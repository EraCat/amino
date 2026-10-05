'use strict';
const $ = (s) => document.querySelector(s);
const GROUPS = {nonpolar:'Неполярная',polar:'Полярная, незаряженная',acidic:'Кислая',basic:'Основная',special:'Редкая кодируемая'};
const MODES = {mix:'Все темы',names:'Названия и коды',class:'Классификация',formula:'Формулы',structure:'Структуры',properties:'Свойства'};
const AXES = {aromatic:{title:'Ароматическое кольцо',codes:'FWYH',noun:'аминокислотам с ароматическим кольцом в боковой цепи'},aliphatic:{title:'Гидрофобная алифатическая',codes:'AVLIM',noun:'гидрофобным алифатическим аминокислотам'},sulfur:{title:'Серосодержащая',codes:'CM',noun:'серосодержащим'},bcaa:{title:'Разветвлённая цепь (BCAA)',codes:'VLI',noun:'аминокислотам с разветвлённой цепью (BCAA)'},hydroxyl:{title:'Гидроксильная группа',codes:'STY',noun:'аминокислотам с гидроксильной группой в боковой цепи'},amide:{title:'Амидная боковая цепь',codes:'NQ',noun:'аминокислотам с амидной боковой цепью'}};
const TYPES = ExamCore.TOPICS.flatMap(t=>t.types);
const TRAIN_TOPIC = {names:'names-codes',class:'classification',formula:'formulas',structure:'structures',properties:'properties'};
const KEY = 'amino-quiz-v1';
let memoryOnly = false;
let stored = {};
try {stored = JSON.parse(localStorage.getItem(KEY) || '{}') || {};} catch {memoryOnly = true;}
let stats = stored.stats && typeof stored.stats === 'object' ? stored.stats : {};
let mistakes = Array.isArray(stored.mistakes) ? stored.mistakes.filter(x => AMINO.some(a=>a.code===x.code) && TYPES.includes(x.type)) : [];
let rounds = Number(stored.rounds) || 0;
let extended = !!stored.extended;
let mode = 'mix', view = 'train', session = null, search = '', filter = 'all';
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const formula = s => esc(s).replace(/(\d+)/g,'<sub>$1</sub>');
const getA = code => AMINO.find(a=>a.code===code);
const pool = () => AMINO.filter(a=>extended || a.group !== 'special');
const activeMistakes = () => mistakes.filter(x=>pool().some(a=>a.code===x.code&&ExamCore.allowed(a,x.type)));
const shuffle = arr => [...arr].map(v=>({v,r:Math.random()})).sort((a,b)=>a.r-b.r).map(x=>x.v);
function save(){try{localStorage.setItem(KEY, JSON.stringify({stats,mistakes,rounds,extended}));}catch{memoryOnly=true;}}
function totals(){return Object.values(stats).reduce((s,x)=>({attempts:s.attempts+(Number(x.attempts)||0),correct:s.correct+(Number(x.correct)||0)}),{attempts:0,correct:0});}
function accuracy(){const t=totals();return t.attempts ? Math.round(t.correct/t.attempts*100)+'%' : '—';}
function setView(v){view=v;session=null;document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===v));render();window.scrollTo(0,0);}
function intro(k,title,sub){return `<div class="intro">${k?`<div class="eyebrow">${k}</div>`:''}<h1>${title}</h1>${sub?`<p>${sub}</p>`:''}</div>`;}
function render(){
 document.body.classList.toggle('in-quiz',!!session&&!session.done);
 $('#app').innerHTML=(memoryOnly?'<div class="save-warning">Прогресс не сохраняется: хранилище браузера недоступно.</div>':'')+(view==='library'?library():view==='progress'?progress():session?quiz():home());
 bind();
}
function home(){
 const t=totals(), day=AMINO[Math.floor(Date.now()/86400000)%20];
 return intro('','Тренировка','')+`<div class="workspace"><section class="panel start-panel"><div class="round-head"><h2><span class="step">1</span>Тема</h2><span class="round-badge">10 вопросов</span></div><div class="mode-grid">${Object.entries(MODES).map(([k,v])=>`<button class="mode ${mode===k?'selected':''}" data-mode="${k}" aria-pressed="${mode===k}"><span class="mode-symbol" aria-hidden="true">${({mix:'◈',names:'Aa',class:'▦',formula:'H₂',structure:'⬡',properties:'±'})[k]}</span><span>${v}</span><span class="selection-mark" aria-hidden="true">${mode===k?'✓':''}</span></button>`).join('')}</div><label class="select-row"><span class="step-label"><span class="step">2</span>Набор</span><select id="set-select"><option value="20" ${!extended?'selected':''}>20 стандартных</option><option value="22" ${extended?'selected':''}>22 · включая Sec и Pyl</option></select></label><button id="start" class="button full primary-action">Начать квиз</button></section><section class="panel context-panel"><div class="section-top"><h2>Статистика</h2><span class="pill">Раундов: ${rounds}</span></div><div class="mini-stats"><div><span class="big-number">${t.attempts}</span><small>ответов</small></div><div><span class="big-number">${accuracy()}</span><small>точность</small></div><div><span class="big-number">${activeMistakes().length}</span><small>к повторению</small></div></div><div class="section-top"><h3>Аминокислота дня</h3><button class="text-button" data-detail="${day.code}">Открыть</button></div><div class="molecule-tile"><img src="${esc(day.structure)}" alt="Структура: ${day.name}"><div><div class="code">${day.code} <small>${day.three}</small></div><strong>${day.name}</strong></div></div><p class="tip">${esc(day.info)}</p><button class="button secondary full" id="repeat" ${activeMistakes().length?'':'disabled'} style="margin-top:20px">Повторить ошибки${activeMistakes().length?' · '+activeMistakes().length:''}</button></section></div>`;
}
function typesFor(a){const types=mode==='mix'?TYPES:ExamCore.TOPICS.find(t=>t.id===TRAIN_TOPIC[mode]).types;return types.filter(t=>ExamCore.allowed(a,t));}
function start(repeat=false){
 let questions=[];
 if(repeat){questions=shuffle(activeMistakes()).slice(0,10).map(x=>ExamCore.question(pool(),getA(x.code),x.type));}
 else{
  const topic=ExamCore.TOPICS.find(t=>t.id===TRAIN_TOPIC[mode]),used=new Set();
  const schedule=mode==='mix'?shuffle(ExamCore.TOPICS.flatMap(t=>[shuffle(t.forward)[0],shuffle(t.reverse)[0]])):shuffle([...Array.from({length:5},(_,i)=>topic.forward[i%topic.forward.length]),...Array.from({length:5},(_,i)=>topic.reverse[i%topic.reverse.length])]);
  questions=schedule.map(type=>{
   const candidates=pool().filter(a=>typesFor(a).includes(type));
   const unseen=candidates.filter(a=>!used.has(a.code)),a=shuffle(unseen.length?unseen:candidates)[0];used.add(a.code);
   return ExamCore.question(pool(),a,type);
  });
 }
 if(!questions.length)return;
 session={questions,index:0,correct:0,answered:false,selected:null,results:[],choices:null,done:false};render();window.scrollTo(0,0);
}
function questionText(q){return q.text;}
function makeChoices(q){return q.choices;}
function explain(q){return q.explanation;}
function promptMarkup(q){return q.type==='structure'?`<img src="${esc(q.prompt)}" alt="Структура аминокислоты">`:q.type==='formula-reverse'?formula(q.prompt):esc(q.prompt);}
function promptClass(q){return ['property','classset-reverse'].includes(q.type)?'description':['name','name-three','formula-reverse','structure'].includes(q.type)?'':'words';}
function choicesClass(q){return q.type==='structure-reverse'?'structure-answers':['property-forward','classset'].includes(q.type)?'answer-descriptions':'';}
function choiceMarkup(q,value,i){return q.type==='structure-reverse'?`<img class="structure-option" src="${esc(value)}" alt="Вариант структуры ${i+1}">`:q.type==='formula'?formula(value):esc(value);}
function reviewMarkup(q,value){return q.type==='structure-reverse'?`<img class="review-structure" src="${esc(value)}" alt="Структура аминокислоты">`:q.type==='formula'?formula(value):esc(value);}
function quiz(){
 if(session.done)return result();
 const q=session.questions[session.index],a=getA(q.code),correct=q.correct;
 if(!session.choices)session.choices=makeChoices(q);
 const prompt=promptMarkup(q);
 const right=session.selected===correct;
 return `<div class="quiz-wrap"><div class="quiz-toolbar"><button id="exit" class="text-button">Завершить</button><span>Вопрос ${session.index+1} из ${session.questions.length}</span><span>${session.correct} верно</span></div><div class="bar" aria-label="Прогресс раунда"><span style="width:${session.index/session.questions.length*100}%"></span></div><section class="panel question-panel ${session.answered?'':'question-enter'}"><span class="eyebrow">${['structure','structure-reverse'].includes(q.type)?'СТРУКТУРА':['formula','formula-reverse'].includes(q.type)?'МОЛЕКУЛЯРНАЯ ФОРМУЛА':['classset','classset-reverse'].includes(q.type)?'КЛАССИФИКАЦИЯ':['property','property-forward','essential','essential-reverse'].includes(q.type)?'СВОЙСТВА':'НАЗВАНИЯ И КОДЫ'}</span><h1>${esc(questionText(q))}</h1><div class="prompt-display ${promptClass(q)}">${prompt}</div><div class="answers ${choicesClass(q)}">${session.choices.map((x,i)=>`<button class="answer ${session.answered?(x===correct?'correct':x===session.selected?'wrong':''):''}" data-answer="${i}" ${session.answered?'disabled':''}><span class="letter" aria-hidden="true">${session.answered&&x===correct?'✓':session.answered&&x===session.selected?'×':i+1}</span><span class="answer-copy">${choiceMarkup(q,x,i)}${session.answered&&x===correct?'<small>Верный ответ</small>':session.answered&&x===session.selected?'<small>Ваш ответ</small>':''}</span></button>`).join('')}</div>${session.answered?`<div class="feedback ${right?'':'bad'}" role="status"><strong><span aria-hidden="true">${right?'✓':'×'}</span> ${right?'Верно':'Ошибка'}</strong><p>${esc(explain(q))}</p><button id="next" class="button">${session.index+1===session.questions.length?'Посмотреть результат':'Следующий вопрос'}</button></div>`:''}</section>${['structure','structure-reverse'].includes(q.type)?'<div class="quiz-foot">Нейтральная форма свободной аминокислоты</div>':['classset','classset-reverse'].includes(q.type)?'<div class="quiz-foot">Свойства боковой цепи при pH ≈ 7</div>':''}</div>`;
}
function answer(i){if(!session || session.answered || session.done)return;const q=session.questions[session.index],a=getA(q.code),correct=q.correct,selected=session.choices[i];if(selected===undefined)return;const right=selected===correct;session.selected=selected;session.answered=true;if(right)session.correct++;session.results.push({...q,right,selected,correct});const st=stats[a.code]||{attempts:0,correct:0};st.attempts++;if(right)st.correct++;stats[a.code]=st;mistakes=mistakes.filter(x=>x.code!==q.code||x.type!==q.type);if(!right)mistakes.push({...q});save();render();requestAnimationFrame(()=>{$('.feedback')?.scrollIntoView({block:'nearest',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});$('#next')?.focus({preventScroll:true});});}
function next(){if(!session?.answered)return;session.index++;if(session.index>=session.questions.length){session.done=true;rounds++;save();}else{session.answered=false;session.selected=null;session.choices=null;}render();window.scrollTo(0,0);}
function result(){const wrong=session.results.filter(r=>!r.right);return `<div class="result">${intro('','Результат','')}<section class="panel"><div class="result-score">${session.correct}<span class="muted" style="font-size:30px;letter-spacing:0"> / ${session.questions.length}</span></div><p class="muted">${Math.round(session.correct/session.questions.length*100)}% правильных ответов</p><div class="result-actions"><button id="start" class="button">Ещё раунд</button>${activeMistakes().length?'<button id="repeat" class="button secondary">Повторить ошибки</button>':''}</div>${wrong.map(r=>`<div class="review-item"><strong>${esc(getA(r.code).name)}</strong>${esc(questionText(r))}<br><span class="muted">Ваш ответ: ${reviewMarkup(r,r.selected)}</span><br>Верно: ${reviewMarkup(r,r.correct)}</div>`).join('')}</section></div>`;}
function library(){const list=pool().filter(a=>(filter==='all'||a.group===filter||AXES[filter]?.codes.includes(a.code))&&`${a.name} ${a.en} ${a.code} ${a.three}`.toLocaleLowerCase().includes(search.toLocaleLowerCase().trim()));return intro('',`Аминокислоты · ${pool().length}`,'')+`<div class="tools"><input id="search" type="search" placeholder="Название или код" aria-label="Поиск аминокислоты" value="${esc(search)}"><select id="filter" aria-label="Фильтр по классификации"><option value="all">Все группы</option>${Object.entries({...GROUPS,...Object.fromEntries(Object.entries(AXES).map(([k,v])=>[k,v.title]))}).filter(([k])=>extended||k!=='special').map(([k,v])=>`<option value="${k}" ${filter===k?'selected':''}>${v}</option>`).join('')}</select></div>${classificationMap()}<div class="catalog">${list.map(a=>`<button class="amino-card" data-detail="${a.code}"><div class="card-top"><span class="card-code">${a.code}</span><span class="card-three">${a.three}</span></div><img src="${esc(a.structure)}" alt=""><h3>${a.name}</h3>${groupPill(a.group,GROUPS[a.group])}</button>`).join('')||'<div class="empty">Ничего не найдено.</div>'}</div>`;}
function progress(){const t=totals(),covered=pool().filter(a=>stats[a.code]?.attempts).length;return intro('','Прогресс','')+`<div class="overview"><div class="panel"><span class="big-number">${t.attempts}</span><small>ответов всего</small></div><div class="panel"><span class="big-number">${accuracy()}</span><small>точность</small></div><div class="panel"><span class="big-number">${covered}/${pool().length}</span><small>в тренировке</small></div></div><div class="section-top"><h2>По аминокислотам</h2><button id="repeat" class="text-button" ${activeMistakes().length?'':'disabled'}>Ошибки · ${activeMistakes().length}</button></div><div class="progress-list">${pool().map(a=>{const st=stats[a.code]||{attempts:0,correct:0},pct=st.attempts?Math.round(st.correct/st.attempts*100):0;return `<div class="progress-row"><div class="section-top" style="margin:0"><strong>${a.three} · ${a.name}</strong><span class="muted">${st.attempts?pct+'%':'—'}</span></div><div class="bar"><span style="width:${pct}%"></span></div><div class="sr-status" style="margin-top:8px">${st.correct} верно из ${st.attempts} ответов</div></div>`;}).join('')}</div><p class="catalog-note">Точность — доля верных ответов. Прогресс хранится в этом браузере.</p><button id="reset" class="reset">Сбросить прогресс</button>`;}
function modal(html){$('#modal-content').innerHTML=html;$('#modal').showModal();}
function detail(code){const a=getA(code);modal(`<article class="detail">${groupPill(a.group,GROUPS[a.group])}<h1 style="font-size:30px">${a.name}</h1><div class="muted">${a.en}</div><div class="detail-codes"><strong>${a.code}</strong><span class="muted">/</span><strong>${a.three}</strong></div><img src="${esc(a.structure)}" alt="Структурная формула: ${a.name}">${tags(a)}<div class="facts"><div class="fact"><small>Молекулярная формула</small><strong class="formula">${formula(a.formula)}</strong></div><div class="fact"><small>Боковая цепь R</small><strong>${esc(a.side)}</strong></div><div class="fact"><small>Особенность</small>${a.feature}</div><div class="fact"><small>В рационе взрослого</small>${a.essential===null?'Не относится к стандартной пищевой классификации':a.essential?'Незаменимая':'Не входит в 9 незаменимых'}</div></div><p>${esc(a.info)}</p><p><a href="https://ru.wikipedia.org/wiki/${encodeURIComponent(a.name.replaceAll(' ','_'))}" target="_blank" rel="noopener">Википедия</a></p><p class="muted">Нейтральная форма свободной аминокислоты.</p></article>`);}
function help(){modal(`<h2>Справка</h2><p>Наборы: 20 стандартных аминокислот или 22 с селеноцистеином (Sec, U) и пирролизином (Pyl, O).</p><h3>Классификация</h3><p>По свойствам боковой цепи: неполярные (G, A, V, L, I, M, P, F, W), полярные незаряженные (S, T, C, Y, N, Q), кислые (D, E), основные (K, R, H). Ароматическое кольцо: F, W, Y, H. В классической учебной группе «ароматические» часто перечисляют только F, W и Y. Гидрофобные алифатические: A, V, L, I, M. Gly и Pro выделены отдельно по особенностям структуры.</p><p>Классификации в учебниках могут отличаться, особенно для C, Y и W. Гистидин относится к основным, но при pH около 7 его боковая цепь преимущественно нейтральна. Для Sec и Pyl в квизе нет вопроса о стандартной группе или пищевой незаменимости.</p><h3>Формулы и структуры</h3><p>Формулы относятся к свободным аминокислотам, не к остаткам в белке. На рисунках — нейтральные L-формы (глицин ахирален), с учётом стереохимии. Это 2D-структуры, а не пространственная форма белка. Лейцин и изолейцин имеют одинаковую молекулярную формулу.</p><h3>Источники</h3><p><a href="https://ru.wikipedia.org/wiki/Аминокислоты#Классификация" target="_blank" rel="noopener">Википедия · классификации аминокислот</a><br><a href="https://en.wikipedia.org/wiki/Proteinogenic_amino_acid#Side-chain_properties" target="_blank" rel="noopener">Wikipedia · свойства боковых цепей и коды</a><br><a href="https://www.ncbi.nlm.nih.gov/books/NBK9879/" target="_blank" rel="noopener">NCBI · The Molecular Composition of Cells</a><br><a href="https://www.ncbi.nlm.nih.gov/books/NBK557845/" target="_blank" rel="noopener">NCBI · Essential Amino Acids</a><br><a href="https://www.ncbi.nlm.nih.gov/books/NBK538201/" target="_blank" rel="noopener">NCBI · Histidine, ароматичность и свойства</a><br><a href="https://pubchem.ncbi.nlm.nih.gov/" target="_blank" rel="noopener">PubChem · формулы и химические структуры</a></p><p class="muted">Прогресс хранится в браузере.</p>`);}


