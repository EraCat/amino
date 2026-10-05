/* Shared questions for practice and exams. One correct answer = one point. */
var ExamCore = (() => {
  const VERSION = '2026-10-v5';
  const LIMIT = 30;
  const MAX_ERRORS = 3;
  const GROUPS = {nonpolar:'Неполярная',polar:'Полярная незаряженная',acidic:'Кислая',basic:'Основная'};
  const AXES = [
    ['Ароматическое кольцо','FWYH'],['Гидрофобная алифатическая','AVLIM'],
    ['Серосодержащая','CM'],['BCAA','VLI'],['Гидроксильная группа','STY'],['Амидная боковая цепь','NQ']
  ];
  const TOPICS = [
    {id:'names-codes',title:'Названия и коды',forward:['code','three'],reverse:['name','name-three'],description:'Названия по кодам и коды по названиям'},
    {id:'classification',title:'Классификация',forward:['classset'],reverse:['classset-reverse'],description:'Аминокислоты и группы боковых цепей'},
    {id:'formulas',title:'Формулы',forward:['formula'],reverse:['formula-reverse'],description:'Аминокислоты и молекулярные формулы'},
    {id:'structures',title:'Структуры',forward:['structure-reverse'],reverse:['structure'],description:'Аминокислоты и химические структуры'},
    {id:'properties',title:'Свойства',forward:['property-forward','essential'],reverse:['property','essential-reverse'],description:'Особенности и незаменимость'}
  ].map(t=>({...t,types:[...t.forward,...t.reverse],total:LIMIT}));
  const shuffle = (a, random=Math.random) => {
    const r=[...a];for(let i=r.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[r[i],r[j]]=[r[j],r[i]];}return r;
  };
  const classification = a => [GROUPS[a.group],...AXES.filter(([,codes])=>codes.includes(a.code)).map(([title])=>title)].join(' · ');
  const essential = a => a.essential?'Незаменимая':'Не входит в 9 незаменимых';
  const property = a => `${a.feature}. Боковая цепь: ${a.side}.`;
  const image = a => a.structure;
  const SPECS = {
    name:{text:'Какая аминокислота обозначается этим однобуквенным кодом?',prompt:a=>a.code,value:a=>a.name},
    'name-three':{text:'Какая аминокислота обозначается этим трёхбуквенным кодом?',prompt:a=>a.three,value:a=>a.name},
    code:{text:'Какой однобуквенный код у этой аминокислоты?',prompt:a=>a.name,value:a=>a.code},
    three:{text:'Какой трёхбуквенный код у этой аминокислоты?',prompt:a=>a.name,value:a=>a.three},
    classset:{text:'Какой набор категорий указан для этой аминокислоты в схеме квиза?',prompt:a=>a.name,value:classification},
    'classset-reverse':{text:'Какая из перечисленных аминокислот имеет такой набор категорий в схеме квиза?',prompt:classification,value:a=>a.name,match:classification},
    formula:{text:'Какая молекулярная формула у этой аминокислоты?',prompt:a=>a.name,value:a=>a.formula},
    'formula-reverse':{text:'Какая из перечисленных аминокислот имеет эту молекулярную формулу?',prompt:a=>a.formula,value:a=>a.name,match:a=>a.formula},
    structure:{text:'Какая аминокислота изображена?',prompt:image,value:a=>a.name},
    'structure-reverse':{text:'Какая структура соответствует этой аминокислоте?',prompt:a=>a.name,value:image},
    property:{text:'Какой аминокислоте соответствует это описание?',prompt:property,value:a=>a.name,match:property},
    'property-forward':{text:'Какое описание относится к этой аминокислоте?',prompt:a=>a.name,value:property},
    essential:{text:'Эта аминокислота незаменима для здорового взрослого?',prompt:a=>a.name,value:essential},
    'essential-reverse':{text:'Какая из перечисленных аминокислот относится к этой категории для здорового взрослого?',prompt:essential,value:a=>a.name,match:essential}
  };
  function allowed(a,type){return a.group!=='special'||!['classset','classset-reverse','essential','essential-reverse'].includes(type);}
  function question(data,a,type,random=Math.random){
    const spec=SPECS[type];if(!spec||!allowed(a,type))throw Error('Недопустимый тип вопроса');
    const correct=spec.value(a);
    const candidates=data.filter(other=>allowed(other,type)&&(!spec.match||spec.match(other)!==spec.match(a)));
    let alternatives=type==='essential'?['Незаменимая','Не входит в 9 незаменимых']:candidates.map(spec.value);
    alternatives=shuffle([...new Set(alternatives)].filter(v=>v!==correct),random).slice(0,type==='essential'?1:3);
    let explanation=`${a.name} · ${a.three} · ${a.code}. ${a.info}`;
    if(type==='formula'||type==='formula-reverse'){
      const same=data.filter(other=>other.code!==a.code&&other.formula===a.formula);
      explanation=`${a.formula} — формула свободной аминокислоты. ${same.length?`Такую же формулу имеет ${same.map(x=>x.name.toLowerCase()).join(', ')}. `:''}${a.info}`;
    }
    return {code:a.code,type,text:spec.text,prompt:spec.prompt(a),choices:shuffle([correct,...alternatives],random),correct,explanation};
  }
  function build(data,topicId,random=Math.random){
    const topic=TOPICS.find(t=>t.id===topicId);if(!topic)throw Error('Неизвестная тема');
    const standard=data.filter(a=>a.group!=='special');
    if(standard.length!==20)throw Error('Для экзамена требуется 20 стандартных аминокислот');
    const types=shuffle(topic.types,random);
    // Equal numbers of forward and reverse questions, with balanced types within each.
    const quotas={};for(const direction of [topic.forward,topic.reverse]){
      const order=shuffle(direction,random);order.forEach((type,i)=>quotas[type]=Math.floor(LIMIT/2/order.length)+(i<LIMIT/2%order.length?1:0));
    }
    const selected=[],used=new Set();
    const add=(a,type)=>{selected.push(question(standard,a,type,random));used.add(type+':'+a.code);quotas[type]--;};
    // Every amino acid appears, then fill remaining slots without repeated pairs.
    for(const a of shuffle(standard,random)){
      const maximum=Math.max(...Object.values(quotas));
      const type=shuffle(types.filter(t=>quotas[t]===maximum),random)[0];add(a,type);
    }
    for(const type of types){const rest=shuffle(standard.filter(a=>!used.has(type+':'+a.code)),random);while(quotas[type]>0)add(rest.pop(),type);}
    return shuffle(selected,random);
  }
  function publicQuestion(q,index){if(!q)return null;return {index,type:q.type,text:q.text,prompt:q.prompt,choices:q.choices};}
  function resultScore(a){
    if(a.status==='unfinished')return 0;
    // Recover earned points from attempts zeroed by the previous grading rule.
    if(a.status==='failed'&&a.score===0&&Array.isArray(a.answers))return a.answers.filter(x=>x.feedback?.right===true).length;
    return a.score;
  }
  function isCurrentAttempt(a){return ['2026-10-v3','2026-10-v4',VERSION].includes(a.version)&&TOPICS.some(t=>t.id===a.topic);}
  return {VERSION,LIMIT,MAX_ERRORS,TOPICS,question,allowed,build,publicQuestion,isCurrentAttempt,resultScore};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=ExamCore;
