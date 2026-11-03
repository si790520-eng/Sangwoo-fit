/* 핏로그 — 운동 기록 PWA (localStorage) */
(() => {
'use strict';
const KEY = 'fitlog.v1';
const $ = (s, el = document) => el.querySelector(s);
const app = $('#app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const r1 = n => Math.round(n * 10) / 10;
const fmt = n => r1(n).toLocaleString('ko-KR');
const DAYS = ['일','월','화','수','목','금','토'];

// ───────── 날짜
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const todayStr = () => ymd(new Date());
const parseD = s => new Date(s + 'T00:00:00');
const addDays = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return ymd(d); };
const labelD = s => { const d = parseD(s); return `${d.getMonth()+1}월 ${d.getDate()}일 (${DAYS[d.getDay()]})`; };
const shortD = s => { const d = parseD(s); return `${d.getMonth()+1}/${d.getDate()}`; };

// ───────── 저장소
const MEALS = ['아침', '점심', '저녁', '간식'];
const isObj = o => o && typeof o === 'object' && !Array.isArray(o);
const isDate = k => /^\d{4}-\d{2}-\d{2}$/.test(k);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
function emptyDb() { return { version: 2, workouts: {}, custom: [], meals: {}, weights: {}, profile: {}, customFoods: [], favFoods: [], lastAmt: {}, meta: {} }; }
function validDb(d) {
  if (!isObj(d)) return false;
  if (d.workouts === undefined && d.meals === undefined && d.weights === undefined) return false;
  if (d.workouts !== undefined) {
    if (!isObj(d.workouts)) return false;
    for (const [k, v] of Object.entries(d.workouts)) {
      if (!isDate(k) || !Array.isArray(v)) return false;
      for (const it of v) if (!it || typeof it.exId !== 'string' || !Array.isArray(it.sets)) return false;
    }
  }
  if (d.meals !== undefined) {
    if (!isObj(d.meals)) return false;
    for (const [k, v] of Object.entries(d.meals)) {
      if (!isDate(k) || !Array.isArray(v)) return false;
      for (const it of v) if (!it || typeof it.name !== 'string') return false;
    }
  }
  if (d.weights !== undefined && !isObj(d.weights)) return false;
  if (d.custom && !Array.isArray(d.custom)) return false;
  return true;
}
const nz = v => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : 0; };
function normEntry(it) {
  return { id: String(it.id || uid()), meal: MEALS.includes(it.meal) ? it.meal : '간식', name: String(it.name).slice(0, 60), serving: String(it.serving || '1회').slice(0, 40),
    qty: nz(it.qty) || 1, kcal: nz(it.kcal), protein: nz(it.protein), carbs: nz(it.carbs), fat: nz(it.fat), foodId: it.foodId ? String(it.foodId) : undefined,
    g: nz(it.g) || undefined, amt: isObj(it.amt) ? { ...(it.amt.p != null ? { p: nz(it.amt.p), n: nz(it.amt.n) || 1 } : {}) } : undefined };
}
function normalize(d) {
  const out = emptyDb();
  out.custom = (d.custom || []).filter(c => c && c.id && c.name);
  out.meta = isObj(d.meta) ? d.meta : {};
  for (const [k, v] of Object.entries(d.workouts || {})) {
    const items = v.map(it => ({ exId: it.exId, sets: it.sets.map(s => ({ w: num(s.w), r: num(s.r) })) }));
    if (items.length) out.workouts[k] = items;
  }
  for (const [k, v] of Object.entries(d.meals || {})) { const items = v.map(normEntry); if (items.length) out.meals[k] = items; }
  for (const [k, v] of Object.entries(d.weights || {})) { const n = Number(v); if (isDate(k) && n >= 20 && n <= 400) out.weights[k] = n; }
  if (isObj(d.profile)) out.profile = d.profile;
  // 직접입력 음식: 새 방식(100g당 k/p/c/f + 분량) 또는 예전 방식(1회 제공량당 kcal/protein…)을 모두 그대로 보존
  out.customFoods = (Array.isArray(d.customFoods) ? d.customFoods : []).filter(f => f && f.id && f.name).map(f => f.k != null
    ? { id: String(f.id), name: String(f.name), cat: '내 음식', custom: true, k: nz(f.k), p: nz(f.p), c: nz(f.c), f: nz(f.f), unit: 'g', src: '직접 입력', srcName: String(f.srcName || ''), state: '',
        por: (Array.isArray(f.por) ? f.por : []).filter(p => Array.isArray(p) && p[1] > 0).map(p => [String(p[0]).slice(0, 30), nz(p[1])]) }
    : { id: String(f.id), name: String(f.name), serving: String(f.serving || '1회'), kcal: nz(f.kcal), protein: nz(f.protein), carbs: nz(f.carbs), fat: nz(f.fat), cat: '내 음식', custom: true });
  out.lastAmt = {};
  for (const [k, v] of Object.entries(isObj(d.lastAmt) ? d.lastAmt : {})) if (isObj(v) && nz(v.g) > 0) out.lastAmt[k] = v.p != null ? { p: nz(v.p), n: nz(v.n) || 1, g: nz(v.g) } : { g: nz(v.g) };
  out.favFoods = (Array.isArray(d.favFoods) ? d.favFoods : []).filter(x => typeof x === 'string');
  return out;
}
function num(v) { if (v === '' || v == null) return null; const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : null; }
function load() {
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (validDb(d)) return normalize(d); } catch (e) {}
  return emptyDb();
}
let db = load();
function save() {
  for (const k of Object.keys(db.workouts)) if (!db.workouts[k].length) delete db.workouts[k];
  for (const k of Object.keys(db.meals)) if (!db.meals[k].length) delete db.meals[k];
  localStorage.setItem(KEY, JSON.stringify(db));
}

// ───────── 운동 라이브러리
const allEx = () => [...window.EXERCISES, ...db.custom];
const exById = id => allEx().find(e => e.id === id) || { id, name: '알 수 없는 운동', group: '기타', equip: '', type: 'weight', inc: 2.5, range: [8, 12], custom: true };
const unitR = ex => ex.type === 'time' ? '초' : '회';

// ───────── 지표 계산
const epley = (w, r) => r <= 1 ? w : w * (1 + r / 30);
function metrics(ex, sets) {
  const v = (sets || []).filter(s => s.r > 0);
  if (!v.length) return null;
  const w = s => s.w || 0;
  const top = Math.max(...v.map(w));
  const topReps = Math.max(...v.filter(s => w(s) === top).map(s => s.r));
  return {
    sets: v.length,
    volume: v.reduce((a, s) => a + w(s) * s.r, 0),
    top, topReps,
    e1rm: top > 0 ? Math.max(...v.map(s => epley(w(s), s.r))) : 0,
    totalReps: v.reduce((a, s) => a + s.r, 0),
    bestReps: Math.max(...v.map(s => s.r)),
  };
}
// 종목별 표시 지표
function metricDefs(ex, m) {
  if (ex.type === 'time') return [
    { k: 'bestReps', lbl: '최고 시간', u: '초' },
    { k: 'totalReps', lbl: '총 시간', u: '초' }];
  if (ex.type === 'bw') {
    const d = [{ k: 'totalReps', lbl: '총 횟수', u: '회' }, { k: 'bestReps', lbl: '최고 횟수', u: '회' }];
    if (m && m.top > 0) d.push({ k: 'top', lbl: '최고 추가중량', u: 'kg' }, { k: 'volume', lbl: '볼륨(추가중량)', u: 'kg' });
    return d;
  }
  return [
    { k: 'volume', lbl: '총 볼륨', u: 'kg' },
    { k: 'top', lbl: '최고 중량', u: 'kg' },
    { k: 'topReps', lbl: '최고 중량 횟수', u: '회' },
    { k: 'e1rm', lbl: '예상 1RM', u: 'kg' }];
}
// 향상 여부 판단 기준 지표
const keyMetrics = ex => ex.type === 'time' ? ['bestReps', 'totalReps'] : ex.type === 'bw' ? ['totalReps', 'bestReps', 'top'] : ['e1rm', 'volume'];

function sessionsFor(exId) {
  const ex = exById(exId), out = [];
  for (const date of Object.keys(db.workouts).sort()) {
    const it = db.workouts[date].find(i => i.exId === exId);
    if (!it) continue;
    const m = metrics(ex, it.sets);
    if (m) out.push({ date, sets: it.sets.filter(s => s.r > 0), m });
  }
  return out;
}
function prevSession(exId, date) {
  const s = sessionsFor(exId).filter(x => x.date < date);
  return s.length ? s[s.length - 1] : null;
}
function isPlateau(exId, date) {
  const ex = exById(exId);
  const s = sessionsFor(exId).filter(x => x.date <= date);
  if (s.length < 4 || s[s.length - 1].date !== date) return false;
  const win = s.slice(-3), before = s.slice(0, -3);
  return keyMetrics(ex).every(k => {
    const best = Math.max(...before.map(x => x.m[k]));
    return win.every(x => x.m[k] <= best + 1e-9);
  });
}
function isPR(exId, date, m) {
  const ex = exById(exId);
  const prev = sessionsFor(exId).filter(x => x.date < date);
  if (!prev.length || !m) return false;
  const k = keyMetrics(ex)[0];
  return m[k] > Math.max(...prev.map(x => x.m[k])) + 1e-9;
}
function nextTarget(ex, m) {
  if (!m) return null;
  const [lo, hi] = ex.range || [8, 12];
  const inc = ex.inc ?? 2.5;
  if (ex.type === 'time') return `${m.bestReps + 5}초 버티기 (+5초)`;
  if (ex.type === 'bw' && m.top === 0) {
    if (m.bestReps >= hi && inc > 0) return `추가 중량 ${inc}kg 달고 ${lo}회 (또는 ${m.bestReps + 1}회)`;
    return `${m.bestReps + 1}회 (+1회)`;
  }
  if (m.topReps >= hi && inc > 0) return `${fmt(m.top + inc)}kg × ${lo}회 (무게 +${inc}kg)`;
  return `${fmt(m.top)}kg × ${m.topReps + 1}회 (+1회)`;
}
const setsText = (ex, sets) => sets.map(s => ex.type === 'weight' || (s.w || 0) > 0 ? `${fmt(s.w || 0)}×${s.r}` : `${s.r}${unitR(ex)}`).join(' · ');

function deltaHtml(d, u) {
  const v = r1(d);
  if (v > 0) return `<span class="d up">▲ +${fmt(v)}${u}</span>`;
  if (v < 0) return `<span class="d down">▼ ${fmt(v)}${u}</span>`;
  return `<span class="d same">– 0${u}</span>`;
}
function message(ex, cur, prev) {
  const sign = n => (n > 0 ? '+' : '') + fmt(n);
  if (ex.type === 'weight') {
    const dTop = r1(cur.top - prev.top), dv = r1(cur.volume - prev.volume), dr = cur.topReps - prev.topReps, de = r1(cur.e1rm - prev.e1rm);
    const p = [];
    if (dTop > 0) p.push(`최고 중량 ${sign(dTop)}kg`);
    if (dv > 0) p.push(`볼륨 ${sign(dv)}kg`);
    if (dTop === 0 && dr > 0) p.push(`같은 무게로 ${dr}회 더`);
    if (!p.length && de > 0) p.push(`예상 1RM ${sign(de)}kg`);
    if (p.length) return { cls: '', text: `지난번보다 ${p.join(', ')}, 잘했어요! 💪` };
    if (dv === 0 && dTop === 0 && dr === 0) return { cls: 'neutral', text: '지난번과 똑같아요. 다음엔 1회만 더 도전해 봐요!' };
    return { cls: 'down', text: `지난번보다 볼륨 ${sign(dv)}kg. 컨디션이 안 좋은 날도 있어요, 꾸준함이 최고예요 🙂` };
  }
  const u = unitR(ex);
  const dt = cur.totalReps - prev.totalReps, db_ = cur.bestReps - prev.bestReps, dw = r1(cur.top - prev.top);
  const p = [];
  if (dw > 0) p.push(`추가 중량 ${sign(dw)}kg`);
  if (dt > 0) p.push(`총 ${sign(dt)}${u}`);
  if (db_ > 0) p.push(`최고 ${sign(db_)}${u}`);
  if (p.length) return { cls: '', text: `지난번보다 ${p.join(', ')}, 잘했어요! 💪` };
  if (dt === 0 && db_ === 0 && dw === 0) return { cls: 'neutral', text: `지난번과 똑같아요. 다음엔 ${ex.type === 'time' ? '5초' : '1회'}만 더 도전해 봐요!` };
  return { cls: 'down', text: `지난번보다 총 ${sign(dt)}${u}. 컨디션 조절도 훈련이에요, 다음에 다시 올려봐요 🙂` };
}

// ───────── 토스트 / 시트
let toastT;
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.remove('hidden'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.add('hidden'), 2200); }
function openSheet(html, onMount) { $('#sheetBody').innerHTML = html; $('#sheet').classList.remove('hidden'); onMount && onMount($('#sheetBody')); }
function closeSheet() { $('#sheet').classList.add('hidden'); $('#sheetBody').innerHTML = ''; }
$('.sheet-backdrop').addEventListener('click', closeSheet);

// ───────── 라우팅
let curDate = todayStr();
let histMode = 'date';
let guideFilter = '전체', guideQuery = '';
let chartMetric = {};
function go(h) { if (location.hash === h) route(); else location.hash = h; }
window.addEventListener('hashchange', route);
document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => go('#/' + b.dataset.tab)));
$('#backBtn').addEventListener('click', () => { if (history.length > 1) history.back(); else go('#/guide'); });

function route() {
  const parts = (location.hash || '#/log').slice(2).split('/');
  const tab = parts[0] || 'log';
  const tabFor = tab === 'ex' ? (parts[2] === 'guide' ? 'guide' : 'history') : tab === 'weight' ? 'diet' : tab === 'evidence' ? 'settings' : tab;
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tabFor));
  $('#backBtn').classList.toggle('hidden', tab !== 'ex' && tab !== 'weight' && tab !== 'evidence');
  window.scrollTo(0, 0);
  if (tab === 'history') return renderHistory();
  if (tab === 'diet') return renderDiet();
  if (tab === 'weight') return renderWeightPage();
  if (tab === 'guide') return renderGuide();
  if (tab === 'settings') return renderSettings();
  if (tab === 'evidence') return renderEvidence();
  if (tab === 'ex') return renderExercise(decodeURIComponent(parts[1] || ''), parts[2] || 'records');
  return renderLog();
}
const setTitle = t => { $('#title').textContent = t; document.title = t + ' · 핏로그'; };

