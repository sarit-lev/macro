/* Macro — one-tap nutrition logger. Vanilla JS, IndexedDB, offline-first. */
'use strict';
const APP_VERSION = '1.0.0';

/* ---------------- i18n ---------------- */
const T = {
  he: {
    ring_protein:'חלבון · g', ring_kcal:'קלוריות',
    search_ph:'חיפוש מנה…', add_food:'+ מנה',
    entries_title:'מה אכלת היום', entries_empty:'עוד לא נרשם כלום. הקישי על מנה כדי להוסיף.',
    food_new:'מנה חדשה', food_edit:'עריכת מנה',
    paste_hint:'הדביקי תשובה מ‑Gemini / Claude (kcal + protein) למילוי אוטומטי',
    paste_ph:'למשל: 240 קלוריות, 32 גרם חלבון…', serving_ph:'1 גביע 170g',
    lbl_name_he:'שם (עברית)', lbl_name_en:'Name (English)', lbl_kcal:'קלוריות', lbl_protein:'חלבון (g)',
    lbl_serving:'מנה / כמות', lbl_category:'קטגוריה', fav_label:'מועדף (יופיע ראשון)',
    delete:'מחיקה', save:'שמירה', settings:'הגדרות',
    lbl_target_kcal:'יעד קלוריות', lbl_target_protein:'יעד חלבון (g)', lbl_lang:'שפת ממשק',
    export:'ייצוא גיבוי (JSON)', import:'ייבוא מגיבוי', close:'סגירה',
    cat_protein:'חלבון', cat_dairy:'חלב', cat_carb:'פחמימה', cat_veg:'ירקות', cat_fruit:'פירות',
    cat_fat:'שומן', cat_snack:'חטיף', cat_drink:'משקה', cat_meal:'ארוחה',
    today:'היום', yesterday:'אתמול', tomorrow:'מחר',
    added:'נוסף', removed:'נמחק', undo:'ביטול', no_results:'לא נמצאה מנה',
    left_kcal:'נשאר {n} קלוריות', over_kcal:'מעל היעד ב‑{n}',
    left_protein:'עוד {n}g חלבון', hit_protein:'יעד החלבון הושג ✓',
    saved:'נשמר', need_name:'צריך שם וערכים', confirm_del:'למחוק את המנה מהמאגר?',
    ver:'גרסה {v}', imported:'הגיבוי נטען', bad_file:'קובץ לא תקין',
  },
  en: {
    ring_protein:'protein · g', ring_kcal:'calories',
    search_ph:'Search food…', add_food:'+ Food',
    entries_title:"Today's log", entries_empty:'Nothing logged yet. Tap a food to add.',
    food_new:'New food', food_edit:'Edit food',
    paste_hint:'Paste a Gemini / Claude reply (kcal + protein) to auto-fill',
    paste_ph:'e.g. 240 calories, 32 g protein…', serving_ph:'1 cup 170g',
    lbl_name_he:'Name (Hebrew)', lbl_name_en:'Name (English)', lbl_kcal:'Calories', lbl_protein:'Protein (g)',
    lbl_serving:'Serving', lbl_category:'Category', fav_label:'Favorite (shown first)',
    delete:'Delete', save:'Save', settings:'Settings',
    lbl_target_kcal:'Calorie target', lbl_target_protein:'Protein target (g)', lbl_lang:'Interface language',
    export:'Export backup (JSON)', import:'Import backup', close:'Close',
    cat_protein:'Protein', cat_dairy:'Dairy', cat_carb:'Carb', cat_veg:'Veg', cat_fruit:'Fruit',
    cat_fat:'Fat', cat_snack:'Snack', cat_drink:'Drink', cat_meal:'Meal',
    today:'Today', yesterday:'Yesterday', tomorrow:'Tomorrow',
    added:'Added', removed:'Removed', undo:'Undo', no_results:'No match',
    left_kcal:'{n} kcal left', over_kcal:'{n} over target',
    left_protein:'{n}g protein to go', hit_protein:'Protein target hit ✓',
    saved:'Saved', need_name:'Name and values required', confirm_del:'Delete this food from the database?',
    ver:'Version {v}', imported:'Backup loaded', bad_file:'Invalid file',
  }
};
let LANG = 'he';
const t = (k, vars) => { let s = (T[LANG] && T[LANG][k]) || (T.he[k] || k); if (vars) for (const p in vars) s = s.replace('{'+p+'}', vars[p]); return s; };

