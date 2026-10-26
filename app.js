/* Macro — one-tap nutrition logger. Vanilla JS, IndexedDB, offline-first. */
'use strict';
const APP_VERSION = '1.1.0';
const DEFAULT_MODEL = 'claude-opus-5';
/* Starting targets for a fresh install only — a stored value always wins. */
const DEFAULT_KCAL = 1400, DEFAULT_PROTEIN = 150;

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
    lbl_carbs:'פחמימות (g)', lbl_fat:'שומן (g)',
    lbl_serving:'מנה / כמות', lbl_category:'קטגוריה', fav_label:'מועדף (יופיע ראשון)',
    delete:'מחיקה', save:'שמירה', settings:'הגדרות',
    lbl_target_kcal:'יעד קלוריות', lbl_target_protein:'יעד חלבון (g)', lbl_lang:'שפת ממשק',
    export:'ייצוא גיבוי (JSON)', import:'ייבוא מגיבוי', close:'סגירה',
    ask_hint:'תארי מנה במילים שלך ואמלא את השדות', ask_ph:'קערת קוטג׳ 5% עם מלפפון וקרקר',
    ask_btn:'שאלי', ask_working:'רגע…', ask_failed:'לא הצלחתי להביא תשובה',
    ask_refused:'לא קיבלתי תשובה על המנה הזו', ask_badkey:'המפתח לא תקין',
    conf_high:'הערכה בטוחה', conf_medium:'הערכה סבירה', conf_low:'הערכה גסה, כדאי לבדוק',
    photo_btn:'📷 צילום מנה', photo_working:'מנתחת…',
    photo_truncated:'התשובה נקטעה באמצע — נסי תמונה עם פחות מרכיבים',
    photo_nocomp:'לא זיהיתי מרכיבים בתמונה', dish_total:'סה״כ',
    sec_ai:'התייעצות על מנות', lbl_api_key:'מפתח Anthropic API', api_key_ph:'sk-ant-…',
    lbl_model:'מודל', key_saved:'המפתח נשמר', key_cleared:'המפתח נמחק',
    sec_backup:'גיבוי', share_export:'שיתוף גיבוי', drive_connect:'חיבור לגוגל דרייב',
    drive_disconnect:'ניתוק', drive_backup_now:'גיבוי עכשיו',
    drive_off:'הגיבוי לדרייב כבוי', drive_never:'עוד לא גובה',
    drive_ok:'גובה לדרייב {d}', drive_failed:'הגיבוי לדרייב נכשל',
    drive_reconnect:'צריך להתחבר לגוגל מחדש', drive_saved:'גובה לדרייב',
    backup_stale:'לא גיבית כבר {n} ימים',
    cat_protein:'חלבון', cat_dairy:'חלב', cat_carb:'פחמימה', cat_veg:'ירקות', cat_fruit:'פירות',
    cat_fat:'שומן', cat_snack:'חטיף', cat_drink:'משקה', cat_meal:'ארוחה',
    today:'היום', yesterday:'אתמול', tomorrow:'מחר',
    added:'נוסף', removed:'נמחק', undo:'ביטול', no_results:'לא נמצאה מנה',
    left_kcal:'נשאר {n} קלוריות', over_kcal:'מעל היעד ב‑{n}',
    left_protein:'עוד {n}g חלבון', hit_protein:'יעד החלבון הושג ✓',
    saved:'נשמר', need_name:'צריך שם וערכים', confirm_del:'למחוק את המנה מהמאגר?',
    ver:'גרסה {v}', imported:'הגיבוי נטען', bad_file:'קובץ לא תקין',
    cancel:'ביטול', done:'סיום', edit:'עריכה', my_foods:'המנות שלי',
    prev_day:'היום הקודם', next_day:'היום הבא', add_food_aria:'הוספת מנה',
    dec:'הפחתה', inc:'הוספה', remove:'הסרה',
    unsaved:'יש שינויים שלא נשמרו', discard:'לצאת בלי לשמור', add_named:'הוספת ״{q}״',
  },
  en: {
    ring_protein:'protein · g', ring_kcal:'calories',
    search_ph:'Search food…', add_food:'+ Food',
    entries_title:"Today's log", entries_empty:'Nothing logged yet. Tap a food to add.',
    food_new:'New food', food_edit:'Edit food',
    paste_hint:'Paste a Gemini / Claude reply (kcal + protein) to auto-fill',
    paste_ph:'e.g. 240 calories, 32 g protein…', serving_ph:'1 cup 170g',
    lbl_name_he:'Name (Hebrew)', lbl_name_en:'Name (English)', lbl_kcal:'Calories', lbl_protein:'Protein (g)',
    lbl_carbs:'Carbs (g)', lbl_fat:'Fat (g)',
    lbl_serving:'Serving', lbl_category:'Category', fav_label:'Favorite (shown first)',
    delete:'Delete', save:'Save', settings:'Settings',
    lbl_target_kcal:'Calorie target', lbl_target_protein:'Protein target (g)', lbl_lang:'Interface language',
    export:'Export backup (JSON)', import:'Import backup', close:'Close',
    ask_hint:'Describe a dish in your own words and I will fill the fields',
    ask_ph:'a bowl of 5% cottage cheese with cucumber and a cracker',
    ask_btn:'Ask', ask_working:'One moment…', ask_failed:"Couldn't get an answer",
    ask_refused:'No answer returned for that dish', ask_badkey:'That key is not valid',
    conf_high:'confident estimate', conf_medium:'reasonable estimate', conf_low:'rough estimate, worth checking',
    photo_btn:'📷 Photograph a dish', photo_working:'Analysing…',
    photo_truncated:'The reply was cut off — try a dish with fewer ingredients',
    photo_nocomp:'No ingredients recognised in that photo', dish_total:'Total',
    sec_ai:'Ask about a dish', lbl_api_key:'Anthropic API key', api_key_ph:'sk-ant-…',
    lbl_model:'Model', key_saved:'Key saved', key_cleared:'Key cleared',
    sec_backup:'Backup', share_export:'Share backup', drive_connect:'Connect Google Drive',
    drive_disconnect:'Disconnect', drive_backup_now:'Back up now',
    drive_off:'Drive backup is off', drive_never:'Never backed up',
    drive_ok:'Backed up to Drive {d}', drive_failed:'Drive backup failed',
    drive_reconnect:'Reconnect to Google', drive_saved:'Backed up to Drive',
    backup_stale:"You haven't backed up in {n} days",
    cat_protein:'Protein', cat_dairy:'Dairy', cat_carb:'Carb', cat_veg:'Veg', cat_fruit:'Fruit',
    cat_fat:'Fat', cat_snack:'Snack', cat_drink:'Drink', cat_meal:'Meal',
    today:'Today', yesterday:'Yesterday', tomorrow:'Tomorrow',
    added:'Added', removed:'Removed', undo:'Undo', no_results:'No match',
    left_kcal:'{n} kcal left', over_kcal:'{n} over target',
    left_protein:'{n}g protein to go', hit_protein:'Protein target hit ✓',
    saved:'Saved', need_name:'Name and values required', confirm_del:'Delete this food from the database?',
    ver:'Version {v}', imported:'Backup loaded', bad_file:'Invalid file',
    cancel:'Cancel', done:'Done', edit:'Edit', my_foods:'My foods',
    prev_day:'Previous day', next_day:'Next day', add_food_aria:'Add food',
    dec:'Decrease', inc:'Increase', remove:'Remove',
    unsaved:'Unsaved changes', discard:'Discard', add_named:'Add “{q}”',
  }
};
let LANG = 'he';
let editMode = false;   // tiles: tap logs; in edit mode, tap opens the editor
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
let SETTINGS = { key:'settings', target_kcal:DEFAULT_KCAL, target_protein_g:DEFAULT_PROTEIN, lang:'he', version:APP_VERSION };
/* secrets live in their own meta record so exportBackup() can never serialise them */
let SECRETS = { key:'secrets', anthropic_key:'', model:DEFAULT_MODEL, google_client_id:'', drive_file_id:'', drive_last_backup:0 };
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
    let k=0,p=0,c_=0,ft=0;
    for(const c of f.components){ const cf=FMAP[c.id]; if(cf){ const m=macrosOf(cf); k+=m.kcal*c.qty; p+=m.protein*c.qty; c_+=m.carbs*c.qty; ft+=m.fat*c.qty; } }
    return {kcal:k, protein:p, carbs:c_, fat:ft};
  }
  // carbs/fat are optional — foods predating them read as 0 and are never displayed as a total
  return {kcal:Number(f.kcal)||0, protein:Number(f.protein_g)||0, carbs:Number(f.carbs_g)||0, fat:Number(f.fat_g)||0};
}
function dayTotals(){ let k=0,p=0; for(const e of curDay.entries){ k+=e.kcal*e.qty; p+=e.protein*e.qty; } return {kcal:k, protein:p}; }

