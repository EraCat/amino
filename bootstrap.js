'use strict';
(() => {
  const STORAGE_KEY = 'amino-locale-v1';
  const STATIC = {ru:{loading:'Загрузка…',failed:'Не удалось загрузить данные.',retry:'Повторить'},en:{loading:'Loading…',failed:'Could not load the content.',retry:'Retry'}};
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const get = (object, path) => path.split('.').reduce((value, key) => value?.[key], object);
  const format = (value, params, escape) => String(value).replace(/\{(\w+)\}/g, (_, key) => escape(params[key] ?? ''));
  const fetchJson = async path => { const response=await fetch(path,{headers:{Accept:'application/json'}});if(!response.ok)throw Error(`${path}: ${response.status}`);return response.json(); };
  const loadScript = src => new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=()=>reject(Error(`Failed to load ${src}`));document.head.append(script);});
  const pickLocale = languages => {const published=languages.filter(item=>item.published),byLower=new Map(published.map(item=>[item.code.toLowerCase(),item.code]));let stored='';try{stored=localStorage.getItem(STORAGE_KEY)||'';}catch{}const candidates=[new URL(location.href).searchParams.get('lang'),stored,...(navigator.languages||[]),navigator.language,'ru'].filter(Boolean);for(const candidate of candidates){const normalized=String(candidate).toLowerCase(),exact=byLower.get(normalized),base=byLower.get(normalized.split('-')[0]);if(exact||base)return exact||base;}return published[0]?.code||'ru';};
  const showState=(locale,failed=false)=>{const copy=STATIC[locale.split('-')[0]]||STATIC.ru,app=document.querySelector('#app');document.documentElement.lang=locale;app.innerHTML=failed?`<div class="boot-state" role="alert"><p>${copy.failed}</p><button id="boot-retry" class="button" type="button">${copy.retry}</button></div>`:`<div class="boot-state" role="status">${copy.loading}</div>`;if(failed)document.querySelector('#boot-retry').onclick=()=>location.reload();};
  async function boot(){
    let provisional=(new URL(location.href).searchParams.get('lang')||navigator.language||'ru').toLowerCase().split('-')[0];if(!STATIC[provisional])provisional='ru';showState(provisional);
    try{
      const languages=await fetchJson('locales/languages.json'),locale=pickLocale(languages);showState(locale);
      const [core,ui,questions]=await Promise.all([fetchJson('content/amino/core.json'),fetchJson(`locales/${locale}/ui.json`),fetchJson(`locales/${locale}/questions.json`)]);
      const cards=await Promise.all(core.map(item=>fetchJson(`locales/${locale}/cards/${item.code}.json`))),cardByCode=new Map(cards.map(card=>[card.code,card]));
      window.AMINO=core.map(item=>{const card=cardByCode.get(item.code);if(!card||card.sourceRevision!==item.revision)throw Error(`Card revision mismatch: ${item.code}`);return {...item,...card,en:item.englishName,side:card.sideLabel||item.side,history:card.history?{...card.history,sources:item.sources}:null,_questions:questions,_locale:locale};});
      const rules=new Intl.PluralRules(locale),resolve=(key,params)=>{let value=get(ui,key);if(value&&typeof value==='object')value=value[rules.select(Number(params.count))]??value.other;return value;};
      window.I18n={locale,languages,dictionary:ui,t(key,params={}){const value=resolve(key,params);return value==null?key:format(value,params,String);},html(key,params={}){const value=resolve(key,params);return escapeHtml(value==null?key:format(value,params,String));},setLanguage(next){if(!languages.some(item=>item.published&&item.code===next)||next===locale)return;if(window.aminoLanguageLocked?.()){window.updateLanguageControl?.();return;}try{localStorage.setItem(STORAGE_KEY,next);}catch{}const url=new URL(location.href);url.searchParams.set('lang',next);location.assign(url.href);}};
      document.documentElement.lang=locale;document.title=I18n.t('meta.title');document.querySelector('meta[name="description"]').content=I18n.t('meta.description');
      document.querySelectorAll('[data-i18n]').forEach(node=>{node.textContent=I18n.t(node.dataset.i18n);});document.querySelectorAll('[data-i18n-aria]').forEach(node=>{node.setAttribute('aria-label',I18n.t(node.dataset.i18nAria));});document.querySelectorAll('[data-i18n-title]').forEach(node=>{node.title=I18n.t(node.dataset.i18nTitle);});
      const select=document.querySelector('#language-select');select.innerHTML=languages.filter(item=>item.published).map(item=>`<option value="${escapeHtml(item.code)}"${item.code===locale?' selected':''}>${escapeHtml(item.name)}</option>`).join('');select.setAttribute('aria-label',I18n.t('language.label'));select.onchange=()=>I18n.setLanguage(select.value);
      const mobileLanguage=window.matchMedia('(max-width:700px)');
      const updateLanguageLabels=()=>{for(const option of select.options){const language=languages.find(item=>item.code===option.value);option.textContent=mobileLanguage.matches?Array.from(language.name).slice(0,3).join(''):language.name;option.setAttribute('aria-label',language.name);}};
      updateLanguageLabels();mobileLanguage.addEventListener('change',updateLanguageLabels);
      await loadScript('exam-core.js');for(const topic of ExamCore.TOPICS)Object.assign(topic,questions.topics[topic.id]||{});await loadScript('app.js');await loadScript('exam-ui.js');
    }catch(error){console.error(error);showState(provisional,true);}
  }
  boot();
})();
