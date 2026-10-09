import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {once} from 'node:events';
import {loadLocalization,ROOT} from '../localization.mjs';
import Core from '../exam-core.js';

const localization=await loadLocalization();
const directory=await mkdtemp(path.join(tmpdir(),'amino-localization-'));
const token='a'.repeat(64),participantId=randomUUID(),legacyId=randomUUID();
const legacyQuestion=Core.question(localization.packs.get('ru').data,localization.packs.get('ru').data[0],'code');
delete legacyQuestion.choiceIds;delete legacyQuestion.correctId;delete legacyQuestion.locale;
const legacy={id:legacyId,participantId,requestId:randomUUID(),name:'Legacy',topic:'names-codes',version:'2026-10-v7',
  questions:[legacyQuestion],cursor:0,score:0,errors:0,status:'running',startedAt:Date.now(),expiresAt:Date.now()+3600000,answers:[]};
const removedParticipantId=randomUUID();
const removedAttempts=['formulas','codons'].map((topic,i)=>({...legacy,id:randomUUID(),requestId:randomUUID(),topic,version:'2026-10-v8',
  status:i?'running':'passed',cursor:i?0:1,score:i?0:1}));
removedAttempts.push({...removedAttempts[0],id:randomUUID(),participantId:removedParticipantId});
await writeFile(path.join(directory,'leaderboard.json'),JSON.stringify({schema:1,participants:[
  {id:participantId,name:'Legacy',tokenHash:createHash('sha256').update(token).digest('hex')},
  {id:removedParticipantId,name:'Removed topics only',tokenHash:createHash('sha256').update('b'.repeat(64)).digest('hex')}
],attempts:[legacy,...removedAttempts]}));
let processOutput='';
let child;
try{
  child=spawn(process.execPath,['server.mjs'],{cwd:ROOT,env:{...process.env,HOST:'127.0.0.1',PORT:'0',DATA_DIR:directory},windowsHide:true,stdio:['ignore','pipe','pipe']});
  child.stdout.on('data',data=>{processOutput+=data;});child.stderr.on('data',data=>{processOutput+=data;});
  const origin=await new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>reject(Error('Server did not start: '+processOutput)),15000);
    const inspect=()=>{const match=/http:\/\/127\.0\.0\.1:(\d+)\//.exec(processOutput);if(match){clearTimeout(timeout);resolve(match[0]);}};
    child.stdout.on('data',inspect);
    child.once('error',error=>{clearTimeout(timeout);reject(error);});
    child.once('exit',code=>{clearTimeout(timeout);reject(Error(`Server exited (${code}): ${processOutput}`));});
  });
  const request=async(route,{locale='en',body,auth=token,status=200}={})=>{
    const response=await fetch(new URL(route,origin),{headers:{'Accept-Language':locale,...(auth?{Authorization:'Bearer '+auth}:{}),...(body?{'Content-Type':'application/json'}:{})},method:body?'POST':'GET',body:body?JSON.stringify(body):undefined});
    assert.equal(response.status,status,`${route}: unexpected status`);
    return {response,value:await response.json()};
  };
  for(const locale of ['ru','en']){
    const {response,value}=await request(`locales/${locale}/cards/G.json`);
    assert.match(response.headers.get('content-type'),/application\/json/);assert.equal(value.code,'G');
  }
  await request('private-data/leaderboard.json',{status:404});
  await request('locales/en/cards/../../server.mjs',{status:404});
  const topicIds=Core.TOPICS.map(topic=>topic.id);
  assert.deepEqual(topicIds,['names-codes','classification','structures','properties','history']);
  assert.equal(Core.TOPICS.reduce((sum,topic)=>sum+topic.total,0),150);
  const {value:mine}=await request('api/me');
  assert.deepEqual(mine.attempts.map(a=>a.id),[legacyId]);
  assert.deepEqual(mine.topics.map(topic=>topic.id),topicIds);
  for(const removed of removedAttempts){
    await request('api/result?id='+removed.id,{status:404});
    await request('api/attempt?id='+removed.id,{status:404});
    await request('api/answer',{body:{attemptId:removed.id,index:0,choice:0},status:404});
  }
  for(const locale of ['ru','en'])for(const difficulty of ['normal','hard'])for(const topic of ['formulas','codons']){
    const {value:rejected}=await request('api/start',{locale,body:{requestId:randomUUID(),topic,name:'Smoke',locale,difficulty},status:400});
    assert.equal(rejected.errorCode,'unknown_topic');
  }
  const {value:old}=await request('api/attempt?id='+legacyId);
  assert.equal(old.locale,'ru');assert.equal(old.question.text,legacyQuestion.text);
  assert.equal(old.question.choiceIds,undefined);
  const choice=legacyQuestion.choices.indexOf(legacyQuestion.correct);
  const {value:oldAnswer}=await request('api/answer',{body:{attemptId:legacyId,index:0,choice}});
  assert.equal(oldAnswer.feedback.right,true);assert.equal(oldAnswer.attempt.score,1);assert.equal(oldAnswer.attempt.status,'passed');
  for(const locale of ['ru','en']){
    // Reusing an archived topic's request ID must not revive or expose it.
    const requestId=locale==='ru'?removedAttempts[0].requestId:randomUUID();
    const startBody={requestId,topic:'history',name:'Smoke',locale};
    const {value:start}=await request('api/start',{locale,body:startBody});
    assert.equal(start.locale,locale);assert.equal(start.total,30);assert.equal(Object.hasOwn(start.question,'code'),false);
    assert.equal(start.question.text,localization.packs.get(locale).questions.text[start.question.type]);
    assert.equal(Object.hasOwn(start.question,'correctId'),false);assert.equal(Object.hasOwn(start.question,'correct'),false);
    assert.equal(Object.hasOwn(start.question,'choiceIds'),false);
    const {value:again}=await request('api/start',{locale,body:startBody});assert.deepEqual(again,start);
    const store=JSON.parse(await readFile(path.join(directory,'leaderboard.json'),'utf8'));
    const stored=store.attempts.find(a=>a.id===start.id),q=stored.questions[0];
    // The browser submits an index; the server maps it to a stable answer ID.
    const correctChoice=q.choiceIds.indexOf(q.correctId);
    const body={attemptId:start.id,index:0,choice:correctChoice};
    const {value:answer}=await request('api/answer',{locale,body});
    assert.equal(answer.feedback.right,true);assert.equal(answer.attempt.score,1);assert.equal(answer.feedback.correctId,q.correctId);
    const {value:retry}=await request('api/answer',{locale,body});assert.deepEqual(retry,answer);
    const wrong=(correctChoice+1)%q.choices.length;
    await request('api/answer',{locale,body:{...body,choice:wrong},status:409});
    const {value:resume}=await request('api/attempt?id='+start.id,{locale:locale==='ru'?'en':'ru'});
    assert.equal(resume.locale,locale);assert.equal(resume.question.text,stored.questions[1].text);
    for(let index=1;index<stored.questions.length;index++){
      const question=stored.questions[index],correctIndex=question.choiceIds.indexOf(question.correctId);
      const {value:step}=await request('api/answer',{locale,body:{attemptId:start.id,index,choice:index===1?(correctIndex+1)%question.choices.length:correctIndex}});
      assert.equal(step.feedback.right,index!==1);
      if(index===stored.questions.length-1){assert.equal(step.attempt.status,'passed');assert.equal(step.attempt.score,29);assert.equal(step.attempt.errors,1);}
    }
  }
  const {value:unsupported}=await request('api/start',{body:{requestId:randomUUID(),topic:'history',name:'Smoke',locale:'../../private-data'},status:400});
  assert.equal(unsupported.errorCode,'unsupported_locale');assert.equal(unsupported.error,localization.packs.get('en').errors.unsupported_locale);
  const {value:ranking}=await request('api/leaderboard');
  assert.deepEqual(ranking.topics.map(topic=>topic.id),topicIds);
  assert.deepEqual(Object.keys(ranking.rows[0].results),topicIds);
  assert.equal(ranking.rows.some(row=>row.id===removedParticipantId),false);
  assert.equal(ranking.topics[0].title,localization.packs.get('en').questions.topics['names-codes'].title);
  assert.equal(ranking.rows[0].total,30);
  const {value:negotiated}=await request('api/leaderboard',{locale:'ru;q=0,en-US;q=1'});
  assert.equal(negotiated.topics[0].title,localization.packs.get('en').questions.topics['names-codes'].title);
  const {value:history}=await request('api/history?participant='+participantId);
  assert.equal(history.attempts.length,3);assert.ok(history.attempts.every(a=>topicIds.includes(a.topic)));
  const saved=JSON.parse(await readFile(path.join(directory,'leaderboard.json'),'utf8'));
  assert.ok(removedAttempts.every(a=>saved.attempts.some(stored=>stored.id===a.id)));
  assert.equal(saved.attempts.find(a=>a.id===removedAttempts[1].id).status,'unfinished');
  console.log('HTTP smoke passed: JSON, RU/EN exams, stable choices, idempotency, locale pinning, legacy resume, five-topic ranking and removed-topic migration.');
}finally{
  if(child?.pid){const exited=child.exitCode!==null?Promise.resolve():once(child,'exit');child.kill();await exited;}
  await rm(directory,{recursive:true,force:true});
}