/* ---------------- IndexedDB ---------------- */
const DB_NAME = 'macro', DB_VER = 1;
let db;
function openDB(){
  return new Promise((res, rej)=>{
    const r = indexedDB.open(DB_NAME, DB_VER);
    r.onupgradeneeded = e => {
      const d = e.target.result;
      if(!d.objectStoreNames.contains('foods')) d.createObjectStore('foods',{keyPath:'id'});
      if(!d.objectStoreNames.contains('days'))  d.createObjectStore('days',{keyPath:'date'});
      if(!d.objectStoreNames.contains('meta'))  d.createObjectStore('meta',{keyPath:'key'});
    };
    r.onsuccess = ()=>res(r.result);
    r.onerror = ()=>rej(r.error);
  });
}
const tx = (store, mode='readonly') => db.transaction(store, mode).objectStore(store);
const idbGet = (store, key) => new Promise((res,rej)=>{const q=tx(store).get(key);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});
const idbAll = (store) => new Promise((res,rej)=>{const q=tx(store).getAll();q.onsuccess=()=>res(q.result||[]);q.onerror=()=>rej(q.error);});
const idbPut = (store, val) => new Promise((res,rej)=>{const q=tx(store,'readwrite').put(val);q.onsuccess=()=>res();q.onerror=()=>rej(q.error);});
const idbDel = (store, key) => new Promise((res,rej)=>{const q=tx(store,'readwrite').delete(key);q.onsuccess=()=>res();q.onerror=()=>rej(q.error);});
function idbBulkPut(store, arr){return new Promise((res,rej)=>{const s=db.transaction(store,'readwrite').objectStore(store);arr.forEach(v=>s.put(v));s.transaction.oncomplete=()=>res();s.transaction.onerror=()=>rej(s.transaction.error);});}

/* ---------------- state ---------------- */
let SETTINGS = { key:'settings', target_kcal:1200, target_protein_g:105, lang:'he', version:APP_VERSION };
let FOODS = [];
let FMAP = {};
let curDate = todayStr();
let curDay = { date: curDate, entries: [] };
let lastAction = null;   // for undo
let toastTimer = null;