/* ---------------- boot ---------------- */
(async function boot(){
  db = await openDB();
  const s = await idbGet('meta','settings'); if(s) SETTINGS = Object.assign(SETTINGS, s);
  SETTINGS.version = APP_VERSION;
  LANG = SETTINGS.lang || 'he';

  const sec = await idbGet('meta','secrets'); if(sec) SECRETS = Object.assign(SECRETS, sec);
  if(!SECRETS.model) SECRETS.model = DEFAULT_MODEL;
  // a key from a pre-1.1 build could be sitting in settings; move it and scrub it
  if(SETTINGS.anthropic_key){
    if(!SECRETS.anthropic_key) SECRETS.anthropic_key = SETTINGS.anthropic_key;
    delete SETTINGS.anthropic_key;
    await saveSecrets(); await saveSettings();
  }

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
  applyAskAvailability();
  renderBackupStatus();
  registerSW();
  if(navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(()=>{});
  maybeAutoBackup();   // deliberately not awaited: backup must never delay first paint
})();

function rebuildFmap(){ FMAP = {}; for(const f of FOODS) FMAP[f.id]=f; }
async function loadDay(date){ const d = await idbGet('days', date); curDay = d || { date, entries: [] }; }
async function saveDay(){ await idbPut('days', curDay); }
async function saveFood(f){ await idbPut('foods', f); rebuildFmap(); }
async function saveSettings(){ SETTINGS.lang = LANG; await idbPut('meta', SETTINGS); }
async function saveSecrets(){ await idbPut('meta', SECRETS); }

/* ---------------- rendering ---------------- */
function applyLang(lang){
  LANG = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = (lang==='he') ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(el=>{ const k=el.getAttribute('data-i18n'); if(T[lang][k]!=null) el.textContent=T[lang][k]; });
  document.querySelectorAll('[data-ph]').forEach(el=>{ const k=el.getAttribute('data-ph'); if(T[lang][k]!=null) el.placeholder=T[lang][k]; });
  document.querySelectorAll('[data-i18n-aria]').forEach(el=>{ const k=el.getAttribute('data-i18n-aria'); if(T[lang][k]!=null) el.setAttribute('aria-label', T[lang][k]); });
  const edit = document.getElementById('btnEdit'); if(edit) edit.textContent = t(editMode?'done':'edit');
}

function render(){ renderDay(); renderTiles(); }
/* logging, quantity and undo leave the tiles where they are: a tile never jumps away from a finger.
   The order by use refreshes on the next full render (launch, search, save). */
function renderDay(){ renderDate(); renderRings(); renderRemaining(); renderEntries(); }

function renderDate(){
  const el = document.getElementById('dateLabel');
  const today = todayStr();
  if(curDate===today) el.textContent = t('today');
  else if(curDate===shiftDate(today,-1)) el.textContent = t('yesterday');
  else if(curDate===shiftDate(today,1)) el.textContent = t('tomorrow');
  else { const [y,m,d]=curDate.split('-'); el.textContent = `${d}/${m}`; }
  document.getElementById('navTitle').textContent = el.textContent;
  document.getElementById('dayNext').disabled = (curDate>=today);
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

/* a favorite gets a star, a combo gets a stack; shape carries the meaning, not color */
const MARK_FAV = `<svg class="tile__mark tile__mark--fav" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/></svg>`;
const MARK_COMBO = `<svg class="tile__mark" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5"/></svg>`;
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
  if(!list.length){
    // an empty result always offers the next step: add what was searched for
    const raw = (document.getElementById('search').value||'').trim();
    wrap.innerHTML = `<div class="tiles__empty"><span>${t('no_results')}</span>${raw?`<button class="btn btn--secondary" data-addq>${esc(t('add_named',{q:raw}))}</button>`:''}</div>`;
    return;
  }
  wrap.innerHTML = list.map(f=>{
    const m = macrosOf(f);
    return `<button class="tile" data-id="${f.id}">
      ${f.favorite ? MARK_FAV : (f.kind==='combo' ? MARK_COMBO : '')}
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
        <button class="qbtn" data-act="dec" aria-label="${t('dec')}">−</button>
        <span class="entry__q">${e.qty}</span>
        <button class="qbtn" data-act="inc" aria-label="${t('inc')}">+</button>
      </div>
      <button class="entry__x" data-act="del" aria-label="${t('remove')}">✕</button>
    </div>`;
  }).join('');
}
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

/* ---------------- actions ---------------- */
async function logFood(id){
  const f = FMAP[id]; if(!f) return;
  const m = macrosOf(f);
  const entry = { eid:uid(), food_id:id, name_he:f.name_he, name_en:f.name_en,
    kcal:m.kcal, protein:m.protein, carbs:m.carbs, fat:m.fat, qty:1, at:new Date().toISOString() };
  curDay.entries.push(entry);
  f.use_count = (f.use_count||0)+1; f.last_used = Date.now();
  await saveDay(); await saveFood(f);
  renderDay();
  lastAction = { type:'add', eid:entry.eid };
  showToast(t('added')+' · '+foodName(f), t('undo'), undoLast);
  buzz();
}
async function changeQty(i, delta){
  const e = curDay.entries[i]; if(!e) return;
  e.qty += delta;
  if(e.qty<=0){ curDay.entries.splice(i,1); }
  await saveDay(); renderDay();
}
async function removeEntry(i){
  const e = curDay.entries[i]; if(!e) return;
  const removed = Object.assign({}, e);
  curDay.entries.splice(i,1);
  await saveDay(); renderDay();
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
  lastAction=null; hideToast(); await saveDay(); renderDay();
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
/* haptic tick: Android through vibrate(); iOS Safari 18+ ticks when a switch toggles, so flip a hidden one */
let hapticLabel = null;
function buzz(){
  try{
    if(navigator.vibrate){ navigator.vibrate(8); return; }
    if(!hapticLabel){
      hapticLabel = document.createElement('label'); hapticLabel.setAttribute('aria-hidden','true'); hapticLabel.style.display='none';
      const sw = document.createElement('input'); sw.type='checkbox'; sw.setAttribute('switch',''); sw.tabIndex=-1;
      hapticLabel.appendChild(sw); document.body.appendChild(hapticLabel);
    }
    hapticLabel.click();
  }catch(e){}
}

/* ---------------- food sheet ---------------- */
let editingId = null;
function openFood(food){
  editingId = food ? food.id : null;
  document.getElementById('foodSheetTitle').textContent = t(food?'food_edit':'food_new');
  document.getElementById('fName').value = food?food.name_he||'':'';
  document.getElementById('fNameEn').value = food?food.name_en||'':'';
  // a combo shows its computed totals; an atomic food shows its own stored value.
  // blank stays blank — an unset carbs_g means "unknown", which is not the same as 0.
  const fieldVal = (key, macroKey) => {
    if(!food) return '';
    if(food.kind==='combo') return rnd(macrosOf(food)[macroKey]);
    return food[key]==null || food[key]==='' ? '' : food[key];
  };
  document.getElementById('fKcal').value = fieldVal('kcal','kcal');
  document.getElementById('fProtein').value = fieldVal('protein_g','protein');
  document.getElementById('fCarbs').value = fieldVal('carbs_g','carbs');
  document.getElementById('fFat').value = fieldVal('fat_g','fat');
  document.getElementById('fServing').value = food?food.serving_label||'':'';
  document.getElementById('fCategory').value = food?food.category||'protein':'protein';
  document.getElementById('fFav').checked = food?!!food.favorite:false;
  document.getElementById('pasteBox').value='';
  document.getElementById('askBox').value='';
  setAskNote('');
  clearDishPreview();
  document.getElementById('btnDeleteFood').hidden = !food;
  // combos are edited as their computed totals; disabling per-component edit keeps MVP simple
  foodSnapshot = foodFormState();
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
  // optional: a blank field clears the value rather than storing a fake 0
  for(const [el,key] of [['fCarbs','carbs_g'],['fFat','fat_g']]){
    const raw = document.getElementById(el).value.trim();
    const n = parseFloat(raw);
    if(raw==='' || isNaN(n)) delete f[key]; else f[key]=n;
  }
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

/* ---------------- ask about a dish ----------------
   Direct browser call to the Messages API. The key is Sarit's own and lives only in this
   device's IndexedDB — it is never in the repo and never in a backup. */
const API_URL = 'https://api.anthropic.com/v1/messages';

/* Structured outputs: numeric bounds and string-length constraints are not supported,
   and every object needs additionalProperties:false plus a full required list. */
const FOOD_SCHEMA = {
  type:'object',
  properties:{
    name_he:{type:'string', description:'שם קצר וטבעי בעברית, בלי כמויות'},
    name_en:{type:'string', description:'Short natural English name, no quantities'},
    kcal:{type:'number', description:'Calories for the whole serving described'},
    protein_g:{type:'number'},
    carbs_g:{type:'number'},
    fat_g:{type:'number'},
    serving_label:{type:'string', description:'The portion these numbers describe, e.g. "1 גביע 170g"'},
    category:{type:'string', enum:['protein','dairy','carb','veg','fruit','fat','snack','drink','meal']},
    confidence:{type:'string', enum:['high','medium','low'],
      description:'high for a packaged product with known values, low for a vague home-cooked portion'},
    note:{type:'string', description:'One short sentence on what was assumed, in the user language. Empty string if nothing was assumed.'}
  },
  required:['name_he','name_en','kcal','protein_g','carbs_g','fat_g','serving_label','category','confidence','note'],
  additionalProperties:false
};

const ASK_SYSTEM = [
  'You estimate nutrition for a single dish and return it as structured data.',
  'The user is in Israel, so assume Israeli supermarket products and home cooking',
  '(for example קוטג׳, לבנה, במבה, פיתה, טחינה, שקדי מרק) unless told otherwise.',
  'If no quantity is given, assume one ordinary serving and state it in serving_label.',
  'Estimate honestly: use low confidence when the portion is vague, and never imply',
  'precision you do not have. Write name_he and note in Hebrew.'
].join(' ');

/* Photo → ingredient breakdown. Same structured-output rules as FOOD_SCHEMA above:
   the nested component objects each need additionalProperties:false and a full required list. */
const DISH_SCHEMA = {
  type:'object',
  properties:{
    dish_name_he:{type:'string', description:'שם קצר וטבעי למנה כולה בעברית'},
    dish_name_en:{type:'string', description:'Short natural English name for the whole dish'},
    serving_label:{type:'string', description:'The whole portion in the photo, e.g. "צלחת אחת"'},
    confidence:{type:'string', enum:['high','medium','low']},
    note:{type:'string', description:'One short sentence in Hebrew on what was assumed. Empty string if nothing was assumed.'},
    components:{
      type:'array',
      description:'One entry per identifiable ingredient, with the nutrition of the amount present in THIS dish.',
      items:{
        type:'object',
        properties:{
          name_he:{type:'string'},
          name_en:{type:'string'},
          amount_label:{type:'string', description:'How much of this ingredient is in the dish, e.g. "כף" or "80g"'},
          kcal:{type:'number'},
          protein_g:{type:'number'},
          carbs_g:{type:'number'},
          fat_g:{type:'number'},
          category:{type:'string', enum:['protein','dairy','carb','veg','fruit','fat','snack','drink','meal']}
        },
        required:['name_he','name_en','amount_label','kcal','protein_g','carbs_g','fat_g','category'],
        additionalProperties:false
      }
    }
  },
  required:['dish_name_he','dish_name_en','serving_label','confidence','note','components'],
  additionalProperties:false
};

const DISH_SYSTEM = [
  'You break a photographed meal down into its individual ingredients and return structured data.',
  'The user is in Israel, so assume Israeli supermarket products and home cooking unless the photo says otherwise.',
  'List every ingredient you can actually see, including cooking oil and dressings you can infer from sheen or texture.',
  'Each component describes the amount of that ingredient present in THIS dish — not a generic 100g serving.',
  'State that amount in amount_label, and make the components add up to the whole plate.',
  'Judge portions against visible references such as the plate rim, cutlery, or a hand.',
  'Estimate honestly: use low confidence when a portion or a hidden ingredient is a guess,',
  'and never imply precision you do not have. Write name_he, amount_label and note in Hebrew.'
].join(' ');

function setAskNote(msg, tone){
  const el = document.getElementById('askNote');
  el.textContent = msg || '';
  el.hidden = !msg;
  el.className = 'asknote' + (tone ? ' asknote--'+tone : '');
}

async function askAboutFood(){
  const text = document.getElementById('askBox').value.trim();
  const key = SECRETS.anthropic_key;
  if(!text || !key) return;

  const btn = document.getElementById('btnAsk');
  btn.disabled = true; btn.textContent = t('ask_working');
  setAskNote('');

  try{
    const res = await fetch(API_URL, {
      method:'POST',
      headers:{
        'content-type':'application/json',
        'x-api-key':key,
        'anthropic-version':'2023-06-01',
        // required for a direct browser call; without it CORS blocks the request
        'anthropic-dangerous-direct-browser-access':'true'
      },
      body: JSON.stringify({
        model: SECRETS.model || DEFAULT_MODEL,
        max_tokens: 2048,          // thinking is on by default and shares this budget
        output_config: { effort:'low', format:{ type:'json_schema', schema:FOOD_SCHEMA } },
        system: ASK_SYSTEM,
        messages: [{ role:'user', content: text }]
      })
    });

    if(!res.ok){
      setAskNote(t(res.status===401 || res.status===403 ? 'ask_badkey' : 'ask_failed'), 'bad');
      return;
    }
    const data = await res.json();
    // a refusal returns HTTP 200 with empty content — check before reading it
    if(data.stop_reason === 'refusal'){ setAskNote(t('ask_refused'), 'bad'); return; }

    const block = (data.content||[]).find(b => b.type === 'text');
    if(!block){ setAskNote(t('ask_failed'), 'bad'); return; }
    fillFromAsk(JSON.parse(block.text));
  }catch(e){
    console.warn('ask failed', e);
    setAskNote(t('ask_failed'), 'bad');
  }finally{
    btn.disabled = false; btn.textContent = t('ask_btn');
  }
}

/* Fills the form and stops. Nothing is saved until she taps שמירה. */
function fillFromAsk(f){
  const set = (id,v) => { if(v!=null && v!=='') document.getElementById(id).value = v; };
  set('fName', f.name_he); set('fNameEn', f.name_en);
  set('fKcal', rnd(f.kcal)); set('fProtein', rnd(f.protein_g));
  set('fCarbs', rnd(f.carbs_g)); set('fFat', rnd(f.fat_g));
  set('fServing', f.serving_label);
  if(f.category) document.getElementById('fCategory').value = f.category;

  // an estimate is labelled as one — the UI must never present a guess as a measurement
  const label = t('conf_' + (f.confidence || 'medium'));
  setAskNote(f.note ? label + ' · ' + f.note : label, f.confidence==='low' ? 'warn' : '');
}

/* ---------------- photo → ingredient breakdown ---------------- */

/* A phone photo is 4000px+ and the API caps images at 2576px on the long edge anyway.
   Downscaling here cuts the upload and the image-token bill without costing recognition. */
async function fileToResizedJpeg(file, maxEdge = 1568, quality = 0.82){
  // imageOrientation honours the EXIF rotation phones write instead of rotating pixels
  const bmp = await createImageBitmap(file, { imageOrientation:'from-image' })
    .catch(() => createImageBitmap(file));
  const scale = Math.min(1, maxEdge / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  cv.getContext('2d').drawImage(bmp, 0, 0, w, h);
  if(bmp.close) bmp.close();
  const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', quality));
  const bytes = new Uint8Array(await blob.arrayBuffer());
  // chunked, because String.fromCharCode(...wholeArray) overflows the stack on a big image
  let bin = '';
  for(let i=0; i<bytes.length; i+=0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i+0x8000));
  return btoa(bin);
}

async function analyseDishPhoto(file){
  const key = SECRETS.anthropic_key;
  if(!file || !key) return;

  const btn = document.getElementById('btnPhoto');
  btn.disabled = true; btn.textContent = t('photo_working');
  setAskNote(''); clearDishPreview();

  try{
    const data64 = await fileToResizedJpeg(file);
    const res = await fetch(API_URL, {
      method:'POST',
      headers:{
        'content-type':'application/json',
        'x-api-key':key,
        'anthropic-version':'2023-06-01',
        'anthropic-dangerous-direct-browser-access':'true'
      },
      body: JSON.stringify({
        model: SECRETS.model || DEFAULT_MODEL,
        // 8000, not the 2048 the text ask uses: thinking is on by default and shares this
        // budget, and a plate with eight ingredients will truncate mid-JSON at 2048.
        max_tokens: 8000,
        // medium, not low: identifying ingredients and splitting macros between them is
        // meaningfully harder than estimating one known dish.
        output_config: { effort:'medium', format:{ type:'json_schema', schema:DISH_SCHEMA } },
        system: DISH_SYSTEM,
        messages: [{ role:'user', content:[
          // the image block goes before the text block
          { type:'image', source:{ type:'base64', media_type:'image/jpeg', data:data64 } },
          { type:'text', text:'פרקי את המנה שבתמונה למרכיבים.' }
        ]}]
      })
    });

    if(!res.ok){
      setAskNote(t(res.status===401 || res.status===403 ? 'ask_badkey' : 'ask_failed'), 'bad');
      return;
    }
    const data = await res.json();
    if(data.stop_reason === 'refusal'){ setAskNote(t('ask_refused'), 'bad'); return; }
    // caught before JSON.parse — a truncated reply is invalid JSON and would throw instead
    if(data.stop_reason === 'max_tokens'){ setAskNote(t('photo_truncated'), 'bad'); return; }

    const block = (data.content||[]).find(b => b.type === 'text');
    if(!block){ setAskNote(t('ask_failed'), 'bad'); return; }

    const dish = JSON.parse(block.text);
    console.log('[dish]', dish, '\nusage:', data.usage);
    renderDishPreview(dish);
  }catch(e){
    console.warn('dish photo failed', e);
    setAskNote(t('ask_failed'), 'bad');
  }finally{
    btn.disabled = false; btn.textContent = t('photo_btn');
  }
}

function clearDishPreview(){
  const el = document.getElementById('dishResult');
  el.hidden = true; el.innerHTML = '';
}

/* Shows the breakdown and fills the form with the dish totals.
   Nothing is written to the database — saving still stores one atomic food.
   Turning these components into a real combo record is the next step. */
function renderDishPreview(d){
  const comps = Array.isArray(d.components) ? d.components : [];
  if(!comps.length){ setAskNote(t('photo_nocomp'), 'bad'); return; }

  const sum = comps.reduce((a,c)=>({
    kcal:    a.kcal    + (Number(c.kcal)||0),
    protein: a.protein + (Number(c.protein_g)||0),
    carbs:   a.carbs   + (Number(c.carbs_g)||0),
    fat:     a.fat     + (Number(c.fat_g)||0)
  }), {kcal:0, protein:0, carbs:0, fat:0});

  const nm = c => LANG==='he' ? (c.name_he||c.name_en||'') : (c.name_en||c.name_he||'');
  const rows = comps.map(c=>`<li class="dish__item">
      <span class="dish__nm">${esc(nm(c))}</span>
      <span class="dish__amt">${esc(c.amount_label)}</span>
      <span class="dish__mac" dir="ltr">${rnd(c.kcal)} · ${rnd(c.protein_g)}g</span>
    </li>`).join('');

  const el = document.getElementById('dishResult');
  el.innerHTML =
    `<div class="dish__head">${esc(LANG==='he' ? (d.dish_name_he||d.dish_name_en) : (d.dish_name_en||d.dish_name_he))}` +
    `<small>${esc(d.serving_label)}</small></div>` +
    `<ul class="dish__list">${rows}</ul>` +
    // dir=ltr: a bare "560 · 27g" gets bidi-reordered to "27g · 560" inside the RTL sheet
    `<div class="dish__total">${t('dish_total')}: <span dir="ltr">${rnd(sum.kcal)} · ${rnd(sum.protein)}g</span></div>`;
  el.hidden = false;

  const label = t('conf_' + (d.confidence || 'medium'));
  setAskNote(d.note ? label + ' · ' + d.note : label, d.confidence==='low' ? 'warn' : '');

  const set = (id,v) => { if(v!=null && v!=='') document.getElementById(id).value = v; };
  set('fName', d.dish_name_he); set('fNameEn', d.dish_name_en);
  set('fKcal', rnd(sum.kcal)); set('fProtein', rnd(sum.protein));
  set('fCarbs', rnd(sum.carbs)); set('fFat', rnd(sum.fat));
  set('fServing', d.serving_label);
  document.getElementById('fCategory').value = 'meal';
}

/* No key or offline: the ask box disappears and the paste box carries on as before. */
function applyAskAvailability(){
  document.getElementById('askField').hidden = !SECRETS.anthropic_key;
}

/* ---------------- motion: Apple's spring (duration + bounce, WWDC23) ----------------
   stiffness = (2π/duration)², damping = 4π(1−bounce)/duration, mass 1.
   Springs start from the current value and velocity, so every move can be interrupted. */
const REDUCED_MOTION = matchMedia('(prefers-reduced-motion: reduce)');
function spring({from, to, velocity=0, duration=0.42, bounce=0, onUpdate, onDone}){
  const k = (2*Math.PI/duration)**2, c = 4*Math.PI*(1-bounce)/duration;
  let x = from, v = velocity, last = performance.now(), raf = 0;
  const step = now => {
    const dt = Math.min(0.064, (now-last)/1000); last = now;
    const n = Math.max(1, Math.ceil(dt/0.004)), h = dt/n;
    for(let i=0;i<n;i++){ v += (-k*(x-to) - c*v)*h; x += v*h; }
    if(Math.abs(v)<1 && Math.abs(x-to)<0.5){ onUpdate(to); raf=0; onDone && onDone(); return; }
    onUpdate(x); raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return { stop(){ if(raf) cancelAnimationFrame(raf); raf=0; } };
}
/* where a flick is heading (WWDC18 projection, scroll-view deceleration) */
const project = (v, rate=0.998) => (v/1000)*rate/(1-rate);
/* resistance past an edge instead of a hard stop */
const rubberband = (over, dim, c=0.55) => (over*dim*c)/(dim + c*Math.abs(over));

/* ---------------- sheets ---------------- */
const SHEET = { el:null, y:0, h:0, anim:null };
function sheetSetY(y){
  SHEET.y = y;
  SHEET.el.style.transform = `translateY(${y}px)`;
  document.getElementById('scrim').style.opacity = Math.max(0, Math.min(1, 1 - y/SHEET.h));
}
function sheetAnimate(to, velocity=0, bounce=0, onDone){
  if(SHEET.anim) SHEET.anim.stop();
  SHEET.anim = spring({ from:SHEET.y, to, velocity, duration:0.42, bounce, onUpdate:sheetSetY, onDone });
}
function openSheet(id){
  const el = document.getElementById(id);
  const reopening = SHEET.el === el;          // grabbed again while closing: continue from where it is
  if(SHEET.el && !reopening) hideSheetNow();
  document.getElementById('scrim').hidden = false;
  el.hidden = false;
  SHEET.el = el; SHEET.h = el.getBoundingClientRect().height || innerHeight;
  if(REDUCED_MOTION.matches){ sheetSetY(0); return; }
  if(!reopening) sheetSetY(SHEET.h);
  sheetAnimate(0);
}
function hideSheetNow(){
  if(SHEET.anim) SHEET.anim.stop();
  if(SHEET.el){ SHEET.el.hidden = true; SHEET.el.style.transform = ''; }
  const s = document.getElementById('scrim'); s.hidden = true; s.style.opacity = '';
  SHEET.el = null; SHEET.y = 0;
}
function closeSheets(velocity){
  if(typeof velocity !== 'number') velocity = 0;   // also wired straight to click handlers
  if(!SHEET.el) return;
  if(REDUCED_MOTION.matches){ hideSheetNow(); return; }
  sheetAnimate(SHEET.h, velocity, 0, hideSheetNow);
}
/* unsaved edits in the food sheet are never dropped by a stray tap or swipe */
let foodSnapshot = '';
const FOOD_FIELDS = ['fName','fNameEn','fKcal','fProtein','fCarbs','fFat','fServing','fCategory','fFav','pasteBox','askBox'];
function foodFormState(){ return FOOD_FIELDS.map(id=>{ const el=document.getElementById(id); return el.type==='checkbox'?el.checked:el.value; }).join('\u0001'); }
function sheetIsDirty(){ return SHEET.el && SHEET.el.id==='sheetFood' && foodFormState()!==foodSnapshot; }
function warnUnsaved(){ showToast(t('unsaved'), t('discard'), ()=>{ hideToast(); closeSheets(); }); }
function closeUnlessDirty(){
  if(!sheetIsDirty()){ closeSheets(); return; }
  warnUnsaved();
  if(!REDUCED_MOTION.matches){ sheetSetY(28); sheetAnimate(0, 0, 0.3); }   // a small nudge: it stays
}
function wireSheetDrag(el){
  const handles = el.querySelectorAll('.sheet__grab, .sheet__bar');
  handles.forEach(hd => hd.addEventListener('pointerdown', e=>{
    if(e.target.closest('button') || SHEET.el!==el) return;
    if(SHEET.anim) SHEET.anim.stop();
    hd.setPointerCapture(e.pointerId);
    const startY = e.clientY, y0 = SHEET.y, dirty = sheetIsDirty();
    const hist = [{y:e.clientY, t:performance.now()}];
    const move = ev=>{
      let y = y0 + (ev.clientY - startY);
      if(y < 0) y = -rubberband(-y, SHEET.h);               // can't pull past fully open
      else if(dirty) y = rubberband(y, SHEET.h);            // resists, will not dismiss unsaved work
      sheetSetY(y);
      hist.push({y:ev.clientY, t:performance.now()}); if(hist.length>5) hist.shift();
    };
    const up = ()=>{
      hd.removeEventListener('pointermove', move); hd.removeEventListener('pointerup', up); hd.removeEventListener('pointercancel', up);
      const a = hist[0], b = hist[hist.length-1];
      const v = b.t>a.t ? (b.y-a.y)/((b.t-a.t)/1000) : 0;   // px/s
      if(!dirty && SHEET.y + project(v) > SHEET.h*0.5) closeSheets(v);
      else { if(dirty && SHEET.y > 40) warnUnsaved(); sheetAnimate(0, v, Math.abs(v)>300 ? 0.15 : 0); }
    };
    hd.addEventListener('pointermove', move); hd.addEventListener('pointerup', up); hd.addEventListener('pointercancel', up);
  }));
}
function openSettings(){
  document.getElementById('sKcal').value = SETTINGS.target_kcal;
  document.getElementById('sProtein').value = SETTINGS.target_protein_g;
  document.getElementById('sLang').value = LANG;
  document.getElementById('sApiKey').value = SECRETS.anthropic_key || '';
  document.getElementById('sModel').value = SECRETS.model || DEFAULT_MODEL;
  document.getElementById('sGoogleId').value = SECRETS.google_client_id || '';
  renderBackupStatus();
  document.getElementById('verHint').textContent = t('ver',{v:APP_VERSION});
  openSheet('sheetSettings');
}

/* ---------------- export / import ---------------- */
/* The single place a backup payload is built. Secrets live in their own meta record and
   are never read here, so no key can reach a file, a share sheet, or Google Drive. */
async function buildBackup(){
  const days = await idbAll('days');
  const settings = Object.assign({}, SETTINGS);
  delete settings.anthropic_key;              // belt and braces against a pre-1.1 record
  return { app:'macro', version:APP_VERSION, exported:new Date().toISOString(), settings, foods:FOODS, days };
}
function backupBlob(data){ return new Blob([JSON.stringify(data,null,2)], {type:'application/json'}); }
function backupName(){ return `macro-backup-${todayStr()}.json`; }

async function exportBackup(){
  const blob = backupBlob(await buildBackup());
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = backupName();
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href);
  await markBackedUp();
}

/* One tap into Files / Drive / anywhere iOS can share to. Works offline and needs no auth,
   so this stays the guaranteed way data leaves the phone even if Drive is unavailable. */
async function shareBackup(){
  const data = await buildBackup();
  const file = new File([backupBlob(data)], backupName(), {type:'application/json'});
  if(navigator.canShare && navigator.canShare({files:[file]})){
    try{ await navigator.share({files:[file], title:'Macro backup'}); await markBackedUp(); }
    catch(e){ if(e && e.name!=='AbortError') exportBackup(); }
  } else {
    exportBackup();
  }
}

async function importBackup(file){
  try{
    const data = JSON.parse(await file.text());
    if(!data || !Array.isArray(data.foods)) throw new Error('bad');
    if(data.settings) {
      const incoming = Object.assign({}, data.settings);
      delete incoming.anthropic_key;          // never restore a key from a file
      SETTINGS = Object.assign(SETTINGS, incoming);
      delete SETTINGS.anthropic_key;          // nor leave a pre-1.1 one sitting in the merge
      SETTINGS.version=APP_VERSION; await saveSettings();
    }
    if(data.foods.length){ await idbBulkPut('foods', data.foods); FOODS = await idbAll('foods'); rebuildFmap(); }
    if(Array.isArray(data.days)) await idbBulkPut('days', data.days);
    LANG = SETTINGS.lang||'he'; applyLang(LANG);
    await loadDay(curDate); render(); showToast(t('imported'));
  }catch(e){ showToast(t('bad_file')); }
}

/* ---------------- google drive backup ----------------
   Google Identity Services + Drive REST v3, scope drive.file so the app only ever sees
   files it created itself. The OAuth client ID is public by design and is safe in the repo;
   only the Anthropic key is device-only.

   Two known limits, both surfaced in the UI rather than failing silently:
   - a browser client gets no refresh token, so the ~1h access token needs periodic re-auth
   - GIS opens a popup, which is unreliable inside a standalone iOS home-screen app
   shareBackup() is always available as the offline, no-auth fallback. */
const GIS_SRC = 'https://accounts.google.com/gsi/client';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';
const BACKUP_INTERVAL_MS = 24*60*60*1000;
const STALE_BACKUP_DAYS = 14;

let gisReady = null, tokenClient = null, driveToken = '', driveTokenExp = 0;

function loadGIS(){
  if(gisReady) return gisReady;
  gisReady = new Promise((res,rej)=>{
    if(window.google && google.accounts) return res();
    const s = document.createElement('script');
    s.src = GIS_SRC; s.async = true; s.defer = true;
    s.onload = ()=>res(); s.onerror = ()=>rej(new Error('gis load failed'));
    document.head.appendChild(s);
  });
  return gisReady;
}

/* interactive=false attempts a silent renewal; it only works while the Google session
   is alive, so a failure here means she has to reconnect by hand. */
function getDriveToken(interactive){
  return new Promise(async (res,rej)=>{
    if(driveToken && Date.now() < driveTokenExp - 60000) return res(driveToken);
    if(!SECRETS.google_client_id) return rej(new Error('no client id'));
    try{ await loadGIS(); }catch(e){ return rej(e); }

    if(!tokenClient){
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: SECRETS.google_client_id, scope: DRIVE_SCOPE, callback: ()=>{}
      });
    }
    tokenClient.callback = (r)=>{
      if(r && r.access_token){
        driveToken = r.access_token;
        driveTokenExp = Date.now() + (Number(r.expires_in||3600) * 1000);
        res(driveToken);
      } else rej(new Error(r && r.error ? r.error : 'no token'));
    };
    tokenClient.error_callback = (e)=>rej(new Error(e && e.type ? e.type : 'auth failed'));
    try{ tokenClient.requestAccessToken({prompt: interactive ? '' : 'none'}); }
    catch(e){ rej(e); }
  });
}

async function driveUpload(token){
  const data = await buildBackup();
  const body = backupBlob(data);
  const meta = { name: 'macro-backup.json', mimeType: 'application/json' };

  // update the same file when we already own one, so Drive holds one current backup
  if(SECRETS.drive_file_id){
    const r = await fetch(`${DRIVE_UPLOAD}/${SECRETS.drive_file_id}?uploadType=media`, {
      method:'PATCH', headers:{Authorization:'Bearer '+token, 'Content-Type':'application/json'}, body
    });
    if(r.ok) return SECRETS.drive_file_id;
    if(r.status !== 404) throw new Error('drive patch '+r.status);
    SECRETS.drive_file_id = '';        // someone deleted it in Drive; fall through and recreate
  }

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(meta)], {type:'application/json'}));
  form.append('file', body);
  const r = await fetch(`${DRIVE_UPLOAD}?uploadType=multipart&fields=id`, {
    method:'POST', headers:{Authorization:'Bearer '+token}, body:form
  });
  if(!r.ok) throw new Error('drive create '+r.status);
  return (await r.json()).id;
}

