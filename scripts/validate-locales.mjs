import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile} from 'node:fs/promises';
import {loadLocalization,parseJson,ROOT} from '../localization.mjs';
import Core from '../exam-core.js';

const run=promisify(execFile);
const assert=(ok,message)=>{if(!ok)throw Error(message);};
try{
  const localization=await loadLocalization({includeDrafts:true});
  const references=new Set();
  for(const file of ['app.js','exam-ui.js','bootstrap.js','index.html']){
    const code=await readFile(new URL('../'+file,import.meta.url),'utf8');
    for(const match of code.matchAll(/\b(?:t|h)\(\s*['"]([\w.]+)['"]/g))if(!match[1].endsWith('.'))references.add(match[1]);
    for(const match of code.matchAll(/data-i18n(?:-aria|-title)?="([\w.]+)"/g))references.add(match[1]);
  }
  for(const [locale,pack] of localization.packs){
    if(pack.draft)continue;
    for(const key of references)assert(key.split('.').reduce((entry,part)=>entry?.[part],pack.ui)!==undefined,`${locale}/ui: missing referenced key ${key}`);
  }
  const base=process.env.LOCALE_BASE_SHA;
  if(base&&!/^0{40}$/.test(base)){
    assert(/^[a-f0-9]{40}$/.test(base),'LOCALE_BASE_SHA must be a commit SHA');
    await run('git',['cat-file','-e',`${base}^{commit}`],{cwd:ROOT,windowsHide:true});
    const previous=async file=>{
      try{return parseJson((await run('git',['show',`${base}:${file}`],{cwd:ROOT,windowsHide:true})).stdout,file);}
      catch(error){if(error.code===128)return null;throw error;}
    };
    const oldCore=await previous('content/amino/core.json');
    if(oldCore){
      const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
      for(const shared of localization.core){
        const oldShared=oldCore.find(a=>a.code===shared.code);
        if(!oldShared)continue;
        const withoutCoreRevision=({revision,...data})=>JSON.stringify(canonical(data));
        assert(shared.revision>=oldShared.revision,`core/${shared.code}: source revision cannot decrease`);
        if(withoutCoreRevision(oldShared)!==withoutCoreRevision(shared))assert(shared.revision>oldShared.revision,`core/${shared.code}: changed shared content requires increasing revision and reviewing translations`);
        const file=`locales/ru/cards/${shared.code}.json`,oldCard=await previous(file);
        if(!oldCard)continue;
        const current=localization.packs.get('ru').cards.find(c=>c.code===shared.code);
        const withoutRevision=({sourceRevision,...card})=>JSON.stringify(canonical(card));
        if(withoutRevision(oldCard)!==withoutRevision(current)){
          assert(shared.revision>oldCore.find(a=>a.code===shared.code).revision,`${file}: changed source text requires increasing core.revision and reviewing translations`);
        }
      }
    }
  }
  let checked=0;
  for(const [locale,pack] of localization.packs){
    if(pack.draft){console.log(`${locale}: draft, ${pack.cards.length}/22 supplied cards checked`);continue;}
    for(const a of pack.data){
      for(const type of Core.TOPICS.flatMap(t=>t.types).filter(type=>Core.allowed(a,type))){
        const q=Core.question(pack.data,a,type);
        assert(typeof q.text==='string'&&q.text.trim()&&typeof q.explanation==='string'&&q.explanation.trim(),`${locale}/${a.code}/${type}: missing question wording`);
        const correctIndex=q.choiceIds.indexOf(q.correctId);
        assert(correctIndex>=0&&q.choices[correctIndex]===q.correct,`${locale}/${a.code}/${type}: correct answer mismatch`);
        assert(new Set(q.choices).size===q.choices.length,`${locale}/${a.code}/${type}: indistinguishable answer labels`);
        assert(q.choices.length===(type==='essential'?2:4),`${locale}/${a.code}/${type}: incorrect choice count`);
        assert(!Object.hasOwn(Core.publicQuestion(q,0),'correctId'),`${locale}: public question leaks the correct answer`);
        assert(!Object.hasOwn(Core.publicQuestion(q,0),'code'),`${locale}: public question leaks the target amino acid`);
        assert(!Object.hasOwn(Core.publicQuestion(q,0),'choiceIds'),`${locale}: public question leaks semantic answer IDs`);
        checked++;
      }
    }
    for(const topic of Core.TOPICS){
      const questions=Core.build(pack.data,topic.id);
      assert(questions.length===30,`${locale}/${topic.id}: wrong exam length`);
      assert(questions.filter(q=>topic.forward.includes(q.type)).length===15,`${locale}/${topic.id}: wrong directional balance`);
      assert(new Set(questions.map(q=>q.code)).size===20,`${locale}/${topic.id}: not all standard amino acids represented`);
    }
    console.log(`${locale}: 22 cards and all ${Core.TOPICS.length} exam topics valid`);
  }
  console.log(`Validated ${checked} generated questions.`);
}catch(error){console.error(error.message);process.exitCode=1;}