/* ---------------- helpers ---------------- */
function todayStr(d){ d = d || new Date(); const z = n => String(n).padStart(2,'0'); return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`; }
function shiftDate(str, days){ const [y,m,dd]=str.split('-').map(Number); const d=new Date(y,m-1,dd); d.setDate(d.getDate()+days); return todayStr(d); }
function uid(){ return (crypto.randomUUID ? crypto.randomUUID() : 'e'+Date.now()+Math.round(Math.random()*1e6)); }
function foodName(f){ return LANG==='he' ? (f.name_he||f.name_en||'') : (f.name_en||f.name_he||''); }
function foodSub(f){ return LANG==='he' ? (f.name_en||'') : (f.name_he||''); }
function rnd(n){ return Math.round(n); }
function macrosOf(f){
  if(f.kind==='combo' && Array.isArray(f.components) && f.components.length){
    let k=0,p=0; for(const c of f.components){ const cf=FMAP[c.id]; if(cf){ const m=macrosOf(cf); k+=m.kcal*c.qty; p+=m.protein*c.qty; } }
    return {kcal:k, protein:p};
  }
  return {kcal:Number(f.kcal)||0, protein:Number(f.protein_g)||0};
}
function dayTotals(){ let k=0,p=0; for(const e of curDay.entries){ k+=e.kcal*e.qty; p+=e.protein*e.qty; } return {kcal:k, protein:p}; }

/* ---------------- boot ---------------- */
(async function boot(){
  db = await openDB();
  const s = await idbGet('meta','settings'); if(s) SETTINGS = Object.assign(SETTINGS, s);
  SETTINGS.version = APP_VERSION;
  LANG = SETTINGS.lang || 'he';

  try { FOODS = await idbAll('foods'); } catch(e){ FOODS = []; }
  if(!FOODS.length){
    try{
      const seed = await (await fetch('data/seed-foods.json',{cache:'no-store'})).json();
      seed.forEach(f=>{ f.use_count=0; f.last_used=0; });
      FOODS = seed;                 // populate UI immediately
      idbBulkPut('foods', seed).catch(err=>console.warn('seed persist failed', err)); // persist in background, non-blocking
    }catch(err){ console.warn('seed load failed', err); }
  }
  rebuildFmap();

  curDate = todayStr();
  await loadDay(curDate);

  applyLang(LANG);
  wire();
  render();
  registerSW();
  if(navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(()=>{});
})();

function rebuildFmap(){ FMAP = {}; for(const f of FOODS) FMAP[f.id]=f; }
async function loadDay(date){ const d = await idbGet('days', date); curDay = d || { date, entries: [] }; }
async function saveDay(){ await idbPut('days', curDay); }
async function saveFood(f){ await idbPut('foods', f); rebuildFmap(); }
async function saveSettings(){ SETTINGS.lang = LANG; await idbPut('meta', SETTINGS); }

/* ---------------- rendering ---------------- */
function applyLang(lang){
  LANG = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = (lang==='he') ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(el=>{ const k=el.getAttribute('data-i18n'); if(T[lang][k]!=null) el.textContent=T[lang][k]; });
  document.querySelectorAll('[data-ph]').forEach(el=>{ const k=el.getAttribute('data-ph'); if(T[lang][k]!=null) el.placeholder=T[lang][k]; });
}

function render(){ renderDate(); renderRings(); renderRemaining(); renderTiles(); renderEntries(); }

function renderDate(){
  const el = document.getElementById('dateLabel');
  const today = todayStr();
  if(curDate===today) el.textContent = t('today');
  else if(curDate===shiftDate(today,-1)) el.textContent = t('yesterday');
  else if(curDate===shiftDate(today,1)) el.textContent = t('tomorrow');
  else { const [y,m,d]=curDate.split('-'); el.textContent = `${d}/${m}`; }
  document.getElementById('dayNext').disabled = (curDate>=today);
  document.getElementById('dayNext').style.opacity = (curDate>=today)?.3:1;
}

const RING_C = 2*Math.PI*52;
function setRing(fillEl, ringEl, val, target){
  const pct = target>0 ? val/target : 0;
  fillEl.style.strokeDasharray = RING_C;
  fillEl.style.strokeDashoffset = RING_C*(1-Math.max(0,Math.min(1,pct)));
  return pct;
}
function renderRings(){
  const {kcal,protein} = dayTotals();
  document.getElementById('proteinVal').textContent = rnd(protein);
  document.getElementById('kcalVal').textContent = rnd(kcal);
  document.getElementById('proteinTarget').textContent = '/ '+SETTINGS.target_protein_g;
  document.getElementById('kcalTarget').textContent = '/ '+SETTINGS.target_kcal;
  const pPct = setRing(document.getElementById('ringProteinFill'), null, protein, SETTINGS.target_protein_g);
  const kPct = setRing(document.getElementById('ringKcalFill'), null, kcal, SETTINGS.target_kcal);
  document.getElementById('ringProtein').classList.toggle('is-hit', pPct>=1);
  document.getElementById('ringKcal').classList.toggle('is-over', kPct>1);
}
function renderRemaining(){
  const {kcal,protein} = dayTotals();
  const el = document.getElementById('remaining');
  const pLeft = SETTINGS.target_protein_g - protein;
  const kLeft = SETTINGS.target_kcal - kcal;
  const pPart = pLeft>0 ? t('left_protein',{n:rnd(pLeft)}) : t('hit_protein');
  const kPart = kLeft>=0 ? t('left_kcal',{n:rnd(kLeft)}) : t('over_kcal',{n:rnd(-kLeft)});
  el.innerHTML = `<b>${pPart}</b> · ${kPart}`;
}

const CAT_COLOR = {protein:'var(--green-fill)',dairy:'var(--blue)',carb:'var(--yellow)',veg:'#3FBE7A',fruit:'var(--pink)',fat:'var(--orange)',snack:'var(--orange)',drink:'var(--blue)',meal:'var(--yellow)'};
function sortFoods(a,b){
  if(!!b.favorite - !!a.favorite) return (!!b.favorite - !!a.favorite);
  if((b.use_count||0)!==(a.use_count||0)) return (b.use_count||0)-(a.use_count||0);
  return (b.last_used||0)-(a.last_used||0);
}
function renderTiles(){
  const q = (document.getElementById('search').value||'').trim().toLowerCase();
  let list = FOODS.slice();
  if(q) list = list.filter(f => (f.name_he||'').toLowerCase().includes(q) || (f.name_en||'').toLowerCase().includes(q));
  list.sort(sortFoods);
  const wrap = document.getElementById('tiles');
  if(!list.length){ wrap.innerHTML = `<div class="tiles__empty">${t('no_results')}</div>`; return; }
  wrap.innerHTML = list.map(f=>{
    const m = macrosOf(f);
    const combo = f.kind==='combo' ? ' tile--combo' : '';
    return `<button class="tile${combo}" data-id="${f.id}">
      ${f.favorite?`<span class="tile__fav">★</span>`:`<span class="tile__dot" style="background:${CAT_COLOR[f.category]||'var(--taupe)'}"></span>`}
      <div class="tile__name">${esc(foodName(f))}</div>
      <div class="tile__macros"><span class="tile__p">${rnd(m.protein)}g</span><span class="tile__k">${rnd(m.kcal)} kcal</span></div>
      ${f.serving_label?`<div class="tile__sub">${esc(f.serving_label)}</div>`:''}
    </button>`;
  }).join('');
}
function renderEntries(){
  const wrap = document.getElementById('entries');
  const empty = document.getElementById('entriesEmpty');
  const count = document.getElementById('entriesCount');
  if(!curDay.entries.length){ wrap.innerHTML=''; empty.hidden=false; count.textContent=''; return; }
  empty.hidden=true;
  count.textContent = curDay.entries.length + ' × ';
  wrap.innerHTML = curDay.entries.map((e,i)=>{
    const time = e.at ? new Date(e.at).toLocaleTimeString(LANG==='he'?'he-IL':'en-GB',{hour:'2-digit',minute:'2-digit'}) : '';
    return `<div class="entry" data-i="${i}">
      <div class="entry__main">
        <div class="entry__name">${esc(e['name_'+LANG]||e.name_he||e.name_en)}</div>
        <div class="entry__meta">${rnd(e.protein*e.qty)}g · ${rnd(e.kcal*e.qty)} kcal${time?' · '+time:''}</div>
      </div>
      <div class="entry__qty">
        <button class="qbtn" data-act="dec">−</button>
        <span class="entry__q">${e.qty}</span>
        <button class="qbtn" data-act="inc">+</button>
      </div>
      <button class="entry__x" data-act="del" aria-label="remove">✕</button>
    </div>`;
  }).join('');
}
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

/* ---------------- actions ---------------- */
async function logFood(id){
  const f = FMAP[id]; if(!f) return;
  const m = macrosOf(f);
  const entry = { eid:uid(), food_id:id, name_he:f.name_he, name_en:f.name_en, kcal:m.kcal, protein:m.protein, qty:1, at:new Date().toISOString() };
  curDay.entries.push(entry);
  f.use_count = (f.use_count||0)+1; f.last_used = Date.now();
  await saveDay(); await saveFood(f);
  render();
  lastAction = { type:'add', eid:entry.eid };
  showToast(t('added')+' · '+foodName(f), t('undo'), undoLast);
  buzz();
}
async function changeQty(i, delta){
  const e = curDay.entries[i]; if(!e) return;
  e.qty += delta;
  if(e.qty<=0){ curDay.entries.splice(i,1); }
  await saveDay(); render();
}
async function removeEntry(i){
  const e = curDay.entries[i]; if(!e) return;
  const removed = Object.assign({}, e);
  curDay.entries.splice(i,1);
  await saveDay(); render();
  lastAction = { type:'remove', entry:removed, index:i };
  showToast(t('removed')+' · '+(removed['name_'+LANG]||removed.name_he), t('undo'), undoLast);
}
async function undoLast(){
  if(!lastAction) return;
  if(lastAction.type==='add'){
    const i = curDay.entries.findIndex(e=>e.eid===lastAction.eid);
    if(i>=0) curDay.entries.splice(i,1);
  } else if(lastAction.type==='remove'){
    curDay.entries.splice(Math.min(lastAction.index,curDay.entries.length),0,lastAction.entry);
  }
  lastAction=null; hideToast(); await saveDay(); render();
}

/* ---------------- toast ---------------- */
function showToast(msg, actionLabel, onAction){
  const el = document.getElementById('toast');
  el.innerHTML = `<span>${esc(msg)}</span>` + (actionLabel?`<button class="toast__undo">${esc(actionLabel)}</button>`:'');
  if(actionLabel && onAction) el.querySelector('.toast__undo').onclick = onAction;
  el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(hideToast, 3200);
}
function hideToast(){ document.getElementById('toast').classList.remove('show'); }
function buzz(){ try{ if(navigator.vibrate) navigator.vibrate(8); }catch(e){} }

/* ---------------- food sheet ---------------- */
let editingId = null;
function openFood(food){
  editingId = food ? food.id : null;
  document.getElementById('foodSheetTitle').textContent = t(food?'food_edit':'food_new');
  document.getElementById('fName').value = food?food.name_he||'':'';
  document.getElementById('fNameEn').value = food?food.name_en||'':'';
  document.getElementById('fKcal').value = food?(food.kind==='combo'?rnd(macrosOf(food).kcal):food.kcal):'';
  document.getElementById('fProtein').value = food?(food.kind==='combo'?rnd(macrosOf(food).protein):food.protein_g):'';
  document.getElementById('fServing').value = food?food.serving_label||'':'';
  document.getElementById('fCategory').value = food?food.category||'protein':'protein';
  document.getElementById('fFav').checked = food?!!food.favorite:false;
  document.getElementById('pasteBox').value='';
  document.getElementById('btnDeleteFood').hidden = !food;
  // combos are edited as their computed totals; disabling per-component edit keeps MVP simple
  openSheet('sheetFood');
}
async function saveFoodFromSheet(){
  const name_he = document.getElementById('fName').value.trim();
  const name_en = document.getElementById('fNameEn').value.trim();
  const kcal = parseFloat(document.getElementById('fKcal').value);
  const protein = parseFloat(document.getElementById('fProtein').value);
  if((!name_he && !name_en) || isNaN(kcal) || isNaN(protein)){ showToast(t('need_name')); return; }
  let f = editingId ? Object.assign({}, FMAP[editingId]) : { id:slug(name_en||name_he), kind:'atomic', components:[], use_count:0, last_used:0 };
  if(!editingId && FMAP[f.id]) f.id = f.id+'-'+Math.random().toString(36).slice(2,6);
  f.name_he=name_he||name_en; f.name_en=name_en||name_he;
  // if editing a combo, convert stored totals to atomic so edits stick
  if(f.kind==='combo'){ f.kind='atomic'; f.components=[]; }
  f.kcal=kcal; f.protein_g=protein;
  f.serving_label=document.getElementById('fServing').value.trim();
  f.category=document.getElementById('fCategory').value;
  f.favorite=document.getElementById('fFav').checked;
  await saveFood(f);
  FOODS = await idbAll('foods'); rebuildFmap();
  closeSheets(); render(); showToast(t('saved'));
}
async function deleteFood(){
  if(!editingId) return;
  if(!confirm(t('confirm_del'))) return;
  await idbDel('foods', editingId);
  FOODS = FOODS.filter(f=>f.id!==editingId); rebuildFmap();
  closeSheets(); render();
}
function slug(s){ return (s||'food').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40) || 'food-'+Math.random().toString(36).slice(2,6); }

/* paste-parse: pull kcal + protein out of a chat reply (he/en) */
function parsePaste(text){
  const num = '(\\d+(?:[.,]\\d+)?)';
  const kcal = text.match(new RegExp(num+'\\s*(?:kcal|cal(?:ories?)?|קלוריות|קלוריה)','i'))
            || text.match(new RegExp('(?:kcal|cal(?:ories?)?|קלוריות)\\D{0,8}'+num,'i'));
  const prot = text.match(new RegExp(num+'\\s*(?:g(?:rams?)?\\s*)?(?:protein|prot\\.?|חלבון)','i'))
            || text.match(new RegExp('(?:protein|חלבון)\\D{0,10}'+num,'i'));
  const f = m => m ? parseFloat(m[1].replace(',','.')) : null;
  return { kcal:f(kcal), protein:f(prot) };
}

/* ---------------- sheets ---------------- */
function openSheet(id){ document.getElementById('scrim').hidden=false; document.getElementById(id).hidden=false; }
function closeSheets(){ document.getElementById('scrim').hidden=true; document.getElementById('sheetFood').hidden=true; document.getElementById('sheetSettings').hidden=true; }
function openSettings(){
  document.getElementById('sKcal').value = SETTINGS.target_kcal;
  document.getElementById('sProtein').value = SETTINGS.target_protein_g;
  document.getElementById('sLang').value = LANG;
  document.getElementById('verHint').textContent = t('ver',{v:APP_VERSION});
  openSheet('sheetSettings');
}

/* ---------------- export / import ---------------- */
async function exportBackup(){
  const days = await idbAll('days');
  const data = { app:'macro', version:APP_VERSION, exported:new Date().toISOString(), settings:SETTINGS, foods:FOODS, days };
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `macro-backup-${todayStr()}.json`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href);
}
async function importBackup(file){
  try{
    const data = JSON.parse(await file.text());
    if(!data || !Array.isArray(data.foods)) throw new Error('bad');
    if(data.settings) { SETTINGS = Object.assign(SETTINGS, data.settings); SETTINGS.version=APP_VERSION; await saveSettings(); }
    if(data.foods.length){ await idbBulkPut('foods', data.foods); FOODS = await idbAll('foods'); rebuildFmap(); }
    if(Array.isArray(data.days)) await idbBulkPut('days', data.days);
    LANG = SETTINGS.lang||'he'; applyLang(LANG);
    await loadDay(curDate); render(); showToast(t('imported'));
  }catch(e){ showToast(t('bad_file')); }
}

/* ---------------- event wiring ---------------- */
function wire(){
  // tiles: tap = log, long-press = edit
  const tiles = document.getElementById('tiles');
  let pressTimer=null, longFired=false, startY=0, startX=0;
  tiles.addEventListener('pointerdown', e=>{
    const tile = e.target.closest('.tile'); if(!tile) return;
    longFired=false; startX=e.clientX; startY=e.clientY;
    pressTimer=setTimeout(()=>{ longFired=true; buzz(); openFood(FMAP[tile.dataset.id]); }, 480);
  });
  tiles.addEventListener('pointermove', e=>{ if(pressTimer && (Math.abs(e.clientX-startX)>12||Math.abs(e.clientY-startY)>12)){ clearTimeout(pressTimer); pressTimer=null; } });
  tiles.addEventListener('pointerup', ()=>{ clearTimeout(pressTimer); pressTimer=null; });
  tiles.addEventListener('pointercancel', ()=>{ clearTimeout(pressTimer); pressTimer=null; });
  tiles.addEventListener('click', e=>{
    const tile = e.target.closest('.tile'); if(!tile) return;
    if(longFired){ longFired=false; return; }
    tile.classList.remove('just-added'); void tile.offsetWidth; tile.classList.add('just-added');
    logFood(tile.dataset.id);
  });

  // entries: qty + / - , delete
  document.getElementById('entries').addEventListener('click', e=>{
    const row = e.target.closest('.entry'); if(!row) return;
    const i = +row.dataset.i; const act = e.target.closest('[data-act]')?.dataset.act;
    if(act==='inc') changeQty(i, 1);
    else if(act==='dec') changeQty(i, -1);
    else if(act==='del') removeEntry(i);
  });

  document.getElementById('search').addEventListener('input', renderTiles);
  document.getElementById('dayPrev').addEventListener('click', async ()=>{ curDate=shiftDate(curDate,-1); await loadDay(curDate); render(); });
  document.getElementById('dayNext').addEventListener('click', async ()=>{ if(curDate>=todayStr())return; curDate=shiftDate(curDate,1); await loadDay(curDate); render(); });

  document.getElementById('btnAdd').addEventListener('click', ()=>openFood(null));
  document.getElementById('btnSettings').addEventListener('click', openSettings);
  document.getElementById('btnSaveFood').addEventListener('click', saveFoodFromSheet);
  document.getElementById('btnDeleteFood').addEventListener('click', deleteFood);
  document.getElementById('scrim').addEventListener('click', closeSheets);
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click', closeSheets));

  document.getElementById('pasteBox').addEventListener('input', e=>{
    const {kcal,protein} = parsePaste(e.target.value);
    if(kcal!=null && !document.getElementById('fKcal').value) document.getElementById('fKcal').value=kcal;
    if(protein!=null && !document.getElementById('fProtein').value) document.getElementById('fProtein').value=protein;
  });

  document.getElementById('sKcal').addEventListener('change', async e=>{ SETTINGS.target_kcal=Math.max(1,parseInt(e.target.value)||1200); await saveSettings(); render(); });
  document.getElementById('sProtein').addEventListener('change', async e=>{ SETTINGS.target_protein_g=Math.max(1,parseInt(e.target.value)||105); await saveSettings(); render(); });
  document.getElementById('sLang').addEventListener('change', async e=>{ LANG=e.target.value; applyLang(LANG); await saveSettings(); render(); });
  document.getElementById('btnExport').addEventListener('click', exportBackup);
  document.getElementById('btnImport').addEventListener('click', ()=>document.getElementById('importFile').click());
  document.getElementById('importFile').addEventListener('change', e=>{ if(e.target.files[0]) importBackup(e.target.files[0]); e.target.value=''; });

  // re-sync to today if app was left open past midnight
  document.addEventListener('visibilitychange', async ()=>{
    if(!document.hidden){ const nd=todayStr(); if(nd!==todayStr(new Date(curDate+'T00:00')) && curDate!==nd){ /* keep viewing */ } }
  });
}

/* ---------------- service worker ---------------- */
function registerSW(){
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(err=>console.warn('SW fail',err));
  }
}