async function backupToDrive(interactive){
  if(!SECRETS.google_client_id) return false;
  try{
    const token = await getDriveToken(interactive);
    SECRETS.drive_file_id = await driveUpload(token);
    SECRETS.drive_last_backup = Date.now();
    await saveSecrets();
    renderBackupStatus();
    if(interactive) showToast(t('drive_saved'));
    return true;
  }catch(e){
    console.warn('drive backup failed', e);
    renderBackupStatus(interactive ? t('drive_failed') : t('drive_reconnect'));
    return false;
  }
}

async function markBackedUp(){
  SECRETS.drive_last_backup = Date.now();
  await saveSecrets(); renderBackupStatus();
}

function renderBackupStatus(override){
  const el = document.getElementById('backupStatus'); if(!el) return;
  if(override){ el.textContent = override; return; }
  const last = SECRETS.drive_last_backup;
  if(!SECRETS.google_client_id && !last){ el.textContent = t('drive_off'); return; }
  if(!last){ el.textContent = t('drive_never'); return; }
  const d = new Date(last);
  const z = n => String(n).padStart(2,'0');
  el.textContent = t('drive_ok', {d:`${z(d.getDate())}/${z(d.getMonth()+1)} ${z(d.getHours())}:${z(d.getMinutes())}`});
}