function groupMarker(group){return `<span class="group-marker ${group}" aria-hidden="true">${({nonpolar:'●',aliphatic:'●',polar:'◆',acidic:'−',basic:'+',special:'✦',aromatic:'⬡',sulfur:'S',bcaa:'Y',hydroxyl:'OH',amide:'N'})[group]||'●'}</span>`;}
function groupPill(group,label){return `<span class="pill ${group}">${groupMarker(group)}${label}</span>`;}

function tags(a){return `<div class="tags">${Object.entries(AXES).filter(([k,v])=>v.codes.includes(a.code)).map(([k,v])=>`${groupPill(k,v.title)}`).join('')}${a.essential?'<span class="pill">Незаменимая</span>':''}${'RCQYGP'.includes(a.code)?'<span class="pill">Условно незаменимая</span>':''}</div>`;}
function classificationMap(){const groups=[['aliphatic','Гидрофобные алифатические','AVLIM'],['aromatic','Ароматическое кольцо','FWYH'],['polar','Полярные незаряженные','CSTNQY'],['basic','Основные','KRH'],['acidic','Отрицательно заряженные','DE']];return `<details class="map"><summary>Группы и пересечения</summary><p class="catalog-note">His: ароматическое кольцо и основная боковая цепь. Gly и Pro относятся к неполярным.</p><div class="map-grid">${groups.map(([k,label,codes])=>`<button class="map-group ${k}" data-group="${k}"><strong>${groupMarker(k)}${label}</strong><span>${codes.split('').map(c=>getA(c).three).join(' · ')}</span></button>`).join('')}</div></details>`;}

