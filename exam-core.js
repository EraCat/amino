/* Shared semantic questions for practice and exams. Text is supplied by locale JSON. */
var ExamCore = (() => {
  const VERSION = '2026-10-v8';
  const LIMIT = 30;
  const MAX_ERRORS = 3;
  const AXES = [
    ['aromatic','FWYH'],['aliphatic','AVLIM'],['sulfur','CM'],
    ['bcaa','VLI'],['hydroxyl','STY'],['amide','NQ']
  ];
  const TOPICS = [
    {id:'names-codes',forward:['code','three'],reverse:['name','name-three']},
    {id:'codons',forward:['codon'],reverse:['codon-reverse']},
    {id:'classification',forward:['classset'],reverse:['classset-reverse']},
    {id:'formulas',forward:['formula'],reverse:['formula-reverse']},
    {id:'structures',forward:['structure-reverse'],reverse:['structure']},
    {id:'properties',forward:['property-forward','essential'],reverse:['property','essential-reverse']},
    {id:'history',forward:['history-forward'],reverse:['history']}
  ].map(t=>({...t,types:[...t.forward,...t.reverse],total:LIMIT}));
  const shuffle = (a, random=Math.random) => {
    const r=[...a];for(let i=r.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[r[i],r[j]]=[r[j],r[i]];}return r;
  };
  const format = (text,params={}) => text.replace(/\{(\w+)\}/g,(_,key)=>String(params[key]??''));
  const dictionary = a => {if(!a._questions)throw Error('Missing question dictionary');return a._questions;};
  const categories = a => [a.group,...AXES.filter(([,codes])=>codes.includes(a.code)).map(([key])=>key)];
  const classificationId = a => 'classification:'+categories(a).slice().sort().join(',');
  const classification = a => {const q=dictionary(a);return [q.groups[a.group],...categories(a).slice(1).map(key=>q.axes[key])].join(' · ');};
  const essential = a => dictionary(a).essential[a.essential?'yes':'no'];
  const property = a => format(dictionary(a).property,{feature:a.feature,side:a.side});
  const aminoId = a => 'amino:'+a.code;
  const propertyId = a => a.propertyId;
  const SPECS = {
    history:{prompt:a=>a.history.clue,value:a=>a.name,id:aminoId,match:a=>'history:'+a.code},
    'history-forward':{prompt:a=>a.name,value:a=>a.history.clue,id:a=>'history:'+a.code},
    name:{prompt:a=>a.code,value:a=>a.name,id:aminoId},
    'name-three':{prompt:a=>a.three,value:a=>a.name,id:aminoId},
    code:{prompt:a=>a.name,value:a=>a.code,id:a=>'code:'+a.code},
    three:{prompt:a=>a.name,value:a=>a.three,id:a=>'three:'+a.three},
    classset:{prompt:a=>a.name,value:classification,id:classificationId},
    'classset-reverse':{prompt:classification,value:a=>a.name,id:aminoId,match:classificationId},
    formula:{prompt:a=>a.name,value:a=>a.formula,id:a=>'formula:'+a.formula},
    'formula-reverse':{prompt:a=>a.formula,value:a=>a.name,id:aminoId,match:a=>a.formula},
    structure:{prompt:a=>a.structure,value:a=>a.name,id:aminoId},
    'structure-reverse':{prompt:a=>a.name,value:a=>a.structure,id:a=>'structure:'+a.code},
    property:{prompt:property,value:a=>a.name,id:aminoId,match:propertyId},
    'property-forward':{prompt:a=>a.name,value:property,id:propertyId},
    essential:{prompt:a=>a.name,value:essential,id:a=>'essential:'+Boolean(a.essential)},
    'essential-reverse':{prompt:essential,value:a=>a.name,id:aminoId,match:a=>Boolean(a.essential)}
  };
  function allowed(a,type){
    if(['history','history-forward'].includes(type))return !!a.history?.clue;
    if(['codon','codon-reverse'].includes(type))return a.group!=='special'&&Array.isArray(a.codons)&&a.codons.length>0;
    return a.group!=='special'||!['classset','classset-reverse','essential','essential-reverse'].includes(type);
  }
  function options(correct,candidates,count,random){
    const ids=new Set([correct.id]),labels=new Set([correct.label]),unique=[];
    for(const candidate of candidates){
      if(ids.has(candidate.id)||labels.has(candidate.label))continue;
      ids.add(candidate.id);labels.add(candidate.label);unique.push(candidate);
    }
    const alternatives=shuffle(unique,random).slice(0,count);
    if(alternatives.length!==count)throw Error('Not enough distinct translated choices');
    const all=shuffle([correct,...alternatives],random);
    return {choices:all.map(x=>x.label),choiceIds:all.map(x=>x.id),correct:correct.label,correctId:correct.id};
  }
  function codonQuestion(data,a,type,random,forcedCodon){
    if(!allowed(a,type))throw Error('Invalid question type');
    const codon=forcedCodon===undefined?a.codons[Math.floor(random()*a.codons.length)]:forcedCodon;
    if(!a.codons.includes(codon))throw Error('Codon does not belong to this amino acid');
    const others=data.filter(other=>allowed(other,type)&&other.code!==a.code);
    const reverse=type==='codon-reverse';
    const correct=reverse?{id:aminoId(a),label:a.name}:{id:'codon:'+codon,label:codon};
    const candidates=reverse?others.map(other=>({id:aminoId(other),label:other.name})):others.flatMap(other=>other.codons).filter(c=>!a.codons.includes(c)).map(c=>({id:'codon:'+c,label:c}));
    const q=dictionary(a);
    return {code:a.code,type,locale:a._locale,text:q.text[type],prompt:reverse?codon:a.name,
      ...options(correct,candidates,3,random),explanation:format(q.codonExplanation,{name:a.name,codons:a.codons.join(', ')})};
  }
  function question(data,a,type,random=Math.random,forcedCodon){
    if(['codon','codon-reverse'].includes(type))return codonQuestion(data,a,type,random,forcedCodon);
    const spec=SPECS[type];if(!spec||!allowed(a,type))throw Error('Invalid question type');
    const q=dictionary(a),correct={id:spec.id(a),label:spec.value(a)};
    const candidates=data.filter(other=>allowed(other,type)&&(!spec.match||spec.match(other)!==spec.match(a)));
    const alternatives=type==='essential'?[{id:'essential:true',label:q.essential.yes},{id:'essential:false',label:q.essential.no}]:candidates.map(other=>({id:spec.id(other),label:spec.value(other)}));
    let explanation=format(q.explanation,a);
    if(['history','history-forward'].includes(type))explanation=a.history.story;
    if(type==='formula'||type==='formula-reverse'){
      const same=data.filter(other=>other.code!==a.code&&other.formula===a.formula);
      explanation=format(q.formulaExplanation,{...a,same:same.length?format(q.sameFormula,{names:same.map(x=>x.name).join(', ')}):''});
    }
    return {code:a.code,type,locale:a._locale,text:q.text[type],prompt:spec.prompt(a),
      ...options(correct,alternatives,type==='essential'?1:3,random),explanation};
  }
  function build(data,topicId,random=Math.random){
    const topic=TOPICS.find(t=>t.id===topicId);if(!topic)throw Error('Unknown topic');
    const standard=data.filter(a=>a.group!=='special');
    if(standard.length!==20)throw Error('An exam requires 20 standard amino acids');
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
  function isCurrentAttempt(a){return ['2026-10-v3','2026-10-v4','2026-10-v5','2026-10-v6','2026-10-v7',VERSION].includes(a.version)&&TOPICS.some(t=>t.id===a.topic);}
  return {VERSION,LIMIT,MAX_ERRORS,TOPICS,question,allowed,build,publicQuestion,isCurrentAttempt,resultScore};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=ExamCore;
