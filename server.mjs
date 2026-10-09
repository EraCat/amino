import http from 'node:http';
import { readFile, mkdir, open, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, createHash, randomInt } from 'node:crypto';
import Core from './exam-core.js';
import {loadLocalization,resolveLanguage} from './localization.mjs';

const ROOT=path.dirname(fileURLToPath(import.meta.url));
const STORE=path.resolve(process.env.DATA_DIR||path.join(ROOT,'private-data'));
const FILE=path.join(STORE,'leaderboard.json');
const PORT=Number(process.env.PORT||4174), HOST=process.env.HOST||'127.0.0.1';
const TTL=2*60*60*1000;
const localization=await loadLocalization();
const data=localization.core;
const topicsFor=locale=>Core.TOPICS.map(t=>({...t,...localization.packs.get(locale).questions.topics[t.id]}));
await mkdir(STORE,{recursive:true});
let state;
try{state=JSON.parse(await readFile(FILE,'utf8'));if(state.schema!==1||!Array.isArray(state.participants)||!Array.isArray(state.attempts))throw Error('Некорректный файл результатов');}
catch(e){if(e.code!=='ENOENT')throw e;state={schema:1,participants:[],attempts:[]};}
let queue=Promise.resolve();
const serial=fn=>{const p=queue.then(fn);queue=p.catch(()=>{});return p;};
async function commit(next){
  const temporary=FILE+'.'+randomUUID()+'.tmp';let handle;
  try{handle=await open(temporary,'wx',0o600);await handle.writeFile(JSON.stringify(next));await handle.sync();await handle.close();handle=null;await rename(temporary,FILE);state=next;}
  catch(e){if(handle)await handle.close().catch(()=>{});await unlink(temporary).catch(()=>{});throw e;}
}
function fail(code,status=400){const e=Error(code);e.status=status;e.publicCode=code;throw e;}
function identity(req,required=true){
  const raw=(req.headers.authorization||'').replace(/^Bearer /,'');
  if(!/^[a-f0-9]{64}$/.test(raw)){if(required)fail('participant_unavailable',401);return null;}
  return createHash('sha256').update(raw).digest('hex');
}
function safeName(value){
  if(typeof value!=='string')fail('name_required');const name=value.normalize('NFKC').trim().replace(/\s+/gu,' ');
  if(name.length<2||name.length>32||/[<>\p{Cc}\p{Cf}]/u.test(name))fail('invalid_name');
  return name;
}
function expired(next){let changed=false;for(const a of next.attempts){if(a.status==='running'&&(Date.now()>a.expiresAt||!Core.isCurrentAttempt(a))){a.status='unfinished';a.finishedAt=Math.min(Date.now(),a.expiresAt);changed=true;}}return changed;}
const visibleAttempt=a=>Core.TOPICS.some(topic=>topic.id===a.topic)||['names','codes'].includes(a.topic);
function expose(a){return {id:a.id,participantId:a.participantId,name:a.name,topic:a.topic,difficulty:a.difficulty||'normal',version:a.version,locale:a.locale||'ru',contentRevision:a.contentRevision||null,total:a.questions.length,answered:a.cursor,score:Core.resultScore(a),errors:a.errors,status:a.status,startedAt:a.startedAt,finishedAt:a.finishedAt||null,expiresAt:a.expiresAt};}
function live(a){return {...expose(a),question:a.status==='running'?Core.publicQuestion(a.questions[a.cursor],a.cursor):null};}
function getAttempt(next,id,hash){const p=next.participants.find(p=>p.tokenHash===hash),a=next.attempts.find(a=>a.id===id&&visibleAttempt(a));if(!p||!a||a.participantId!==p.id)fail('attempt_not_found',404);return a;}
function leaderboard(next,difficulty='normal'){
  const inMode=a=>(a.difficulty||'normal')===difficulty;
  const rows=next.participants.filter(p=>next.attempts.some(a=>a.participantId===p.id&&visibleAttempt(a)&&inMode(a))).map(p=>{
    const attempts=next.attempts.filter(a=>a.participantId===p.id&&Core.isCurrentAttempt(a)&&inMode(a));
    const results=Object.fromEntries(Core.TOPICS.map(t=>{
      const list=attempts.filter(a=>a.topic===t.id),finished=list.filter(a=>a.status==='passed'||a.status==='failed');
      const best=finished.sort((a,b)=>Core.resultScore(b)-Core.resultScore(a)||(a.status==='passed'?0:1)-(b.status==='passed'?0:1)||a.startedAt-b.startedAt)[0];
      const latest=list.sort((a,b)=>b.startedAt-a.startedAt)[0];
      return [t.id,{best:best?expose(best):null,latest:latest?expose(latest):null,passed:list.some(a=>a.status==='passed')}];
    }));
    return {id:p.id,name:p.name,results,total:Object.values(results).reduce((sum,r)=>sum+(r.best?.score||0),0),attemptCount:attempts.length};
  }).sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name,'ru')||a.id.localeCompare(b.id));
  let rank=0,previous=null;return rows.map((r,i)=>{if(r.total!==previous){rank=i+1;previous=r.total;}return {...r,rank};});
}
const rates=new Map();
function limit(req){const ip=req.socket.remoteAddress||'unknown',now=Date.now();for(const [k,v] of rates)if(now-v.since>60000)rates.delete(k);const r=rates.get(ip)||{since:now,count:0};r.count++;rates.set(ip,r);if(r.count>240)fail('rate_limited',429);}
async function body(req){
  let bytes=0,parts=[];for await(const part of req){bytes+=part.length;if(bytes>8192)fail('request_too_large',413);parts.push(part);}
  try{const value=JSON.parse(Buffer.concat(parts).toString('utf8'));if(!value||typeof value!=='object'||Array.isArray(value))fail('invalid_request');return value;}catch{fail('invalid_request');}
}
function json(res,status,payload){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(payload));}
const statics=new Set(['index.html','analytics.js','style.css','flow.css','exam.css','app.js','bootstrap.js','exam-core.js','exam-ui.js','assets/logo.png','assets/favicon.png','assets/molecule-mark.png','brand.css']);
for(const file of localization.publicFiles)statics.add(file);
const mime={'.json':'application/json; charset=utf-8','.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer(async(req,res)=>{
  const locale=resolveLanguage(req.headers['accept-language'],localization.languages);
  try{
    const url=new URL(req.url,'http://localhost'),route=url.pathname;
    if(route.startsWith('/api/')){
      limit(req);
      if(req.method==='POST'){
        const origin=req.headers.origin;if(origin&&origin!==`http://${req.headers.host}`&&origin!==`https://${req.headers.host}`&&origin!==process.env.PUBLIC_ORIGIN)fail('origin_rejected',403);
        if(!(req.headers['content-type']||'').startsWith('application/json'))fail('json_required',415);
      }
      const input=req.method==='POST'?await body(req):{};
      const result=await serial(async()=>{
        let next=structuredClone(state),changed=expired(next),reply;
        if(route==='/api/health'&&req.method==='GET')reply={ok:true,version:Core.VERSION};
        else if(route==='/api/leaderboard'&&req.method==='GET'){
          const difficulty=url.searchParams.get('difficulty')||'normal';
          if(!['normal','hard'].includes(difficulty))fail('invalid_difficulty');
          reply={version:Core.VERSION,difficulty,topics:topicsFor(locale),rows:leaderboard(next,difficulty)};
        }
        else if(route==='/api/me'&&req.method==='GET'){
          const hash=identity(req,false),p=next.participants.find(p=>p.tokenHash===hash);
          reply={participant:p?{id:p.id,name:p.name}:null,attempts:p?next.attempts.filter(a=>a.participantId===p.id&&visibleAttempt(a)).map(expose).sort((a,b)=>b.startedAt-a.startedAt):[],topics:topicsFor(locale)};
        }
        else if(route==='/api/start'&&req.method==='POST'){
          const hash=identity(req),name=safeName(input.name),topic=Core.TOPICS.find(t=>t.id===input.topic);
          const examLocale=input.locale===undefined?locale:input.locale;
          const difficulty=input.difficulty===undefined?'normal':input.difficulty;
          if(!['normal','hard'].includes(difficulty))fail('invalid_difficulty');
          if(typeof examLocale!=='string'||!localization.languages.some(l=>l.published&&l.code===examLocale))fail('unsupported_locale');
          if(!topic)fail('unknown_topic');if(!/^[a-f0-9-]{36}$/.test(input.requestId||''))fail('invalid_request_id');
          let p=next.participants.find(p=>p.tokenHash===hash);
          if(!p){p={id:randomUUID(),name,tokenHash:hash};next.participants.push(p);}
          const previous=next.attempts.find(a=>a.participantId===p.id&&a.requestId===input.requestId);
          if(previous)reply=live(previous);
          else{
            const active=next.attempts.find(a=>a.participantId===p.id&&a.status==='running');
            if(active)fail('active_exam',409);
            const recent=next.attempts.filter(a=>a.participantId===p.id&&Date.now()-a.startedAt<3600000);if(recent.length>=20)fail('attempt_limit',429);
            p.name=name;
            const examData=localization.packs.get(examLocale).data;
            const a={id:randomUUID(),requestId:input.requestId,participantId:p.id,name,topic:topic.id,difficulty,version:Core.VERSION,locale:examLocale,contentRevision:Object.fromEntries(data.map(a=>[a.code,a.revision])),questions:Core.build(examData,topic.id,()=>randomInt(0,0x1000000)/0x1000000).map(q=>Core.withDifficulty(examData,q,difficulty)),cursor:0,score:0,errors:0,status:'running',startedAt:Date.now(),expiresAt:Date.now()+TTL,answers:[]};
            next.attempts.push(a);changed=true;reply=live(a);
          }
        }
        else if(route==='/api/attempt'&&req.method==='GET'){reply=live(getAttempt(next,url.searchParams.get('id'),identity(req)));}
        else if(route==='/api/answer'&&req.method==='POST'){
          const a=getAttempt(next,input.attemptId,identity(req));
          if(!Number.isInteger(input.index)||input.index<0||input.index>=a.questions.length)fail('invalid_answer');
          const q=a.questions[input.index],textAnswer=q.answerMode==='text';
          if(textAnswer?(typeof input.answer!=='string'||input.answer.length>120||!Core.normalizeAnswer(input.answer)):!Number.isInteger(input.choice))fail('invalid_answer');
          if(input.index<a.cursor){const old=a.answers[input.index];if(textAnswer?Core.normalizeAnswer(old.answer)!==Core.normalizeAnswer(input.answer):old.choice!==input.choice)fail('answer_saved',409);reply={attempt:live(a),feedback:old.feedback};}
          else{
            if(a.status!=='running')fail('exam_finished',409);if(input.index!==a.cursor)fail('refresh_question',409);
            if(!textAnswer&&(input.choice<0||input.choice>=q.choices.length))fail('choice_not_found');
            const selected=textAnswer?input.answer.trim():q.choices[input.choice],correct=textAnswer?Core.checkTextAnswer(q,input.answer):q.choiceIds?q.choiceIds[input.choice]===q.correctId:selected===q.correct;
            if(correct)a.score++;else a.errors++;a.cursor++;
            if(a.errors>=Core.MAX_ERRORS)a.status='failed';else if(a.cursor===a.questions.length)a.status='passed';
            if(a.status!=='running')a.finishedAt=Date.now();
            const feedback={right:correct,selected,correct:q.correct,...(!textAnswer?{selectedIndex:input.choice,correctIndex:q.choiceIds?q.choiceIds.indexOf(q.correctId):q.choices.indexOf(q.correct),selectedId:q.choiceIds?.[input.choice]}:{}),correctId:q.correctId,code:q.code,explanation:q.explanation};a.answers.push({...(textAnswer?{answer:input.answer}:{choice:input.choice}),feedback});changed=true;reply={attempt:live(a),feedback};
          }
        }
        else if(route==='/api/abandon'&&req.method==='POST'){
          const a=getAttempt(next,input.attemptId,identity(req));if(a.status==='running'){a.status='unfinished';a.finishedAt=Date.now();changed=true;}reply=live(a);
        }
        else if(route==='/api/result'&&req.method==='GET'){
          const a=next.attempts.find(a=>a.id===url.searchParams.get('id')&&visibleAttempt(a));if(!a)fail('result_not_found',404);reply=expose(a);
        }
        else if(route==='/api/history'&&req.method==='GET'){
          reply={attempts:next.attempts.filter(a=>a.participantId===url.searchParams.get('participant')&&visibleAttempt(a)).sort((a,b)=>b.startedAt-a.startedAt).slice(0,100).map(expose)};
        }
        else fail('route_not_found',404);
        if(changed)await commit(next);return reply;
      });json(res,200,result);return;
    }
    if(req.method!=='GET'&&req.method!=='HEAD')fail('method_not_supported',405);
    let relative=route==='/'?'index.html':route.slice(1);
    // Keep images in already running attempts available after the asset rename.
    const legacy=/^structures\/([A-Z])\.svg$/.exec(relative);
    if(legacy)relative=data.find(a=>a.code===legacy[1])?.structure||relative;
    if(!statics.has(relative)&&!data.some(a=>a.structure===relative))fail('page_not_found',404);
    let content;try{content=await readFile(path.join(ROOT,relative));}catch(e){if(e.code==='ENOENT')fail('file_not_found',404);throw e;}
    res.writeHead(200,{'Content-Type':mime[path.extname(relative)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Content-Security-Policy':"default-src 'self'; script-src 'self' https://mc.yandex.ru https://yastatic.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://mc.yandex.ru https://mc.yandex.az https://mc.yandex.by https://mc.yandex.co.il https://mc.yandex.com https://mc.yandex.com.am https://mc.yandex.com.ge https://mc.yandex.com.tr https://mc.yandex.ee https://mc.yandex.fr https://mc.yandex.kg https://mc.yandex.kz https://mc.yandex.lt https://mc.yandex.lv https://mc.yandex.md https://mc.yandex.tj https://mc.yandex.tm https://mc.yandex.uz; connect-src 'self' https://mc.yandex.ru https://mc.yandex.az https://mc.yandex.by https://mc.yandex.co.il https://mc.yandex.com https://mc.yandex.com.am https://mc.yandex.com.ge https://mc.yandex.com.tr https://mc.yandex.ee https://mc.yandex.fr https://mc.yandex.kg https://mc.yandex.kz https://mc.yandex.lt https://mc.yandex.lv https://mc.yandex.md https://mc.yandex.tj https://mc.yandex.tm https://mc.yandex.uz; base-uri 'none'; frame-ancestors 'none'"});res.end(req.method==='HEAD'?undefined:content);
  }catch(e){if(!e.status)console.error(e);const code=e.publicCode||'save_failed';json(res,e.status||503,{errorCode:code,error:localization.packs.get(locale).errors[code]||localization.packs.get('ru').errors[code]});}
});
server.listen(PORT,HOST,()=>console.log(`Амино: http://${HOST}:${server.address().port}/`));
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{server.close();queue.finally(()=>process.exit(0));});
