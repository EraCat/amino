import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {once} from 'node:events';
import {loadLocalization,ROOT} from '../localization.mjs';
import Core from '../exam-core.js';

const localization=await loadLocalization(),directory=await mkdtemp(path.join(tmpdir(),'amino-hard-mode-'));
const participants=[],attempts=[],fixtures=[];
// Known ambiguous prompts ensure grading accepts answers beyond the generated target.
for(const locale of ['ru','en']){
  const data=localization.packs.get(locale).data,byCode=code=>data.find(a=>a.code===code);
  const token=(locale==='ru'?'a':'b').repeat(64),participantId=randomUUID();
  participants.push({id:participantId,name:locale,tokenHash:createHash('sha256').update(token).digest('hex')});
  const pairs=[['D','classset-reverse','E'],['V','essential-reverse','K'],
    ['A','name'],['A','code'],['A','three'],['A','structure'],
    ['A','property'],['A','history'],['N','name-three'],
    ['A','structure-reverse'],['A','classset'],['A','history-forward'],['A','property-forward'],['A','essential']];
  const questions=pairs.map(([code,type])=>Core.withDifficulty(data,Core.question(data,byCode(code),type),'hard'));
  const values=pairs.map(([code,type,alternative],index)=>alternative?byCode(alternative).name:
    type==='name'?(locale==='ru'?byCode(code).englishName:byCode(code).legacyName):questions[index].correct);
  const attempt={id:randomUUID(),participantId,name:locale,requestId:randomUUID(),topic:'names-codes',difficulty:'hard',locale,
    version:'2026-10-v8',questions,cursor:0,score:0,errors:0,status:'running',startedAt:Date.now(),expiresAt:Date.now()+3600000,answers:[]};
  attempts.push(attempt);fixtures.push({locale,token,attempt,values});
}
await writeFile(path.join(directory,'leaderboard.json'),JSON.stringify({schema:1,participants,attempts}));
let child,output='';
try{
  child=spawn(process.execPath,['server.mjs'],{cwd:ROOT,env:{...process.env,HOST:'127.0.0.1',PORT:'0',DATA_DIR:directory},windowsHide:true,stdio:['ignore','pipe','pipe']});
  child.stdout.on('data',data=>{output+=data;});child.stderr.on('data',data=>{output+=data;});
  const origin=await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(Error('Server did not start: '+output)),15000);
    child.stdout.on('data',()=>{const match=/http:\/\/127\.0\.0\.1:\d+\//.exec(output);if(match){clearTimeout(timer);resolve(match[0]);}});
    child.once('error',error=>{clearTimeout(timer);reject(error);});
    child.once('exit',code=>{clearTimeout(timer);reject(Error(`Server exited (${code}): ${output}`));});
  });
  const request=async(route,token,body,status=200)=>{
    const response=await fetch(new URL('api/'+route,origin),{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
    const value=await response.json();assert.equal(response.status,status,`${route}: ${JSON.stringify(value)}`);return value;
  };
  const publicCheck=q=>{
    for(const key of ['correct','correctId','choiceIds','acceptedAnswers','code'])assert.equal(Object.hasOwn(q,key),false,`Answer leaked: ${key}`);
    if(q.answerMode==='text')assert.equal(Object.hasOwn(q,'choices'),false);
    else assert.ok(Array.isArray(q.choices));
  };
  const storedAttempt=async id=>JSON.parse(await readFile(path.join(directory,'leaderboard.json'),'utf8')).attempts.find(a=>a.id===id);
  for(const {locale,token,attempt,values} of fixtures){
    let current=await request('attempt?id='+attempt.id,token);
    for(let index=0;index<attempt.questions.length;index++){
      const q=attempt.questions[index];publicCheck(current.question);
      const answer=q.answerMode==='text'?{answer:'  '+values[index].toUpperCase().replace(/ /g,'   ')+'  '}:{choice:q.choiceIds.indexOf(q.correctId)};
      const body={attemptId:attempt.id,index,...answer};
      if(index===0){
        for(const invalid of [{answer:'   '},{answer:7},{answer:'x'.repeat(121)},{choice:0}])await request('answer',token,{attemptId:attempt.id,index,...invalid},400);
      }
      const response=await request('answer',token,body);assert.equal(response.feedback.right,true,`${locale}/${q.type}`);
      assert.equal(response.attempt.score,index+1);
      if(index===0){
        assert.deepEqual(await request('answer',token,{...body,answer:values[index].toLowerCase()}),response);
        await request('answer',token,{...body,answer:'wrong'},409);
      }
      current=response.attempt;
    }
    assert.equal(current.status,'passed');assert.equal(current.errors,0);
    for(const topic of Core.TOPICS){
      const body={topic:topic.id,name:'Hard smoke',locale,difficulty:'hard',requestId:randomUUID()};
      const start=await request('start',token,body);assert.equal(start.difficulty,'hard');assert.equal(start.total,30);
      assert.deepEqual(await request('start',token,body),start);
      const resume=await request('attempt?id='+start.id,token);assert.deepEqual(resume,start);
      const stored=await storedAttempt(start.id),count=topic.id==='names-codes'?30:2;
      let step=start;
      for(let index=0;index<count;index++){
        publicCheck(step.question);const q=stored.questions[index];
        const answer=q.answerMode==='text'?{answer:q.correct.toLowerCase()}:{choice:q.choiceIds.indexOf(q.correctId)};
        const response=await request('answer',token,{attemptId:start.id,index,...answer});assert.equal(response.feedback.right,true);
        step=response.attempt;
      }
      if(count===30){assert.equal(step.status,'passed');assert.equal(step.score,30);}
      else await request('abandon',token,{attemptId:start.id});
    }
    const failed=await request('start',token,{topic:'names-codes',name:'Hard smoke',locale,difficulty:'hard',requestId:randomUUID()});
    let last;
    for(let index=0;index<3;index++)last=await request('answer',token,{attemptId:failed.id,index,answer:'wrong'});
    assert.equal(last.attempt.status,'failed');assert.equal(last.attempt.errors,3);assert.equal(last.attempt.score,0);
    assert.deepEqual(await request('answer',token,{attemptId:failed.id,index:2,answer:'wrong'}),last);
    const hard=await request('leaderboard?difficulty=hard',token),normal=await request('leaderboard',token);
    assert.equal(hard.rows.find(row=>row.id===attempt.participantId).total,30);
    assert.equal(normal.rows.some(row=>row.id===attempt.participantId),false);
    const legacyDefault=await request('start',token,{topic:'names-codes',name:'Normal smoke',locale,requestId:randomUUID()});
    assert.equal(legacyDefault.difficulty,'normal');assert.equal(legacyDefault.question.answerMode,undefined);assert.equal(legacyDefault.question.choices.length,4);
    await request('abandon',token,{attemptId:legacyDefault.id});
    const normalAfter=await request('leaderboard',token);assert.equal(normalAfter.rows.find(row=>row.id===attempt.participantId).total,0);
  }
  await request('leaderboard?difficulty=unknown',fixtures[0].token,undefined,400);
  await request('start',fixtures[0].token,{topic:'names-codes',name:'Smoke',difficulty:'unknown',requestId:randomUUID()},400);
  console.log('Hard mode HTTP smoke passed: RU/EN, all topics, typed/choice grading, alternatives, input validation, retries, resume, failure rule and separate rankings.');
}finally{
  if(child?.pid){const exited=child.exitCode!==null?Promise.resolve():once(child,'exit');child.kill();await exited;}
  await rm(directory,{recursive:true,force:true});
}