function bind(){
 document.querySelectorAll('[data-group]').forEach(b=>b.onclick=()=>{filter=b.dataset.group;search='';render();});
 document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;render();});
 document.querySelectorAll('[data-detail]').forEach(b=>b.onclick=()=>detail(b.dataset.detail));
 document.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>answer(Number(b.dataset.answer)));
 if($('#set-select'))$('#set-select').onchange=e=>{extended=e.target.value==='22';filter='all';save();render();};
 if($('#start'))$('#start').onclick=()=>start();
 if($('#repeat'))$('#repeat').onclick=()=>start(true);
 if($('#next'))$('#next').onclick=next;
 if($('#exit'))$('#exit').onclick=()=>modal('<h2>Закончить раунд?</h2><p>Ответы сохранены. Раунд останется незавершённым.</p><button id="confirm-exit" class="button dark">Закончить</button>');
 if($('#search'))$('#search').oninput=e=>{const caret=e.target.selectionStart;search=e.target.value;render();$('#search').focus();$('#search').setSelectionRange(caret,caret);};
 if($('#filter'))$('#filter').onchange=e=>{filter=e.target.value;render();};
 if($('#reset'))$('#reset').onclick=()=>modal('<h2>Сбросить статистику?</h2><p>Все ответы и сохранённые ошибки будут удалены из этого браузера.</p><button id="confirm-reset" class="button dark">Сбросить</button>');
}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{if(session&&!session.done){modal(`<h2>Выйти из раунда?</h2><p>Ответы сохранены.</p><button id="confirm-view" class="button dark" data-target="${b.dataset.view}">Перейти в раздел</button>`);}else setView(b.dataset.view);});
$('#help').onclick=help;
$('.brand').onclick=e=>{e.preventDefault();$('[data-view="train"]').click();};
$('#close-modal').onclick=()=>$('#modal').close();
$('#modal').addEventListener('click',e=>{const b=e.target.closest('button');if(b?.id==='confirm-exit'){$('#modal').close();setView('train');}if(b?.id==='confirm-view'){$('#modal').close();setView(b.dataset.target);}if(b?.id==='confirm-reset'){stats={};mistakes=[];rounds=0;save();$('#modal').close();render();}});
document.addEventListener('keydown',e=>{if($('#modal').open || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(session&&!session.done){if(!session.answered && /^[1-4]$/.test(e.key))answer(Number(e.key)-1);else if(session.answered && e.key==='Enter'){e.preventDefault();next();}}});
render();
