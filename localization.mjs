import {readFile, readdir, access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const ROOT=path.dirname(fileURLToPath(import.meta.url));
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const assert=(condition,message)=>{if(!condition)throw Error(message);};

// JSON.parse silently accepts repeated keys. Reject them before translations reach production.
export function parseJson(source,label='JSON'){
  const result=JSON.parse(source);
  const tokens=source.match(/"(?:\\.|[^"\\])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null|[{}\[\],:]/g)||[];
  let cursor=0;
  function value(){
    const token=tokens[cursor++];
    if(token==='{'){
      const keys=new Set();
      if(tokens[cursor]==='}'){cursor++;return;}
      while(true){
        const key=JSON.parse(tokens[cursor++]);
        assert(!keys.has(key),`${label}: duplicate key ${key}`);keys.add(key);cursor++;
        value();if(tokens[cursor++]==='}')return;
      }
    }
    if(token==='['){
      if(tokens[cursor]===']'){cursor++;return;}
      while(true){value();if(tokens[cursor++]===']')return;}
    }
  }
  value();return result;
}

export async function readJson(relative){return parseJson(await readFile(path.join(ROOT,relative),'utf8'),relative);}
export const placeholders=text=>[...new Set([...text.matchAll(/\{(\w+)\}/g)].map(m=>m[1]))].sort();
const pluralKeys=new Set(['zero','one','two','few','many','other']);

export function validateDictionary(value,source,label){
  if(typeof source==='string'){
    assert(typeof value==='string'&&value.trim().length>0,`${label}: expected nonempty text`);
    assert(!/[<>]/.test(value),`${label}: use plain text, not HTML`);
    assert(JSON.stringify(placeholders(value))===JSON.stringify(placeholders(source)),`${label}: template parameters differ`);
    return;
  }
  assert(object(value)&&object(source),`${label}: expected an object`);
  const isPlural=Object.keys(source).every(k=>pluralKeys.has(k))&&Object.hasOwn(source,'other');
  if(isPlural){
    assert(Object.hasOwn(value,'other'),`${label}: plural forms require other`);
    for(const [key,text] of Object.entries(value)){
      assert(pluralKeys.has(key),`${label}: unknown plural form ${key}`);
      validateDictionary(text,source.other,`${label}.${key}`);
    }
    return;
  }
  assert(JSON.stringify(Object.keys(value).sort())===JSON.stringify(Object.keys(source).sort()),`${label}: keys differ from ru`);
  for(const key of Object.keys(source))validateDictionary(value[key],source[key],`${label}.${key}`);
}

function validatePartialDictionary(value,source,label){
  if(typeof source==='string'){validateDictionary(value,source,label);return;}
  assert(object(value)&&object(source),`${label}: expected an object`);
  const isPlural=Object.keys(source).every(k=>pluralKeys.has(k))&&Object.hasOwn(source,'other');
  for(const [key,entry] of Object.entries(value)){
    assert(isPlural?pluralKeys.has(key):Object.hasOwn(source,key),`${label}: unknown key ${key}`);
    validatePartialDictionary(entry,isPlural?source.other:source[key],`${label}.${key}`);
  }
}

export function validateCard(card,shared,source,label,{complete=true}={}){
  assert(object(card),`${label}: expected an object`);
  const allowed=['code','sourceRevision','name','info','feature','history','codonNote','sideLabel','links'];
  assert(Object.keys(card).every(key=>allowed.includes(key)),`${label}: unknown card field`);
  assert(card.code===shared.code,`${label}: code must be ${shared.code}`);
  assert(Number.isInteger(card.sourceRevision)&&card.sourceRevision>=1&&card.sourceRevision<=shared.revision,`${label}: invalid sourceRevision`);
  if(complete)assert(card.sourceRevision===shared.revision,`${label}: translation is out of date (source revision ${shared.revision})`);
  if(card.history){
    assert(object(card.history)&&Object.keys(card.history).every(k=>['clue','story'].includes(k)),`${label}: invalid history fields`);
    if(complete)assert(['clue','story'].every(k=>Object.hasOwn(card.history,k)),`${label}: history requires clue and story`);
  }
  for(const key of ['name','info','feature','history',...(source.codonNote?['codonNote']:[]),...(source.sideLabel?['sideLabel']:[])]){
    if(complete||Object.hasOwn(card,key))(complete?validateDictionary:validatePartialDictionary)(card[key],source[key],`${label}.${key}`);
  }
  for(const key of ['codonNote','sideLabel']){
    if(Object.hasOwn(card,key)&&!Object.hasOwn(source,key))validateDictionary(card[key],card[key],`${label}.${key}`);
  }
  if(card.links){
    assert(object(card.links)&&Object.keys(card.links).every(k=>k==='wikipedia'),`${label}: invalid links`);
    for(const link of Object.values(card.links))assert(typeof link==='string'&&new URL(link).protocol==='https:',`${label}: links must use HTTPS`);
  }
}