// ───────── 기록 화면
function renderLog() {
  setTitle(curDate === todayStr() ? '오늘' : '하루 기록');
  const items = db.workouts[curDate] || [];
  app.innerHTML = `
    ${dateBarHtml()}
    <div id="todayDiet"></div>
    <h3 class="sec-h">🏋️ 운동</h3>
    <div id="daySum"></div>
    <div id="exList">${items.map((it, i) => exCard(it, i)).join('')}</div>
    ${items.length ? '' : `<div class="empty" style="padding:18px"><p style="margin:0">아직 운동 기록이 없어요. 아래 버튼으로 추가해 보세요!</p></div>`}
    <button class="btn primary block" id="addEx" style="min-height:56px;font-size:17px">＋ 운동 추가</button>`;
  renderDaySum();
  bindDateBar(renderLog);
  $('#todayDiet').innerHTML = todayDietHtml();
  $('#todayDiet').onclick = e => { if (e.target.closest('[data-go]')) go(e.target.closest('[data-go]').dataset.go); };
  $('#addEx').onclick = () => openPicker(id => addExercise(id));
  bindCards();
}
function renderDaySum() {
  const el = $('#daySum'); if (!el) return;
  const items = db.workouts[curDate] || [];
  let sets = 0, vol = 0;
  items.forEach(it => { const m = metrics(exById(it.exId), it.sets); if (m) { sets += m.sets; vol += m.volume; } });
  el.innerHTML = items.length ? `<div class="stat-grid">
    <div class="stat"><b>${items.length}</b><span>종목</span></div>
    <div class="stat"><b>${sets}</b><span>세트</span></div>
    <div class="stat"><b>${fmt(vol)}</b><span>총 볼륨(kg)</span></div></div>` : '';
}
function exCard(it, i) {
  const ex = exById(it.exId);
  const prev = prevSession(it.exId, curDate);
  const ph = k => prev && prev.sets[k] ? prev.sets[k] : (prev ? prev.sets[prev.sets.length - 1] : null);
  const wLbl = ex.type === 'weight' ? 'kg' : '추가 kg';
  const rows = it.sets.map((s, k) => {
    const p = ph(k);
    return `<div class="set-row" data-k="${k}">
      <div class="set-no">${k + 1}</div>
      <input inputmode="decimal" type="number" step="0.5" min="0" data-f="w" value="${s.w ?? ''}" placeholder="${p ? fmt(p.w || 0) : (ex.type === 'weight' ? 'kg' : '0')}" aria-label="${k + 1}세트 중량">
      <input inputmode="numeric" type="number" step="1" min="0" data-f="r" value="${s.r ?? ''}" placeholder="${p ? p.r : unitR(ex)}" aria-label="${k + 1}세트 ${unitR(ex)}">
      <button class="mini dup" data-act="dup" aria-label="세트 복사">복사</button>
      <button class="mini del" data-act="del" aria-label="세트 삭제">✕</button>
    </div>`;
  }).join('');
  return `<section class="card ex-card" data-i="${i}" data-ex="${esc(it.exId)}">
    <div class="ex-head">
      <div><h2 class="ex-name"><button data-act="open">${esc(ex.name)} ›</button></h2>
        <div style="margin-top:4px"><span class="tag">${esc(ex.group)}</span>${ex.equip ? `<span class="tag">${esc(ex.equip)}</span>` : ''}${ex.rec ? `<span class="tag">권장 ${esc(ex.rec.reps)}</span>` : ''}</div></div>
      <button class="mini del" data-act="rmEx" aria-label="운동 삭제" style="width:44px">🗑</button>
    </div>
    ${it.sets.length ? `<div class="set-row hdr"><div style="text-align:center">세트</div><div style="text-align:center">${wLbl}</div><div style="text-align:center">${unitR(ex)}</div><div></div><div></div></div>` : ''}
    <div class="rows">${rows}</div>
    <div class="actions">
      <button class="btn sm" data-act="add">＋ 세트 추가</button>
      ${prev && !it.sets.some(s => s.r > 0) ? `<button class="btn sm" data-act="loadPrev">↺ 지난번 그대로</button>` : ''}
    </div>
    <div class="cmp" id="cmp-${i}">${cmpHtml(it)}</div>
  </section>`;
}
function cmpHtml(it) {
  const ex = exById(it.exId);
  const cur = metrics(ex, it.sets);
  const prev = prevSession(it.exId, curDate);
  const target = nextTarget(ex, cur || (prev && prev.m));
  let h = '';
  if (!prev) {
    h += `<div class="msg neutral">${cur ? '첫 기록이에요! 🎉 다음 번부터 지난번과 비교해 드릴게요.' : '이 운동의 첫 기록이에요. 세트를 입력해 보세요!'}</div>`;
  } else {
    h += `<div class="prev-sets">지난번 (${shortD(prev.date)}): ${esc(setsText(ex, prev.sets))}</div>`;
    if (!cur) {
      h += `<div class="msg neutral">세트를 입력하면 지난번과 바로 비교해 드려요.</div>`;
    } else {
      const defs = metricDefs(ex, cur.top > 0 || prev.m.top > 0 ? { top: 1 } : cur);
      h += `<div class="metrics">${defs.map(d => `<div class="metric"><div class="lbl">${d.lbl}</div><div class="val">${fmt(cur[d.k])}${d.u}${deltaHtml(cur[d.k] - prev.m[d.k], d.u)}</div></div>`).join('')}</div>`;
      const msg = message(ex, cur, prev.m);
      h += `<div class="msg ${msg.cls}">${msg.text}${isPR(it.exId, curDate, cur) ? '<span class="pr">🏆 PR</span>' : ''}</div>`;
      if (isPlateau(it.exId, curDate)) h += `<div class="plateau">⚠️ 최근 3번 동안 기록이 제자리예요. 무게를 10% 정도 낮춰(디로드) 횟수를 채운 뒤 다시 올리거나, 반복 범위를 바꿔 보세요. 수면·식사도 점검해 봐요.</div>`;
    }
  }
  if (target) h += `<div class="target">🎯 ${cur ? '다음 목표' : '오늘 목표'}: <b>${esc(target)}</b></div>`;
  return h;
}
function bindCards() {
  document.querySelectorAll('.ex-card').forEach(card => {
    const i = +card.dataset.i;
    const item = () => db.workouts[curDate][i];
    card.addEventListener('input', e => {
      const inp = e.target; if (!inp.dataset.f) return;
      const k = +inp.closest('.set-row').dataset.k;
      item().sets[k][inp.dataset.f] = num(inp.value);
      save();
      $('#cmp-' + i).innerHTML = cmpHtml(item());
      renderDaySum();
    });
    card.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const act = b.dataset.act, it = item();
      const row = b.closest('.set-row'), k = row ? +row.dataset.k : -1;
      if (act === 'open') return go('#/ex/' + encodeURIComponent(it.exId) + '/records');
      if (act === 'rmEx') {
        if (it.sets.some(s => s.r > 0) && !confirm(`${exById(it.exId).name} 기록을 삭제할까요?`)) return;
        db.workouts[curDate].splice(i, 1); save(); renderLog(); return toast('삭제했어요');
      }
      if (act === 'add') { const last = it.sets[it.sets.length - 1]; it.sets.push(last ? { ...last } : { w: null, r: null }); }
      if (act === 'dup') it.sets.splice(k + 1, 0, { ...it.sets[k] });
      if (act === 'del') it.sets.splice(k, 1);
      if (act === 'loadPrev') { const p = prevSession(it.exId, curDate); if (p) it.sets = p.sets.map(s => ({ w: s.w, r: s.r })); toast('지난번 세트를 불러왔어요. 수정해서 쓰세요!'); }
      save(); renderLog();
      if (act === 'add') { const rows = $(`.ex-card[data-i="${i}"]`).querySelectorAll('.set-row[data-k]'); const inp = rows[rows.length - 1]?.querySelector('input[data-f="r"]'); inp && inp.focus(); }
    });
  });
}
function addExercise(id) {
  const items = db.workouts[curDate] || (db.workouts[curDate] = []);
  let i = items.findIndex(x => x.exId === id);
  if (i < 0) { items.push({ exId: id, sets: [{ w: null, r: null }] }); i = items.length - 1; save(); }
  else toast('이미 추가된 운동이에요');
  closeSheet();
  if (!location.hash.startsWith('#/log') && location.hash) { location.hash = '#/log'; } else renderLog();
  setTimeout(() => { const c = $(`.ex-card[data-i="${i}"]`); c && c.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50);
}

// ───────── 운동 선택 시트
function recentIds() {
  const seen = [];
  for (const d of Object.keys(db.workouts).sort().reverse()) for (const it of db.workouts[d]) if (!seen.includes(it.exId)) seen.push(it.exId);
  return seen;
}
function exListHtml(list, sub) {
  return list.map(ex => `<button class="list-item" data-id="${esc(ex.id)}"><div><div class="t">${esc(ex.name)}</div><div class="s">${sub(ex)}</div></div><span class="chev">›</span></button>`).join('') || '<div class="empty">찾는 운동이 없어요.</div>';
}
function filterEx(q, g) {
  const rec = recentIds();
  let list = g === '최근' ? rec.map(exById).filter(e => !e.name.startsWith('알 수 없는')) : allEx();
  if (g !== '전체' && g !== '최근') list = list.filter(e => e.group === g);
  if (q) { const s = q.toLowerCase().replace(/\s/g, ''); list = list.filter(e => (e.name + (e.en || '') + e.group + (e.primary || '')).toLowerCase().replace(/\s/g, '').includes(s)); }
  return list;
}
function openPicker(onPick) {
  let g = recentIds().length ? '최근' : '전체', q = '';
  const chips = ['최근', '전체', ...window.GROUPS, '기타'];
  openSheet(`<h2>운동 선택</h2>
    <input class="search" id="pq" placeholder="운동 이름 검색 (예: 벤치)" autocomplete="off">
    <div class="chips" id="pc"></div>
    <div id="pl"></div>
    <button class="btn block" id="pcustom" style="margin-top:6px">✏️ 목록에 없는 운동 직접 추가</button>`, body => {
    const draw = () => {
      $('#pc', body).innerHTML = chips.map(c => `<button class="chip ${c === g ? 'on' : ''}" data-c="${c}">${c}</button>`).join('');
      $('#pl', body).innerHTML = exListHtml(filterEx(q, g), ex => {
        const p = prevSession(ex.id, '9999-12-31');
        return `${esc(ex.group)}${ex.equip ? ' · ' + esc(ex.equip) : ''}${p ? ` · 최근 ${shortD(p.date)} ${esc(setsText(ex, p.sets.slice(0, 1)))}` : ''}`;
      });
    };
    draw();
    $('#pq', body).addEventListener('input', e => { q = e.target.value.trim(); if (q && g === '최근') g = '전체'; draw(); });
    $('#pc', body).addEventListener('click', e => { const c = e.target.closest('[data-c]'); if (c) { g = c.dataset.c; draw(); } });
    $('#pl', body).addEventListener('click', e => { const b = e.target.closest('[data-id]'); if (b) onPick(b.dataset.id); });
    $('#pcustom', body).onclick = () => openCustomForm(onPick, q);
  });
}
function openCustomForm(onPick, name = '') {
  openSheet(`<h2>운동 직접 추가</h2>
    <div class="field"><label>운동 이름</label><input id="cn" value="${esc(name)}" placeholder="예: 스미스머신 스쿼트" maxlength="40"></div>
    <div class="field"><label>부위</label><select id="cg">${[...window.GROUPS, '기타'].map(g => `<option>${g}</option>`).join('')}</select></div>
    <div class="field"><label>기록 방식</label><select id="ct">
      <option value="weight">중량 × 횟수 (kg)</option><option value="bw">맨몸 횟수 (+추가중량)</option><option value="time">시간 (초)</option></select></div>
    <div class="row"><button class="btn ghost" id="cc" style="flex:1">취소</button><button class="btn primary" id="cs" style="flex:2">추가하기</button></div>`, body => {
    $('#cc', body).onclick = closeSheet;
    $('#cs', body).onclick = () => {
      const n = $('#cn', body).value.trim();
      if (!n) return toast('운동 이름을 입력해 주세요');
      if (allEx().some(e => e.name === n)) return toast('같은 이름의 운동이 이미 있어요');
      const ex = { id: 'c_' + Date.now().toString(36), name: n, group: $('#cg', body).value, equip: '직접 추가', type: $('#ct', body).value, inc: 2.5, range: [8, 12], custom: true };
      db.custom.push(ex); save(); toast('새 운동을 추가했어요');
      onPick(ex.id);
    };
  });
}

// ───────── 히스토리
function renderHistory() {
  setTitle('히스토리');
  const dates = Object.keys(db.workouts).sort().reverse();
  const allDates = [...new Set([...dates, ...Object.keys(db.meals), ...Object.keys(db.weights)])].sort().reverse();
  const now = new Date(), wk = addDays(todayStr(), -((now.getDay() + 6) % 7)), mo = todayStr().slice(0, 8) + '01';
  app.innerHTML = `<div class="stat-grid">
      <div class="stat"><b>${dates.filter(d => d >= wk && d <= todayStr()).length}</b><span>이번 주</span></div>
      <div class="stat"><b>${dates.filter(d => d >= mo && d <= todayStr()).length}</b><span>이번 달</span></div>
      <div class="stat"><b>${dates.length}</b><span>총 운동일</span></div></div>
    <div class="seg"><button data-m="date" class="${histMode === 'date' ? 'on' : ''}">날짜별</button><button data-m="ex" class="${histMode === 'ex' ? 'on' : ''}">종목별</button><button data-m="weight" class="${histMode === 'weight' ? 'on' : ''}">체중</button></div>
    <div id="hl"></div>`;
  app.querySelectorAll('.seg button').forEach(b => b.onclick = () => { histMode = b.dataset.m; renderHistory(); });
  const hl = $('#hl');
  if (histMode === 'weight') { hl.innerHTML = weightSectionHtml(); bindWeightSection(hl, renderHistory); return; }
  if (!allDates.length) { hl.innerHTML = `<div class="empty"><div class="big">📈</div><p>운동을 기록하면 여기에 쌓여요.</p></div>`; return; }
  if (histMode === 'date') {
    hl.innerHTML = allDates.map(d => {
      let sets = 0, vol = 0; const names = [];
      (db.workouts[d] || []).forEach(it => { const ex = exById(it.exId); names.push(ex.name); const m = metrics(ex, it.sets); if (m) { sets += m.sets; vol += m.volume; } });
      const t = dayTotals(d);
      return `<button class="list-item" data-d="${d}"><div><div class="t">${labelD(d)}</div>
        ${names.length ? `<div class="s">🏋️ ${esc(names.join(', '))}</div><div class="s">${sets}세트 · 볼륨 ${fmt(vol)}kg</div>` : ''}
        ${t.count ? `<div class="s">🍚 ${fmt(t.kcal)}kcal · 단백질 ${fmt(t.protein)}g</div>` : ''}
        ${db.weights[d] ? `<div class="s">⚖️ ${fmt(db.weights[d])}kg</div>` : ''}</div><span class="chev">›</span></button>`;
    }).join('');
    hl.onclick = e => { const b = e.target.closest('[data-d]'); if (b) { curDate = b.dataset.d; go('#/log'); } };
  } else {
    const ids = recentIds().filter(id => sessionsFor(id).length);
    hl.innerHTML = exListHtml(ids.map(exById), ex => {
      const s = sessionsFor(ex.id), last = s[s.length - 1];
      const best = ex.type === 'weight' ? `최고 ${fmt(Math.max(...s.map(x => x.m.top)))}kg` : `최고 ${Math.max(...s.map(x => x.m.bestReps))}${unitR(ex)}`;
      return `${s.length}회 기록 · ${best} · 최근 ${shortD(last.date)}`;
    });
    hl.onclick = e => { const b = e.target.closest('[data-id]'); if (b) go('#/ex/' + encodeURIComponent(b.dataset.id) + '/records'); };
  }
}

// ───────── 차트 (인라인 SVG)
function chartSvg(pts, unit) {
  const W = 340, H = 190, L = 44, R = 14, T = 16, B = 28;
  const vals = pts.map(p => p.v);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (lo === hi) { lo = lo - Math.max(1, lo * 0.1); hi = hi + Math.max(1, hi * 0.1); }
  const padv = (hi - lo) * 0.12; lo = Math.max(0, lo - padv); hi += padv;
  const x = i => pts.length === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (pts.length - 1);
  const y = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const grid = [0, 0.5, 1].map(f => { const v = lo + (hi - lo) * f; return `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="#2b303b" stroke-dasharray="3 4"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" font-size="10" fill="#9aa3b2">${fmt(v)}</text>`; }).join('');
  const line = pts.map((p, i) => `${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  const area = pts.length > 1 ? `<polygon points="${x(0)},${H - B} ${line} ${x(pts.length - 1)},${H - B}" fill="url(#g)"/>` : '';
  const step = Math.max(1, Math.ceil(pts.length / 5));
  const xl = pts.map((p, i) => (i % step === 0 || i === pts.length - 1) ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" font-size="10" fill="#9aa3b2">${shortD(p.date)}</text>` : '').join('');
  const lastP = pts[pts.length - 1];
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="기록 그래프">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4ade80" stop-opacity=".35"/><stop offset="1" stop-color="#4ade80" stop-opacity="0"/></linearGradient></defs>
    ${grid}${area}
    <polyline points="${line}" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${pts.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.v)}" r="${i === pts.length - 1 ? 5 : 3.5}" fill="${i === pts.length - 1 ? '#4ade80' : '#181b22'}" stroke="#4ade80" stroke-width="2"/>`).join('')}
    <text x="${Math.min(x(pts.length - 1), W - R - 2)}" y="${y(lastP.v) - 10}" text-anchor="end" font-size="11" font-weight="700" fill="#eef1f6">${fmt(lastP.v)}${unit}</text>
    ${xl}</svg>`;
}

// ───────── 종목 상세 (기록 + 운동 방법)
function renderExercise(id, sub) {
  const ex = exById(id);
  setTitle(ex.name);
  const s = sessionsFor(id);
  app.innerHTML = `<div class="seg"><button data-s="records" class="${sub !== 'guide' ? 'on' : ''}">내 기록</button><button data-s="guide" class="${sub === 'guide' ? 'on' : ''}">운동 방법</button></div><div id="exBody"></div>`;
  app.querySelectorAll('.seg button').forEach(b => b.onclick = () => location.replace('#/ex/' + encodeURIComponent(id) + '/' + b.dataset.s));
  const body = $('#exBody');
  if (sub === 'guide') { body.innerHTML = guideHtml(ex); bindGuide(ex); return; }
  if (!s.length) {
    body.innerHTML = `<div class="empty"><div class="big">📝</div><p>아직 ${esc(ex.name)} 기록이 없어요.</p></div><button class="btn primary block" id="addThis">오늘 기록에 추가</button>`;
    $('#addThis').onclick = () => { curDate = todayStr(); addExercise(id); };
    return;
  }
  const opts = ex.type === 'weight' ? [['top', '최고 중량', 'kg'], ['volume', '볼륨', 'kg'], ['e1rm', '예상 1RM', 'kg']]
    : ex.type === 'time' ? [['bestReps', '최고 시간', '초'], ['totalReps', '총 시간', '초']]
    : [['totalReps', '총 횟수', '회'], ['bestReps', '최고 횟수', '회']];
  const mk = opts.find(o => o[0] === chartMetric[id]) ? chartMetric[id] : opts[0][0];
  const o = opts.find(o => o[0] === mk);
  const bestOf = k => Math.max(...s.map(x => x.m[k]));
  const last = s[s.length - 1];
  const tgt = nextTarget(ex, last.m);
  body.innerHTML = `
    <div class="stat-grid">
      ${opts.map(op => `<div class="stat"><b>${fmt(bestOf(op[0]))}</b><span>최고 ${op[1].replace('최고 ', '')}(${op[2]})</span></div>`).join('')}
      ${opts.length < 3 ? `<div class="stat"><b>${s.length}</b><span>기록 횟수</span></div>` : ''}
    </div>
    <div class="seg" id="cm">${opts.map(op => `<button data-k="${op[0]}" class="${op[0] === mk ? 'on' : ''}">${op[1]}</button>`).join('')}</div>
    <div class="chart-wrap">${chartSvg(s.map(x => ({ date: x.date, v: r1(x.m[mk]) })), o[2])}
      ${s.length < 2 ? '<div class="muted small" style="text-align:center">기록이 2번 이상 쌓이면 추세선이 보여요</div>' : ''}</div>
    ${tgt ? `<div class="target" style="margin-bottom:12px">🎯 다음 목표: <b>${esc(tgt)}</b></div>` : ''}
    ${isPlateau(id, last.date) ? `<div class="plateau" style="margin-bottom:12px">⚠️ 최근 3번 동안 제자리예요. 디로드(무게 약 10%↓)나 반복 범위 변경을 시도해 보세요.</div>` : ''}
    <h3 style="font-size:16px;margin:14px 2px 8px">세션 기록</h3>
    ${s.slice().reverse().map((x, j, arr) => {
      const p = arr[j + 1]; const k = keyMetrics(ex)[1] === 'volume' ? 'volume' : keyMetrics(ex)[0];
      const u = k === 'volume' ? 'kg' : unitR(ex);
      return `<button class="list-item" data-d="${x.date}"><div><div class="t">${labelD(x.date)}</div><div class="s">${esc(setsText(ex, x.sets))}</div>
        <div class="s">${k === 'volume' ? '볼륨' : '총'} ${fmt(x.m[k])}${u}${p ? deltaHtml(x.m[k] - p.m[k], u) : ''}</div></div><span class="chev">›</span></button>`;
    }).join('')}
    ${ex.custom && db.custom.some(c => c.id === id) ? '' : ''}`;
  $('#cm').onclick = e => { const b = e.target.closest('[data-k]'); if (b) { chartMetric[id] = b.dataset.k; renderExercise(id, sub); } };
  body.querySelectorAll('.list-item[data-d]').forEach(b => b.onclick = () => { curDate = b.dataset.d; go('#/log'); });
}
function guideHtml(ex) {
  const safety = `<div class="safety">⚠️ <b>안전 안내</b><br>운동 중 날카롭거나 찌르는 통증, 관절 통증, 저림이 느껴지면 즉시 멈추세요. 통증이 계속되면 의사나 물리치료사 등 전문가와 상담하세요. 처음 하는 동작은 가벼운 무게로 자세부터 익히고, 무거운 무게는 보조자나 안전바를 꼭 사용하세요.</div>`;
  if (!ex.steps) return `<div class="card"><p>직접 추가한 운동이라 운동 방법 가이드가 없어요.</p><p class="muted small">트레이너에게 자세를 확인받는 걸 추천해요.</p></div>${safety}
    ${db.custom.some(c => c.id === ex.id) ? '<button class="btn danger block" id="delCustom" style="margin-top:12px">이 운동 목록에서 삭제</button>' : ''}`;
  return `<div class="guide">
    <div class="card">
      <div class="muted small">${esc(ex.en)} · ${esc(ex.group)} · ${esc(ex.equip)}</div>
      <h3 style="margin-top:10px">🎯 타깃 근육</h3>
      <div><b>주동근</b> ${esc(ex.primary)}</div>${ex.secondary ? `<div class="muted"><b>보조근</b> ${esc(ex.secondary)}</div>` : ''}
    </div>
    <div class="card"><h3 style="margin-top:0">📋 권장 세트/횟수</h3>
      <div class="rec"><div><span class="muted small">세트</span><b>${esc(ex.rec.sets)}</b></div><div><span class="muted small">${ex.type === 'time' ? '시간' : '횟수'}</span><b>${esc(ex.rec.reps)}</b></div><div><span class="muted small">휴식</span><b>${esc(ex.rec.rest)}</b></div></div>
      <p class="muted small" style="margin:8px 0 0">마지막 1~2회가 힘들지만 자세는 유지되는 무게가 적당해요. 권장 횟수 상한을 모든 세트에서 채우면 무게를 올려요.</p></div>
    <div class="card"><h3 style="margin-top:0">✅ 동작 순서</h3><ol>${ex.steps.map(t => `<li>${esc(t)}</li>`).join('')}</ol></div>
    <div class="card"><h3 style="margin-top:0">🚫 흔한 실수</h3><ul>${ex.mistakes.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
    ${safety}
    <button class="btn primary block" id="addThis" style="margin-top:12px">오늘 기록에 추가</button></div>`;
}
function bindGuide(ex) {
  const a = $('#addThis'); if (a) a.onclick = () => { curDate = todayStr(); addExercise(ex.id); };
  const d = $('#delCustom'); if (d) d.onclick = () => {
    if (sessionsFor(ex.id).length) return toast('기록이 있는 운동은 삭제할 수 없어요. 기록을 먼저 지워 주세요.');
    for (const k of Object.keys(db.workouts)) db.workouts[k] = db.workouts[k].filter(i => i.exId !== ex.id);
    db.custom = db.custom.filter(c => c.id !== ex.id); save(); toast('삭제했어요'); go('#/guide');
  };
}

// ───────── 운동 방법 목록
function renderGuide() {
  setTitle('운동 방법');
  const chips = ['전체', ...window.GROUPS];
  app.innerHTML = `<input class="search" id="gq" placeholder="운동 검색 (예: 스쿼트, 이두)" value="${esc(guideQuery)}" autocomplete="off"><div class="chips" id="gc"></div><div id="gl"></div>`;
  const draw = () => {
    $('#gc').innerHTML = chips.map(c => `<button class="chip ${c === guideFilter ? 'on' : ''}" data-c="${c}">${c}</button>`).join('');
    $('#gl').innerHTML = exListHtml(filterEx(guideQuery, guideFilter), ex => `${esc(ex.group)} · ${esc(ex.primary || ex.equip || '')}`);
  };
  draw();
  $('#gq').addEventListener('input', e => { guideQuery = e.target.value.trim(); draw(); });
  $('#gc').onclick = e => { const c = e.target.closest('[data-c]'); if (c) { guideFilter = c.dataset.c; draw(); } };
  $('#gl').onclick = e => { const b = e.target.closest('[data-id]'); if (b) go('#/ex/' + encodeURIComponent(b.dataset.id) + '/guide'); };
}

// ───────── 백업
function backupJson() { return JSON.stringify({ app: 'fitlog', exportedAt: new Date().toISOString(), ...db }, null, 2); }
function coachText(days = 14) {
  const from = addDays(todayStr(), -days);
  const lines = [`[핏로그 기록 · 최근 ${days}일]`];
  const t = calcTargets();
  if (t) lines.push(`목표: ${fmt(t.kcal)}kcal · 단백질 ${t.protein}g · 탄수 ${t.carbs}g · 지방 ${t.fat}g${db.profile.goal ? ` (${GOALS[db.profile.goal].lbl})` : ''}`);
  const dates = [...new Set([...Object.keys(db.workouts), ...Object.keys(db.meals), ...Object.keys(db.weights)])].sort().filter(d => d >= from);
  for (const d of dates) {
    lines.push(`\n${d} ${labelD(d).split(' ').pop()}${db.weights[d] ? ` · 체중 ${fmt(db.weights[d])}kg` : ''}`);
    for (const it of db.workouts[d] || []) { const ex = exById(it.exId); const v = it.sets.filter(s => s.r > 0); if (v.length) lines.push(`- ${ex.name}: ${setsText(ex, v)}${ex.type === 'weight' ? ` (볼륨 ${fmt(metrics(ex, v).volume)}kg)` : ''}`); }
    const tot = dayTotals(d);
    if (tot.count) {
      for (const m of MEALS) { const es = (db.meals[d] || []).filter(e => e.meal === m); if (es.length) lines.push(`- ${m}: ${es.map(e => `${e.name}${e.qty !== 1 ? ` ×${fmt(e.qty)}` : ''}(${fmt(e.kcal * e.qty)}kcal, 단 ${fmt(e.protein * e.qty)}g)`).join(', ')}`); }
      lines.push(`  식단 합계: ${fmt(tot.kcal)}kcal · 단 ${fmt(tot.protein)}g · 탄 ${fmt(tot.carbs)}g · 지 ${fmt(tot.fat)}g`);
    }
  }
  if (lines.length <= 2) lines.push('기록 없음');
  return lines.join('\n');
}
async function copy(t) { try { await navigator.clipboard.writeText(t); toast('복사했어요! 붙여넣기 하세요'); } catch (e) { openSheet(`<h2>아래 내용을 복사하세요</h2><textarea readonly>${esc(t)}</textarea><button class="btn block" style="margin-top:10px" onclick="document.querySelector('.sheet-backdrop').click()">닫기</button>`); } }
function renderSettings() {
  setTitle('설정 · 백업');
  const n = Object.keys(db.workouts).length, nm = Object.keys(db.meals).length, nw = Object.keys(db.weights).length;
  const sets = Object.values(db.workouts).flat().reduce((a, it) => a + it.sets.filter(s => s.r > 0).length, 0);
  app.innerHTML = `${profileCardHtml()}
    <div class="card"><h3 style="margin:0 0 6px">💾 데이터 백업</h3>
      <p class="muted small" style="margin:0 0 10px">기록은 이 폰의 브라우저에만 저장돼요. 브라우저 데이터를 지우거나 폰을 바꾸면 사라질 수 있으니 가끔 백업해 주세요.<br>현재: 운동 ${n}일 · ${sets}세트 · 식단 ${nm}일 · 체중 ${nw}회${db.meta.lastBackup ? ` · 마지막 백업 ${labelD(db.meta.lastBackup)}` : ' · 아직 백업 안 함'}</p>
      <button class="btn primary block" id="exp">⬇️ 백업 파일 저장 (JSON)</button>
      <div class="row" style="margin-top:8px"><button class="btn" id="share" style="flex:1">📤 파일 공유</button><button class="btn" id="cpj" style="flex:1">📋 JSON 복사</button></div>
    </div>
    <div class="card"><h3 style="margin:0 0 6px">📥 백업 불러오기</h3>
      <p class="muted small" style="margin:0 0 10px">합치기: 같은 날짜·같은 운동은 백업 내용으로 바뀌고, 식단은 없는 항목만 더해져요. 덮어쓰기: 지금 기록을 모두 지우고 백업으로 바꿔요.</p>
      <input type="file" id="impFile" accept="application/json,.json" class="hidden">
      <div class="row"><button class="btn" id="impMerge" style="flex:1">합치기</button><button class="btn danger" id="impReplace" style="flex:1">덮어쓰기</button></div>
    </div>
    <div class="card"><h3 style="margin:0 0 6px">🤖 코치에게 공유</h3>
      <p class="muted small" style="margin:0 0 10px">최근 2주 운동·식단·체중을 글로 정리해서 복사해요. 코치 봇 채팅에 붙여넣으면 바로 분석받을 수 있어요.</p>
      <button class="btn block" id="coach">📝 최근 2주 기록 텍스트 복사</button>
      <button class="btn block" id="pasteImp" style="margin-top:8px">📋 코치 데이터 붙여넣기</button></div>
    <div class="card"><h3 style="margin:0 0 6px">📱 홈 화면에 추가</h3>
      <p class="small" style="margin:0">아이폰: 사파리 하단 <b>공유</b> → <b>홈 화면에 추가</b><br>안드로이드: 크롬 메뉴(⋮) → <b>홈 화면에 추가</b> 또는 <b>앱 설치</b><br><span class="muted">한 번 열고 나면 인터넷 없이도 동작해요.</span></p></div>
    <button class="btn block" id="evBtn" style="margin-bottom:12px">📚 계산·음식 데이터 근거 (논문·출처)</button>
    <button class="btn danger block" id="wipe">전체 기록 삭제</button>
    <p class="muted small" style="text-align:center;margin-top:16px">핏로그 v3 · 상우님 전용 💪</p>`;
  $('#evBtn').onclick = () => go('#/evidence');
  const fname = () => `fitlog-backup-${todayStr()}.json`;
  const markBackup = () => { db.meta.lastBackup = todayStr(); save(); };
  $('#exp').onclick = () => {
    const url = URL.createObjectURL(new Blob([backupJson()], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = fname(); document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000); markBackup(); toast('백업 파일을 저장했어요'); renderSettings();
  };
  $('#share').onclick = async () => {
    const file = new File([backupJson()], fname(), { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: '핏로그 백업' }); markBackup(); } catch (e) {} }
    else toast('이 브라우저는 파일 공유를 지원하지 않아요. 파일 저장을 이용해 주세요');
  };
  $('#cpj').onclick = () => { copy(backupJson()); markBackup(); };
  $('#coach').onclick = () => copy(coachText());
  $('#pasteImp').onclick = () => openPasteImport();
  bindProfile();
  let mode = 'merge';
  $('#impMerge').onclick = () => { mode = 'merge'; $('#impFile').click(); };
  $('#impReplace').onclick = () => { mode = 'replace'; $('#impFile').click(); };
  $('#impFile').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (!validDb(d)) throw new Error('형식');
      const inc = normalize(d);
      if (mode === 'replace') { if (!confirm('지금 기록을 모두 지우고 백업으로 바꿀까요?')) return; db = inc; }
      else {
        for (const c of inc.custom) if (!db.custom.some(x => x.id === c.id)) db.custom.push(c);
        for (const [date, items] of Object.entries(inc.workouts)) {
          const cur = db.workouts[date] || (db.workouts[date] = []);
          for (const it of items) { const j = cur.findIndex(x => x.exId === it.exId); if (j >= 0) cur[j] = it; else cur.push(it); }
        }
        for (const [date, items] of Object.entries(inc.meals)) {
          const cur = db.meals[date] || (db.meals[date] = []);
          for (const it of items) if (!cur.some(x => x.id === it.id)) cur.push(it);
        }
        Object.assign(db.weights, inc.weights);
        if (!Object.keys(db.profile).length) db.profile = inc.profile;
        for (const f of inc.customFoods) if (!db.customFoods.some(x => x.id === f.id)) db.customFoods.push(f);
        db.favFoods = [...new Set([...db.favFoods, ...inc.favFoods])];
        db.lastAmt = { ...inc.lastAmt, ...db.lastAmt };
      }
      save(); toast(`불러왔어요! (운동 ${Object.keys(inc.workouts).length}일 · 식단 ${Object.keys(inc.meals).length}일)`); renderSettings();
    } catch (err) { toast('백업 파일을 읽을 수 없어요. 핏로그 JSON 파일인지 확인해 주세요'); }
    e.target.value = '';
  };
  $('#wipe').onclick = () => {
    if (!confirm('정말 모든 기록을 삭제할까요? 되돌릴 수 없어요.')) return;
    if (!confirm('마지막 확인: 백업은 해두셨나요? 삭제할게요.')) return;
    db = emptyDb(); save(); toast('모두 삭제했어요'); renderSettings();
  };
}

// ───────── 근거 화면
const REFS = [
  { k: 'msj', t: 'Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO. A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr. 1990;51(2):241–247.', doi: '10.1093/ajcn/51.2.241' },
  { k: 'morton', t: 'Morton RW, Murphy KT, McKellar SR, et al. A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults. Br J Sports Med. 2018;52(6):376–384.', doi: '10.1136/bjsports-2017-097608' },
  { k: 'issn', t: 'Jäger R, Kerksick CM, Campbell BI, et al. International Society of Sports Nutrition Position Stand: protein and exercise. J Int Soc Sports Nutr. 2017;14:20.', doi: '10.1186/s12970-017-0177-8' },
  { k: 'helms', t: 'Helms ER, Aragon AA, Fitschen PJ. Evidence-based recommendations for natural bodybuilding contest preparation: nutrition and supplementation. J Int Soc Sports Nutr. 2014;11:20.', doi: '10.1186/1550-2783-11-20' },
];
const DATA_SRCS = [
  ['농촌진흥청 국가표준식품성분표 제10개정판', '공공데이터포털 15137343 (파일 데이터, 3,310개 식품, 100g당). 일부 항목은 성분표가 국립수산과학원·USDA·일본식품성분표 값을 인용한 것이고, 앱에 원출처를 함께 적었어요.', 'https://www.data.go.kr/data/15137343/fileData.do'],
  ['식품의약품안전처 통합식품영양성분정보(음식)', '공공데이터포털 15100070. 외식·가정식 음식의 100g(ml)당 값과 1인분 중량. 찌개·볶음 등 섞인 음식은 추정치로 표시해요.', 'https://www.data.go.kr/data/15100070/fileData.do'],
  ['식품의약품안전처 통합식품영양성분정보(가공식품)', '공공데이터포털 15100066. 시판 닭가슴살·조미김·삼각김밥처럼 제품마다 다른 음식은 같은 종류 제품 여러 개의 100g당 중앙값을 써요.', 'https://www.data.go.kr/data/15100066/fileData.do'],
  ['USDA FoodData Central (SR Legacy)', '국내 자료에 없는 조리 상태(오븐에 구운 닭가슴살 등)와 웨이 프로틴·땅콩버터 등.', 'https://fdc.nal.usda.gov/'],
];
function renderEvidence() {
  setTitle('근거 · 출처');
  const t = calcTargets(), cb = ['닭가슴살 (생것)', '닭가슴살 (삶은 것)', '닭가슴살 (구운 것·오븐)', '닭가슴살 (팬에 구운 것)'].map(n => window.FOODS.find(f => f.name === n)).filter(Boolean);
  const ref = k => { const i = REFS.findIndex(r => r.k === k); return `<sup><a href="#ref-${k}">[${i + 1}]</a></sup>`; };
  app.innerHTML = `
    <div class="card ev"><h3>🔥 하루 칼로리 목표</h3>
      <p class="small">기초대사량(BMR)은 <b>Mifflin-St Jeor 공식</b>${ref('msj')}으로 계산해요.<br>
      <code>남성 = 10×체중(kg) + 6.25×키(cm) − 5×나이 + 5</code><br><code>여성 = 10×체중 + 6.25×키 − 5×나이 − 161</code></p>
      <p class="small">여기에 활동계수(1.2~1.9)를 곱해 하루 소비량(TDEE)을 추정해요. 활동계수는 널리 쓰이는 관례적 값이라 개인차가 있어요. 2~3주 체중 추세를 보고 ±100~200kcal씩 조정하는 게 가장 정확해요.</p>
      <p class="small"><b>감량</b>은 TDEE의 82%(약 −18%)로 잡아요. 체중이 주당 <b>0.5~1%</b>씩 빠지는 속도가 근손실을 줄이는 데 권장돼요${ref('helms')}. 예: 75kg이면 주당 0.4~0.75kg. 그보다 빨리 빠지면 칼로리를 조금 올리세요. 최저치(남 1500 / 여 1200kcal)는 너무 낮게 먹지 않도록 앱이 정한 안전 하한이에요.</p>
      ${t && t.bmr ? `<div class="tip">상우님 현재 값: BMR ${fmt(t.bmr)} → TDEE ${fmt(t.tdee)} → 목표 ${fmt(t.kcal)}kcal</div>` : ''}</div>
    <div class="card ev"><h3>🥩 단백질 목표</h3>
      <p class="small">근력운동을 하는 사람에게 <b>체중 1kg당 1.6~2.2g</b>을 권해요. 49개 연구(1,863명) 메타분석에서 근육 증가 효과는 하루 약 <b>1.62g/kg</b>에서 더 늘지 않았고, 95% 신뢰구간 상한이 약 2.2g/kg이었어요${ref('morton')}. 국제스포츠영양학회(ISSN) 입장문은 운동하는 사람 대부분에게 1.4~2.0g/kg을 권하고, 감량 중에는 더 높은 섭취가 근육 유지에 도움이 될 수 있다고 해요${ref('issn')}. 감량기 보디빌더 대상 리뷰는 제지방량 1kg당 2.3~3.1g을 제안해요${ref('helms')}.</p>
      <p class="small">앱 기본값은 <b>2.0g/kg</b>(감량 중이라 범위 위쪽)이고, 설정에서 1.6~2.2g 중 고를 수 있어요. 지방은 칼로리의 25%, 나머지는 탄수화물로 채워요(앱 기본값).</p></div>
    <div class="card ev"><h3>🐔 닭가슴살 100g에 단백질 36g?</h3>
      <p class="small">맞을 수도, 아닐 수도 있어요. <b>익히면 수분이 빠져 같은 고기가 가벼워지기</b> 때문에, 100g당 단백질은 생것보다 익힌 것이 높아요. 그래서 무게를 <b>익히기 전에 쟀는지, 익힌 뒤에 쟀는지</b>에 맞는 항목을 고르는 게 중요해요.</p>
      <table class="ptable">${cb.map(f => `<tr><th>${esc(f.name.replace('닭가슴살 ', ''))}</th><td><b>${fmt(f.p)}g</b> · ${fmt(f.k)}kcal <span class="muted">(${esc(f.src)})</span></td></tr>`).join('')}</table>
      <p class="small muted">36g 근처 값은 팬에 구워 수분이 많이 빠진 상태(농진청 35.5g)예요. 시판 훈제·스테이크 닭가슴살은 양념·수분이 들어가 보통 100g당 20~25g이에요. 포장지 값이 있으면 그 값이 가장 정확해요.</p></div>
    <div class="card ev"><h3>🍱 음식 데이터 출처</h3>
      ${DATA_SRCS.map(s => `<p class="small"><b>${s[0]}</b><br>${s[1]}<br><a href="${s[2]}" target="_blank" rel="noopener">${s[2]}</a></p>`).join('')}
      <p class="small">모든 값은 100g(음료·국물은 100ml)당으로 저장해요. "한 줌", "1봉" 같은 분량은 제품 표시중량, 식약처 1인분 중량, 일반 계량 기준이고, <b>약</b>이 붙은 분량은 어림값이에요. 한 번 기록한 양은 다음에 같은 음식을 고를 때 그대로 기억해요.</p>
      <p class="small muted">음식 수: ${window.FOODS.length}개 · 출처별 ${Object.entries(window.FOODS.reduce((a, f) => (a[f.src] = (a[f.src] || 0) + 1, a), {})).map(([k, v]) => `${k} ${v}`).join(' · ')}</p></div>
    <div class="card ev"><h3>📄 참고문헌</h3><ol class="refs small">${REFS.map(r => `<li id="ref-${r.k}">${esc(r.t)} <a href="https://doi.org/${r.doi}" target="_blank" rel="noopener">doi:${r.doi}</a></li>`).join('')}</ol>
      <p class="small muted">이 앱은 건강한 성인을 위한 일반 정보예요. 질환이 있거나 약을 먹고 있다면 의사·영양사와 상의하세요.</p></div>`;
}

// ───────── 날짜 바 (공용)
function dateBarHtml() {
  return `<div class="datebar">
      <button class="btn" id="prevDay" aria-label="이전 날">‹</button>
      <input type="date" id="dateIn" value="${curDate}" aria-label="날짜">
      <button class="btn" id="nextDay" aria-label="다음 날">›</button>
    </div>
    <div class="row between" style="margin:-4px 2px 10px">
      <span class="muted small">${labelD(curDate)}${curDate === todayStr() ? ' · 오늘' : ''}</span>
      ${curDate !== todayStr() ? '<button class="btn sm ghost" id="toToday">오늘로</button>' : ''}
    </div>`;
}
function bindDateBar(rerender) {
  $('#dateIn').addEventListener('change', e => { if (e.target.value) { curDate = e.target.value; rerender(); } });
  $('#prevDay').onclick = () => { curDate = addDays(curDate, -1); rerender(); };
  $('#nextDay').onclick = () => { curDate = addDays(curDate, 1); rerender(); };
  const tt = $('#toToday'); if (tt) tt.onclick = () => { curDate = todayStr(); rerender(); };
}

// ───────── 목표 계산 (Mifflin-St Jeor)
const ACT = [[1.2, '거의 안 움직임 (사무직, 운동 X)'], [1.375, '가벼운 활동 (주 1~3회 운동)'], [1.55, '보통 (주 3~5회 운동)'], [1.725, '활동적 (주 6~7회 운동)'], [1.9, '매우 활동적 (육체노동 + 운동)']];
const GOALS = { cut: { lbl: '감량', f: 0.82, desc: 'TDEE의 약 82% (-18%)' }, keep: { lbl: '유지', f: 1, desc: 'TDEE와 같게' }, bulk: { lbl: '증량', f: 1.1, desc: 'TDEE의 110% (+10%)' } };
function latestWeight(upTo = todayStr()) {
  const ks = Object.keys(db.weights).filter(k => k <= upTo).sort();
  return ks.length ? db.weights[ks[ks.length - 1]] : null;
}
function calcTargets(date = todayStr()) {
  const p = db.profile || {};
  const w = latestWeight(date) || +p.weight || 0;
  const h = +p.height, a = +p.age;
  let bmr = null, tdee = null, auto = null, floorHit = false;
  if (w && h && a && (p.sex === 'm' || p.sex === 'f')) {
    bmr = 10 * w + 6.25 * h - 5 * a + (p.sex === 'm' ? 5 : -161);
    tdee = bmr * (+p.activity || 1.375);
    const g = GOALS[p.goal] || GOALS.keep;
    auto = Math.round(tdee * g.f / 10) * 10;
    const floor = p.sex === 'm' ? 1500 : 1200;
    if (auto < floor) { auto = floor; floorHit = true; }
  }
  const kcal = +p.kcalOverride || auto;
  const autoP = w ? Math.round(w * (+p.ppk || 2)) : null;
  const protein = +p.proteinOverride || autoP;
  if (!kcal || !protein) return null;
  const fat = Math.round(kcal * 0.25 / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { bmr: bmr && Math.round(bmr), tdee: tdee && Math.round(tdee), auto, autoP, kcal, protein, fat, carbs, weight: w, floorHit };
}

// ───────── 식단 합계
function dayTotals(date) {
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0, count: 0 };
  for (const e of db.meals[date] || []) { t.kcal += e.kcal * e.qty; t.protein += e.protein * e.qty; t.carbs += e.carbs * e.qty; t.fat += e.fat * e.qty; t.count++; }
  return t;
}
function barHtml(label, cur, target, unit, cls = '') {
  if (!target) return `<div class="bar-row"><div class="row between"><span>${label}</span><b>${fmt(cur)}${unit}</b></div></div>`;
  const pct = Math.min(100, (cur / target) * 100), over = cur > target * 1.05, rem = target - cur;
  return `<div class="bar-row"><div class="row between"><span>${label}</span><span><b>${fmt(cur)}</b> / ${fmt(target)}${unit}</span></div>
    <div class="bar ${cls} ${over ? 'over' : ''}"><i style="width:${pct.toFixed(1)}%"></i></div>
    <div class="small ${over ? 'down' : 'muted'}" style="text-align:right">${rem >= 0 ? `남은 ${fmt(rem)}${unit}` : `${fmt(-rem)}${unit} 초과`}</div></div>`;
}
function dietTip(t, tot) {
  if (!t) return '설정 탭에서 키·체중·나이·목표를 입력하면 하루 칼로리·단백질 목표를 계산해 드려요.';
  if (!tot.count) return `오늘 목표는 ${fmt(t.kcal)}kcal, 단백질 ${t.protein}g이에요. 첫 끼를 기록해 보세요!`;
  const pr = t.protein - tot.protein, kr = t.kcal - tot.kcal, parts = [];
  if (pr >= 10) {
    const g = Math.round(pr / 0.31 / 10) * 10; // 익힌(오븐) 닭가슴살 100g당 단백질 31g (USDA)
    parts.push(pr < 40 ? `단백질 ${Math.round(pr)}g 더 필요해요 — 익힌 닭가슴살 ${g}g 정도${pr >= 20 ? ` 또는 프로틴 ${Math.max(1, Math.round(pr / 24 * 2) / 2)}스쿱` : ''}` : `단백질 ${Math.round(pr)}g 더 필요해요 — 익힌 닭가슴살 ${g}g 정도 (남은 끼니에 나눠서, 프로틴 1스쿱 ≈ 24g)`);
  } else parts.push('단백질 목표 거의 달성! 👏');
  if (kr < -100) parts.push(`칼로리는 목표보다 ${fmt(-kr)}kcal 많아요. 다음 끼는 가볍게 가봐요`);
  else if (kr > 0) parts.push(`남은 칼로리 ${fmt(kr)}kcal`);
  else parts.push('칼로리는 목표에 딱 맞아요 👍');
  return parts.join('. ') + '.';
}
function dashHtml(date, compact) {
  const t = calcTargets(date), tot = dayTotals(date);
  return `${barHtml('칼로리', tot.kcal, t && t.kcal, 'kcal', 'k')}
    ${barHtml('단백질', tot.protein, t && t.protein, 'g', 'p')}
    ${compact ? '' : `<div class="macro-grid">
      <div><span class="muted small">탄수화물</span><b>${fmt(tot.carbs)}${t ? `<small> / ${t.carbs}g</small>` : 'g'}</b></div>
      <div><span class="muted small">단백질</span><b>${fmt(tot.protein)}${t ? `<small> / ${t.protein}g</small>` : 'g'}</b></div>
      <div><span class="muted small">지방</span><b>${fmt(tot.fat)}${t ? `<small> / ${t.fat}g</small>` : 'g'}</b></div></div>`}
    <div class="tip">💡 ${esc(dietTip(t, tot))}</div>`;
}
function todayDietHtml() {
  const w = db.weights[curDate];
  return `<h3 class="sec-h">🍚 식단 ${w ? `<span class="muted small" style="font-weight:400">· 체중 ${fmt(w)}kg</span>` : ''}</h3>
    <div class="card">${dashHtml(curDate, true)}
    <button class="btn block sm" data-go="#/diet" style="margin-top:10px">식단 기록하러 가기 ›</button></div>`;
}

// ───────── 식단 화면
// 음식 DB(foods.js)는 100g(음료·국물은 100ml)당 값 + 이름 붙은 분량(por: [라벨, g])을 가져요.
// 옛 방식(1회 제공량당 값) 직접입력 음식은 per100이 없으므로 "인분" 단위로만 다뤄요.
const allFoods = () => [...window.FOODS, ...db.customFoods];
const foodById = id => allFoods().find(f => f.id === id);
const per100 = f => f && f.k != null ? { kcal: f.k, protein: f.p, carbs: f.c, fat: f.f } : null;
const uOf = f => (f && f.unit) || 'g';
const porLbl = (f, p) => /\d/.test(p[0]) && p[0].includes(String(p[1])) ? p[0].replace(/≈$/, '') : `${p[0].replace(/≈$/, '')} (${p[0].endsWith('≈') ? '약 ' : ''}${fmt(p[1])}${uOf(f)})`;
const SRC_LBL = { '농진청': '농촌진흥청 국가표준식품성분표', '식약처': '식약처 식품영양성분DB(음식)', '식약처 제품': '식약처 가공식품DB', 'USDA': 'USDA FoodData Central', '직접 입력': '직접 입력' };
function macrosFor(f, g) { const v = per100(f); return { kcal: v.kcal * g / 100, protein: v.protein * g / 100, carbs: v.carbs * g / 100, fat: v.fat * g / 100 }; }
function defaultAmt(f) {
  const last = db.lastAmt[f.id];
  if (last && last.g > 0) return { ...last };
  if (!per100(f)) return { n: 1 };
  const p = (f.por || [])[0];
  return p ? { p: 0, n: 1, g: p[1] } : { g: 100 };
}
function foodSub(f) {
  if (!per100(f)) return `${esc(f.serving)} · ${fmt(f.kcal)}kcal · 단백질 ${fmt(f.protein)}g`;
  const p = (f.por || [])[0], g = p ? p[1] : 100, m = macrosFor(f, g);
  return `${p ? esc(porLbl(f, p)) : `100${uOf(f)}`} ${m.kcal >= 10 ? Math.round(m.kcal).toLocaleString('ko-KR') : fmt(m.kcal)}kcal · 단 ${fmt(m.protein)}g <span class="src-tag">${esc(f.src || '')}${f.est ? '·추정' : ''}</span>`;
}
let foodCat = null;
function renderDiet() {
  setTitle(curDate === todayStr() ? '오늘의 식단' : '식단 기록');
  const meals = db.meals[curDate] || [];
  const w = db.weights[curDate];
  app.innerHTML = `${dateBarHtml()}
    <div class="card" id="dash">${dashHtml(curDate)}</div>
    <div class="card"><div class="row between"><b>⚖️ 체중</b><button class="btn sm ghost" id="wGo">그래프 ›</button></div>
      <div class="row" style="margin-top:8px"><input id="wIn" class="num-in" type="number" inputmode="decimal" step="0.1" min="20" max="400" placeholder="${latestWeight(curDate) ? fmt(latestWeight(curDate)) : '체중'}" value="${w ?? ''}" aria-label="체중 kg"><span class="muted">kg</span>
      <button class="btn primary sm" id="wSave">저장</button></div>
      <div class="small muted" style="margin-top:6px">${weightSummary(curDate)}</div></div>
    ${MEALS.map(m => {
      const es = meals.map((e, i) => ({ e, i })).filter(x => x.e.meal === m);
      const kc = es.reduce((a, x) => a + x.e.kcal * x.e.qty, 0), pr = es.reduce((a, x) => a + x.e.protein * x.e.qty, 0);
      return `<section class="card meal" data-meal="${m}">
        <div class="row between"><h3 class="meal-h">${{ 아침: '🌅', 점심: '☀️', 저녁: '🌙', 간식: '🍪' }[m]} ${m}</h3><span class="small muted">${es.length ? `${fmt(kc)}kcal · 단 ${fmt(pr)}g` : ''}</span></div>
        ${es.map(({ e, i }) => `<button class="food-row" data-i="${i}"><div><div class="t">${esc(e.name)}</div><div class="s">${esc(e.serving)}${e.qty !== 1 ? ` × ${fmt(e.qty)}` : ''}</div></div>
          <div class="r"><b>${fmt(e.kcal * e.qty)}</b><span>kcal</span><div class="s">단 ${fmt(e.protein * e.qty)}g</div></div></button>`).join('')}
        <button class="btn sm block ghost add-food" data-meal="${m}">＋ ${m} 추가</button></section>`;
    }).join('')}
    <button class="btn block" id="pasteBtn">📋 코치 데이터 붙여넣기</button>
    <p class="muted small" style="margin:12px 4px">ⓘ 음식 값은 농촌진흥청 국가표준식품성분표·식약처 식품영양성분DB·USDA 자료의 100g당 값이에요. 같은 음식도 조리법·제품·양에 따라 달라요. <a href="#/evidence">근거 보기</a></p>`;
  bindDateBar(renderDiet);
  app.querySelectorAll('.add-food').forEach(b => b.onclick = () => openFoodPicker(b.dataset.meal));
  app.querySelectorAll('.food-row').forEach(b => b.onclick = () => { const e = db.meals[curDate][+b.dataset.i]; openAmount({ ...e }, { meal: e.meal, editIndex: +b.dataset.i }); });
  $('#pasteBtn').onclick = () => openPasteImport();
  $('#wGo').onclick = () => go('#/weight');
  $('#wSave').onclick = () => saveWeight(curDate, $('#wIn').value, renderDiet);
}
function saveWeight(date, v, rerender) {
  if (v === '' || v == null) { if (db.weights[date]) { delete db.weights[date]; save(); toast('체중 기록을 지웠어요'); rerender(); } return; }
  const n = Number(v);
  if (!(n >= 20 && n <= 400)) return toast('체중을 kg으로 정확히 입력해 주세요');
  db.weights[date] = r1(n); save(); toast(`${labelD(date)} 체중 ${fmt(n)}kg 저장!`); rerender();
}
function avg7(date) {
  const from = addDays(date, -6);
  const v = Object.entries(db.weights).filter(([k]) => k >= from && k <= date).map(([, x]) => x);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}
function weightSummary(date) {
  const a = avg7(date), b = avg7(addDays(date, -7));
  if (a == null) return '체중을 꾸준히 기록하면 7일 평균으로 추세를 보여드려요.';
  return `7일 평균 ${fmt(a)}kg${b != null ? ` · 지난주 대비 ${a - b > 0 ? '+' : ''}${fmt(a - b)}kg` : ''}`;
}

// ───────── 음식 선택
function recentFoods() {
  const out = [], seen = new Set();
  for (const d of Object.keys(db.meals).sort().reverse()) for (const e of db.meals[d].slice().reverse()) {
    const f = e.foodId && foodById(e.foodId);
    const key = f ? f.id : 'n:' + e.name + '|' + e.serving;
    if (seen.has(key)) continue; seen.add(key);
    out.push(f || { id: null, name: e.name, serving: e.serving, kcal: e.kcal, protein: e.protein, carbs: e.carbs, fat: e.fat, cat: '최근', legacy: true });
    if (out.length >= 30) return out;
  }
  return out;
}
const norm = s => String(s || '').replace(/[\s·()]/g, '').toLowerCase();
function searchFoods(q, list = allFoods()) {
  const s = norm(q); if (!s) return list;
  const scored = [];
  for (const f of list) {
    const n = norm(f.name), a = norm(f.aka) + norm(f.cat), words = String(f.aka || '').toLowerCase().split(/\s+/);
    const sc = n === s ? 0 : words.includes(s) ? 1 : n.startsWith(s) ? 2 : n.includes(s) ? 3 : a.includes(s) ? 4 : -1;
    if (sc >= 0) scored.push([sc, scored.length, f]);
  }
  return scored.sort((x, y) => x[0] - y[0] || x[1] - y[1]).map(x => x[2]);
}
function openFoodPicker(meal) {
  let q = '';
  let cat = foodCat || (recentFoods().length ? '최근' : '전체');
  const chips = ['최근', '즐겨찾기', '내 음식', '전체', ...window.FOOD_CATS];
  openSheet(`<h2>${meal}에 음식 추가</h2>
    <input class="search" id="fq" placeholder="음식 검색 (예: 닭가슴살, 김, 황태채)" autocomplete="off">
    <div class="chips" id="fc"></div><div id="fl"></div>
    <button class="btn block" id="fcustom" style="margin-top:6px">✏️ 목록에 없어요 · 직접 입력</button>`, body => {
    let shown = [];
    const draw = () => {
      $('#fc', body).innerHTML = chips.map(c => `<button class="chip ${c === cat ? 'on' : ''}" data-c="${c}">${c}</button>`).join('');
      let list = cat === '최근' ? recentFoods() : cat === '즐겨찾기' ? db.favFoods.map(foodById).filter(Boolean) : cat === '내 음식' ? db.customFoods : cat === '전체' ? allFoods() : allFoods().filter(f => f.cat === cat);
      if (q) list = searchFoods(q);
      shown = list;
      $('#fl', body).innerHTML = list.slice(0, 120).map((f, i) => `<button class="list-item" data-k="${i}"><div><div class="t">${db.favFoods.includes(f.id) ? '⭐ ' : ''}${esc(f.name)}</div><div class="s">${foodSub(f)}</div></div><span class="chev">＋</span></button>`).join('')
        || `<div class="empty" style="padding:20px">${cat === '즐겨찾기' && !q ? '음식을 추가할 때 ⭐를 누르면 여기 모여요.' : cat === '최근' && !q ? '최근 먹은 음식이 여기 표시돼요.' : '찾는 음식이 없어요. 아래에서 직접 입력해 주세요.'}</div>`;
    };
    draw();
    $('#fq', body).addEventListener('input', e => { q = e.target.value.trim(); draw(); });
    $('#fc', body).onclick = e => { const c = e.target.closest('[data-c]'); if (c) { cat = foodCat = c.dataset.c; q = ''; $('#fq', body).value = ''; draw(); } };
    $('#fl', body).onclick = e => {
      const b = e.target.closest('[data-k]'); if (!b) return; const f = shown[+b.dataset.k];
      if (f.legacy || !f.id || !per100(f)) openAmount({ foodId: f.id || undefined, name: f.name, serving: f.serving, kcal: f.kcal, protein: f.protein, carbs: f.carbs, fat: f.fat, qty: 1 }, { meal });
      else openAmount({ foodId: f.id, name: f.name }, { meal });
    };
    $('#fcustom', body).onclick = () => openCustomFood(meal, q);
  });
}
function srcHtml(f) {
  if (!per100(f)) return '';
  const v = per100(f), u = uOf(f);
  return `<div class="srcbox small">
    <div><b>100${u}당</b> ${fmt(v.kcal)}kcal · 단백질 ${fmt(v.protein)}g · 탄수 ${fmt(v.carbs)}g · 지방 ${fmt(v.fat)}g</div>
    ${f.state ? `<div>상태: ${esc(f.state)}</div>` : ''}
    <div class="muted">출처: ${f.src === '식약처 제품' ? esc(f.srcNote) : `${esc(SRC_LBL[f.src] || f.src || '')}${f.srcName ? ` — ${esc(f.srcName)}` : ''}${f.srcNote && f.src !== '직접 입력' ? `<br>${esc(f.srcNote)}` : ''}`}</div>
    ${f.est ? '<div class="warn">여러 재료가 섞인 음식이라 집·식당마다 차이가 커요(추정치).</div>' : ''}
    ${f.note ? `<div>💡 ${esc(f.note)}</div>` : ''}
    ${(f.por || []).some(p => p[0].endsWith('≈')) ? '<div class="muted">"약"이 붙은 분량은 일반적인 어림값이에요. 정확히 하려면 g으로 입력하세요.</div>' : ''}
  </div>`;
}
function openAmount(e, { meal, editIndex }) {
  const editing = editIndex != null;
  const f = e.foodId ? foodById(e.foodId) : null;
  // 100g당 값이 있는 음식이고, (새로 추가) 또는 (g 정보가 저장된 기록)일 때 g 기반 화면
  if (f && per100(f) && (!editing || e.g > 0)) return openAmountG(f, e, { meal, editIndex });
  return openAmountLegacy(e, { meal, editIndex });
}
function openAmountG(f, e, { meal, editIndex }) {
  const editing = editIndex != null, u = uOf(f);
  let a = editing && e.amt ? { ...e.amt, g: e.g } : editing ? { g: e.g } : defaultAmt(f), m = meal;
  const por = f.por || [];
  const grams = () => a.p != null && por[a.p] ? por[a.p][1] * a.n : a.g;
  openSheet(`<h2>${esc(f.name)}</h2>
    <div class="field"><label>분량 고르기</label><div class="chips wrap" id="ap">
      ${por.map((p, i) => `<button class="chip" data-p="${i}">${esc(porLbl(f, p))}</button>`).join('')}
      <button class="chip" data-p="g100">100${u}</button></div></div>
    <div class="field" id="anf"><label>개수</label>
      <div class="stepper"><button class="btn" data-d="-0.5">−</button><input id="an" type="number" inputmode="decimal" step="0.5" min="0.25"><button class="btn" data-d="0.5">＋</button></div></div>
    <div class="field"><label>또는 정확한 양 (${u})</label><div class="row"><input id="ag" class="num-in" type="number" inputmode="decimal" min="0" step="1" placeholder="예: 150"><span class="muted">${u}</span></div></div>
    <div class="card" id="atot"></div>
    ${srcHtml(f)}
    <div class="field"><label>끼니</label><div class="chips" id="am">${MEALS.map(x => `<button class="chip ${x === m ? 'on' : ''}" data-m="${x}">${x}</button>`).join('')}</div></div>
    <button class="btn block ghost" id="afav" style="margin-bottom:8px"></button>
    <div class="row">${editing ? '<button class="btn danger" id="adel" style="flex:1">삭제</button>' : '<button class="btn ghost" id="acancel" style="flex:1">취소</button>'}
    <button class="btn primary" id="aok" style="flex:2">${editing ? '저장' : '추가하기'}</button></div>`, body => {
    const draw = (fromInput) => {
      const g = grams() || 0, mm = macrosFor(f, g);
      body.querySelectorAll('#ap .chip').forEach(c => c.classList.toggle('on', a.p != null && String(c.dataset.p) === String(a.p)));
      $('#anf', body).style.display = a.p != null ? '' : 'none';
      if (a.p != null) $('#an', body).value = a.n;
      if (fromInput !== 'g') $('#ag', body).value = g ? r1(g) : '';
      $('#atot', body).innerHTML = `<div class="small muted" style="margin-bottom:6px">${g ? `총 <b id="agt">${fmt(g)}${u}</b>${a.p != null ? ` = ${esc(porLbl(f, por[a.p]))} × ${fmt(a.n)}` : ''}` : '양을 골라 주세요'}</div>
        <div class="macro-grid four"><div><span class="muted small">칼로리</span><b id="akc">${fmt(mm.kcal)}</b></div><div><span class="muted small">단백질</span><b id="apr">${fmt(mm.protein)}g</b></div><div><span class="muted small">탄수</span><b>${fmt(mm.carbs)}g</b></div><div><span class="muted small">지방</span><b>${fmt(mm.fat)}g</b></div></div>`;
      $('#afav', body).textContent = db.favFoods.includes(f.id) ? '⭐ 즐겨찾기 해제' : '☆ 즐겨찾기에 추가';
    };
    draw();
    $('#ap', body).onclick = ev => { const c = ev.target.closest('[data-p]'); if (!c) return; if (c.dataset.p === 'g100') a = { g: 100 }; else a = { p: +c.dataset.p, n: a.p === +c.dataset.p ? a.n : 1 }; draw(); };
    body.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { a.n = Math.max(0.25, Math.round((a.n + +b.dataset.d) * 4) / 4); draw(); });
    $('#an', body).addEventListener('input', ev => { const v = Number(ev.target.value); if (v > 0) { a.n = v; draw('n'); $('#an', body).value = ev.target.value; } });
    $('#ag', body).addEventListener('input', ev => { const v = Number(ev.target.value); if (v > 0) { a = { g: v }; draw('g'); } });
    $('#am', body).onclick = ev => { const c = ev.target.closest('[data-m]'); if (c) { m = c.dataset.m; body.querySelectorAll('#am .chip').forEach(x => x.classList.toggle('on', x.dataset.m === m)); } };
    $('#afav', body).onclick = () => { const i = db.favFoods.indexOf(f.id); if (i >= 0) db.favFoods.splice(i, 1); else db.favFoods.push(f.id); save(); draw(); };
    const c = $('#acancel', body); if (c) c.onclick = closeSheet;
    const d = $('#adel', body); if (d) d.onclick = () => { db.meals[curDate].splice(editIndex, 1); save(); closeSheet(); toast('삭제했어요'); renderDiet(); };
    $('#aok', body).onclick = () => {
      const g = grams(); if (!(g > 0)) return toast('먹은 양을 입력해 주세요');
      const mm = macrosFor(f, g);
      const serving = a.p != null ? `${porLbl(f, por[a.p])}${a.n !== 1 ? ` × ${fmt(a.n)}` : ''}` : `${fmt(g)}${u}`;
      const amt = a.p != null ? { p: a.p, n: a.n } : {};
      const entry = normEntry({ id: editIndex != null ? e.id : undefined, foodId: f.id, name: f.name, serving, qty: 1, g: r1(g), amt, meal: m,
        kcal: Math.round(mm.kcal), protein: r1(mm.protein), carbs: r1(mm.carbs), fat: r1(mm.fat) });
      db.lastAmt[f.id] = { ...amt, g: r1(g) };
      const list = db.meals[curDate] || (db.meals[curDate] = []);
      if (editIndex != null) list[editIndex] = entry; else list.push(entry);
      save(); closeSheet(); toast(editIndex != null ? '수정했어요' : `${m}에 ${f.name} ${serving} 추가!`);
      if (location.hash.startsWith('#/diet')) renderDiet(); else go('#/diet');
    };
  });
}
// 옛 기록(1회 제공량 × 인분)과 옛 방식 직접입력 음식용
function openAmountLegacy(e, { meal, editIndex }) {
  let qty = e.qty || 1, m = meal;
  const editing = editIndex != null;
  openSheet(`<h2>${esc(e.name)}</h2><div class="muted small" style="margin-top:-8px;margin-bottom:12px">1회 제공량: ${esc(e.serving)} · ${fmt(e.kcal)}kcal${e.g ? '' : ' (예전 방식으로 저장된 값이에요)'}</div>
    <div class="field"><label>먹은 양 (인분)</label>
      <div class="stepper"><button class="btn" data-d="-0.5">−</button><input id="aq" type="number" inputmode="decimal" step="0.25" min="0.1" value="${qty}"><button class="btn" data-d="0.5">＋</button></div>
      <div class="chips" style="margin-top:8px">${[0.5, 1, 1.5, 2, 3].map(v => `<button class="chip" data-q="${v}">${v}인분</button>`).join('')}</div></div>
    <div class="field"><label>끼니</label><div class="chips" id="am">${MEALS.map(x => `<button class="chip ${x === m ? 'on' : ''}" data-m="${x}">${x}</button>`).join('')}</div></div>
    <div class="card" id="atot"></div>
    ${e.foodId ? `<button class="btn block ghost" id="afav" style="margin-bottom:8px"></button>` : ''}
    <div class="row">${editing ? '<button class="btn danger" id="adel" style="flex:1">삭제</button>' : '<button class="btn ghost" id="acancel" style="flex:1">취소</button>'}
    <button class="btn primary" id="aok" style="flex:2">${editing ? '저장' : '추가하기'}</button></div>`, body => {
    const drawTot = () => {
      $('#atot', body).innerHTML = `<div class="macro-grid four"><div><span class="muted small">칼로리</span><b id="akc">${fmt(e.kcal * qty)}</b></div><div><span class="muted small">단백질</span><b id="apr">${fmt(e.protein * qty)}g</b></div><div><span class="muted small">탄수</span><b>${fmt(e.carbs * qty)}g</b></div><div><span class="muted small">지방</span><b>${fmt(e.fat * qty)}g</b></div></div>`;
      const fb = $('#afav', body); if (fb) fb.textContent = db.favFoods.includes(e.foodId) ? '⭐ 즐겨찾기 해제' : '☆ 즐겨찾기에 추가';
    };
    const setQ = v => { qty = Math.max(0.25, Math.round(v * 4) / 4 || 0.25); $('#aq', body).value = qty; drawTot(); };
    drawTot();
    body.querySelectorAll('[data-d]').forEach(b => b.onclick = () => setQ(qty + +b.dataset.d));
    body.querySelectorAll('[data-q]').forEach(b => b.onclick = () => setQ(+b.dataset.q));
    $('#aq', body).addEventListener('input', ev => { const v = Number(ev.target.value); if (v > 0) { qty = v; drawTot(); } });
    $('#am', body).onclick = ev => { const c = ev.target.closest('[data-m]'); if (c) { m = c.dataset.m; body.querySelectorAll('#am .chip').forEach(x => x.classList.toggle('on', x.dataset.m === m)); } };
    const fb = $('#afav', body); if (fb) fb.onclick = () => { const i = db.favFoods.indexOf(e.foodId); if (i >= 0) db.favFoods.splice(i, 1); else db.favFoods.push(e.foodId); save(); drawTot(); };
    const c = $('#acancel', body); if (c) c.onclick = closeSheet;
    const d = $('#adel', body); if (d) d.onclick = () => { db.meals[curDate].splice(editIndex, 1); save(); closeSheet(); toast('삭제했어요'); renderDiet(); };
    $('#aok', body).onclick = () => {
      const entry = normEntry({ ...e, qty, meal: m });
      const list = db.meals[curDate] || (db.meals[curDate] = []);
      if (editing) list[editIndex] = entry; else list.push(entry);
      save(); closeSheet(); toast(editing ? '수정했어요' : `${m}에 ${e.name} 추가!`);
      if (location.hash.startsWith('#/diet')) renderDiet(); else go('#/diet');
    };
  });
}
const PORTION_GUIDE = [
  ['한 줌 (가볍게 쥔 손)', '견과 약 25g · 건어물(황태채·멸치) 약 10g · 시리얼 약 30g'],
  ['한 컵 (종이컵 200ml)', '우유·두유 200g · 황태채(가볍게 담아) 약 20g · 밥 약 150g'],
  ['1큰술 (밥숟가락 15ml)', '기름 13g · 꿀 20g · 고추장·된장 18g · 설탕 12g'],
  ['1작은술 (찻숟가락 5ml)', '기름 4g · 설탕 4g'],
  ['한 조각', '피자 약 100~120g · 케이크 약 80~100g · 치킨(뼈 포함) 약 60g'],
  ['손바닥 크기 고기', '두께 1cm 정도면 약 100g (익힌 무게)'],
  ['1공기', '밥 210g (즉석밥 1개와 같아요)'],
];
function openCustomFood(meal, name = '') {
  let basis = '100', portions = [];
  openSheet(`<h2>음식 직접 입력</h2>
    <div class="field"><label>음식 이름</label><input id="cfn" value="${esc(name)}" maxlength="40" placeholder="예: 엄마표 김치볶음밥"></div>
    <div class="field"><label>🔎 비슷한 음식으로 값 채우기 <span class="muted small">(선택)</span></label>
      <input id="cfq" class="search" placeholder="예: 김치볶음밥 → 볶음밥" autocomplete="off" value="${esc(name)}"><div id="cfl"></div></div>
    <div class="field"><label>영양성분표 기준</label><div class="chips" id="cfb">
      <button class="chip on" data-b="100">100g당</button><button class="chip" data-b="serv">1회 제공량(포장지 표기)당</button></div></div>
    <div class="field" id="cfsw" style="display:none"><label>그 1회 제공량은 몇 g인가요?</label><div class="row"><input id="cfsg" class="num-in" type="number" inputmode="decimal" min="0" placeholder="예: 30"><span class="muted">g</span></div></div>
    <div class="grid2">
      <div class="field"><label>칼로리 (kcal)</label><input id="cfk" type="number" inputmode="decimal" min="0"></div>
      <div class="field"><label>단백질 (g)</label><input id="cfp" type="number" inputmode="decimal" min="0"></div>
      <div class="field"><label>탄수화물 (g)</label><input id="cfc" type="number" inputmode="decimal" min="0"></div>
      <div class="field"><label>지방 (g)</label><input id="cff" type="number" inputmode="decimal" min="0"></div></div>
    <div class="field"><label>내가 먹은 양 (g)</label><div class="row"><input id="cfeat" class="num-in" type="number" inputmode="decimal" min="0" placeholder="예: 30"><span class="muted">g</span></div>
      <div class="small muted" id="cfprev" style="margin-top:6px"></div></div>
    <details class="guide"><summary>📏 분량 감 잡기 (한 줌·한 컵·한 스푼)</summary>
      <table class="ptable">${PORTION_GUIDE.map(r => `<tr><th>${r[0]}</th><td>${r[1]}</td></tr>`).join('')}</table>
      <p class="small muted">가장 정확한 건 주방 저울이에요. 한 번만 재 보면 다음부터는 눈대중이 정확해져요.</p></details>
    <details class="guide"><summary>🏷️ 영양성분표 읽는 법</summary>
      <ul class="small"><li><b>총 내용량</b>: 포장 하나에 든 전체 양 (예: 총 내용량 40g).</li>
      <li><b>1회 제공량</b>(또는 "1회 섭취참고량"): 표의 숫자가 기준으로 삼은 양. 총 내용량보다 작을 수 있어요 (예: 40g 봉지인데 표는 20g 기준).</li>
      <li>표 맨 위에 "총 내용량 ○g당", "1회 제공량 ○g당", "100g당" 중 무엇인지 먼저 확인하고, 위 <b>기준</b>을 같게 고르세요.</li>
      <li>봉지를 다 먹었다면 먹은 양에 <b>총 내용량</b>을 넣으면 돼요.</li></ul></details>
    <label class="check"><input type="checkbox" id="cfsave" checked> 내 음식에 저장해서 다음에도 쓰기</label>
    <div class="row" style="margin-top:12px"><button class="btn ghost" id="cfx" style="flex:1">취소</button><button class="btn primary" id="cfo" style="flex:2">${meal}에 추가</button></div>`, body => {
    const vals = () => ({ k: $('#cfk', body).value, p: $('#cfp', body).value, c: $('#cfc', body).value, f: $('#cff', body).value });
    const to100 = v => { const sg = Number($('#cfsg', body).value); const r = basis === '100' ? 1 : sg > 0 ? 100 / sg : null; return r == null ? null : { k: nz(v.k) * r, p: nz(v.p) * r, c: nz(v.c) * r, f: nz(v.f) * r }; };
    const prev = () => {
      const v = vals(), eat = Number($('#cfeat', body).value), h = to100(v);
      $('#cfprev', body).textContent = v.k === '' ? '' : !h ? '1회 제공량의 g을 입력해 주세요' : eat > 0 ? `→ ${fmt(eat)}g = ${fmt(h.k * eat / 100)}kcal · 단백질 ${fmt(h.p * eat / 100)}g` : `→ 100g당 ${fmt(h.k)}kcal · 단백질 ${fmt(h.p)}g`;
    };
    const drawSim = () => {
      const q = $('#cfq', body).value.trim();
      const list = q ? searchFoods(q, window.FOODS).slice(0, 5) : [];
      $('#cfl', body).innerHTML = list.map((f, i) => `<button class="list-item sm" data-s="${i}"><div><div class="t">${esc(f.name)}</div><div class="s">100${uOf(f)}당 ${fmt(f.k)}kcal · 단 ${fmt(f.p)}g · ${esc(f.src)}</div></div><span class="chev">채우기</span></button>`).join('');
      $('#cfl', body).onclick = ev => {
        const b = ev.target.closest('[data-s]'); if (!b) return; const f = list[+b.dataset.s];
        basis = '100'; body.querySelectorAll('#cfb .chip').forEach(c => c.classList.toggle('on', c.dataset.b === '100')); $('#cfsw', body).style.display = 'none';
        $('#cfk', body).value = f.k; $('#cfp', body).value = f.p; $('#cfc', body).value = f.c; $('#cff', body).value = f.f;
        portions = (f.por || []).map(p => [...p]);
        if (!$('#cfeat', body).value && portions[0]) $('#cfeat', body).value = portions[0][1];
        if (!$('#cfn', body).value.trim()) $('#cfn', body).value = f.name;
        toast(`${f.name}의 100g당 값으로 채웠어요. 포장지 값이 있으면 고쳐 주세요`); prev();
      };
    };
    drawSim();
    $('#cfq', body).addEventListener('input', drawSim);
    $('#cfb', body).onclick = ev => { const c = ev.target.closest('[data-b]'); if (!c) return; basis = c.dataset.b; body.querySelectorAll('#cfb .chip').forEach(x => x.classList.toggle('on', x === c)); $('#cfsw', body).style.display = basis === 'serv' ? '' : 'none'; prev(); };
    body.querySelectorAll('#cfk,#cfp,#cfc,#cff,#cfsg,#cfeat').forEach(i => i.addEventListener('input', prev));
    $('#cfx', body).onclick = closeSheet;
    $('#cfo', body).onclick = () => {
      const n = $('#cfn', body).value.trim(), v = vals();
      if (!n) return toast('음식 이름을 입력해 주세요');
      if (v.k === '' || !(Number(v.k) >= 0)) return toast('칼로리를 입력해 주세요');
      const h = to100(v); if (!h) return toast('1회 제공량이 몇 g인지 입력해 주세요');
      const eat = Number($('#cfeat', body).value) || (basis === 'serv' ? Number($('#cfsg', body).value) : 0);
      if (!(eat > 0)) return toast('먹은 양(g)을 입력해 주세요');
      const sg = Number($('#cfsg', body).value);
      const por = basis === 'serv' && sg > 0 ? [['1회 제공량', sg], ...portions] : portions;
      const f = { id: 'cf_' + uid(), name: n, cat: '내 음식', custom: true, k: r1(h.k), p: r1(h.p), c: r1(h.c), f: r1(h.f), unit: 'g', por, src: '직접 입력', srcName: basis === 'serv' ? `포장지 ${fmt(sg)}g당 값을 100g당으로 환산` : '100g당 값', state: '' };
      const saveIt = $('#cfsave', body).checked;
      if (saveIt) db.customFoods.push(f);
      const mm = macrosFor(f, eat);
      const list = db.meals[curDate] || (db.meals[curDate] = []);
      list.push(normEntry({ foodId: saveIt ? f.id : undefined, name: n, serving: `${fmt(eat)}g`, qty: 1, g: eat, amt: {}, meal, kcal: Math.round(mm.kcal), protein: r1(mm.protein), carbs: r1(mm.carbs), fat: r1(mm.fat) }));
      if (saveIt) db.lastAmt[f.id] = { g: eat };
      save(); closeSheet(); toast(`${meal}에 ${n} 추가!`); renderDiet();
    };
  });
}

// ───────── 체중
function weightChartSvg(pts) {
  const W = 340, H = 190, L = 40, R = 14, T = 16, B = 28;
  const vals = pts.flatMap(p => [p.v, p.a]);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (hi - lo < 1) { lo -= 0.5; hi += 0.5; }
  const pv = (hi - lo) * 0.12; lo -= pv; hi += pv;
  const x = i => pts.length === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (pts.length - 1);
  const y = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const grid = [0, 0.5, 1].map(f => { const v = lo + (hi - lo) * f; return `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="#2b303b" stroke-dasharray="3 4"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" font-size="10" fill="#9aa3b2">${fmt(v)}</text>`; }).join('');
  const step = Math.max(1, Math.ceil(pts.length / 5));
  const xl = pts.map((p, i) => (i % step === 0 || i === pts.length - 1) ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" font-size="10" fill="#9aa3b2">${shortD(p.date)}</text>` : '').join('');
  const avgLine = pts.map((p, i) => `${x(i).toFixed(1)},${y(p.a).toFixed(1)}`).join(' ');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="체중 그래프">${grid}
    ${pts.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.v)}" r="3" fill="#60a5fa" opacity=".55"/>`).join('')}
    ${pts.length > 1 ? `<polyline points="${avgLine}" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>` : ''}
    ${xl}</svg>
    <div class="legend"><span><i style="background:#60a5fa"></i>매일 체중</span><span><i style="background:#4ade80"></i>7일 평균</span></div>`;
}
function weightSectionHtml() {
  const ks = Object.keys(db.weights).sort();
  if (!ks.length) return `<div class="empty"><div class="big">⚖️</div><p>식단 탭에서 체중을 기록하면 추세 그래프가 보여요.</p></div>`;
  const pts = ks.slice(-60).map(d => ({ date: d, v: db.weights[d], a: avg7(d) }));
  const first = db.weights[ks[0]], last = db.weights[ks[ks.length - 1]];
  return `<div class="stat-grid"><div class="stat"><b>${fmt(last)}</b><span>최근(kg)</span></div><div class="stat"><b>${fmt(avg7(ks[ks.length - 1]))}</b><span>7일 평균</span></div>
    <div class="stat"><b class="${(db.profile.goal === 'cut' && last < first) || (db.profile.goal === 'bulk' && last > first) ? 'up' : ''}">${last - first > 0 ? '+' : ''}${fmt(last - first)}</b><span>시작 대비</span></div></div>
    <div class="chart-wrap">${weightChartSvg(pts)}</div>
    <p class="muted small" style="margin:0 4px 10px">하루하루 체중은 수분·식사로 1kg 넘게 오르내려요. 7일 평균선의 방향을 보세요.</p>
    ${ks.slice().reverse().map(d => `<div class="list-item"><div><div class="t">${labelD(d)}</div><div class="s">7일 평균 ${fmt(avg7(d))}kg</div></div><div class="row"><b>${fmt(db.weights[d])}kg</b><button class="mini del" data-wdel="${d}" aria-label="삭제" style="width:44px">✕</button></div></div>`).join('')}`;
}
function bindWeightSection(el, rerender) {
  el.querySelectorAll('[data-wdel]').forEach(b => b.onclick = () => { if (confirm(`${labelD(b.dataset.wdel)} 체중 기록을 지울까요?`)) { delete db.weights[b.dataset.wdel]; save(); rerender(); } });
}
function renderWeightPage() {
  setTitle('체중 추세');
  app.innerHTML = `<div class="card"><b>오늘 체중</b><div class="row" style="margin-top:8px"><input id="wIn2" class="num-in" type="number" inputmode="decimal" step="0.1" value="${db.weights[todayStr()] ?? ''}" placeholder="kg"><span class="muted">kg</span><button class="btn primary sm" id="wSave2">저장</button></div></div><div id="wsec">${weightSectionHtml()}</div>`;
  $('#wSave2').onclick = () => saveWeight(todayStr(), $('#wIn2').value, renderWeightPage);
  bindWeightSection($('#wsec'), renderWeightPage);
}

// ───────── 프로필 / 목표 설정
function profileCardHtml() {
  const p = db.profile, sel = (v, x) => String(v) === String(x) ? 'selected' : '';
  return `<div class="card" id="profile"><h3 style="margin:0 0 6px">🎯 내 정보 · 목표</h3>
    <div class="grid2">
      <div class="field"><label>키 (cm)</label><input data-p="height" type="number" inputmode="decimal" value="${p.height ?? ''}" placeholder="175"></div>
      <div class="field"><label>체중 (kg)</label><input data-p="weight" type="number" inputmode="decimal" value="${p.weight ?? ''}" placeholder="${latestWeight() ?? 75}"></div>
      <div class="field"><label>나이</label><input data-p="age" type="number" inputmode="numeric" value="${p.age ?? ''}" placeholder="30"></div>
      <div class="field"><label>성별</label><select data-p="sex"><option value="">선택</option><option value="m" ${sel(p.sex, 'm')}>남성</option><option value="f" ${sel(p.sex, 'f')}>여성</option></select></div></div>
    <div class="field"><label>활동량</label><select data-p="activity">${ACT.map(([v, l]) => `<option value="${v}" ${sel(p.activity ?? 1.375, v)}>${l}</option>`).join('')}</select></div>
    <div class="grid2">
      <div class="field"><label>목표</label><select data-p="goal">${Object.entries(GOALS).map(([k, g]) => `<option value="${k}" ${sel(p.goal ?? 'keep', k)}>${g.lbl}</option>`).join('')}</select></div>
      <div class="field"><label>단백질 (체중 1kg당)</label><select data-p="ppk">${[1.6, 1.8, 2.0, 2.2].map(v => `<option value="${v}" ${sel(+(p.ppk ?? 2), v)}>${v.toFixed(1)}g</option>`).join('')}</select></div>
      <div class="field"><label>목표 칼로리 직접 (선택)</label><input data-p="kcalOverride" type="number" inputmode="numeric" value="${p.kcalOverride ?? ''}" placeholder="자동"></div>
      <div class="field"><label>목표 단백질 직접 (선택)</label><input data-p="proteinOverride" type="number" inputmode="numeric" value="${p.proteinOverride ?? ''}" placeholder="자동"></div></div>
    <div id="tgt"></div></div>`;
}
function targetSummaryHtml() {
  const t = calcTargets();
  if (!t) return `<div class="tip">키·체중·나이·성별을 입력하면 목표를 자동으로 계산해요.</div>`;
  const g = GOALS[db.profile.goal] || GOALS.keep;
  return `<div class="macro-grid">
      ${t.bmr ? `<div><span class="muted small">기초대사량</span><b>${fmt(t.bmr)}</b></div><div><span class="muted small">활동대사량(TDEE)</span><b>${fmt(t.tdee)}</b></div>` : ''}
      <div><span class="muted small">하루 목표</span><b class="up">${fmt(t.kcal)}kcal</b></div>
      <div><span class="muted small">단백질</span><b>${t.protein}g</b></div><div><span class="muted small">탄수화물</span><b>${t.carbs}g</b></div><div><span class="muted small">지방</span><b>${t.fat}g</b></div></div>
    <p class="muted small" style="margin:8px 0 0">${db.profile.kcalOverride ? '칼로리는 직접 입력한 값이에요.' : `${g.lbl}: ${g.desc}${t.floorHit ? ' · 너무 낮지 않게 최소치로 맞췄어요' : ''}.`} 지방은 칼로리의 25%, 나머지는 탄수화물로 계산해요.${Object.keys(db.weights).length ? ' 체중 기록이 있으면 최신 체중을 써요.' : ''} 공식: Mifflin-St Jeor (1990). <a href="#/evidence">근거 보기</a></p>`;
}
function bindProfile() {
  const box = $('#profile'); if (!box) return;
  $('#tgt').innerHTML = targetSummaryHtml();
  box.addEventListener('input', e => {
    const k = e.target.dataset.p; if (!k) return;
    const v = e.target.value;
    if (v === '') delete db.profile[k]; else db.profile[k] = ['sex', 'goal'].includes(k) ? v : Number(v);
    save(); $('#tgt').innerHTML = targetSummaryHtml();
  });
}

// ───────── 코치 데이터 붙여넣기
const MEAL_ALIAS = { 아침: '아침', 조식: '아침', breakfast: '아침', 점심: '점심', 중식: '점심', lunch: '점심', 저녁: '저녁', 석식: '저녁', dinner: '저녁', 간식: '간식', 야식: '간식', snack: '간식', snacks: '간식' };
const normName = s => String(s || '').replace(/\s/g, '').toLowerCase();
function findExercise(name) {
  const n = normName(name);
  return allEx().find(e => normName(e.name) === n || normName(e.en) === n || e.id === name) || null;
}
function parsePaste(text) {
  const res = { blocks: [], errors: [], warnings: [] };
  let raw = String(text || '').trim().replace(/```(?:json)?/gi, '');
  const i0 = raw.search(/[\[{]/), i1 = Math.max(raw.lastIndexOf('}'), raw.lastIndexOf(']'));
  if (i0 < 0 || i1 < i0) { res.errors.push('JSON 블록을 찾지 못했어요. { 로 시작하는 내용을 붙여넣어 주세요.'); return res; }
  let data;
  try { data = JSON.parse(raw.slice(i0, i1 + 1)); } catch (e) { res.errors.push('JSON 형식이 올바르지 않아요: ' + e.message); return res; }
  const list = Array.isArray(data) ? data : [data];
  list.forEach((b, bi) => {
    const tag = list.length > 1 ? `[${bi + 1}번째] ` : '';
    if (!isObj(b)) { res.errors.push(tag + '객체가 아니에요.'); return; }
    let date = b.date;
    if (!date) { date = curDate; res.warnings.push(`${tag}날짜가 없어서 ${labelD(curDate)}로 넣을게요.`); }
    else if (!isDate(date) || isNaN(parseD(date))) { res.errors.push(`${tag}날짜 "${date}" 형식이 틀렸어요 (YYYY-MM-DD).`); return; }
    const blk = { date, meals: [], workouts: [], weight: null };
    (Array.isArray(b.meals) ? b.meals : Array.isArray(b.foods) ? b.foods : []).forEach((m, mi) => {
      const where = `${tag}음식 ${mi + 1}`;
      if (!isObj(m) || !String(m.name || '').trim()) return res.errors.push(`${where}: 이름(name)이 없어요.`);
      const kcal = Number(m.kcal);
      if (!Number.isFinite(kcal) || kcal < 0 || kcal > 10000) return res.errors.push(`${where} (${m.name}): kcal 숫자가 필요해요.`);
      let meal = MEAL_ALIAS[normName(m.meal)];
      if (!meal) { meal = '간식'; res.warnings.push(`${where} (${m.name}): 끼니 "${m.meal ?? ''}"를 몰라서 간식으로 넣어요.`); }
      for (const k of ['protein', 'carbs', 'fat']) if (m[k] != null && !(Number(m[k]) >= 0)) res.warnings.push(`${where}: ${k} 값이 이상해서 0으로 넣어요.`);
      blk.meals.push(normEntry({ meal, name: String(m.name).trim(), serving: m.amount || m.serving || '1회', qty: 1, kcal, protein: m.protein, carbs: m.carbs, fat: m.fat }));
    });
    (Array.isArray(b.workouts) ? b.workouts : []).forEach((w, wi) => {
      const where = `${tag}운동 ${wi + 1}`;
      if (!isObj(w) || !String(w.exercise || '').trim()) return res.errors.push(`${where}: 운동 이름(exercise)이 없어요.`);
      const sets = [];
      (Array.isArray(w.sets) ? w.sets : []).forEach((s, si) => {
        const wt = Array.isArray(s) ? s[0] : (s && (s.weight ?? s.kg ?? s.w));
        const rp = Array.isArray(s) ? s[1] : (s && (s.reps ?? s.r ?? s.sec ?? s.seconds));
        const W = Number(wt ?? 0), R = Number(rp);
        if (!(W >= 0 && W < 1000) || !(R > 0 && R < 1000)) res.errors.push(`${where} (${w.exercise}) ${si + 1}세트: [중량, 횟수] 숫자가 필요해요.`);
        else sets.push({ w: W, r: Math.round(R) });
      });
      if (!sets.length) return res.errors.push(`${where} (${w.exercise}): 유효한 세트가 없어요.`);
      const ex = findExercise(w.exercise);
      if (!ex) res.warnings.push(`${where}: "${w.exercise}"는 목록에 없어서 새 운동으로 추가돼요.`);
      blk.workouts.push({ name: String(w.exercise).trim(), exId: ex ? ex.id : null, sets, isNew: !ex });
    });
    if (b.weight != null) { const n = Number(b.weight); if (n >= 20 && n <= 400) blk.weight = r1(n); else res.errors.push(`${tag}체중 값 "${b.weight}"이 이상해요.`); }
    if (blk.meals.length || blk.workouts.length || blk.weight) res.blocks.push(blk);
  });
  if (!res.blocks.length && !res.errors.length) res.errors.push('추가할 음식·운동·체중이 없어요.');
  return res;
}
function applyPaste(res) {
  let n = 0;
  for (const b of res.blocks) {
    if (b.meals.length) { const l = db.meals[b.date] || (db.meals[b.date] = []); b.meals.forEach(m => { l.push({ ...m, id: uid() }); n++; }); }
    for (const w of b.workouts) {
      let id = w.exId;
      if (!id) {
        const ex = findExercise(w.name);
        if (ex) id = ex.id;
        else { const nx = { id: 'c_' + uid(), name: w.name, group: '기타', equip: '직접 추가', type: w.sets.every(s => s.w === 0) ? 'bw' : 'weight', inc: 2.5, range: [8, 12], custom: true }; db.custom.push(nx); id = nx.id; }
      }
      const l = db.workouts[b.date] || (db.workouts[b.date] = []);
      let it = l.find(x => x.exId === id);
      if (!it) { it = { exId: id, sets: [] }; l.push(it); }
      it.sets = it.sets.filter(s => s.r > 0).concat(w.sets.map(s => ({ ...s })));
      n += w.sets.length;
    }
    if (b.weight) { db.weights[b.date] = b.weight; n++; }
  }
  save();
  return n;
}
function pastePreviewHtml(res) {
  let h = '';
  if (res.errors.length) h += `<div class="safety"><b>확인이 필요해요</b><ul>${res.errors.map(e => `<li>${esc(e)}</li>`).join('')}</ul></div>`;
  if (res.warnings.length) h += `<div class="plateau"><ul style="margin:0;padding-left:18px">${res.warnings.map(e => `<li>${esc(e)}</li>`).join('')}</ul></div>`;
  for (const b of res.blocks) {
    const k = b.meals.reduce((a, m) => a + m.kcal, 0), p = b.meals.reduce((a, m) => a + m.protein, 0);
    h += `<div class="card" style="margin-top:10px"><b>${labelD(b.date)}</b>
      ${b.meals.map(m => `<div class="prev-line">🍚 [${m.meal}] ${esc(m.name)} (${esc(m.serving)}) · ${fmt(m.kcal)}kcal · 단 ${fmt(m.protein)}g · 탄 ${fmt(m.carbs)}g · 지 ${fmt(m.fat)}g</div>`).join('')}
      ${b.meals.length > 1 ? `<div class="small muted">식단 합계 ${fmt(k)}kcal · 단백질 ${fmt(p)}g</div>` : ''}
      ${b.workouts.map(w => `<div class="prev-line">🏋️ ${esc(w.name)}${w.isNew ? ' <span class="tag">새 운동</span>' : ''}: ${w.sets.map(s => `${fmt(s.w)}×${s.r}`).join(' · ')}</div>`).join('')}
      ${b.weight ? `<div class="prev-line">⚖️ 체중 ${fmt(b.weight)}kg</div>` : ''}</div>`;
  }
  return h;
}
const PASTE_EXAMPLE = `{"date":"${todayStr()}","meals":[{"meal":"점심","name":"제육덮밥","amount":"1그릇","kcal":800,"protein":32,"carbs":100,"fat":28}],"workouts":[{"exercise":"벤치프레스","sets":[[62.5,8],[62.5,8]]}],"weight":75.2}`;
function openPasteImport() {
  openSheet(`<h2>📋 코치 데이터 붙여넣기</h2>
    <p class="muted small" style="margin-top:-6px">코치 봇이 사진을 보고 만들어 준 JSON 블록을 그대로 붙여넣으세요. 추가하기 전에 미리보기로 확인해요.</p>
    <textarea id="pt" placeholder='${esc(PASTE_EXAMPLE)}'></textarea>
    <div class="row" style="margin-top:8px"><button class="btn ghost sm" id="pex" style="flex:1">형식 예시 보기</button><button class="btn primary" id="ppv" style="flex:2">미리보기</button></div>
    <div id="pres"></div>`, body => {
    let res = null;
    $('#pex', body).onclick = () => { $('#pt', body).value = JSON.stringify(JSON.parse(PASTE_EXAMPLE), null, 1); };
    $('#ppv', body).onclick = () => {
      res = parsePaste($('#pt', body).value);
      const cnt = res.blocks.reduce((a, b) => a + b.meals.length + b.workouts.length + (b.weight ? 1 : 0), 0);
      $('#pres', body).innerHTML = pastePreviewHtml(res) + (cnt ? `<button class="btn primary block" id="papply" style="margin-top:10px">${cnt}개 항목 추가하기${res.errors.length ? ' (오류 항목 제외)' : ''}</button>` : '');
      const ap = $('#papply', body);
      if (ap) ap.onclick = () => { const n = applyPaste(res); closeSheet(); toast(`추가 완료! (${n}개)`); route(); };
    };
  });
}

// ───────── 시작
route();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
window.__fitlog = { get db() { return db; }, metrics, sessionsFor, isPlateau, nextTarget, calcTargets, dayTotals, parsePaste, foodById, macrosFor, searchFoods };
})();
