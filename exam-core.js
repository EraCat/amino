/* Shared semantic questions for practice and exams. Text is supplied by locale JSON. */
var ExamCore = (() => {
  const VERSION = '2026-10-v10';
  const LIMIT = 30;
  const MAX_ERRORS = 3;
  const AXES = [
    ['aromatic','FWYH'],['aliphatic','AVLIM'],['sulfur','CM'],
    ['bcaa','VLI'],['hydroxyl','STY'],['amide','NQ']
  ];
  const TOPICS = [
    {id:'names-codes',forward:['code','three','code-pair','code-link'],reverse:['name','name-three']},
    {id:'classification',forward:['classset','category'],reverse:['classset-reverse','class-image']},
    {id:'structures',forward:['structure-reverse','structure-match'],reverse:['structure','sidechain']},
    {id:'properties',forward:['property-forward','essential','property-image'],reverse:['property','essential-reverse']},
    {id:'history',forward:['history-forward'],reverse:['history','history-code']}
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
  // Confusable neighbours are topic-dependent; history uses the kind of clue.
  const NEIGHBORS = {G:'AS',A:'GVS',V:'LIA',L:'IVA',I:'LVT',M:'CLU',P:'HWO',F:'YWH',W:'YFH',S:'TCU',T:'SIV',C:'USM',Y:'FWS',N:'QDE',Q:'NED',D:'ENQ',E:'DQN',K:'ROH',R:'KHO',H:'RWK',U:'CSM',O:'KRP'};
  const HISTORY_GROUPS = ['GLYHKS','NDQE','FPMUI','ARWTVO'];
  const TRAITS = {hydrogen:'G',methyl:'A',branched:'VLI',thiol:'C',thioether:'M',phenol:'Y',indole:'W',imidazole:'H',amide:'NQO',carboxyl:'DE',guanidine:'R',amine:'K',alcohol:'ST',pyrrolidine:'P',benzyl:'F',selenol:'U',twoCenters:'IT',achiral:'G'};
  const TRAIT_GROUPS = [['thiol','thioether','selenol','alcohol','phenol'],['amide','carboxyl','amine','guanidine'],['phenol','benzyl','indole','imidazole','pyrrolidine'],['hydrogen','methyl','branched','twoCenters','achiral']];
  const categoryLabel = (a,key) => dictionary(a).axes[key]||dictionary(a).groups[key];
  const pair = a => a.three+' · '+a.code;
  const imageStyles = (a,representation='mixed') => Object.keys(a.structureVariants||{}).filter(style=>style!=='side'&&(representation==='2d'?!style.startsWith('ball'):representation==='3d'?style.startsWith('ball'):true));
  const imageFor = (a,style) => a.structureVariants?.[style]||a.structure;
  const pick = (values,random) => values[Math.floor(random()*values.length)];
  function nearby(a,b,type){
    if(type.startsWith('history'))return HISTORY_GROUPS.some(group=>group.includes(a.code)&&group.includes(b.code))?8:0;
    if(['classset','classset-reverse','class-image','category'].includes(type)){
      const x=categories(a),y=categories(b);return 10-x.filter(k=>!y.includes(k)).length-y.filter(k=>!x.includes(k)).length;
    }
    const neighbors=NEIGHBORS[a.code]||'',index=neighbors.indexOf(b.code);
    return (index<0?0:20-index)+(a.group===b.group?2:0)+categories(a).filter(k=>categories(b).includes(k)).length;
  }
  const SPECS = {
    history:{prompt:a=>a.history.clue,value:a=>a.name,id:aminoId,match:a=>'history:'+a.code},
    'history-forward':{prompt:a=>a.name,value:a=>a.history.clue,id:a=>'history:'+a.code},
    name:{prompt:a=>a.code,value:a=>a.name,id:aminoId},
    'name-three':{prompt:a=>a.three,value:a=>a.name,id:aminoId},
    code:{prompt:a=>a.name,value:a=>a.code,id:a=>'code:'+a.code},
    three:{prompt:a=>a.name,value:a=>a.three,id:a=>'three:'+a.three},
    'code-link':{prompt:a=>a.three,value:a=>a.code,id:a=>'code:'+a.code},
    'code-pair':{prompt:a=>a.name,value:pair,id:a=>'pair:'+a.code},
    classset:{prompt:a=>a.name,value:classification,id:classificationId},
    'classset-reverse':{prompt:classification,value:a=>a.name,id:aminoId,match:classificationId},
    structure:{prompt:a=>a.structure,value:a=>a.name,id:aminoId},
    'structure-reverse':{prompt:a=>a.name,value:a=>a.structure,id:a=>'structure:'+a.code},
    'structure-match':{prompt:a=>a.structure,value:a=>a.structure,id:a=>'structure:'+a.code},
    sidechain:{prompt:a=>a.side,value:a=>a.name,id:aminoId},
    'class-image':{prompt:a=>a.structure,value:classification,id:classificationId},
    category:{prompt:a=>a.name,value:classification,id:classificationId},
    'property-image':{prompt:a=>a.structure,value:property,id:propertyId},
    property:{prompt:property,value:a=>a.name,id:aminoId,match:propertyId},
    'property-forward':{prompt:a=>a.name,value:property,id:propertyId},
    essential:{prompt:a=>a.name,value:essential,id:a=>'essential:'+Boolean(a.essential)},
    'essential-reverse':{prompt:essential,value:a=>a.name,id:aminoId,match:a=>Boolean(a.essential)},
    'history-code':{prompt:a=>a.history.clue,value:a=>a.code,id:a=>'code:'+a.code}
  };
  function matchesPrompt(target,candidate,type){
    // Listed positive properties do not imply that unlisted properties are absent.
    if(type==='classset-reverse')return categories(target).every(key=>categories(candidate).includes(key));
    // A shorter, entirely true description is not a useful wrong answer either.
    if(['classset','class-image'].includes(type))return categories(candidate).every(key=>categories(target).includes(key));
    const spec=SPECS[type];
    return spec?.match?spec.match(candidate)===spec.match(target):candidate.code===target.code;
  }
  function classificationExamples(data,a){
    return format(dictionary(a).classificationExamples,{names:data.filter(other=>allowed(other,'classset-reverse')&&matchesPrompt(a,other,'classset-reverse')).map(other=>other.name).join(', ')});
  }
  const INPUT_KINDS = Object.fromEntries([
    ...['name','name-three','history','structure','sidechain','classset-reverse','property','essential-reverse'].map(type=>[type,'name']),
    ...['code','three'].map(type=>[type,type]),['code-link','code'],['history-code','code']
  ]);
  const normalizeAnswer = value => String(value??'').normalize('NFKC').trim().replace(/\s+/gu,' ').toLowerCase().replace(/ё/g,'е');
  // Accepted names for amino-acid identity questions, including common ionic names.
  const NAME_ALIASES = {D:['аспартат','aspartate'],E:['глутамат','glutamate']};
  const answerNames = a => [a.name,a.englishName,a.legacyName,...(NAME_ALIASES[a.code]||[])].filter(Boolean);
  function withDifficulty(data,q,difficulty='normal'){
    const answerKind=INPUT_KINDS[q.type];
    if(difficulty!=='hard'||!answerKind)return q;
    const a=data.find(item=>item.code===q.code);
    // A classification or dietary category can describe several amino acids.
    const matching=answerKind==='name'?data.filter(other=>allowed(other,q.type)&&matchesPrompt(a,other,q.type)):[];
    const values=answerKind==='name'?matching.flatMap(answerNames):[q.correct];
    return {...q,answerMode:'text',answerKind,text:dictionary(a).inputText[q.type],
      ...(answerKind==='name'?{nameAnswerRule:1}:{}),
      ...(q.type==='classset-reverse'?{classificationRule:1,explanation:classificationExamples(data,a)}:{}),
      acceptedAnswers:[...new Set(values.filter(Boolean).map(normalizeAnswer))]};
  }
  function checkTextAnswer(q,value){return q.answerMode==='text'&&typeof value==='string'&&q.acceptedAnswers.includes(normalizeAnswer(value));}
  function checkChoiceAnswer(data,q,index){
    const id=q.choiceIds?.[index];
    if(!id)return q.choices[index]===q.correct;
    if(id===q.correctId)return true;
    const target=data.find(a=>a.code===q.code);
    if(!target)return false;
    // Older saved choices may contain several true descriptions. Keep their
    // order intact and accept them, rather than changing an on-screen question.
    if(q.type==='classset-reverse'){
      const candidate=data.find(a=>id===aminoId(a));
      return !!candidate&&matchesPrompt(target,candidate,q.type);
    }
    if(['classset','class-image'].includes(q.type)&&id.startsWith('classification:'))return id.slice(15).split(',').every(key=>categories(target).includes(key));
    if(q.type==='category'&&id.startsWith('category:'))return categories(target).includes(id.slice(9));
    if(q.type==='property-image'&&id.startsWith('trait:'))return !!TRAITS[id.slice(6)]?.includes(target.code);
    return false;
  }
  function allowed(a,type){
    if(type.startsWith('history'))return !!a.history?.clue;
    if(!Object.hasOwn(SPECS,type))return false;
    return a.group!=='special'||!['classset','classset-reverse','class-image','category','essential','essential-reverse'].includes(type);
  }
  function options(correct,candidates,count,random){
    const ids=new Set([correct.id]),labels=new Set([correct.label]),unique=[];
    for(const candidate of candidates){
      if(ids.has(candidate.id)||labels.has(candidate.label))continue;
      ids.add(candidate.id);labels.add(candidate.label);unique.push(candidate);
    }
    const alternatives=unique.slice(0,count);
    if(alternatives.length!==count)throw Error('Not enough distinct translated choices');
    const all=shuffle([correct,...alternatives],random);
    return {choices:all.map(x=>x.label),choiceIds:all.map(x=>x.id),correct:correct.label,correctId:correct.id};
  }
  function question(data,a,type,random=Math.random,settings={}){
    const spec=SPECS[type];if(!spec||!allowed(a,type))throw Error('Invalid question type');
    const q=dictionary(a),correct={id:spec.id(a),label:spec.value(a)};
    const candidates=shuffle(data.filter(other=>allowed(other,type)&&!matchesPrompt(a,other,type)),random)
      .map(other=>({other,weight:nearby(a,other,type)+(other.code===settings.confusedCode?100:0)+random()*2}))
      .sort((x,y)=>y.weight-x.weight).map(item=>item.other);
    let alternatives=candidates.map(other=>({id:spec.id(other),label:spec.value(other)}));
    const imageQuestion=['structure','structure-reverse','structure-match','class-image','property-image'].includes(type);
    const style=imageQuestion?pick(imageStyles(a,settings.representation),random):null;
    let prompt=spec.prompt(a),promptKind='text',choiceKind='text',note='';
    if(['structure','structure-match','class-image','property-image'].includes(type)){prompt=imageFor(a,style);promptKind='image';}
    if(['structure-reverse','structure-match'].includes(type)){
      // In a matching question, redraw the answer; never repeat the prompt asset.
      const different=imageStyles(a,settings.representation).filter(s=>s!==style),flat=different.filter(s=>!s.startsWith('ball'));
      const answerStyle=type==='structure-match'?pick(flat.length?flat:different,random):style;
      correct.label=imageFor(a,answerStyle);alternatives=candidates.map(other=>({id:spec.id(other),label:imageFor(other,answerStyle)}));choiceKind='image';
    }
    if(imageQuestion)note=(style||'').startsWith('ball')?'model':'structure';
    if(type==='class-image')note+='-classification';
    if(type==='sidechain'){promptKind='formula';note='sidechain';}
    if(type==='essential')alternatives=[{id:'essential:true',label:q.essential.yes},{id:'essential:false',label:q.essential.no}];
    if(type==='code-pair'){
      const other=candidates[0];alternatives=shuffle([{id:'pair:three',label:a.three+' · '+other.code},{id:'pair:code',label:other.three+' · '+a.code},{id:'pair:both',label:pair(other)}],random);
    }
    if(type==='category'){
      const keys=categories(a),key=pick(keys,random);
      correct.id='category:'+key;correct.label=categoryLabel(a,key);
      alternatives=shuffle([...AXES.map(([k])=>k),'nonpolar','polar','acidic','basic'].filter(k=>!keys.includes(k)),random).map(k=>({id:'category:'+k,label:categoryLabel(a,k)}));
    }
    if(type==='property-image'){
      const traits=Object.entries(TRAITS),key=pick(traits.filter(([,codes])=>codes.includes(a.code)),random)[0];
      correct.id='trait:'+key;correct.label=q.traits[key];
      alternatives=shuffle(traits.filter(([,codes])=>!codes.includes(a.code)),random)
        .sort(([x],[y])=>Number(TRAIT_GROUPS.some(group=>group.includes(key)&&group.includes(y)))-Number(TRAIT_GROUPS.some(group=>group.includes(key)&&group.includes(x))))
        .map(([k])=>({id:'trait:'+k,label:q.traits[k]}));
    }
    if(type.startsWith('history')){
      const detailed=random()<.5,clue=other=>detailed?q.historyDetails[other.code]:other.history.clue;
      if(type==='history-forward'){correct.label=clue(a);alternatives=candidates.map(other=>({id:spec.id(other),label:clue(other)}));}
      else prompt=clue(a);
    }
    let explanation=format(q.explanation,a);
    if(type.startsWith('history'))explanation=a.history.story;
    if(['classset','classset-reverse','class-image','category'].includes(type))explanation=a.name+': '+classification(a)+'.';
    if(type==='classset-reverse')explanation=classificationExamples(data,a);
    if(type==='code-pair'||type==='code-link')explanation=a.name+' · '+pair(a)+'.';
    if(type==='property-image')explanation=a.name+': '+correct.label+'.';
    const result={code:a.code,type,locale:a._locale,text:q.text[type],prompt,promptKind,choiceKind,note,
      ...options(correct,alternatives,type==='essential'?1:3,random),explanation};
    // Store feedback with the question so resumed exams retain their wording.
    if(['structure','structure-reverse','structure-match','sidechain','property','property-forward'].includes(type)){
      result.contrasts=Object.fromEntries(candidates.filter(other=>result.choiceIds.includes(spec.id(other))).map(other=>[spec.id(other),format(q.contrast,{name:a.name,side:a.side,other:other.name,otherSide:other.side})]));
    }
    return result;
  }
  function build(data,topicId,random=Math.random,settings={}){
    const topic=TOPICS.find(t=>t.id===topicId);if(!topic)throw Error('Unknown topic');
    const standard=data.filter(a=>a.group!=='special');
    if(standard.length!==20)throw Error('An exam requires 20 standard amino acids');
    const types=shuffle(topic.types,random);
    // Equal numbers of forward and reverse questions, with balanced types within each.
    const quotas={};for(const direction of [topic.forward,topic.reverse]){
      const order=shuffle(direction,random);order.forEach((type,i)=>quotas[type]=Math.floor(LIMIT/2/order.length)+(i<LIMIT/2%order.length?1:0));
    }
    const selected=[],used=new Set();
    const add=(a,type)=>{selected.push(question(standard,a,type,random,settings));used.add(type+':'+a.code);quotas[type]--;};
    // Every amino acid appears, then fill remaining slots without repeated pairs.
    for(const a of shuffle(standard,random)){
      const maximum=Math.max(...Object.values(quotas));
      const type=shuffle(types.filter(t=>quotas[t]===maximum),random)[0];add(a,type);
    }
    for(const type of types){const rest=shuffle(standard.filter(a=>!used.has(type+':'+a.code)),random);while(quotas[type]>0)add(rest.pop(),type);}
    return shuffle(selected,random);
  }
  function publicQuestion(q,index){
    if(!q)return null;
    const result={index,type:q.type,text:q.text,prompt:q.prompt};
    for(const key of ['promptKind','choiceKind','note'])if(q[key])result[key]=q[key];
    return q.answerMode==='text'?{...result,answerMode:'text',answerKind:q.answerKind}:{...result,choices:q.choices};
  }
  function resultScore(a){
    if(a.status==='unfinished')return 0;
    // Recover earned points from attempts zeroed by the previous grading rule.
    if(a.status==='failed'&&a.score===0&&Array.isArray(a.answers))return a.answers.filter(x=>x.feedback?.right===true).length;
    return a.score;
  }
  function answerExplanation(q,selectedId){return q.contrasts?.[selectedId]||q.explanation;}
  function isCurrentAttempt(a){return ['2026-10-v3','2026-10-v4','2026-10-v5','2026-10-v6','2026-10-v7','2026-10-v8','2026-10-v9',VERSION].includes(a.version)&&TOPICS.some(t=>t.id===a.topic);}
  return {VERSION,LIMIT,MAX_ERRORS,TOPICS,question,allowed,build,withDifficulty,normalizeAnswer,answerNames,checkTextAnswer,checkChoiceAnswer,publicQuestion,isCurrentAttempt,resultScore,answerExplanation,imageStyles,imageFor};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=ExamCore;
