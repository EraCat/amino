import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {once} from 'node:events';
import Core from '../exam-core.js';
import {loadLocalization,ROOT} from '../localization.mjs';

// Independent expected memberships: exercise the generated options through HTTP.
const memberships={nonpolar:'GAVLIMPFW',polar:'STCYNQ',acidic:'DE',basic:'KRH',
  aromatic:'FWYH',aliphatic:'AVLIM',sulfur:'CM',bcaa:'VLI',hydroxyl:'STY',amide:'NQ'};
const traits={hydrogen:'G',methyl:'A',branched:'VLI',thiol:'C',thioether:'M',phenol:'Y',indole:'W',
  imidazole:'H',amide:'NQO',carboxyl:'DE',guanidine:'R',amine:'K',alcohol:'ST',pyrrolidine:'P',
  benzyl:'F',selenol:'U',twoCenters:'IT',achiral:'G'};
const has=(code,key)=>memberships[key]?.includes(code),keys=code=>Object.keys(memberships).filter(key=>has(code,key));
const localization=await loadLocalization(),directory=await mkdtemp(path.join(tmpdir(),'amino-classification-'));
let child,output='',checks=0;
const states=[];
for(const [locale,pack] of localization.packs){
  if(pack.draft)continue;
  for(const difficulty of ['normal','hard']){
    const token=createHash('sha256').update(locale+difficulty).digest('hex'),participantId=randomUUID();
    const data=pack.data.filter(a=>a.group!=='special'),questions=[];
    for(const a of data)for(const type of ['classset','class-image','category','property-image','classset-reverse','essential-reverse']){
      const q=Core.withDifficulty(data,Core.question(data,a,type),difficulty);
      if(q.answerMode!=='text')questions.push(q);
    }
    // Old saved attempts may still contain overlapping options. Do not reorder them.
    const legacy=[];
    for(const [target,type,other] of [['A','classset-reverse','V'],['S','classset-reverse','Y'],['V','classset','A'],['Y','class-image','S']]){
      const q=Core.question(data,data.find(a=>a.code===target),type);
      const candidate=data.find(a=>a.code===other),id=type==='classset-reverse'?'amino:'+other:'classification:'+keys(other).sort().join(',');
      const index=q.choiceIds.findIndex(id=>id!==q.correctId);
      q.choiceIds[index]=id;q.choices[index]=type==='classset-reverse'?candidate.name:keys(other).map(key=>pack.questions.axes[key]||pack.questions.groups[key]).join(' · ');
      legacy.push({question:q,index});
    }
    const attempt={id:randomUUID(),participantId,name:locale,requestId:randomUUID(),topic:'classification',difficulty,locale,
      version:Core.VERSION,questions:[...questions,...legacy.map(x=>x.question)],cursor:0,score:0,errors:0,status:'running',startedAt:Date.now(),expiresAt:Date.now()+3600000,answers:[]};
    states.push({token,participant:{id:participantId,name:locale,tokenHash:createHash('sha256').update(token).digest('hex')},attempt,legacy,startLegacy:questions.length,data});
  }
}
await writeFile(path.join(directory,'leaderboard.json'),JSON.stringify({schema:1,participants:states.map(x=>x.participant),attempts:states.map(x=>x.attempt)}));
try{
  child=spawn(process.execPath,['server.mjs'],{cwd:ROOT,env:{...process.env,HOST:'127.0.0.1',PORT:'0',DATA_DIR:directory},windowsHide:true,stdio:['ignore','pipe','pipe']});
  child.stdout.on('data',x=>output+=x);child.stderr.on('data',x=>output+=x);
  const origin=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error(output)),15000);child.stdout.on('data',()=>{const match=output.match(/http:\/\/127\.0\.0\.1:\d+\//);if(match){clearTimeout(timer);resolve(match[0]);}});child.once('error',reject);});
  // Give each isolated test participant its own loopback IP to respect the real rate limit.
  const {request:httpRequest}=await import('node:http');
  for(const [n,state] of states.entries()){
    const call=(route,body)=>new Promise((resolve,reject)=>{
      const request=httpRequest(new URL('api/'+route,origin),{method:body?'POST':'GET',localAddress:'127.0.0.'+(n+2),headers:{Authorization:'Bearer '+state.token,'Content-Type':'application/json'}},response=>{let value='';response.on('data',chunk=>value+=chunk);response.on('end',()=>{try{assert.equal(response.statusCode,200,value);resolve(JSON.parse(value));}catch(error){reject(error);}});});
      request.on('error',reject);request.end(body?JSON.stringify(body):undefined);
    });
    let live=await call('attempt?id='+state.attempt.id);
    for(let index=0;index<state.attempt.questions.length;index++){
      const q=state.attempt.questions[index];assert.deepEqual(live.question.choices,q.choices,'Saved choice order changed');
      let choice;
      if(index>=state.startLegacy)choice=state.legacy[index-state.startLegacy].index;
      else{
        const valid=q.choiceIds.map((id,i)=>{
          if(q.type==='classset-reverse')return keys(q.code).every(key=>has(id.slice(6),key));
          if(['classset','class-image'].includes(q.type))return id.slice(15).split(',').every(key=>has(q.code,key));
          if(q.type==='category')return has(q.code,id.slice(9));
          if(q.type==='property-image')return traits[id.slice(6)].includes(q.code);
          if(q.type==='essential-reverse')return state.data.find(a=>a.code===id.slice(6)).essential===state.data.find(a=>a.code===q.code).essential;
          return false;
        });
        assert.equal(valid.filter(Boolean).length,1,`${state.attempt.locale}/${state.attempt.difficulty}/${q.code}/${q.type}: ambiguous options`);
        choice=valid.indexOf(true);assert.equal(q.choiceIds[choice],q.correctId);
      }
      const result=await call('answer',{attemptId:state.attempt.id,index,choice});
      assert.equal(result.feedback.right,true);assert.equal(result.feedback.correctIndex,choice);
      assert.equal(result.feedback.correct,q.choices[choice]);live=result.attempt;checks++;
    }
    assert.equal(live.status,'passed');assert.equal(live.errors,0);
  }
  console.log(`Classification HTTP smoke passed: ${checks} choice answers, RU/EN, normal/hard, all standard amino acids, overlapping groups/properties/essentiality, legacy alternatives and unchanged choice order.`);
}finally{
  if(child?.pid){const exited=child.exitCode!==null?Promise.resolve():once(child,'exit');child.kill();await exited;}
  await rm(directory,{recursive:true,force:true});
}
