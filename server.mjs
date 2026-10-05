import http from 'node:http';
import { readFile, mkdir, open, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, createHash, randomInt } from 'node:crypto';
import Core from './exam-core.js';

const ROOT=path.dirname(fileURLToPath(import.meta.url));
const STORE=path.resolve(process.env.DATA_DIR||path.join(ROOT,'private-data'));
const FILE=path.join(STORE,'leaderboard.json');
const PORT=Number(process.env.PORT||4174), HOST=process.env.HOST||'127.0.0.1';
const TTL=2*60*60*1000;
const data=JSON.parse((await readFile(path.join(ROOT,'data.js'),'utf8')).replace(/^const AMINO\s*=\s*/,'').replace(/;\s*$/,''));
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
function fail(message,status=400){const e=Error(message);e.status=status;throw e;}
function identity(req,required=true){
  const raw=(req.headers.authorization||'').replace(/^Bearer /,'');
  if(!/^[a-f0-9]{64}$/.test(raw)){if(required)fail('Идентификатор участника недоступен',401);return null;}
  return createHash('sha256').update(raw).digest('hex');
}
function safeName(value){
  if(typeof value!=='string')fail('Укажите имя');const name=value.normalize('NFKC').trim().replace(/\s+/gu,' ');
  if(name.length<2||name.length>32||/[<>\p{Cc}\p{Cf}]/u.test(name))fail('Имя: от 2 до 32 символов, без управляющих символов и скобок');
  return name;
}
function expired(next){let changed=false;for(const a of next.attempts){if(a.status==='running'&&(Date.now()>a.expiresAt||!Core.isCurrentAttempt(a))){a.status='unfinished';a.finishedAt=Math.min(Date.now(),a.expiresAt);changed=true;}}return changed;}
function expose(a){return {id:a.id,participantId:a.participantId,name:a.name,topic:a.topic,version:a.version,total:a.questions.length,answered:a.cursor,score:Core.resultScore(a),errors:a.errors,status:a.status,startedAt:a.startedAt,finishedAt:a.finishedAt||null,expiresAt:a.expiresAt};}
function live(a){return {...expose(a),question:a.status==='running'?Core.publicQuestion(a.questions[a.cursor],a.cursor):null};}
function getAttempt(next,id,hash){const p=next.participants.find(p=>p.tokenHash===hash),a=next.attempts.find(a=>a.id===id);if(!p||!a||a.participantId!==p.id)fail('Попытка не найдена',404);return a;}
function leaderboard(next){
  const rows=next.participants.filter(p=>next.attempts.some(a=>a.participantId===p.id)).map(p=>{
    const attempts=next.attempts.filter(a=>a.participantId===p.id&&Core.isCurrentAttempt(a));
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
function limit(req){const ip=req.socket.remoteAddress||'unknown',now=Date.now();for(const [k,v] of rates)if(now-v.since>60000)rates.delete(k);const r=rates.get(ip)||{since:now,count:0};r.count++;rates.set(ip,r);if(r.count>240)fail('Слишком много запросов. Повторите через минуту.',429);}
async function body(req){
  let bytes=0,parts=[];for await(const part of req){bytes+=part.length;if(bytes>8192)fail('Слишком большой запрос',413);parts.push(part);}
  try{const value=JSON.parse(Buffer.concat(parts).toString('utf8'));if(!value||typeof value!=='object'||Array.isArray(value))fail('Некорректный запрос');return value;}catch{fail('Некорректный запрос');}
}
function json(res,status,payload){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(payload));}
const statics=new Set(['index.html','style.css','flow.css','exam.css','app.js','data.js','exam-core.js','exam-ui.js','assets/logo.png','assets/favicon.png']);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost'),route=url.pathname;
    if(route.startsWith('/api/')){
      limit(req);
      if(req.method==='POST'){
        const origin=req.headers.origin;if(origin&&origin!==`http://${req.headers.host}`&&origin!==`https://${req.headers.host}`&&origin!==process.env.PUBLIC_ORIGIN)fail('Запрос с другого сайта отклонён',403);
        if(!(req.headers['content-type']||'').startsWith('application/json'))fail('Требуется JSON',415);
      }
      const input=req.method==='POST'?await body(req):{};
      const result=await serial(async()=>{
        let next=structuredClone(state),changed=expired(next),reply;
        if(route==='/api/health'&&req.method==='GET')reply={ok:true,version:Core.VERSION};
        else if(route==='/api/leaderboard'&&req.method==='GET')reply={version:Core.VERSION,topics:Core.TOPICS,rows:leaderboard(next)};
        else if(route==='/api/me'&&req.method==='GET'){
          const hash=identity(req,false),p=next.participants.find(p=>p.tokenHash===hash);
          reply={participant:p?{id:p.id,name:p.name}:null,attempts:p?next.attempts.filter(a=>a.participantId===p.id).map(expose).sort((a,b)=>b.startedAt-a.startedAt):[],topics:Core.TOPICS};
        }
        else if(route==='/api/start'&&req.method==='POST'){
          const hash=identity(req),name=safeName(input.name),topic=Core.TOPICS.find(t=>t.id===input.topic);
          if(!topic)fail('Неизвестная тема');if(!/^[a-f0-9-]{36}$/.test(input.requestId||''))fail('Некорректный идентификатор запроса');
          let p=next.participants.find(p=>p.tokenHash===hash);
          if(!p){p={id:randomUUID(),name,tokenHash:hash};next.participants.push(p);}
          const previous=next.attempts.find(a=>a.participantId===p.id&&a.requestId===input.requestId);
          if(previous)reply=live(previous);
          else{
            const active=next.attempts.find(a=>a.participantId===p.id&&a.status==='running');
            if(active)fail('Сначала продолжите или завершите текущий экзамен',409);
            const recent=next.attempts.filter(a=>a.participantId===p.id&&Date.now()-a.startedAt<3600000);if(recent.length>=20)fail('Лимит: 20 попыток в час',429);
            p.name=name;
            const a={id:randomUUID(),requestId:input.requestId,participantId:p.id,name,topic:topic.id,version:Core.VERSION,questions:Core.build(data,topic.id,()=>randomInt(0,0x1000000)/0x1000000),cursor:0,score:0,errors:0,status:'running',startedAt:Date.now(),expiresAt:Date.now()+TTL,answers:[]};
            next.attempts.push(a);changed=true;reply=live(a);
          }
        }
        else if(route==='/api/attempt'&&req.method==='GET'){reply=live(getAttempt(next,url.searchParams.get('id'),identity(req)));}
        else if(route==='/api/answer'&&req.method==='POST'){
          const a=getAttempt(next,input.attemptId,identity(req));
          if(!Number.isInteger(input.index)||input.index<0||!Number.isInteger(input.choice))fail('Некорректный ответ');
          if(input.index<a.cursor){const old=a.answers[input.index];if(old.choice!==input.choice)fail('Ответ уже сохранён',409);reply={attempt:live(a),feedback:old.feedback};}
          else{
            if(a.status!=='running')fail('Экзамен завершён',409);if(input.index!==a.cursor)fail('Обновите текущий вопрос',409);
            const q=a.questions[a.cursor];if(input.choice<0||input.choice>=q.choices.length)fail('Вариант ответа не найден');
            const selected=q.choices[input.choice],correct=selected===q.correct;
            if(correct)a.score++;else a.errors++;a.cursor++;
            if(a.errors>=Core.MAX_ERRORS)a.status='failed';else if(a.cursor===a.questions.length)a.status='passed';
            if(a.status!=='running')a.finishedAt=Date.now();
            const feedback={right:correct,selected,correct:q.correct,explanation:q.explanation};a.answers.push({choice:input.choice,feedback});changed=true;reply={attempt:live(a),feedback};
          }
        }
        else if(route==='/api/abandon'&&req.method==='POST'){
          const a=getAttempt(next,input.attemptId,identity(req));if(a.status==='running'){a.status='unfinished';a.finishedAt=Date.now();changed=true;}reply=live(a);
        }
        else if(route==='/api/result'&&req.method==='GET'){
          const a=next.attempts.find(a=>a.id===url.searchParams.get('id'));if(!a)fail('Результат не найден',404);reply=expose(a);
        }
        else if(route==='/api/history'&&req.method==='GET'){
          reply={attempts:next.attempts.filter(a=>a.participantId===url.searchParams.get('participant')).sort((a,b)=>b.startedAt-a.startedAt).slice(0,100).map(expose)};
        }
        else fail('Маршрут не найден',404);
        if(changed)await commit(next);return reply;
      });json(res,200,result);return;
    }
    if(req.method!=='GET'&&req.method!=='HEAD')fail('Метод не поддерживается',405);
    let relative=route==='/'?'index.html':route.slice(1);
    // Keep images in already running attempts available after the asset rename.
    const legacy=/^structures\/([A-Z])\.svg$/.exec(relative);
    if(legacy)relative=data.find(a=>a.code===legacy[1])?.structure||relative;
    if(!statics.has(relative)&&!data.some(a=>a.structure===relative))fail('Страница не найдена',404);
    let content;try{content=await readFile(path.join(ROOT,relative));}catch(e){if(e.code==='ENOENT')fail('Файл не найден',404);throw e;}
    res.writeHead(200,{'Content-Type':mime[path.extname(relative)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'"});res.end(req.method==='HEAD'?undefined:content);
  }catch(e){if(!e.status)console.error(e);json(res,e.status||503,{error:e.status?e.message:'Не удалось сохранить данные. Повторите запрос.'});}
});
server.listen(PORT,HOST,()=>console.log(`Амино: http://${HOST}:${PORT}/`));
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{server.close();queue.finally(()=>process.exit(0));});