/* Runs on open: silent renewal only, throttled to once a day. If the token has expired
   it fails quietly and the nudge below tells her to reconnect. */
async function maybeAutoBackup(){
  if(!SECRETS.google_client_id) return nudgeIfStale();
  if(Date.now() - (SECRETS.drive_last_backup||0) < BACKUP_INTERVAL_MS) return;
  const ok = await backupToDrive(false);
  if(!ok) nudgeIfStale();
}

function nudgeIfStale(){
  const last = SECRETS.drive_last_backup || 0;
  if(!FOODS.length) return;
  const days = Math.floor((Date.now()-last)/(24*60*60*1000));
  if(last && days < STALE_BACKUP_DAYS) return;
  if(!last && !SECRETS.google_client_id) return;   // never set up; don't nag on first run
  showToast(t('backup_stale',{n:days}), t('share_export'), shareBackup);
}

/* ---------------- event wiring ---------------- */
function wire(){
  // iOS Safari shows :active press states only when a touch listener exists
  document.addEventListener('touchstart', ()=>{}, {passive:true});
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
    if(e.target.closest('[data-addq]')){
      const q = document.getElementById('search').value.trim();
      openFood(null);
      document.getElementById(/[֐-׿]/.test(q) ? 'fName' : 'fNameEn').value = q;
      foodSnapshot = foodFormState();
      return;
    }
    const tile = e.target.closest('.tile'); if(!tile) return;
    if(longFired){ longFired=false; return; }
    if(editMode){ openFood(FMAP[tile.dataset.id]); return; }
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
  document.getElementById('dayPrev').addEventListener('click', async ()=>{ curDate=shiftDate(curDate,-1); await loadDay(curDate); renderDay(); });
  document.getElementById('dayNext').addEventListener('click', async ()=>{ if(curDate>=todayStr())return; curDate=shiftDate(curDate,1); await loadDay(curDate); renderDay(); });

  document.getElementById('btnAdd').addEventListener('click', ()=>openFood(null));
  document.getElementById('btnSettings').addEventListener('click', openSettings);
  document.getElementById('btnSaveFood').addEventListener('click', saveFoodFromSheet);
  document.getElementById('btnDeleteFood').addEventListener('click', deleteFood);
  document.getElementById('scrim').addEventListener('click', closeUnlessDirty);
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click', ()=>closeSheets()));
  document.addEventListener('keydown', e=>{ if(e.key==='Escape' && SHEET.el) closeUnlessDirty(); });
  document.querySelectorAll('.sheet').forEach(wireSheetDrag);

  // tiles have a visible alternative to long-press: an Edit mode
  document.getElementById('btnEdit').addEventListener('click', ()=>{
    editMode = !editMode;
    document.getElementById('tiles').classList.toggle('is-editing', editMode);
    document.getElementById('btnEdit').textContent = t(editMode?'done':'edit');
  });

  // large title hands over to the compact title once it scrolls under the bar
  const nav = document.getElementById('nav');
  new IntersectionObserver(([en])=>nav.classList.toggle('is-scrolled', !en.isIntersecting),
    { rootMargin:'-60px 0px 0px 0px' }).observe(document.getElementById('dateLabel'));

  document.getElementById('pasteBox').addEventListener('input', e=>{
    const {kcal,protein} = parsePaste(e.target.value);
    if(kcal!=null && !document.getElementById('fKcal').value) document.getElementById('fKcal').value=kcal;
    if(protein!=null && !document.getElementById('fProtein').value) document.getElementById('fProtein').value=protein;
  });

  document.getElementById('sKcal').addEventListener('change', async e=>{ SETTINGS.target_kcal=Math.max(1,parseInt(e.target.value)||DEFAULT_KCAL); await saveSettings(); render(); });
  document.getElementById('sProtein').addEventListener('change', async e=>{ SETTINGS.target_protein_g=Math.max(1,parseInt(e.target.value)||DEFAULT_PROTEIN); await saveSettings(); render(); });
  document.getElementById('sLang').addEventListener('change', async e=>{ LANG=e.target.value; applyLang(LANG); await saveSettings(); render(); });
  document.getElementById('btnExport').addEventListener('click', exportBackup);
  document.getElementById('btnShare').addEventListener('click', shareBackup);
  document.getElementById('btnImport').addEventListener('click', ()=>document.getElementById('importFile').click());
  document.getElementById('importFile').addEventListener('change', e=>{ if(e.target.files[0]) importBackup(e.target.files[0]); e.target.value=''; });

  // ask about a dish
  document.getElementById('btnAsk').addEventListener('click', askAboutFood);
  document.getElementById('askBox').addEventListener('keydown', e=>{
    if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); askAboutFood(); }
  });

  // photo → ingredient breakdown
  document.getElementById('btnPhoto').addEventListener('click', ()=>document.getElementById('dishPhoto').click());
  document.getElementById('dishPhoto').addEventListener('change', e=>{
    if(e.target.files[0]) analyseDishPhoto(e.target.files[0]);
    e.target.value='';   // so re-picking the same photo fires change again
  });

  // secrets: stored on this device only, never exported
  document.getElementById('sApiKey').addEventListener('change', async e=>{
    const v = e.target.value.trim();
    SECRETS.anthropic_key = v; await saveSecrets();
    applyAskAvailability(); showToast(t(v ? 'key_saved' : 'key_cleared'));
  });
  document.getElementById('sModel').addEventListener('change', async e=>{
    SECRETS.model = e.target.value.trim() || DEFAULT_MODEL; await saveSecrets();
  });
  document.getElementById('sGoogleId').addEventListener('change', async e=>{
    SECRETS.google_client_id = e.target.value.trim();
    driveToken=''; driveTokenExp=0; tokenClient=null;   // force a fresh consent on the new id
    await saveSecrets(); renderBackupStatus();
  });
  document.getElementById('btnDrive').addEventListener('click', ()=>backupToDrive(true));

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
