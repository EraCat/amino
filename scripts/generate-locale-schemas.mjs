import {writeFile} from 'node:fs/promises';
import {readJson} from '../localization.mjs';

const plural=['zero','one','two','few','many','other'];
const schema=value=>{
  if(typeof value==='string')return {type:'string',minLength:1};
  const properties=Object.fromEntries(Object.entries(value).map(([key,entry])=>[key,schema(entry)]));
  if(Object.hasOwn(value,'other')&&Object.keys(value).every(key=>plural.includes(key)))for(const key of plural)properties[key]=schema(value.other);
  // Draft dictionaries may be incomplete. Publication completeness is checked in CI.
  return {type:'object',additionalProperties:false,properties};
};
for(const name of ['ui','questions','errors']){
  const output={$schema:'https://json-schema.org/draft/2020-12/schema',title:`Amino ${name} translations`,...schema(await readJson(`locales/ru/${name}.json`))};
  await writeFile(new URL(`../schemas/${name}.schema.json`,import.meta.url),JSON.stringify(output,null,2)+'\n');
}
console.log('Editor schemas generated from Russian dictionary keys.');
