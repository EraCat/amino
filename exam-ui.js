'use strict';
const STATUS = {running:'В процессе',passed:'Сдан',failed:'Не сдан',unfinished:'Не завершён'};
const TOPIC = id => ExamCore.TOPICS.find(t=>t.id===id)||({names:{title:'Названия'},codes:{title:'Коды'}})[id]||{title:id};
const attemptTitle = a => TOPIC(a.topic).title+(!ExamCore.isCurrentAttempt(a)?' · предыдущая версия':'');
function plural(n,one,few,many){return n%100>=11&&n%100<=14?many:n%10===1?one:n%10>=2&&n%10<=4?few:many;}
const pointWord=n=>plural(n,'балл','балла','баллов');
let examState=null, examFeedback=null, examScreenQuestion=null, examBusy=false;
let examProfile=null, examAttempts=[], leaderboardData=null, examError='', service='loading';
let examRequest=null;
let examPublicResult=false;
const AUTH_KEY='amino-participant-v1';
let examToken='',examName='';
try{examToken=localStorage.getItem(AUTH_KEY)||'';examName=localStorage.getItem('amino-name-v1')||'';}catch{}
function createToken(){const bytes=crypto.getRandomValues(new Uint8Array(32));return [...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');}
async function api(route,body){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{
    const response=await fetch('api/'+route,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(examToken?{Authorization:'Bearer '+examToken}:{})},body:body?JSON.stringify(body):undefined,signal:controller.signal});
    let value;try{value=await response.json();}catch{throw Error('Экзамены доступны при запуске серверной версии сайта.');}
    if(!response.ok)throw Error(value.error||'Сервер недоступен');return value;
  }catch(e){if(e.name==='AbortError')throw Error('Сервер не ответил. Повторите запрос: ответ не будет начислен дважды.');throw e;}finally{clearTimeout(timer);}
}
async function refreshExams(){
  try{const mine=await api('me');examProfile=mine.participant;examAttempts=mine.attempts;service='ready';examError='';examName=examProfile?examProfile.name:'';}
  catch{service='offline';}
  if(view==='progress'&&!examState)render();
}
function bestFor(id){return examAttempts.filter(a=>a.topic===id&&ExamCore.isCurrentAttempt(a)&&['passed','failed'].includes(a.status)).sort((a,b)=>b.score-a.score||(a.status==='passed'?0:1)-(b.status==='passed'?0:1))[0];}
function attemptScore(a){return `<strong>${a.score}<span class="muted">/${a.total}</span></strong><span class="exam-status ${a.status}">${STATUS[a.status]}</span>`;}
function examsPanel(){
  const total=ExamCore.TOPICS.reduce((sum,t)=>sum+(bestFor(t.id)?.score||0),0),active=examAttempts.find(a=>a.status==='running');
  return `<section class="exam-overview"><div class="section-top"><h2>Экзамены</h2><span class="exam-total">${total}<small>общий балл</small></span></div><div class="exam-rules"><span>1 верный ответ = 1 балл</span><span>3 ошибки — экзамен не сдан</span></div>${service==='loading'?'<p class="muted">Загрузка результатов…</p>':service==='offline'?'<div class="save-warning">Сервер экзаменов недоступен. Тренировки работают.</div>':''}${active?`<div class="active-exam"><strong>${esc(TOPIC(active.topic)?.title||active.topic)} · ${active.score} ${pointWord(active.score)}</strong><button class="button dark" data-resume="${active.id}">Продолжить экзамен</button></div>`:''}<div class="exam-topics">${ExamCore.TOPICS.map(t=>{const best=bestFor(t.id);return `<article class="exam-topic"><div><h3>${t.title}</h3><p>${t.description}</p><small>${t.total} вопросов · максимум ${t.total} баллов</small></div><div class="exam-topic-bottom">${best?`<div class="exam-score">${attemptScore(best)}</div>`:'<span class="muted">Нет результата</span>'}<button class="button ${best?'secondary':'dark'}" data-exam="${t.id}" ${service!=='ready'||active?'disabled':''}>${best?'Пересдать':'Сдать'}</button></div></article>`;}).join('')}</div><p class="exam-note">В рейтинг входит лучший результат каждой темы, включая несданные экзамены. Набор: 20 стандартных аминокислот.</p>${examAttempts.length?`<details class="attempt-history"><summary>История попыток · ${examAttempts.length}</summary>${examAttempts.slice(0,30).map(a=>`<div class="attempt-line"><span>${esc(attemptTitle(a))}<small>${formatDate(a.startedAt)}</small></span><div class="exam-score">${attemptScore(a)}</div></div>`).join('')}</details>`:''}<button id="show-ranking" class="button secondary full">Общий рейтинг</button></section>`;
}
function formatDate(ms){return new Intl.DateTimeFormat('ru-RU',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(ms);}
const originalProgress=progress;
progress=function(){return intro('','Прогресс','')+examsPanel()+`<details class="training-stats"><summary>Статистика тренировок</summary><div>${originalProgress().replace(/^<div class="intro">.*?<\/div>/,'')}</div></details>`;};
const originalRender=render;
render=function(){
  document.body.classList.toggle('in-quiz',!!examState&&!examPublicResult&&(examState.status==='running'||!!examFeedback));
  if(examState){$('#app').innerHTML=!examPublicResult&&(examState.status==='running'||examFeedback)?examQuestionPage():examResultPage();bindExamUI();return;}
  if(view==='leaderboard'){$('#app').innerHTML=rankingPage();bindExamUI();return;}
  originalRender();bindExamUI();
};
function examStartDialog(id){const t=TOPIC(id);examRequest={topic:id,requestId:crypto.randomUUID()};modal(`<h2>${t.title}</h2><p>${t.total} вопросов. За верный ответ — 1 балл. Третья ошибка завершает экзамен. Набранные баллы сохраняются.</p><form id="exam-start-form"><label class="name-label" for="exam-name">Имя в рейтинге</label><input id="exam-name" name="name" required minlength="2" maxlength="32" autocomplete="nickname" value="${esc(examName)}"><p class="publish-note">Имя и результат будут опубликованы, даже если экзамен не сдан. Попытка будет видна в истории.</p><p id="exam-start-error" class="error-text" role="alert"></p><button class="button dark full" type="submit">Начать экзамен</button></form>`);$('#exam-start-form').onsubmit=beginExam;}
async function beginExam(e){
  e.preventDefault();if(examBusy)return;const input=$('#exam-name').value.trim();examBusy=true;$('#exam-start-form button').disabled=true;$('#exam-start-error').textContent='';
  try{
    if(!/^[a-f0-9]{64}$/.test(examToken)){examToken=createToken();localStorage.setItem(AUTH_KEY,examToken);}
    const started=await api('start',{...examRequest,name:input});examName=input;try{localStorage.setItem('amino-name-v1',input);}catch{}
    examPublicResult=false;pendingAnswer=null;examState=started;examFeedback=null;examScreenQuestion=started.question;examError='';$('#modal').close();session=null;setExamNav();render();window.scrollTo(0,0);refreshExams();
  }catch(e){$('#exam-start-error').textContent=e.message;$('#exam-start-form button').disabled=false;}finally{examBusy=false;if(examState)render();}
}
function setExamNav(){view='progress';document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view==='progress'));}
async function resumeExam(id){
  try{examPublicResult=false;pendingAnswer=null;examState=await api('attempt?id='+encodeURIComponent(id));examFeedback=null;examScreenQuestion=examState.question;examError='';session=null;setExamNav();render();window.scrollTo(0,0);}catch(e){modal(`<h2>Не удалось продолжить</h2><p>${esc(e.message)}</p>`);}
}
function examQuestionPage(){
  const a=examState,q=examScreenQuestion,t=TOPIC(a.topic);if(!q)return examResultPage();
  const prompt=promptMarkup(q);
  return `<div class="quiz-wrap exam-playing"><div class="quiz-toolbar"><button id="exam-exit" class="text-button">Завершить</button><span>${t.title} · ${q.index+1}/${a.total}</span><strong>${a.score} ${pointWord(a.score)}</strong></div><div class="exam-meter"><span class="exam-status">Экзамен</span><span class="error-count ${a.errors?'has-errors':''}">Ошибки ${a.errors}/${ExamCore.MAX_ERRORS}</span></div><div class="bar"><span style="width:${a.answered/a.total*100}%"></span></div><section class="panel question-panel question-enter"><h1>${esc(q.text)}</h1><div class="prompt-display ${promptClass(q)}">${prompt}</div><div class="answers ${choicesClass(q)}">${q.choices.map((choice,i)=>{
    const correct=examFeedback&&choice===examFeedback.correct,wrong=examFeedback&&!examFeedback.right&&choice===examFeedback.selected;
    return `<button class="answer ${correct?'correct':wrong?'wrong':''}" data-exam-answer="${i}" ${examFeedback||examBusy||pendingAnswer?'disabled':''}><span class="answer-copy">${choiceMarkup(q,choice,i)}${correct?'<small>Верный ответ</small>':wrong?'<small>Ваш ответ</small>':''}</span></button>`;
  }).join('')}</div>${examFeedback?`<div class="feedback ${examFeedback.right?'':'bad'}" role="status"><strong>${examFeedback.right?'+1 балл':'Ошибка'}</strong><p>${esc(examFeedback.explanation)}</p><button id="exam-next" class="button">${a.status==='running'?'Следующий вопрос':'Результат'}</button></div>`:''}${examError?`<div class="error-text" role="alert">${esc(examError)}<button id="exam-retry-answer" class="button secondary full">Повторить отправку</button></div>`:''}</section><p class="quiz-foot">${['structure','structure-reverse'].includes(q.type)?'Нейтральная форма свободной аминокислоты':['classset','classset-reverse'].includes(q.type)?'Полярность и структурные признаки боковой цепи':['codon','codon-reverse'].includes(q.type)?'мРНК · 5′ → 3′ · стандартный генетический код':''}</p></div>`;
}
let pendingAnswer=null;
async function submitExamAnswer(choice){
  if(examBusy||examFeedback)return;
  pendingAnswer={attemptId:examState.id,index:examScreenQuestion.index,choice};await sendExamAnswer();
}
async function sendExamAnswer(){
  if(examBusy||!pendingAnswer)return;examBusy=true;examError='';render();
  try{const response=await api('answer',pendingAnswer);examState=response.attempt;examFeedback=response.feedback;pendingAnswer=null;}
  catch(e){examError=e.message;}finally{examBusy=false;render();if(examFeedback)requestAnimationFrame(()=>{$('.feedback')?.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});$('#exam-next')?.focus({preventScroll:true});});}
}
function examNext(){examFeedback=null;examError='';examScreenQuestion=examState.question;render();window.scrollTo(0,0);if(examState.status==='passed')celebrate();if(examState.status!=='running')refreshExams();}
function examResultPage(){
  const a=examState,t=TOPIC(a.topic);return `<div class="result exam-result"><div class="result-header ${a.status}"><span class="exam-status ${a.status}">${STATUS[a.status]}</span><h1>${t.title}</h1></div><section class="panel"><div class="result-score">${a.score}<span class="muted" style="font-size:28px;letter-spacing:0"> / ${a.total}</span></div><p class="muted">${a.errors} ${plural(a.errors,'ошибка','ошибки','ошибок')} · ${a.answered} из ${a.total} вопросов</p><p class="published-result">${esc(a.name)} · результат опубликован</p><div class="result-actions"><button id="exam-to-ranking" class="button dark">Рейтинг</button><button id="exam-share" class="button secondary">Поделиться</button></div><button id="exam-to-progress" class="text-button">К результатам по темам</button></section></div>`;
}
async function shareExam(){const a=examState,t=TOPIC(a.topic),link=new URL(location.href);link.hash='result='+a.id;const payload={title:'Амино · '+t.title,text:`${a.name}: ${a.score}/${a.total} · ${STATUS[a.status]}`,url:link.href};try{if(navigator.share)await navigator.share(payload);else{await navigator.clipboard.writeText(payload.text+'\n'+payload.url);$('#exam-share').textContent='Ссылка скопирована';}}catch(e){if(e.name!=='AbortError')modal(`<h2>Ссылка на результат</h2><input class="share-link" readonly value="${esc(link.href)}">`);}}
function rankingPage(){
  if(!leaderboardData)return intro('','Рейтинг','')+`<div class="panel"><p class="muted">${examError?esc(examError):'Загрузка…'}</p>${examError?'<button id="refresh-ranking" class="button dark">Повторить</button>':''}</div>`;
  const rows=leaderboardData.rows;
  return intro('','Рейтинг','')+`<div class="section-top"><span class="muted">Сумма лучших результатов по темам</span><button id="refresh-ranking" class="text-button">Обновить</button></div>${rows.length?`<div class="ranking-desktop"><table><thead><tr><th>Место</th><th>Имя</th>${ExamCore.TOPICS.map(t=>`<th>${t.title}</th>`).join('')}<th>Всего</th></tr></thead><tbody>${rows.map(r=>`<tr class="${r.id===examProfile?.id?'is-me':''}"><td>${r.rank}</td><td><button class="name-link" data-history="${r.id}">${esc(r.name)}</button></td>${ExamCore.TOPICS.map(t=>`<td>${rankCell(r.results[t.id])}</td>`).join('')}<td class="total-cell">${r.total}</td></tr>`).join('')}</tbody></table></div><div class="ranking-mobile">${rows.map(r=>`<article class="ranking-card ${r.id===examProfile?.id?'is-me':''}"><div class="ranking-head"><span class="rank-number">${r.rank}</span><button class="name-link" data-history="${r.id}">${esc(r.name)}</button><strong>${r.total}<small>${pointWord(r.total)}</small></strong></div><div class="ranking-breakdown">${ExamCore.TOPICS.map(t=>`<div><span>${t.title}</span>${rankCell(r.results[t.id])}</div>`).join('')}</div></article>`).join('')}</div>`:'<div class="panel empty">Пока нет участников.<button id="exam-to-progress" class="button dark" style="display:block;margin:18px auto 0">Выбрать экзамен</button></div>'}`;
}
function passedMark(){return '<span class="passed-mark" role="img" aria-label="Экзамен по теме сдан" title="Экзамен по теме сдан"><svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" focusable="false"><path d="m12 2.5 2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.52l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96Z"/></svg></span>';}
function rankCell(result){const best=result.best;if(best)return `<span class="rank-score">${best.score}/${best.total}${result.passed||best.status==='passed'?passedMark():''}</span>`;return '<span class="muted">—</span>';}
async function loadRanking(){examError='';leaderboardData=null;if(view==='leaderboard')render();try{leaderboardData=await api('leaderboard');}catch(e){examError=e.message;}if(view==='leaderboard')render();}
function showRanking(){examState=null;examFeedback=null;setView('leaderboard');loadRanking();}
async function showHistory(id){try{const result=await api('history?participant='+encodeURIComponent(id));modal(`<h2>История экзаменов</h2>${result.attempts.map(a=>`<div class="attempt-line"><span>${esc(a.name)} · ${esc(attemptTitle(a))}<small>${formatDate(a.startedAt)}</small></span><div class="exam-score">${attemptScore(a)}</div></div>`).join('')}`);}catch(e){modal(`<h2>История недоступна</h2><p>${esc(e.message)}</p>`);}}
function bindExamUI(){
  document.querySelectorAll('[data-exam]').forEach(b=>b.onclick=()=>examStartDialog(b.dataset.exam));
  document.querySelectorAll('[data-resume]').forEach(b=>b.onclick=()=>resumeExam(b.dataset.resume));
  document.querySelectorAll('[data-exam-answer]').forEach(b=>b.onclick=()=>submitExamAnswer(Number(b.dataset.examAnswer)));
  document.querySelectorAll('[data-history]').forEach(b=>b.onclick=()=>showHistory(b.dataset.history));
  if($('#exam-next'))$('#exam-next').onclick=examNext;
  if($('#exam-retry-answer'))$('#exam-retry-answer').onclick=sendExamAnswer;
  if($('#show-ranking'))$('#show-ranking').onclick=showRanking;
  if($('#exam-to-ranking'))$('#exam-to-ranking').onclick=showRanking;
  if($('#refresh-ranking'))$('#refresh-ranking').onclick=loadRanking;
  if($('#exam-share'))$('#exam-share').onclick=shareExam;
  if($('#exam-to-progress'))$('#exam-to-progress').onclick=()=>{examState=null;setView('progress');refreshExams();};
  if($('#exam-exit'))$('#exam-exit').onclick=()=>modal('<h2>Прервать экзамен?</h2><p>Попытка останется в истории со статусом «Не завершён».</p><button id="exam-confirm-exit" class="button dark">Прервать</button>');
}
document.querySelectorAll('[data-view]').forEach(b=>{
  const original=b.onclick;
  b.onclick=()=>{
    if(examState&&examState.status==='running'&&!examPublicResult){modal(`<h2>Выйти из экзамена?</h2><p>Попытку можно продолжить в течение двух часов. После этого она останется в истории как незавершённая.</p><button id="exam-leave" class="button dark" data-target="${b.dataset.view}">Выйти</button>`);return;}
    examState=null;examFeedback=null;original();if(b.dataset.view==='leaderboard')loadRanking();if(b.dataset.view==='progress')refreshExams();
  };
});
$('#modal').addEventListener('click',async e=>{
  const b=e.target.closest('button');if(b?.id==='exam-leave'){$('#modal').close();examState=null;examFeedback=null;setView(b.dataset.target);refreshExams();if(view==='leaderboard')loadRanking();}
  if(b?.id==='exam-confirm-exit'){if(examBusy)return;examBusy=true;b.disabled=true;try{examState=await api('abandon',{attemptId:examState.id});examFeedback=null;examScreenQuestion=null;$('#modal').close();render();refreshExams();}catch(e){b.disabled=false;$('#modal-content').insertAdjacentHTML('beforeend',`<p class="error-text">${esc(e.message)}</p>`);}finally{examBusy=false;}}
});
document.addEventListener('keydown',e=>{if(!examState||examState.status!=='running'||$('#modal').open||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(examFeedback&&e.key==='Enter'){e.preventDefault();examNext();}else if(!examFeedback&&/^[1-4]$/.test(e.key)){e.preventDefault();submitExamAnswer(Number(e.key)-1);}});
function celebrate(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const canvas=document.createElement('canvas');canvas.className='celebration';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
  const ctx=canvas.getContext('2d'),w=innerWidth,h=innerHeight;canvas.width=w;canvas.height=h;
  const colors=['#c5f36a','#557bd6','#db6ba0','#47b79e','#efb748'];
  const pieces=Array.from({length:85},()=>({x:w/2,y:h*.25,vx:(Math.random()-.5)*11,vy:-Math.random()*12-2,r:Math.random()*Math.PI,size:Math.random()*4+3,color:colors[Math.floor(Math.random()*colors.length)]}));
  let startTime,last;function frame(time){if(!startTime)startTime=time;if(!last)last=time;const dt=Math.min((time-last)/16.67,2);last=time;ctx.clearRect(0,0,w,h);const progress=(time-startTime)/2400;if(progress>=1){canvas.remove();return;}ctx.globalAlpha=Math.min(1,(1-progress)*3);for(const p of pieces){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.16*dt;p.r+=.07*dt;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.fillStyle=p.color;ctx.fillRect(-p.size/2,-p.size,p.size,p.size*2);ctx.restore();}requestAnimationFrame(frame);}requestAnimationFrame(frame);
}
refreshExams();
if(location.hash.startsWith('#result=')){api('result?id='+encodeURIComponent(location.hash.slice(8))).then(a=>{examPublicResult=true;examState=a;examFeedback=null;setExamNav();render();}).catch(e=>modal(`<h2>Результат недоступен</h2><p>${esc(e.message)}</p>`));}