export function mergeCard(shared,card,questions,locale){
  return {...shared,...card,en:shared.englishName,side:card.sideLabel||shared.side,
    history:{...card.history,sources:shared.sources},_questions:questions,_locale:locale};
}

export async function loadLocalization({includeDrafts=false}={}){
  const [core,languages]=await Promise.all([readJson('content/amino/core.json'),readJson('locales/languages.json')]);
  assert(Array.isArray(core)&&core.length===22,'core: expected 22 amino acids');
  assert(new Set(core.map(a=>a.code)).size===core.length,'core: duplicate amino acid codes');
  assert(core.filter(a=>a.group!=='special').length===20,'core: expected 20 standard amino acids');
  const standardCodes={G:'Gly',A:'Ala',V:'Val',L:'Leu',I:'Ile',M:'Met',P:'Pro',F:'Phe',W:'Trp',S:'Ser',T:'Thr',C:'Cys',Y:'Tyr',N:'Asn',Q:'Gln',D:'Asp',E:'Glu',K:'Lys',R:'Arg',H:'His',U:'Sec',O:'Pyl'};
  const coreKeys=['code','three','group','essential','side','smiles','formula','structure','codons','englishName','legacyName','revision','sources','propertyId'];
  const codonOwners=new Map();
  for(const a of core){
    assert(object(a)&&Object.keys(a).every(k=>coreKeys.includes(k))&&coreKeys.every(k=>Object.hasOwn(a,k)),`core ${a.code}: fields differ from the content contract`);
    assert(/^[A-Z]$/.test(a.code)&&Number.isInteger(a.revision)&&a.revision>=1,'core: invalid code or revision');
    assert(a.three===standardCodes[a.code],`core ${a.code}: incorrect three-letter code`);
    assert(['nonpolar','polar','acidic','basic','special'].includes(a.group),`core ${a.code}: unknown group`);
    assert((a.group==='special')===['U','O'].includes(a.code),`core ${a.code}: only Sec/Pyl are special`);
    assert(a.group==='special'?a.essential===null:typeof a.essential==='boolean',`core ${a.code}: invalid essentiality`);
    for(const key of ['side','smiles','formula','englishName','legacyName'])assert(typeof a[key]==='string'&&a[key].trim()&&!/[<>]/.test(a[key]),`core ${a.code}: invalid ${key}`);
    assert(/^(?:[A-Z][a-z]?\d*)+$/.test(a.formula),`core ${a.code}: invalid molecular formula`);
    assert(/^structures\/[a-f0-9]+\.svg$/.test(a.structure),`core ${a.code}: invalid image path`);
    assert(a.propertyId==='property:'+a.code,`core ${a.code}: invalid propertyId`);
    assert(Array.isArray(a.codons)&&a.codons.length>0&&a.codons.every(c=>/^[ACGU]{3}$/.test(c)),`core ${a.code}: invalid codons`);
    assert(new Set(a.codons).size===a.codons.length,`core ${a.code}: duplicate codon`);
    if(a.group==='special')assert(a.codons.length===1&&a.codons[0]===(a.code==='U'?'UGA':'UAG'),`core ${a.code}: incorrect special codon`);
    if(a.group!=='special')for(const codon of a.codons){
      assert(!['UAA','UAG','UGA'].includes(codon),`core ${a.code}: standard amino acid has a stop codon`);
      assert(!codonOwners.has(codon),`core: codon ${codon} belongs to multiple standard amino acids`);codonOwners.set(codon,a.code);
    }
    assert(Array.isArray(a.sources)&&a.sources.length>0&&a.sources.every(s=>typeof s==='string'&&new URL(s).protocol==='https:'),`core ${a.code}: invalid sources`);
  }
  assert(codonOwners.size===61,'core: the standard genetic code must cover all 61 sense codons');
  assert(new Set(core.map(a=>a.englishName)).size===core.length,'core: duplicate English names');
  await Promise.all(core.map(a=>access(path.join(ROOT,a.structure))));
  assert(Array.isArray(languages)&&languages.some(l=>l.code==='ru'&&l.published),'languages: ru must be published');
  assert(new Set(languages.map(l=>l.code.toLowerCase())).size===languages.length,'languages: duplicate locale');
  for(const l of languages)assert(/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(l.code)&&typeof l.name==='string'&&l.name.trim()&&!/[<>]/.test(l.name)&&typeof l.published==='boolean','languages: invalid entry');
  const ruCards=await Promise.all(core.map(a=>readJson(`locales/ru/cards/${a.code}.json`)));
  const [ruUi,ruQuestions,ruErrors]=await Promise.all(['ui','questions','errors'].map(f=>readJson(`locales/ru/${f}.json`)));
  const packs=new Map(),publicFiles=new Set(['content/amino/core.json','locales/languages.json']);
  for(const language of languages.filter(l=>l.published||includeDrafts)){
    const prefix=`locales/${language.code}`;
    const files=await readdir(path.join(ROOT,prefix,'cards'));
    assert(files.filter(f=>f.endsWith('.json')).every(f=>core.some(a=>f===a.code+'.json')),`${prefix}: unknown card file`);
    const cards=[];
    for(let i=0;i<core.length;i++){
      const file=`${prefix}/cards/${core[i].code}.json`;
      if(!language.published&&!files.includes(core[i].code+'.json'))continue;
      const card=await readJson(file);validateCard(card,core[i],ruCards[i],file,{complete:language.published});cards.push(card);
      if(language.published)publicFiles.add(file);
    }
    if(!language.published){
      const supplied=await readdir(path.join(ROOT,prefix));
      for(const [name,source] of [['ui',ruUi],['questions',ruQuestions],['errors',ruErrors]]){
        if(supplied.includes(name+'.json'))validatePartialDictionary(await readJson(`${prefix}/${name}.json`),source,`${prefix}/${name}`);
      }
      packs.set(language.code,{cards,draft:true});continue;
    }
    const [ui,questions,errors]=await Promise.all(['ui','questions','errors'].map(f=>readJson(`${prefix}/${f}.json`)));
    validateDictionary(ui,ruUi,`${prefix}/ui`);validateDictionary(questions,ruQuestions,`${prefix}/questions`);validateDictionary(errors,ruErrors,`${prefix}/errors`);
    for(const name of ['ui','questions','errors'])publicFiles.add(`${prefix}/${name}.json`);
    const data=core.map(a=>mergeCard(a,cards.find(c=>c.code===a.code),questions,language.code));
    const normalized=text=>text.normalize('NFC').trim().replace(/\s+/gu,' ').toLowerCase();
    assert(new Set(data.map(a=>normalized(a.name))).size===data.length,`${prefix}: duplicate names`);
    assert(new Set(data.map(a=>normalized(a.history.clue))).size===data.length,`${prefix}: duplicate history clues`);
    const properties=data.map(a=>normalized(questions.property.replace(/\{(\w+)\}/g,(_,key)=>String(a[key]??''))));
    assert(new Set(properties).size===data.length,`${prefix}: indistinguishable property descriptions`);
    packs.set(language.code,{data,ui,questions,errors,cards});
  }
  return {core,languages,packs,publicFiles};
}

export function resolveLanguage(value,languages){
  const requests=String(value||'').split(',').map(part=>{
    const [tag,...parameters]=part.trim().split(';');
    const quality=parameters.find(p=>/^\s*q=/i.test(p));
    return {requested:tag.toLowerCase(),quality:quality===undefined?1:Number(quality.split('=')[1])};
  }).filter(r=>Number.isFinite(r.quality)&&r.quality>0&&r.quality<=1).sort((a,b)=>b.quality-a.quality);
  for(const {requested} of requests){
    const exact=languages.find(l=>l.published&&l.code.toLowerCase()===requested);
    if(exact)return exact.code;
    const base=languages.find(l=>l.published&&l.code.toLowerCase()===requested.split('-')[0]);
    if(base)return base.code;
  }
  return 'ru';
}
