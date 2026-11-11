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
function emptyDb() { return { version: 2, workouts: {}, custom: [], meals: {}, weights: {}, profile: {}, customFoods: [], favFoods: [], lastAmt: {}, meta: {}, routine: null }; }
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
  out.custom = (d.custom || []).filter(c => c && c.id && c.name).map(c => c.group === '코어' ? { ...c, group: '복근' } : c);
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
  out.routine = normRoutine(d.routine);
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
const unitR = ex => ex.type === 'time' ? '초' : ex.type === 'cardio' ? '분' : '회';
// 볼륨(kg) 합산에 넣지 않는 기록 방식: 보조 머신(보조 kg), 유산소(km)
const noVolume = ex => ex.type === 'assist' || ex.type === 'cardio';
const LOAD_LBL = { barbell: '바벨', dumbbell: '덤벨 (한 손 기준)', machine: '핀 머신', plate: '플레이트 머신', smith: '스미스머신', cable: '케이블', bodyweight: '맨몸 (+추가중량)', kettlebell: '케틀벨', cardio: '유산소' };

// ───────── 지표 계산
const epley = (w, r) => r <= 1 ? w : w * (1 + r / 30);
function metrics(ex, sets) {
  const v = (sets || []).filter(s => s.r > 0);
  if (!v.length) return null;
  const w = s => s.w || 0;
  const top = Math.max(...v.map(w));
  const topReps = Math.max(...v.filter(s => w(s) === top).map(s => s.r));
  const low = Math.min(...v.map(w));
  return {
    sets: v.length,
    volume: v.reduce((a, s) => a + w(s) * s.r, 0),
    top, topReps,
    e1rm: top > 0 ? Math.max(...v.map(s => epley(w(s), s.r))) : 0,
    totalReps: v.reduce((a, s) => a + s.r, 0),
    bestReps: Math.max(...v.map(s => s.r)),
    dist: v.reduce((a, s) => a + w(s), 0),
    low, lowReps: Math.max(...v.filter(s => w(s) === low).map(s => s.r)),
    lessAssist: -low,
    work: v.filter(s => w(s) === top).map(s => s.r), // 최고 무게(작업 세트)의 횟수들
    workLow: v.filter(s => w(s) === low).map(s => s.r),
  };
}
// 종목별 표시 지표
function metricDefs(ex, m) {
  if (ex.type === 'cardio') {
    const d = [{ k: 'totalReps', lbl: '총 시간', u: '분' }];
    if (m && m.dist > 0) d.push({ k: 'dist', lbl: '거리', u: 'km' });
    return d;
  }
  if (ex.type === 'assist') return [
    { k: 'totalReps', lbl: '총 횟수', u: '회' },
    { k: 'bestReps', lbl: '최고 횟수', u: '회' },
    { k: 'low', lbl: '최저 보조', u: 'kg', inv: true }];
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
const keyMetrics = ex => ex.type === 'time' ? ['bestReps', 'totalReps'] : ex.type === 'cardio' ? ['totalReps', 'dist'] : ex.type === 'assist' ? ['totalReps', 'bestReps', 'lessAssist'] : ex.type === 'bw' ? ['totalReps', 'bestReps', 'top'] : ['e1rm', 'volume'];

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
// 정체: 예상 1RM·최고 중량(맨몸·시간 등은 주요 지표)이 마지막으로 오른 뒤 4번 이상 + 21일 이상 그대로일 때
const DAY = 864e5;
function plateauInfo(exId, date) {
  const ex = exById(exId);
  const s = sessionsFor(exId).filter(x => x.date <= date);
  if (s.length < 5 || s[s.length - 1].date !== date) return null;
  const keys = ex.type === 'weight' ? ['e1rm', 'top'] : keyMetrics(ex);
  let lastImp = 0; const best = {};
  keys.forEach(k => best[k] = s[0].m[k]);
  for (let i = 1; i < s.length; i++) {
    let up = false;
    keys.forEach(k => { if (s[i].m[k] > best[k] + 1e-9) { best[k] = s[i].m[k]; up = true; } });
    if (up) lastImp = i;
  }
  const n = s.length - 1 - lastImp, days = Math.round((parseD(date) - parseD(s[lastImp].date)) / DAY);
  return n >= 4 && days >= 21 ? { n, days, since: s[lastImp].date } : null;
}
const isPlateau = (exId, date) => !!plateauInfo(exId, date);
function plateauHtml(pi, ex) {
  const wk = Math.max(3, Math.round(pi.days / 7));
  return `<div class="plateau"><b>🌱 약 ${wk}주째 제자리예요 — 누구나 겪는 구간이에요</b>
    <ol class="small" style="margin:6px 0 0;padding-left:18px">
      <li>잠(7시간+)과 단백질(체중 1kg당 1.6g+), 식사량부터 점검해요</li>
      <li>같은 ${ex.type === 'weight' ? '무게' : '강도'}로 2주 더 쌓아 봐요 — 대부분 여기서 다시 올라요</li>
      <li>그래도 그대로면 1주만 <b>무게 10% 낮춰 가볍게</b>(디로드) 한 뒤 다시 시작해요</li></ol></div>`;
}
// 운동 종류(동작 패턴)로 반복 범위·최소 증량을 정해요 — 사용자 기록은 건드리지 않아요
const COMPOUND = ['bench', 'chestpress', 'cablepress', 'dips', 'pushup', 'pike', 'hinge', 'pulldown', 'pullup', 'row', 'ohp', 'squat', 'hack', 'legpress', 'lunge', 'thrust'];
const LOWER = ['squat', 'hack', 'legpress', 'lunge', 'thrust', 'hinge'];
const patOf = ex => (window.FORMS && window.FORMS.MAP[ex.id] ? window.FORMS.MAP[ex.id][0] : null);
function exKind(ex) {
  const p = patOf(ex);
  if (!p) return 'other';
  if (!COMPOUND.includes(p)) return 'iso';
  return ['machine', 'plate', 'cable'].includes(ex.load) ? 'machine' : 'free';
}
function progRange(ex) {
  const r = ex.range || [8, 12];
  if (ex.type !== 'weight' || ex.custom) return r;
  const k = exKind(ex);
  if (k === 'other') return r;
  if (k === 'iso') return r[0] >= 12 ? r : [10, 15];
  return k === 'machine' ? [8, 12] : [6, 10];
}
const MIN_INC = { barbell: 2.5, smith: 2.5, dumbbell: 2, machine: 5, plate: 5, cable: 2.5, kettlebell: 4 };
function minInc(ex) {
  const inc = ex.inc ?? 2.5;
  if (ex.type !== 'weight' || !MIN_INC[ex.load]) return inc;
  return inc > 0 ? Math.min(inc, MIN_INC[ex.load]) : MIN_INC[ex.load];
}
// 더블 프로그레션: 같은 무게로 모든 작업 세트가 범위 위쪽에 닿으면 → 최소 단위만 올리고 아래쪽부터 다시
function nextTarget(ex, m) {
  if (!m) return null;
  const [lo, hi] = progRange(ex);
  const inc = minInc(ex);
  const repsTxt = a => a.join('/') + '회';
  if (ex.type === 'time') return m.bestReps >= hi ? `${m.bestReps}초 유지 · 여유 있으면 +5초 또는 더 어려운 변형` : `${m.bestReps}초 유지 · 여유 있으면 +5초 (목표 ${hi}초)`;
  if (ex.type === 'cardio') {
    if (m.totalReps >= hi) return `${fmt(m.totalReps)}분 유지 + 속도·경사·저항 조금 올리기${m.dist > 0 ? ` (거리 ${fmt(r1(m.dist + 0.2))}km 이상)` : ''}`;
    return `${fmt(m.totalReps + 2)}분 (+2분)`;
  }
  if (ex.type === 'assist') {
    const w = m.workLow || [m.lowReps];
    if (w.every(r => r >= hi) && inc > 0) {
      const nw = Math.max(0, m.low - inc);
      return nw > 0 ? `보조 ${fmt(nw)}kg × ${lo}회부터 (모든 세트 ${hi}회 달성! 보조 −${fmt(m.low - nw)}kg)` : `보조 없이 ${lo}회 도전 (보조 −${fmt(m.low)}kg)`;
    }
    return `보조 ${fmt(m.low)}kg 그대로 · 모든 세트 ${hi}회까지 (지금 ${repsTxt(w)})`;
  }
  if (ex.type === 'bw' && m.top === 0) {
    if (m.bestReps >= hi) return inc > 0 ? `${hi}회 달성! 추가 중량 ${fmt(inc)}kg 달고 ${lo}회부터 (또는 더 어려운 변형)` : `${hi}회 달성! 더 어려운 변형으로 ${lo}회부터 (또는 천천히 내리기)`;
    return `맨몸 그대로 · 세트마다 ${hi}회까지 조금씩 (지금 최고 ${m.bestReps}회)`;
  }
  const w = m.work || [m.topReps];
  if (w.every(r => r >= hi) && inc > 0) return `${fmt(m.top + inc)}kg × ${lo}회부터 (모든 세트 ${hi}회 달성! +${fmt(inc)}kg)`;
  if (Math.max(...w) < lo) return `${fmt(m.top)}kg 그대로 · 우선 ${lo}회 채우기 (무거우면 한 칸 내려도 좋아요)`;
  return `${fmt(m.top)}kg 그대로 · 모든 세트 ${hi}회까지 (지금 ${repsTxt(w)})`;
}
function isPR(exId, date, m) {
  const ex = exById(exId);
  const prev = sessionsFor(exId).filter(x => x.date < date);
  if (!prev.length || !m) return false;
  const k = keyMetrics(ex)[0];
  return m[k] > Math.max(...prev.map(x => x.m[k])) + 1e-9;
}
const recReps = ex => ex.type === 'weight' && ex.rec ? `${progRange(ex)[0]}~${progRange(ex)[1]}회` : ex.rec ? ex.rec.reps : '';
const setsText = (ex, sets) => sets.map(s => ex.type === 'cardio' ? `${s.r}분${(s.w || 0) > 0 ? ' ' + fmt(s.w) + 'km' : ''}` : ex.type === 'assist' ? `보조${fmt(s.w || 0)}×${s.r}` : ex.type === 'weight' || (s.w || 0) > 0 ? `${fmt(s.w || 0)}×${s.r}` : `${s.r}${unitR(ex)}`).join(' · ');

function deltaHtml(d, u, inv) {
  const v = r1(d);
  if (inv && v !== 0) return `<span class="d ${v < 0 ? 'up' : 'down'}">${v < 0 ? '▼' : '▲'} ${v > 0 ? '+' : ''}${fmt(v)}${u}</span>`;
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
    if (dv === 0 && dTop === 0 && dr === 0) return { cls: 'neutral', text: '지난번과 같아요 👍 같은 무게를 다시 해낸 것도 좋은 결과예요. 여유 있는 세트가 있으면 다음엔 1회만 더 해 봐요.' };
    if (dTop < 0) return { cls: 'neutral', text: '오늘은 무게를 낮췄어요. 자세를 다지거나 컨디션을 조절하는 날도 필요해요 🙂' };
    return { cls: 'down', text: `지난번보다 볼륨 ${sign(dv)}kg. 잠·컨디션에 따라 기록은 오르내려요, 꾸준함이 최고예요 🙂` };
  }
  if (ex.type === 'assist') {
    const dl = r1(prev.low - cur.low), dt = cur.totalReps - prev.totalReps, dr = cur.lowReps - prev.lowReps;
    const p = [];
    if (dl > 0) p.push(`보조 ${fmt(dl)}kg 줄임`);
    if (dt > 0) p.push(`총 ${sign(dt)}회`);
    if (dl === 0 && dr > 0) p.push(`같은 보조로 ${dr}회 더`);
    if (p.length) return { cls: '', text: `지난번보다 ${p.join(', ')}, 잘했어요! 💪 (보조 kg이 낮을수록 더 어려워요)` };
    if (dl === 0 && dt === 0) return { cls: 'neutral', text: '지난번과 같아요 👍 그대로 해낸 것도 좋은 결과예요. 여유 있으면 다음엔 1회만 더 해 봐요.' };
    if (dl < 0 && dt <= 0) return { cls: 'down', text: `지난번보다 보조 ${fmt(-dl)}kg 늘었어요. 자세를 다지는 것도 과정이에요 🙂` };
    return { cls: 'down', text: `지난번보다 총 ${sign(dt)}회. 컨디션 조절도 훈련이에요, 다음에 다시 올려봐요 🙂` };
  }
  if (ex.type === 'cardio') {
    const dt = r1(cur.totalReps - prev.totalReps), dd = r1(cur.dist - prev.dist);
    const p = [];
    if (dt > 0) p.push(`${sign(dt)}분`);
    if (dd > 0) p.push(`거리 ${sign(dd)}km`);
    if (p.length) return { cls: '', text: `지난번보다 ${p.join(', ')}, 잘했어요! 🏃` };
    if (dt === 0 && dd === 0) return { cls: 'neutral', text: '지난번과 같아요 👍 꾸준히 해낸 게 중요해요. 여유 있으면 2분만 더 하거나 강도를 살짝 올려 봐요.' };
    return { cls: 'down', text: `지난번보다 ${sign(dt)}분. 짧게라도 꾸준히 하는 게 중요해요 🙂` };
  }
  const u = unitR(ex);
  const dt = cur.totalReps - prev.totalReps, db_ = cur.bestReps - prev.bestReps, dw = r1(cur.top - prev.top);
  const p = [];
  if (dw > 0) p.push(`추가 중량 ${sign(dw)}kg`);
  if (dt > 0) p.push(`총 ${sign(dt)}${u}`);
  if (db_ > 0) p.push(`최고 ${sign(db_)}${u}`);
  if (p.length) return { cls: '', text: `지난번보다 ${p.join(', ')}, 잘했어요! 💪` };
  if (dt === 0 && db_ === 0 && dw === 0) return { cls: 'neutral', text: `지난번과 같아요 👍 그대로 해낸 것도 좋은 결과예요. 여유 있으면 다음엔 ${ex.type === 'time' ? '5초' : '1회'}만 더 해 봐요.` };
  return { cls: 'down', text: `지난번보다 총 ${sign(dt)}${u}. 컨디션 조절도 훈련이에요, 다음에 다시 올려봐요 🙂` };
}

// ───────── 토스트 / 시트
let toastT;
function toast(t, action) {
  const el = $('#toast');
  clearTimeout(toastT);
  if (action && action.lbl && action.fn) {
    el.innerHTML = `<span>${esc(t)}</span><button type="button" class="toast-act">${esc(action.lbl)}</button>`;
    el.querySelector('.toast-act').onclick = ev => { ev.stopPropagation(); el.classList.add('hidden'); clearTimeout(toastT); action.fn(); };
    toastT = setTimeout(() => el.classList.add('hidden'), 5200);
  } else {
    el.textContent = t;
    toastT = setTimeout(() => el.classList.add('hidden'), 2200);
  }
  el.classList.remove('hidden');
}
const ovStack = [];
let ovIgnorePop = false;
const ovWaiters = [];
function flushOvWaiters() { while (ovWaiters.length) ovWaiters.shift()(); }
function popOverlayHistory() {
  return new Promise(resolve => {
    ovIgnorePop = true;
    ovWaiters.push(resolve);
    history.back();
    setTimeout(() => {
      const i = ovWaiters.indexOf(resolve);
      if (i >= 0) { ovWaiters.splice(i, 1); ovIgnorePop = false; resolve(); }
    }, 400);
  });
}
function pushOverlay(entry) {
  ovStack.push(entry);
  history.pushState({ ...(history.state || {}), flOv: ovStack.length, flT: entry.type }, '');
}
function closeTopOverlay(fromPop) {
  const top = ovStack.pop();
  if (!top) return Promise.resolve();
  top.close();
  return fromPop ? Promise.resolve() : popOverlayHistory();
}
window.addEventListener('popstate', () => {
  if (ovIgnorePop) { ovIgnorePop = false; flushOvWaiters(); return; }
  if (ovStack.length) closeTopOverlay(true);
});
let sheetCloseHook = null;
function hideSheetUI() {
  $('#sheet').classList.add('hidden');
  $('#sheetBody').innerHTML = '';
  if (sheetCloseHook) { const h = sheetCloseHook; sheetCloseHook = null; h(); }
}
function openSheet(html, onMount) {
  const already = !$('#sheet').classList.contains('hidden');
  if (already && sheetCloseHook) { const h = sheetCloseHook; sheetCloseHook = null; h(); }
  $('#sheetBody').innerHTML = html;
  $('#sheet').classList.remove('hidden');
  onMount && onMount($('#sheetBody'));
  if (!already) pushOverlay({ type: 'sheet', close: hideSheetUI });
}
function closeSheet() {
  if ($('#sheet').classList.contains('hidden')) return Promise.resolve();
  if (ovStack.length && ovStack[ovStack.length - 1].type === 'sheet') return closeTopOverlay(false);
  hideSheetUI();
  return Promise.resolve();
}
$('.sheet-backdrop').addEventListener('click', () => { closeSheet(); });
function appConfirm(msg) {
  return new Promise(resolve => {
    let done = false;
    const finish = v => {
      if (done) return;
      done = true;
      sheetCloseHook = null;
      Promise.resolve(closeSheet()).then(() => resolve(!!v));
    };
    openSheet(`<h2>확인</h2><p style="margin:0 0 16px">${esc(msg)}</p>
      <div class="row"><button type="button" class="btn ghost" id="cfno" style="flex:1">취소</button>
      <button type="button" class="btn danger" id="cfyes" style="flex:2">확인</button></div>`, body => {
      $('#cfno', body).onclick = () => finish(false);
      $('#cfyes', body).onclick = () => finish(true);
    });
    sheetCloseHook = () => finish(false);
  });
}

// ───────── 라우팅
let curDate = todayStr();
const SEL = {
  diet: { on: false, set: new Set(), date: null },
  log: { on: false, set: new Set(), date: null },
  weight: { on: false, set: new Set() }
};
function syncSelDate(kind) {
  const s = SEL[kind];
  if (s.date !== curDate) { s.set.clear(); s.date = curDate; }
}
function selBarHtml(kind, count) {
  const s = SEL[kind];
  const hint = `<p class="sel-hint">길게 눌러도 선택돼요</p>`;
  if (!s.on) return `<div class="selbar"><button type="button" class="btn sm ghost" data-sel="start"${count ? '' : ' disabled'}>선택</button></div>${hint}`;
  const n = s.set.size;
  return `<div class="selbar on"><button type="button" class="btn sm ghost" data-sel="all">전체 선택</button><button type="button" class="btn sm ghost" data-sel="off">취소</button><button type="button" class="btn sm danger" data-sel="del"${n ? '' : ' disabled'}>선택 삭제 (${n}개)</button></div>${hint}`;
}
let eatNextClick = false, eatClickT = 0, eatX = 0, eatY = 0;
function consumeNextClick(x, y, ms) {
  eatNextClick = true;
  if (typeof x === 'number') { eatX = x; eatY = y; }
  clearTimeout(eatClickT);
  eatClickT = setTimeout(() => { eatNextClick = false; }, ms == null ? 700 : ms);
}
document.addEventListener('click', e => {
  if (!eatNextClick) return;
  if (Math.hypot((e.clientX || 0) - eatX, (e.clientY || 0) - eatY) > 28) return;
  eatNextClick = false;
  clearTimeout(eatClickT);
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
}, true);
function bindLongPress(el, { onLong, ignore } = {}) {
  const HOLD = 500, LIMIT = 10;
  let tid = 0, x0 = 0, y0 = 0, active = false, pid = null, fired = false;
  const stop = () => {
    if (tid) { clearTimeout(tid); tid = 0; }
    active = false;
    pid = null;
    window.removeEventListener('pointermove', onMove, true);
    window.removeEventListener('pointerup', onUp, true);
    window.removeEventListener('pointercancel', onUp, true);
  };
  const onMove = e => {
    if (!active || (pid != null && e.pointerId !== pid)) return;
    if (Math.hypot(e.clientX - x0, e.clientY - y0) > LIMIT) stop();
  };
  const onUp = e => {
    if (pid != null && e.pointerId !== pid) return;
    if (fired) {
      e.preventDefault();
      consumeNextClick(x0, y0, 350);
    }
    fired = false;
    stop();
  };
  el.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (ignore && ignore(e)) return;
    x0 = e.clientX; y0 = e.clientY; active = true; pid = e.pointerId; fired = false;
    tid = setTimeout(() => {
      tid = 0;
      if (!active) return;
      active = false;
      fired = true;
      consumeNextClick(x0, y0, 2000);
      try { if (navigator.vibrate) navigator.vibrate(12); } catch (_) {}
      onLong && onLong();
    }, HOLD);
    window.addEventListener('pointermove', onMove, true);
    window.addEventListener('pointerup', onUp, true);
    window.addEventListener('pointercancel', onUp, true);
  });
  el.addEventListener('contextmenu', e => { e.preventDefault(); });
}
const selRedraw = { diet: null, log: null, weight: null };
function enterSelect(kind, redraw) {
  const s = SEL[kind];
  if (redraw) selRedraw[kind] = redraw;
  const rd = () => { const fn = selRedraw[kind]; fn && fn(); };
  if (s.on) { rd(); return; }
  s.on = true;
  pushOverlay({ type: 'select', kind, close() { s.on = false; s.set.clear(); rd(); } });
  rd();
}
function exitSelect(kind) {
  const s = SEL[kind];
  if (!s.on) return Promise.resolve();
  if (ovStack.length && ovStack[ovStack.length - 1].type === 'select' && ovStack[ovStack.length - 1].kind === kind) return closeTopOverlay(false);
  s.on = false; s.set.clear();
  selRedraw[kind] && selRedraw[kind]();
  return Promise.resolve();
}
function bindSelBar(el, kind, handlers) {
  if (!el) return;
  selRedraw[kind] = handlers.redraw;
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-sel]'); if (!b) return;
    const act = b.dataset.sel;
    if (act === 'start') enterSelect(kind, handlers.redraw);
    else if (act === 'off') exitSelect(kind);
    else if (act === 'all') { handlers.selectAll(); handlers.redraw(); }
    else if (act === 'del') handlers.del();
  });
}
let histMode = 'date';
let guideFilter = '전체', guideQuery = '', guideEquip = '전체', guideBrand = '전체';
let chartMetric = {};
function go(h) { if (location.hash === h) route(); else location.hash = h; }
window.addEventListener('hashchange', route);
document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => go('#/' + b.dataset.tab)));
$('#backBtn').addEventListener('click', () => { if (history.length > 1) history.back(); else go('#/guide'); });

function route() {
  const si = ovStack.findIndex(o => o.type === 'sheet');
  if (si >= 0) { ovStack.splice(si, 1); hideSheetUI(); }
  else if (!$('#sheet').classList.contains('hidden')) hideSheetUI();
  const parts = (location.hash || '#/log').slice(2).split('/');
  const tab = parts[0] || 'log';
  const tabFor = tab === 'ex' ? (parts[2] === 'guide' ? 'guide' : 'history') : tab === 'weight' ? 'diet' : tab === 'evidence' || tab === 'gym' ? 'settings' : tab === 'routine' ? 'log' : tab;
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tabFor));
  $('#backBtn').classList.toggle('hidden', tab !== 'ex' && tab !== 'weight' && tab !== 'evidence' && tab !== 'routine' && tab !== 'gym');
  window.scrollTo(0, 0);
  if (window.FORMS) window.FORMS.stop();
  if (tab === 'history') return renderHistory();
  if (tab === 'diet') return renderDiet();
  if (tab === 'weight') return renderWeightPage();
  if (tab === 'guide') return renderGuide();
  if (tab === 'settings') return renderSettings();
  if (tab === 'evidence') return renderEvidence();
  if (tab === 'gym') return renderGym();
  if (tab === 'routine') return renderRoutine(parts.slice(1).map(decodeURIComponent));
  if (tab === 'ex') return renderExercise(decodeURIComponent(parts[1] || ''), parts[2] || 'records');
  return renderLog();
}
const setTitle = t => { $('#title').textContent = t; document.title = t + ' · 핏로그'; };

// ───────── 기록 화면
function renderLog() {
  setTitle(curDate === todayStr() ? '오늘' : '하루 기록');
  const items = db.workouts[curDate] || [];
  syncSelDate('log');
  app.innerHTML = `
    ${dateBarHtml()}
    ${selBarHtml('log', items.length)}
    <div id="todayDiet"></div>
    <h3 class="sec-h">🏋️ 운동</h3>
    ${routineTodayHtml()}
    <div id="daySum"></div>
    <div id="exList">${items.map((it, i) => exCard(it, i)).join('')}</div>
    ${items.length ? '' : `<div class="empty" style="padding:18px"><p style="margin:0">아직 운동 기록이 없어요. 아래 버튼으로 추가해 보세요!</p></div>`}
    <button class="btn primary block" id="addEx" style="min-height:56px;font-size:17px">＋ 운동 추가</button>`;
  renderDaySum();
  bindDateBar(renderLog);
  bindSelBar($('.selbar'), 'log', {
    redraw: renderLog,
    selectAll: () => { (db.workouts[curDate] || []).forEach((_, i) => SEL.log.set.add(i)); },
    del: async () => {
      const idxs = [...SEL.log.set];
      if (!idxs.length) return;
      if (!await appConfirm(`선택한 ${idxs.length}개 운동을 삭제할까요?`)) return;
      const snap = (db.workouts[curDate] || []).map(it => ({ exId: it.exId, sets: it.sets.map(s => ({ ...s })) }));
      db.workouts[curDate] = (db.workouts[curDate] || []).filter((_, i) => !SEL.log.set.has(i));
      if (!db.workouts[curDate].length) delete db.workouts[curDate];
      save(); await exitSelect('log');
      toast(`${idxs.length}개 운동을 삭제했어요`, { lbl: '실행 취소', fn: () => { db.workouts[curDate] = snap; save(); renderLog(); toast('되돌렸어요'); } });
    }
  });
  $('#todayDiet').innerHTML = todayDietHtml();
  $('#todayDiet').onclick = e => { if (e.target.closest('[data-go]')) go(e.target.closest('[data-go]').dataset.go); };
  $('#addEx').onclick = () => openPicker(id => addExercise(id));
  bindRoutineToday();
  bindCards();
}
function renderDaySum() {
  const el = $('#daySum'); if (!el) return;
  const items = db.workouts[curDate] || [];
  let sets = 0, vol = 0, cmin = 0;
  items.forEach(it => { const ex = exById(it.exId), m = metrics(ex, it.sets); if (m) { if (ex.type === 'cardio') cmin += m.totalReps; else sets += m.sets; if (!noVolume(ex)) vol += m.volume; } });
  el.innerHTML = items.length ? `<div class="stat-grid">
    <div class="stat"><b>${items.length}</b><span>종목</span></div>
    <div class="stat"><b>${sets}</b><span>세트</span></div>
    <div class="stat"><b>${fmt(vol)}</b><span>총 볼륨(kg)</span></div></div>${cmin ? `<div class="muted small" style="margin:-4px 2px 10px">🏃 유산소 ${fmt(cmin)}분</div>` : ''}` : '';
}
function exCard(it, i) {
  const ex = exById(it.exId);
  const prev = prevSession(it.exId, curDate);
  const ph = k => prev && prev.sets[k] ? prev.sets[k] : (prev ? prev.sets[prev.sets.length - 1] : null);
  const wLbl = ex.type === 'weight' ? 'kg' : ex.type === 'assist' ? '보조 kg' : ex.type === 'cardio' ? 'km' : '추가 kg';
  const rows = it.sets.map((s, k) => {
    const p = ph(k);
    return `<div class="set-row" data-k="${k}">
      <div class="set-no">${k + 1}</div>
      <input inputmode="decimal" type="number" step="${ex.type === 'cardio' ? '0.01' : '0.5'}" min="0" data-f="w" value="${s.w ?? ''}" placeholder="${p ? fmt(p.w || 0) : (ex.type === 'weight' || ex.type === 'assist' ? 'kg' : ex.type === 'cardio' ? '선택' : '0')}" aria-label="${k + 1}세트 ${wLbl}">
      <input inputmode="numeric" type="number" step="1" min="0" data-f="r" value="${s.r ?? ''}" placeholder="${p ? (ex.type === 'weight' && s.w != null && p.w != null && s.w > p.w ? progRange(ex)[0] : p.r) : unitR(ex)}" aria-label="${k + 1}세트 ${unitR(ex)}">
      <button class="mini dup" data-act="dup" aria-label="세트 복사">복사</button>
      <button class="mini del" data-act="del" aria-label="세트 삭제">✕</button>
    </div>`;
  }).join('');
  return `<section class="card ex-card${SEL.log.on ? ' sel-mode' : ''}${SEL.log.on && SEL.log.set.has(i) ? ' sel-on' : ''}" data-i="${i}" data-ex="${esc(it.exId)}">
    <div class="ex-head">
      ${SEL.log.on ? `<button type="button" class="sel-box" data-act="sel" aria-label="선택"></button>` : ''}
      <div style="flex:1"><h2 class="ex-name"><button data-act="open">${esc(ex.name)} ›</button></h2>
        <div style="margin-top:4px"><span class="tag">${esc(ex.group)}</span>${ex.equip && ex.equip !== ex.group ? `<span class="tag">${esc(ex.equip)}</span>` : ''}${ex.rec ? `<span class="tag">권장 ${esc(recReps(ex))}</span>` : ''}</div></div>
      ${SEL.log.on ? '' : `<button class="mini del" data-act="rmEx" aria-label="운동 삭제" style="width:44px">🗑</button>`}
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
// ───────── 상위 % (Strength Level 기준 추정) + 이번 달 기대치
function profStd() {
  const p = db.profile || {}, bw = latestWeight() || +p.weight;
  if (!(p.sex === 'm' || p.sex === 'f') || !(bw > 0)) return null;
  return { sex: p.sex, age: +p.age || 0, bw };
}
// 브랜드 기구: 같은 종류 기구 표가 맞는 경우(pct)만 기본 운동 표를 써요
const stdId = ex => ex.base ? (ex.pct ? ex.base : '') : ex.id;
function pctValue(ex, m) {
  if (!m || !window.STD || !window.STD.has(stdId(ex))) return null;
  const pr = profStd(); if (!pr) return null;
  if (ex.type === 'bw') { if (m.top > 0) return null; const r = window.STD.percentile(stdId(ex), m.bestReps, pr); return r && r.reps ? { ...r, basis: `${m.bestReps}회`, v: m.bestReps } : null; }
  if (ex.type !== 'weight' || !(m.e1rm > 0)) return null;
  const r = window.STD.percentile(stdId(ex), m.e1rm, pr);
  return r && !r.reps ? { ...r, basis: `예상 1RM ${fmt(r1(m.e1rm))}kg`, v: m.e1rm } : null;
}
function pctLine(ex, m) {
  const r = pctValue(ex, m); if (!r) return '';
  return `<div class="pct">📊 같은 성별·체중·나이 이용자 중 <b>상위 약 ${r.top}%</b> · ${r.level} <span class="muted small">(${esc(r.basis)} 기준 · <a href="#/evidence">추정 근거</a>)</span></div>`;
}
function levelBarSvg(r) {
  const LV = window.STD.LV, xs = [0, 5, 20, 50, 80, 95, 100], W = 320, X = b => 8 + (W - 16) * b / 100;
  const cols = ['#3a414f', '#475569', '#2f855a', '#38a169', '#4ade80', '#a3e635'];
  const seg = LV.map((l, i) => `<rect x="${X(xs[i]).toFixed(1)}" y="18" width="${(X(xs[i + 1]) - X(xs[i]) - 1.5).toFixed(1)}" height="12" rx="3" fill="${cols[i]}"/>${i ? `<text x="${X((xs[i] + xs[i + 1]) / 2).toFixed(1)}" y="46" font-size="10" text-anchor="middle" fill="#9aa3b2">${l}</text>` : ''}`).join('');
  const mx = X(Math.max(1, Math.min(99, r.beats)));
  return `<svg viewBox="0 0 ${W} 52" class="lvbar" role="img" aria-label="수준 ${r.level}, 상위 ${r.top}%">${seg}<path d="M${mx.toFixed(1)} 16 l-6 -9 h12z" fill="#fbbf24"/><text x="${Math.min(W - 30, Math.max(30, mx)).toFixed(1)}" y="7" font-size="10" text-anchor="middle" fill="#fbbf24" font-weight="700">나</text></svg>`;
}
function pctCard(ex, m) {
  const r = pctValue(ex, m);
  if (!r) {
    if (!window.STD || !window.STD.has(stdId(ex))) return '';
    if (!profStd()) return `<div class="card pct-card"><h3 style="margin:0 0 4px">📊 내 수준은?</h3><p class="muted small" style="margin:0">설정에서 <b>성별·체중·나이</b>를 입력하면 같은 조건 이용자 중 상위 몇 %인지 보여 드려요.</p></div>`;
    return '';
  }
  const u = r.reps ? '회' : 'kg', ut = window.STD.untrained(stdId(ex), profStd());
  return `<div class="card pct-card"><h3 style="margin:0 0 2px">📊 내 수준 <span class="muted small">(추정)</span></h3>
    <div class="pct-big">상위 약 <b>${r.top}%</b> · ${r.level}</div>
    ${levelBarSvg(r)}
    <p class="small" style="margin:6px 0 0">${esc(r.basis)} 기준${r.next ? ` · 다음 단계(${r.next.level})까지 <b>${fmt(r1(Math.max(0, r.next.at - r.v)))}${u}</b>` : ''}</p>
    ${ut ? `<p class="small muted" style="margin:6px 0 0">참고: 운동을 막 배우는 비훈련자(ExRx 표, ${ut.cls}kg급 성인)의 1RM은 약 ${fmt(ut.kg)}kg이에요 — 내 예상 1RM은 그 <b>${fmt(r1(r.v / ut.kg))}배</b>. (순위가 아닌 참고값)</p>` : ''}
    <p class="small muted" style="margin:6px 0 0">헬스장/앱 이용자 기록 기준 추정 (Strength Level). 운동을 안 하는 사람까지 포함한 일반인 기준이라면 순위는 이보다 더 높아요. <a href="#/evidence">근거</a></p></div>`;
}
const STAGES = { 0: '초보', 1: '초중급', 2: '중급 이상' };
function monthlyLine(ex, date) {
  if (ex.type !== 'weight') return '';
  const s = sessionsFor(ex.id).filter(x => x.date <= date); if (!s.length) return '';
  const last = s[s.length - 1], k = exKind(ex);
  if (k === 'other') return '';
  const r = pctValue(ex, last.m);
  const spanD = (parseD(last.date) - parseD(s[0].date)) / DAY;
  const st = r ? (r.lv <= 1 ? 0 : r.lv === 2 ? 1 : 2) : (spanD < 180 ? 0 : spanD < 540 ? 1 : 2);
  let exp, lo, hi;
  if (k === 'iso') exp = '한 달에 1~2회 더 또는 무게 한 칸';
  else {
    const T = LOWER.includes(patOf(ex)) ? [[2.5, 5], [1, 2.5], [0.5, 1]] : [[1, 2.5], [0.5, 1.5], [0, 1]];
    [lo, hi] = T[st]; exp = `예상 1RM 한 달 +${fmt(lo)}~${fmt(hi)}kg`;
  }
  const ago = s.filter(x => x.date <= addDays(last.date, -24)).pop();
  let act = '';
  if (ago && k !== 'iso') {
    const d = r1(last.m.e1rm - ago.m.e1rm);
    act = ` · 최근 한 달 <b>${d > 0 ? '+' : ''}${fmt(d)}kg</b> ${d > hi ? '— 기대보다 빨라요 🎉' : d >= lo ? '— 딱 기대 범위예요 👍' : '— 조금 느려도 괜찮아요, 꾸준히 하면 따라와요 🙂'}`;
  }
  return `<div class="expect">📅 <b>이번 달 기대치</b> (${STAGES[st]}): ${exp}${act}<div class="muted small">자연 운동인의 일반적인 속도를 바탕으로 한 대략적인 코칭 값이에요. 개인차가 커요.</div></div>`;
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
      const defs = metricDefs(ex, { top: Math.max(cur.top, prev.m.top), dist: Math.max(cur.dist || 0, prev.m.dist || 0) });
      h += `<div class="metrics">${defs.map(d => `<div class="metric"><div class="lbl">${d.lbl}</div><div class="val">${fmt(cur[d.k])}${d.u}${deltaHtml(cur[d.k] - prev.m[d.k], d.u, d.inv)}</div></div>`).join('')}</div>`;
      const msg = message(ex, cur, prev.m);
      h += `<div class="msg ${msg.cls}">${msg.text}${isPR(it.exId, curDate, cur) ? '<span class="pr">🏆 PR</span>' : ''}</div>`;
      const pi = plateauInfo(it.exId, curDate);
      if (pi) h += plateauHtml(pi, ex);
    }
  }
  if (target) h += `<div class="target">🎯 ${cur ? '다음 목표' : '오늘 목표'}: <b>${esc(target)}</b></div>`;
  h += pctLine(ex, cur || (prev && prev.m));
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
    bindLongPress(card, {
      ignore: e => !!e.target.closest('input, textarea, select, .mini, .actions, [data-act="dup"], [data-act="del"], [data-act="add"], [data-act="loadPrev"], [data-act="rmEx"]'),
      onLong: () => { SEL.log.set.add(i); enterSelect('log', renderLog); }
    });
    card.addEventListener('click', e => {
      if (SEL.log.on) {
        const actEl = e.target.closest('[data-act]');
        const act0 = actEl && actEl.dataset.act;
        const setEdit = e.target.closest('input') || (act0 && ['add', 'dup', 'del', 'loadPrev'].includes(act0));
        if (!setEdit) {
          if (SEL.log.set.has(i)) SEL.log.set.delete(i); else SEL.log.set.add(i);
          renderLog();
          return;
        }
      }
      const b = e.target.closest('[data-act]'); if (!b) return;
      const act = b.dataset.act, it = item();
      const row = b.closest('.set-row'), k = row ? +row.dataset.k : -1;
      if (act === 'open') return go('#/ex/' + encodeURIComponent(it.exId) + '/records');
      if (act === 'rmEx') {
        (async () => {
          if (it.sets.some(s => s.r > 0) && !await appConfirm(`${exById(it.exId).name} 기록을 삭제할까요?`)) return;
          db.workouts[curDate].splice(i, 1); save(); renderLog(); toast('삭제했어요');
        })();
        return;
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
  return list.map(ex => `<button class="list-item" data-id="${esc(ex.id)}"><span class="ex-thumb" data-thumb="${esc(ex.id)}" aria-hidden="true"></span><div class="ex-list-main"><div class="t">${esc(ex.name)}</div><div class="s">${sub(ex)}</div></div><span class="chev">›</span></button>`).join('') || '<div class="empty">찾는 운동이 없어요.</div>';
}
function hydrateThumbs(root) {
  if (!root || !window.FORMS || !window.FORMS.thumbHtml) return;
  if (root._thumbIO) { root._thumbIO.disconnect(); root._thumbIO = null; }
  const nodes = root.querySelectorAll('[data-thumb]');
  const fill = el => {
    if (el.dataset.filled) return;
    el.dataset.filled = '1';
    el.innerHTML = window.FORMS.thumbHtml(exById(el.dataset.thumb));
  };
  if (typeof IntersectionObserver !== 'function') { nodes.forEach(fill); return; }
  const scrollRoot = root.closest('.sheet-panel');
  const io = new IntersectionObserver(ents => {
    ents.forEach(ent => { if (ent.isIntersecting) { fill(ent.target); io.unobserve(ent.target); } });
  }, { root: scrollRoot || null, rootMargin: '120px 0px', threshold: 0.01 });
  root._thumbIO = io;
  nodes.forEach(n => io.observe(n));
}
// 검색 정규화: 공백 무시 + 소문자 + 흔한 오타(컨→컬)
const exNorm = t => String(t || '').toLowerCase().replace(/\s+/g, '').replace(/컨/g, '컬');
const exCat = e => (window.equipCat ? window.equipCat(e) : '기타');
// 브랜드: '짐80' | '파나타' | '일반'(브랜드 없는 기본 운동) · 설정의 '내 헬스장 기구'는 목록 앞쪽으로
const BRAND_CHIPS = ['전체', '짐80', '파나타', '일반'];
const BRAND_KEY = { 짐80: 'gym80', 파나타: 'panatta' };
const myBrands = () => (Array.isArray(db.profile.gymBrands) ? db.profile.gymBrands : []).filter(b => window.BRANDS && window.BRANDS[b]);
// 내 헬스장(설정)이 있으면 그 헬스장 순서가 먼저: 노비스짐 = 짐80 → 파나타 FO → 프리웨이트·케이블 → 일반 머신 → 다른 파나타
const myGym = () => (window.GYMS && window.GYMS[db.profile.gym]) || null;
const brandRank = e => { const g = myGym(); if (g) return g.rank(e); const m = myBrands(), i = m.indexOf(e.brand); return m.length ? (i >= 0 ? i : m.length) : (e.brand ? 1 : 0); };
const brandTag = e => e.brand ? `<span class="tag brand ${e.brand}">${esc(window.BRANDS[e.brand])} · ${esc(e.seriesKo)}</span>` : '';
function filterEx(q, g = '전체', eq = '전체', br = '전체') {
  const rec = recentIds();
  let list = g === '최근' ? rec.map(exById).filter(e => !e.name.startsWith('알 수 없는')) : allEx();
  if (g !== '전체' && g !== '최근') list = list.filter(e => e.group === g);
  if (eq && eq !== '전체') list = list.filter(e => exCat(e) === eq);
  if (br && br !== '전체') list = list.filter(e => br === '일반' ? !e.brand : e.brand === BRAND_KEY[br]);
  if (!q && g !== '최근' && (myBrands().length || myGym())) list = list.map((e, i) => [brandRank(e), i, e]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(x => x[2]);
  if (q) {
    const s = exNorm(q);
    const score = e => {
      const n = exNorm(e.name), toks = String(e.aka || '').split(/\s+/).map(exNorm);
      if (n === s || toks.includes(s)) return 0;
      if (n.startsWith(s)) return 1;
      if (n.includes(s)) return 2;
      if (toks.some(t => t.startsWith(s))) return 3;
      if (exNorm(e.aka).includes(s)) return 4;
      return (exNorm(e.en) + exNorm(e.group) + exNorm(e.primary)).includes(s) ? 5 : 9;
    };
    list = list.map((e, i) => [score(e), i, e, brandRank(e)]).filter(x => x[0] < 9).sort((a, b) => a[0] - b[0] || a[3] - b[3] || a[1] - b[1]).map(x => x[2]);
  }
  return list;
}
const equipChips = () => ['전체', ...(window.EQUIP_CATS || [])];
function openPicker(onPick) {
  let g = recentIds().length ? '최근' : '전체', q = '', eq = '전체', br = '전체';
  const chips = ['최근', '전체', ...window.GROUPS, '기타'];
  openSheet(`<h2>운동 선택</h2>
    <input class="search" id="pq" placeholder="이름·별명 검색 (예: 팩트플라이, 아웃타이)" autocomplete="off">
    <div class="chip-lbl">부위</div><div class="chips" id="pc"></div>
    <div class="chip-lbl">장비</div><div class="chips" id="pe"></div>
    <div class="chip-lbl">브랜드</div><div class="chips" id="pb"></div>
    <div class="muted small" id="pn" style="margin:0 2px 6px"></div>
    <div id="pl"></div>
    <button class="btn block" id="pcustom" style="margin-top:6px">✏️ 목록에 없는 운동 직접 추가</button>`, body => {
    const draw = () => {
      $('#pc', body).innerHTML = chips.map(c => `<button class="chip ${c === g ? 'on' : ''}" data-c="${c}">${c}</button>`).join('');
      $('#pe', body).innerHTML = equipChips().map(c => `<button class="chip ${c === eq ? 'on' : ''}" data-e="${c}">${c}</button>`).join('');
      $('#pb', body).innerHTML = BRAND_CHIPS.map(c => `<button class="chip ${c === br ? 'on' : ''}" data-b="${c}">${c}</button>`).join('');
      const list = filterEx(q, g, eq, br);
      $('#pn', body).textContent = `${list.length}개 운동${g !== '전체' || eq !== '전체' || br !== '전체' || q ? ` · ${[g !== '전체' ? g : '', eq !== '전체' ? eq : '', br !== '전체' ? br : '', q ? `"${q}"` : ''].filter(Boolean).join(' · ')}` : ''}`;
      $('#pl', body).innerHTML = exListHtml(list, ex => {
        const p = prevSession(ex.id, '9999-12-31');
        return `${brandTag(ex)}${esc(ex.group)}${ex.equip && ex.equip !== ex.group ? ' · ' + esc(ex.equip) : ''}${p ? ` · 최근 ${shortD(p.date)} ${esc(setsText(ex, p.sets.slice(0, 1)))}` : ''}`;
      });
      hydrateThumbs($('#pl', body));
    };
    draw();
    $('#pq', body).addEventListener('input', e => { q = e.target.value.trim(); if (q && g === '최근') g = '전체'; draw(); });
    $('#pc', body).addEventListener('click', e => { const c = e.target.closest('[data-c]'); if (c) { g = c.dataset.c; draw(); } });
    $('#pe', body).addEventListener('click', e => { const c = e.target.closest('[data-e]'); if (c) { eq = c.dataset.e; if (g === '최근') g = '전체'; draw(); } });
    $('#pb', body).addEventListener('click', e => { const c = e.target.closest('[data-b]'); if (c) { br = c.dataset.b; if (g === '최근') g = '전체'; draw(); } });
    $('#pl', body).addEventListener('click', e => { const b = e.target.closest('[data-id]'); if (b) onPick(b.dataset.id); });
    $('#pcustom', body).onclick = () => openCustomForm(onPick, q);
  });
}
function openCustomForm(onPick, name = '') {
  openSheet(`<h2>운동 직접 추가</h2>
    <div class="field"><label>운동 이름</label><input id="cn" value="${esc(name)}" placeholder="예: 스미스머신 스쿼트" maxlength="40"></div>
    <div class="field"><label>부위</label><select id="cg">${[...window.GROUPS, '기타'].map(g => `<option>${g}</option>`).join('')}</select></div>
    <div class="field"><label>기록 방식</label><select id="ct">
      <option value="weight">중량 × 횟수 (kg)</option><option value="bw">맨몸 횟수 (+추가중량)</option><option value="assist">보조 머신 (보조 kg × 횟수)</option><option value="time">시간 (초)</option><option value="cardio">유산소 (분 + 거리 km)</option></select></div>
    <div class="row"><button class="btn ghost" id="cc" style="flex:1">취소</button><button class="btn primary" id="cs" style="flex:2">추가하기</button></div>`, body => {
    $('#cc', body).onclick = closeSheet;
    $('#cs', body).onclick = () => {
      const n = $('#cn', body).value.trim();
      if (!n) return toast('운동 이름을 입력해 주세요');
      if (allEx().some(e => e.name === n)) return toast('같은 이름의 운동이 이미 있어요');
      const t = $('#ct', body).value;
      const ex = { id: 'c_' + Date.now().toString(36), name: n, group: $('#cg', body).value, equip: '직접 추가', type: t, inc: t === 'cardio' ? 0 : 2.5, range: t === 'cardio' ? [20, 40] : [8, 12], custom: true };
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
      (db.workouts[d] || []).forEach(it => { const ex = exById(it.exId); names.push(ex.name); const m = metrics(ex, it.sets); if (m) { sets += m.sets; if (!noVolume(ex)) vol += m.volume; } });
      const t = dayTotals(d);
      return `<button class="list-item" data-d="${d}"><div><div class="t">${labelD(d)}</div>
        ${names.length ? `<div class="s">🏋️ ${esc(names.join(', '))}</div><div class="s">${sets}세트 · 볼륨 ${fmt(vol)}kg</div>` : ''}
        ${t.count ? `<div class="s">🍚 ${fmt(t.kcal)}kcal · 단백질 ${fmt(t.protein)}g</div>` : ''}
        ${db.weights[d] ? `<div class="s">⚖️ ${fmt(db.weights[d])}kg</div>` : ''}</div><span class="chev">›</span></button>`;
    }).join('');
    hl.onclick = e => { const b = e.target.closest('[data-d]'); if (b) { curDate = b.dataset.d; go('#/log'); } };
  } else {
    const ids = recentIds().filter(id => sessionsFor(id).length);
    const lv = ids.map(id => { const ex = exById(id), s = sessionsFor(id), r = pctValue(ex, s[s.length - 1].m); return r ? { ex, r } : null; }).filter(Boolean).sort((a, b) => a.r.top - b.r.top);
    const sum = lv.length ? `<div class="card pct-sum"><h3 style="margin:0 0 6px">📊 종목별 내 수준 <span class="muted small">(최근 기록·추정)</span></h3>
      ${lv.map(({ ex, r }) => `<div class="pct-row"><span>${esc(ex.name)}</span><b>상위 ${r.top}%</b><span class="lv">${r.level}</span></div>`).join('')}
      <p class="small muted" style="margin:8px 0 0">헬스장/앱 이용자 기록 기준 추정 (Strength Level, 같은 성별·체중·나이). 일반인 전체 기준이면 순위는 더 높아요. <a href="#/evidence">근거</a></p></div>`
      : (profStd() ? '' : `<div class="tip" style="margin-bottom:10px">설정에 성별·체중·나이를 넣으면 종목별로 상위 몇 %인지 보여 드려요.</div>`);
    hl.innerHTML = sum + exListHtml(ids.map(exById), ex => {
      const s = sessionsFor(ex.id), last = s[s.length - 1];
      const best = ex.type === 'weight' ? `최고 ${fmt(Math.max(...s.map(x => x.m.top)))}kg` : ex.type === 'assist' ? `최저 보조 ${fmt(Math.min(...s.map(x => x.m.low)))}kg` : ex.type === 'cardio' ? `최장 ${fmt(Math.max(...s.map(x => x.m.totalReps)))}분` : `최고 ${Math.max(...s.map(x => x.m.bestReps))}${unitR(ex)}`;
      return `${s.length}회 기록 · ${best} · 최근 ${shortD(last.date)}`;
    });
    hydrateThumbs(hl);
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
    : ex.type === 'cardio' ? [['totalReps', '시간', '분'], ['dist', '거리', 'km']]
    : ex.type === 'assist' ? [['low', '최저 보조', 'kg'], ['totalReps', '총 횟수', '회'], ['bestReps', '최고 횟수', '회']]
    : [['totalReps', '총 횟수', '회'], ['bestReps', '최고 횟수', '회']];
  const mk = opts.find(o => o[0] === chartMetric[id]) ? chartMetric[id] : opts[0][0];
  const o = opts.find(o => o[0] === mk);
  const bestOf = k => k === 'low' ? Math.min(...s.map(x => x.m[k])) : Math.max(...s.map(x => x.m[k]));
  const last = s[s.length - 1];
  const tgt = nextTarget(ex, last.m);
  body.innerHTML = `
    <div class="stat-grid">
      ${opts.map(op => `<div class="stat"><b>${fmt(bestOf(op[0]))}</b><span>${op[0] === 'low' ? op[1] : '최고 ' + op[1].replace('최고 ', '')}(${op[2]})</span></div>`).join('')}
      ${opts.length < 3 ? `<div class="stat"><b>${s.length}</b><span>기록 횟수</span></div>` : ''}
    </div>
    <div class="seg" id="cm">${opts.map(op => `<button data-k="${op[0]}" class="${op[0] === mk ? 'on' : ''}">${op[1]}</button>`).join('')}</div>
    <div class="chart-wrap">${chartSvg(s.map(x => ({ date: x.date, v: r1(x.m[mk]) })), o[2])}
      ${s.length < 2 ? '<div class="muted small" style="text-align:center">기록이 2번 이상 쌓이면 추세선이 보여요</div>' : ''}</div>
    ${tgt ? `<div class="target" style="margin-bottom:12px">🎯 다음 목표: <b>${esc(tgt)}</b></div>` : ''}
    ${plateauInfo(id, last.date) ? `<div style="margin-bottom:12px">${plateauHtml(plateauInfo(id, last.date), ex)}</div>` : ''}
    ${monthlyLine(ex, last.date)}
    ${pctCard(ex, last.m)}
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
const aliasList = ex => [...new Set(String((ex.base ? exById(ex.base).aka : ex.aka) || '').split(/\s+/).filter(t => t.length >= 2 && !exNorm(ex.name).includes(exNorm(t))))].slice(0, 8);
function incText(ex) {
  const [lo, hi] = progRange(ex), inc = minInc(ex), ld = LOAD_LBL[ex.load] ? `${LOAD_LBL[ex.load]} · ` : '';
  if (ex.type === 'cardio') return `${ld}대화가 조금 힘든 정도(중강도)로 시작해요. 목표 ${hi}분을 채우면 시간 대신 속도·경사·저항을 조금씩 올려요.`;
  if (ex.type === 'time') return `${ld}자세가 무너지기 직전까지 버텨요. 같은 시간을 유지해도 좋고, 여유 있을 때 5초씩 늘려요.`;
  if (ex.type === 'assist') return `${ld}보조 kg이 낮을수록 어려워요. 같은 보조로 모든 세트 ${hi}회를 채우면 보조를 ${fmt(inc)}kg 줄이고 ${lo}회부터 다시 쌓아요.`;
  if (ex.type === 'bw') return `${ld}마지막 1~2회가 힘든 정도로 해요. 모든 세트 ${hi}회를 채우면 ${inc > 0 ? `${fmt(inc)}kg 추가 중량을 달거나 ` : ''}더 어려운 변형으로 바꿔요.`;
  return `${ld}<b>더블 프로그레션</b>: 마지막 1~2회가 힘들지만(여유 1~2회) 자세는 유지되는 무게로 ${lo}~${hi}회. 같은 무게로 <b>모든 세트 ${hi}회</b>가 되면 그때만 ${fmt(inc)}kg 올리고 ${lo}회부터 다시 쌓아요. 매번 오르지 않아도 괜찮아요 — 지난번과 같으면 잘하고 있는 거예요.`;
}
function guideHtml(ex) {
  const safety = `<div class="safety">⚠️ <b>안전 안내</b><br>운동 중 날카롭거나 찌르는 통증, 관절 통증, 저림이 느껴지면 즉시 멈추세요. 통증이 계속되면 의사나 물리치료사 등 전문가와 상담하세요. 처음 하는 동작은 가벼운 무게로 자세부터 익히고, 무거운 무게는 보조자나 안전바를 꼭 사용하세요.</div>`;
  if (!ex.steps) return `<div class="card"><p>직접 추가한 운동이라 운동 방법 가이드가 없어요.</p><p class="muted small">트레이너에게 자세를 확인받는 걸 추천해요.</p></div>${safety}
    ${db.custom.some(c => c.id === ex.id) ? '<button class="btn danger block" id="delCustom" style="margin-top:12px">이 운동 목록에서 삭제</button>' : ''}`;
  return `<div class="guide">
    <div class="card">
      <div class="muted small">${esc(ex.en)} · ${esc(ex.group)} · ${esc(ex.equip)}</div>${ex.brand ? `<div style="margin-top:6px">${brandTag(ex)}</div>` : ''}
      ${aliasList(ex).length ? `<div class="muted small" style="margin-top:4px">🔎 이렇게도 불러요: ${esc(aliasList(ex).join(', '))}</div>` : ''}
      <h3 style="margin-top:10px">🎯 타깃 근육</h3>
      <div><b>주동근</b> ${esc(ex.primary)}</div>${ex.secondary ? `<div class="muted"><b>보조근</b> ${esc(ex.secondary)}</div>` : ''}
    </div>
    ${window.FORMS ? window.FORMS.guideFigureHtml(ex) : ''}
    ${ex.brand ? brandCardHtml(ex) : ''}
    <div class="card"><h3 style="margin-top:0">📋 권장 세트/횟수</h3>
      <div class="rec"><div><span class="muted small">세트</span><b>${esc(ex.rec.sets)}</b></div><div><span class="muted small">${ex.type === 'time' || ex.type === 'cardio' ? '시간' : '횟수'}</span><b>${esc(recReps(ex))}</b></div><div><span class="muted small">휴식</span><b>${esc(ex.rec.rest)}</b></div></div>
      <p class="muted small" style="margin:8px 0 0">${incText(ex)}</p></div>
    <div class="card"><h3 style="margin-top:0">✅ 동작 순서</h3><ol>${ex.steps.map(t => `<li>${esc(t)}</li>`).join('')}</ol></div>
    <div class="card"><h3 style="margin-top:0">🚫 흔한 실수</h3><ul>${ex.mistakes.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
    ${safety}
    <button class="btn primary block" id="addThis" style="margin-top:12px">오늘 기록에 추가</button></div>`;
}
function brandCardHtml(ex) {
  const b = exById(ex.base);
  return `<div class="card brand-card"><h3 style="margin-top:0">🏷️ 이 기구는</h3>
    <p class="small" style="margin:0 0 6px"><b>${esc(window.BRANDS[ex.brand])} ${esc(ex.seriesKo)}</b> (${esc(ex.series)}) · 모델 <b>${esc(ex.model)}</b> <span class="muted">${esc(ex.code)}</span></p>
    ${ex.note ? `<p class="small" style="margin:0 0 6px">✨ ${esc(ex.note)}</p>` : ''}
    <p class="small" style="margin:0 0 6px">💡 ${esc(ex.generic)}</p>
    <p class="small muted" style="margin:0">동작은 <a href="#/ex/${encodeURIComponent(b.id)}/guide">${esc(b.name)}</a>와 같아요. 처음엔 의자·패드 높이를 맞추고 가볍게 동작 범위부터 확인해 보세요. 출처: ${esc(ex.src)}</p></div>`;
}
function bindGuide(ex) {
  if (window.FORMS) window.FORMS.start(app, ex);
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
  app.innerHTML = `<input class="search" id="gq" placeholder="운동 검색 (예: 핵스쿼트, 펙덱, 이두)" value="${esc(guideQuery)}" autocomplete="off">
    <div class="chip-lbl">부위</div><div class="chips" id="gc"></div><div class="chip-lbl">장비</div><div class="chips" id="ge"></div>
    <div class="chip-lbl">브랜드</div><div class="chips" id="gb"></div>
    <div class="muted small" id="gn" style="margin:0 2px 6px"></div><div id="gl"></div>`;
  const draw = () => {
    $('#gc').innerHTML = chips.map(c => `<button class="chip ${c === guideFilter ? 'on' : ''}" data-c="${c}">${c}</button>`).join('');
    $('#ge').innerHTML = equipChips().map(c => `<button class="chip ${c === guideEquip ? 'on' : ''}" data-e="${c}">${c}</button>`).join('');
    $('#gb').innerHTML = BRAND_CHIPS.map(c => `<button class="chip ${c === guideBrand ? 'on' : ''}" data-b="${c}">${c}</button>`).join('');
    const list = filterEx(guideQuery, guideFilter, guideEquip, guideBrand);
    $('#gn').textContent = `${list.length}개 운동${myBrands().length ? ` · 내 헬스장 기구(${myBrands().map(b => window.BRANDS[b]).join('·')}) 먼저` : ''}`;
    $('#gl').innerHTML = exListHtml(list, ex => brandTag(ex) + [ex.group, ex.equip !== ex.group ? ex.equip : '', ex.primary].filter(Boolean).map(esc).join(' · '));
    hydrateThumbs($('#gl'));
  };
  draw();
  $('#gq').addEventListener('input', e => { guideQuery = e.target.value.trim(); draw(); });
  $('#gc').onclick = e => { const c = e.target.closest('[data-c]'); if (c) { guideFilter = c.dataset.c; draw(); } };
  $('#ge').onclick = e => { const c = e.target.closest('[data-e]'); if (c) { guideEquip = c.dataset.e; draw(); } };
  $('#gb').onclick = e => { const c = e.target.closest('[data-b]'); if (c) { guideBrand = c.dataset.b; draw(); } };
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
    ${gymCardHtml()}
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
    <p class="muted small" style="text-align:center;margin-top:16px">핏로그 v11 · 상우님 전용 💪</p>`;
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
  bindGymCard();
  let mode = 'merge';
  $('#impMerge').onclick = () => { mode = 'merge'; $('#impFile').click(); };
  $('#impReplace').onclick = () => { mode = 'replace'; $('#impFile').click(); };
  $('#impFile').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (!validDb(d)) throw new Error('형식');
      const inc = normalize(d);
      if (mode === 'replace') { if (!await appConfirm('지금 기록을 모두 지우고 백업으로 바꿀까요?')) return; db = inc; }
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
        if (!db.routine && inc.routine) db.routine = inc.routine;
      }
      save(); toast(`불러왔어요! (운동 ${Object.keys(inc.workouts).length}일 · 식단 ${Object.keys(inc.meals).length}일)`); renderSettings();
    } catch (err) { toast('백업 파일을 읽을 수 없어요. 핏로그 JSON 파일인지 확인해 주세요'); }
    e.target.value = '';
  };
  $('#wipe').onclick = async () => {
    if (!await appConfirm('정말 모든 기록을 삭제할까요? 되돌릴 수 없어요.')) return;
    if (!await appConfirm('마지막 확인: 백업은 해두셨나요? 삭제할게요.')) return;
    db = emptyDb(); save(); toast('모두 삭제했어요'); renderSettings();
  };
}

// ───────── 근거 화면
const REFS = [
  { k: 'msj', t: 'Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO. A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr. 1990;51(2):241–247.', doi: '10.1093/ajcn/51.2.241' },
  { k: 'morton', t: 'Morton RW, Murphy KT, McKellar SR, et al. A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults. Br J Sports Med. 2018;52(6):376–384.', doi: '10.1136/bjsports-2017-097608' },
  { k: 'issn', t: 'Jäger R, Kerksick CM, Campbell BI, et al. International Society of Sports Nutrition Position Stand: protein and exercise. J Int Soc Sports Nutr. 2017;14:20.', doi: '10.1186/s12970-017-0177-8' },
  { k: 'acsm', t: 'American College of Sports Medicine. American College of Sports Medicine position stand. Progression models in resistance training for healthy adults. Med Sci Sports Exerc. 2009;41(3):687–708.', doi: '10.1249/MSS.0b013e3181915670' },
  { k: 'plotkin', t: 'Plotkin D, Coleman M, Van Every D, et al. Progressive overload without progressing load? The effects of load or repetition progression on muscular adaptations. PeerJ. 2022;10:e14142.', doi: '10.7717/peerj.14142' },
  { k: 'rir', t: 'Helms ER, Cronin J, Storey A, Zourdos MC. Application of the repetitions in reserve-based rating of perceived exertion scale for resistance training. Strength Cond J. 2016;38(4):42–49.', doi: '10.1519/SSC.0000000000000218' },
  { k: 'zourdos', t: 'Zourdos MC, Klemp A, Dolan C, et al. Novel resistance training–specific rating of perceived exertion scale measuring repetitions in reserve. J Strength Cond Res. 2016;30(1):267–275.', doi: '10.1519/JSC.0000000000001049' },
  { k: 'deload', t: 'Bell L, Strafford BW, Coleman M, Androulakis Korakakis P, Nolan D. Integrating deloading into strength and physique sports training programmes: an international Delphi consensus approach. Sports Med Open. 2023;9:87.', doi: '10.1186/s40798-023-00633-0' },
  { k: 'vol', t: 'Schoenfeld BJ, Ogborn D, Krieger JW. Dose-response relationship between weekly resistance training volume and increases in muscle mass: a systematic review and meta-analysis. J Sports Sci. 2017;35(11):1073–1082.', doi: '10.1080/02640414.2016.1210197' },
  { k: 'freq', t: 'Schoenfeld BJ, Ogborn D, Krieger JW. Effects of resistance training frequency on measures of muscle hypertrophy: a systematic review and meta-analysis. Sports Med. 2016;46(11):1689–1697.', doi: '10.1007/s40279-016-0543-8' },
  { k: 'helms', t: 'Helms ER, Aragon AA, Fitschen PJ. Evidence-based recommendations for natural bodybuilding contest preparation: nutrition and supplementation. J Int Soc Sports Nutr. 2014;11:20.', doi: '10.1186/1550-2783-11-20' },
];
const DATA_SRCS = [
  ['농촌진흥청 국가표준식품성분표 제10개정판', '공공데이터포털 15137343 (파일 데이터, 3,310개 식품, 100g당). 일부 항목은 성분표가 국립수산과학원·USDA·일본식품성분표 값을 인용한 것이고, 앱에 원출처를 함께 적었어요.', 'https://www.data.go.kr/data/15137343/fileData.do'],
  ['식품의약품안전처 통합식품영양성분정보(음식)', '공공데이터포털 15100070. 외식·가정식 음식의 100g(ml)당 값과 1인분 중량. 찌개·볶음 등 섞인 음식은 추정치로 표시해요.', 'https://www.data.go.kr/data/15100070/fileData.do'],
  ['식품의약품안전처 통합식품영양성분정보(가공식품)', '공공데이터포털 15100066. 시판 닭가슴살·조미김·삼각김밥처럼 제품마다 다른 음식은 같은 종류 제품 여러 개의 100g당 중앙값을 써요.', 'https://www.data.go.kr/data/15100066/fileData.do'],
  ['USDA FoodData Central (SR Legacy)', '국내 자료에 없는 조리 상태(오븐에 구운 닭가슴살 등)와 웨이 프로틴·땅콩버터 등.', 'https://fdc.nal.usda.gov/'],
  ['버거킹 공식 영양정보', 'burgerking.co.kr 현재 메뉴의 중량·열량·단백질(및 당류·포화지방·나트륨·카페인). 한국 외식 영양표시 관례상 총 탄수화물·총 지방은 표에 없는 항목이 많아요. 확인일 2026-11-11.', 'https://www.burgerking.co.kr/'],
  ['맥도날드 공식 영양분석표', 'mcdonalds.co.kr 제품 영양분석표(표 수정일 2026.11.11). 중량·열량·단백질·포화지방·당·나트륨·카페인. 세트 열량이 범위로만 나온 항목은 값을 고르지 않아 빼 두었어요.', 'https://www.mcdonalds.co.kr/kor/menu/information/nutrition'],
  ['롯데리아 공식 영양성분표', 'lotteeatz.com 영양성분표(게시 2026.10.29). 중량·열량·단백질 등. 세트 열량 범위는 빼 두었어요.', 'https://www.lotteeatz.com/upload/etc/ria/items.html'],
  ['스타벅스 공식 메뉴 영양정보', 'starbucks.co.kr 음료·푸드 영양정보(음료는 Tall 사이즈 기준). 열량·단백질·탄수화물·지방. 확인일 2026-11-11.', 'https://www.starbucks.co.kr/menu/drink_list.do'],
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
    <div class="card ev"><h3>📈 무게는 언제 올리나요? (더블 프로그레션)</h3>
      <p class="small">매번 무게나 횟수를 올려야 하는 건 아니에요. 앱은 <b>정해진 반복 범위</b>(다관절 프리웨이트 6~10회, 머신 다관절 8~12회, 고립 10~15회 · 원래 12회 이상인 종목은 그대로) 안에서 <b>같은 무게로 모든 작업 세트가 범위 위쪽에 닿으면</b> 그때만 기구의 최소 단위(바벨 2.5kg, 덤벨 1~2kg, 머신 5kg 등)를 올리고 아래쪽부터 다시 쌓게 해요. 미국스포츠의학회(ACSM) 입장문은 목표 횟수를 1~2회 넘길 수 있을 때 2~10% 올리는 방식을 권해요${ref('acsm')}. 무게 대신 횟수를 늘려도 근비대·근력 향상이 비슷했다는 연구도 있어요${ref('plotkin')}.</p>
      <p class="small">강도는 <b>여유 1~2회(RIR)</b>를 남기는 정도를 기준으로 해요${ref('rir')}${ref('zourdos')}. 지난번과 같은 기록은 실패가 아니라 정상적인 과정이에요.</p>
      <p class="small"><b>정체</b>: 예상 1RM·최고 중량이 <b>4번 이상, 그리고 3주(21일) 이상</b> 그대로일 때만 알려 드려요. 먼저 잠·식사를 점검하고, 같은 무게로 2주 더 해 본 뒤, 그래도 같으면 1주 정도 가볍게(약 10%↓) 하는 <b>디로드</b>를 권해요. 전문가 합의에서도 디로드는 피로를 풀고 다음 훈련을 준비하는 짧은 기간으로 정의돼요${ref('deload')}.</p>
      <p class="small"><b>이번 달 기대치</b>: 초보는 하체 다관절 예상 1RM이 한 달 약 +2.5~5kg, 상체는 +1~2.5kg 정도, 중급으로 갈수록 느려져요. 이 값은 자연 운동인의 일반적인 속도를 정리한 <b>대략적인 코칭 값</b>이고, 특정 연구의 수치가 아니에요. 개인차(수면·식사·나이·운동 경력)가 커요.</p></div>
    <div class="card ev"><h3>📊 상위 몇 %는 어떻게 계산하나요?</h3>
      <p class="small"><b>Strength Level</b>(strengthlevel.com) 표준표를 써요. 사용자들이 직접 올린 기록(예: 벤치프레스 약 ${fmt(4871)}만 건, 데이터 기준일 ${esc(window.STD ? window.STD.cut : '2026년 3월')})으로 만든 표로, 성별·체중별·나이별로 Beginner(상위 95%)·Novice(80%)·Intermediate(50%)·Advanced(20%)·Elite(5%) 기준 무게가 나와 있어요. 앱의 단계 이름은 Beginner 미만 <b>입문</b>, Beginner~Novice <b>초보</b>, Novice~Intermediate <b>초중급</b>, Intermediate~Advanced <b>중급</b>, Advanced~Elite <b>상급</b>, Elite 이상 <b>최상급</b>이에요. 앱은 내 체중·나이에 맞게 표를 보간하고, 그 사이를 직선으로 이어 <b>예상 1RM(Epley 공식)</b>이 어디쯤인지 추정해요. 덤벨 종목은 한 손 덤벨 무게 기준, 풀업·친업·딥스·푸시업은 맨몸 최고 횟수 기준이에요.</p>
      <p class="small"><b>주의</b>: 이 순위는 <b>헬스장/앱 이용자 기록 기준</b>이에요. 기록을 올리는 사람은 보통 운동을 꾸준히 하는 편이라, 운동을 안 하는 사람까지 포함한 일반인 기준이면 순위가 더 높게 나와요. 머신·케이블은 기구마다 무게 감각이 달라 오차가 커요. 표가 없는 종목은 표시하지 않아요 (${window.STD ? Object.keys(window.STANDARDS.map).length : 0}개 종목 지원).</p>
      <p class="small"><b>비훈련자 참고값</b>: 벤치·스쿼트·데드리프트·오버헤드프레스는 <b>ExRx</b>의 성인 비훈련자(Untrained, 18~39세) 1RM 표와도 비교해 드려요. ExRx 스스로 이 표는 인구 통계(규준)가 아니라고 밝히고 있어서 <b>순위가 아닌 참고값</b>으로만 보여 줘요.</p>
      <p class="small"><a href="https://strengthlevel.com/strength-standards" target="_blank" rel="noopener">strengthlevel.com/strength-standards</a><br><a href="https://exrx.net/Testing/WeightLifting/StrengthStandards" target="_blank" rel="noopener">exrx.net/Testing/WeightLifting/StrengthStandards</a></p></div>
    <div class="card ev"><h3>🖼️ 자세 그림</h3><p class="small">자세 그림은 앱이 직접 그린 단순화한 그림이에요(인터넷 없이 동작). 관절 각도·움직임 경로는 일반적인 동작 설명을 바탕으로 했고, 사람마다 체형에 따라 바른 자세가 조금씩 달라요. 처음 하는 동작은 트레이너에게 확인받는 걸 추천해요.</p></div>
    <div class="card ev"><h3>📋 추천 루틴은 어떻게 짰나요?</h3>
      <p class="small"><b>주간 세트</b>: 주당 세트 수와 근육 증가의 관계를 본 메타분석에서, 세트가 많을수록 근육이 더 늘어나는 용량-반응 관계가 나타났고 근육마다 <b>주 10세트 이상</b>이 그보다 적은 경우보다 효과가 컸어요${ref('vol')}. 앱은 부위마다 <b>주 10~20세트</b>를 기본 범위로 써요 — 20세트 위쪽은 이 연구의 값이 아니라 회복을 고려한 일반적인 코칭 상한이에요.</p>
      <p class="small"><b>빈도</b>: 같은 양을 기준으로 부위마다 <b>주 2번 이상</b> 훈련하는 쪽이 주 1번보다 근비대에 유리했어요${ref('freq')}. 그래서 3·4·5회 루틴 모두 큰 부위를 주 2번씩 넣었어요.</p>
      <p class="small"><b>세트 세는 법</b>: 그 부위가 주동근이면 1세트, 보조근이면 0.5세트로 세요. 0.5는 널리 쓰이는 어림 규칙이고 정확한 값은 아니에요. 반복 범위·휴식은 위의 더블 프로그레션 규칙과 같아요(다관절 머신 1분 30초~2분, 고립 1~1분 30초).</p></div>
    <div class="card ev"><h3>🏷️ 짐80·파나타 기구 목록 출처</h3>
      <p class="small">모델명과 모델 번호는 아래 자료에 실린 것만 넣었어요. 헬스장마다 갖춘 기구·연식이 달라서 이름이 조금 다를 수 있어요. 동작 방법·자세 그림은 같은 동작의 기본 운동과 같고, 상위 %는 같은 종류 기구 표가 맞는 경우(주로 핀 머신, 레그프레스·핵스쿼트 등)만 보여 줘요.</p>
      <p class="small"><b>gym80</b> 종합 브로슈어 2025 (Sygnum · Pure Kraft)<br><a href="https://gym80.ch/wp-content/uploads/2026/08/GESAMTBROSCHUeRE-WEB-2025-GESAMT.pdf" target="_blank" rel="noopener">gym80.ch 브로슈어 PDF</a> · <a href="https://www.gym80.de" target="_blank" rel="noopener">gym80.de</a></p>
      <p class="small"><b>Panatta</b> 공식 사이트 Freeweight Special 목록, Freeweight HP 카탈로그, 공식 판매처 목록(Fit Evo · HP · Special · 신형 Freeweight One 모델 번호)<br><a href="https://www.panattasport.com/en/free-weight-special/" target="_blank" rel="noopener">panattasport.com</a> · <a href="https://panattafitness.com/product-category/fit-evo/" target="_blank" rel="noopener">panattafitness.com</a> · <a href="https://panattafitness.com/product-category/freeweight-one/" target="_blank" rel="noopener">Freeweight One 목록</a></p>
      <p class="small">📍 <b>노비스짐 교동점</b> 기구는 당근 지점 프로필 글·사진, 짐80코리아 오피셜센터 목록에서 확인했어요. <a href="#/gym">기구 목록·출처 보기</a></p>
      <p class="small muted">브랜드 기구 ${(window.BRAND_EX || []).length}개 · 짐80 ${(window.BRAND_EX || []).filter(e => e.brand === 'gym80').length} · 파나타 ${(window.BRAND_EX || []).filter(e => e.brand === 'panatta').length}</p></div>
    <div class="card ev"><h3>🍱 음식 데이터 출처</h3>
      ${DATA_SRCS.map(s => `<p class="small"><b>${s[0]}</b><br>${s[1]}<br><a href="${s[2]}" target="_blank" rel="noopener">${s[2]}</a></p>`).join('')}
      <p class="small">공공 DB 음식은 100g(음료·국물은 100ml)당으로 저장해요. 브랜드 공식 메뉴는 1회 제공량(단품 1개, 세트 1개, Tall 1잔 등) 값을 쓰기도 해요. 총 탄수화물·총 지방이 공식 표에 없으면 그 칸은 비워 두고 출처에 적어 두어요. "한 줌", "1봉" 같은 분량은 제품 표시중량, 식약처 1인분 중량, 일반 계량 기준이고, <b>약</b>이 붙은 분량은 어림값이에요. 한 번 기록한 양은 다음에 같은 음식을 고를 때 그대로 기억해요.</p>
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
// brand_foods.js 의 each:true 항목은 k/p/c/f 가 1회 제공량당이에요(세트·감튀처럼 공식 중량이 없을 때).
// 옛 방식(1회 제공량당 값) 직접입력 음식은 per100이 없으므로 "인분" 단위로만 다뤄요.
const allFoods = () => [...window.FOODS, ...db.customFoods];
const foodById = id => allFoods().find(f => f.id === id);
const per100 = f => f && f.k != null ? { kcal: f.k, protein: f.p, carbs: f.c, fat: f.f } : null;
const uOf = f => (f && f.unit) || 'g';
const porLbl = (f, p) => /\d/.test(p[0]) && p[0].includes(String(p[1])) ? p[0].replace(/≈$/, '') : `${p[0].replace(/≈$/, '')} (${p[0].endsWith('≈') ? '약 ' : ''}${fmt(p[1])}${uOf(f)})`;
const SRC_LBL = { '농진청': '농촌진흥청 국가표준식품성분표', '식약처': '식약처 식품영양성분DB(음식)', '식약처 제품': '식약처 가공식품DB', 'USDA': 'USDA FoodData Central', '직접 입력': '직접 입력', '버거킹': '버거킹 공식 영양정보', '맥도날드': '맥도날드 공식 영양분석표', '롯데리아': '롯데리아 공식 영양성분표', '스타벅스': '스타벅스 공식 메뉴 영양정보' };
const fmtMac = n => (n == null || Number.isNaN(Number(n))) ? '—' : fmt(n);
const scaleMac = (v, factor) => v == null ? null : v * factor;
function macrosFor(f, g) {
  const v = per100(f);
  const factor = f.each ? g : g / 100;
  return { kcal: scaleMac(v.kcal, factor), protein: scaleMac(v.protein, factor), carbs: scaleMac(v.carbs, factor), fat: scaleMac(v.fat, factor) };
}
function defaultAmt(f) {
  const last = db.lastAmt[f.id];
  if (last && last.g > 0) return { ...last };
  if (!per100(f)) return { n: 1 };
  const p = (f.por || [])[0];
  return p ? { p: 0, n: 1, g: p[1] } : { g: 100 };
}
function foodSub(f) {
  if (!per100(f)) return `${esc(f.serving)} · ${fmt(f.kcal)}kcal · 단백질 ${fmt(f.protein)}g`;
  const p = (f.por || [])[0], g = p ? p[1] : (f.each ? 1 : 100), m = macrosFor(f, g);
  const kcalTxt = m.kcal != null && m.kcal >= 10 ? Math.round(m.kcal).toLocaleString('ko-KR') : fmtMac(m.kcal);
  return `${p ? esc(porLbl(f, p)) : (f.each ? '1회' : `100${uOf(f)}`)} ${kcalTxt}kcal · 단 ${fmtProtein(m.protein, f)}g <span class="src-tag">${esc(f.src || '')}${f.pEst || f.est ? '·추정' : ''}</span>`;
}
function fmtProtein(n, f) {
  const base = fmtMac(n);
  return (base !== '—' && f && f.pEst) ? '≈' + base : base;
}
let foodCat = null;
function renderDiet() {
  setTitle(curDate === todayStr() ? '오늘의 식단' : '식단 기록');
  const meals = db.meals[curDate] || [];
  const w = db.weights[curDate];
  syncSelDate('diet');
  app.innerHTML = `${dateBarHtml()}
    ${selBarHtml('diet', meals.length)}
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
        ${es.map(({ e, i }) => `<button class="food-row${SEL.diet.on ? ' sel-mode' : ''}${SEL.diet.on && SEL.diet.set.has(i) ? ' sel-on' : ''}" data-i="${i}">${SEL.diet.on ? '<span class="sel-box" aria-hidden="true"></span>' : ''}<div style="flex:1"><div class="t">${esc(e.name)}</div><div class="s">${esc(e.serving)}${e.qty !== 1 ? ` × ${fmt(e.qty)}` : ''}</div></div>
          <div class="r"><b>${fmt(e.kcal * e.qty)}</b><span>kcal</span><div class="s">단 ${fmt(e.protein * e.qty)}g</div></div></button>`).join('')}
        <button class="btn sm block ghost add-food" data-meal="${m}">＋ ${m} 추가</button></section>`;
    }).join('')}
    <button class="btn block" id="pasteBtn">📋 코치 데이터 붙여넣기</button>
    <p class="muted small" style="margin:12px 4px">ⓘ 음식 값은 농촌진흥청 국가표준식품성분표·식약처 식품영양성분DB·USDA 자료의 100g당 값이에요. 같은 음식도 조리법·제품·양에 따라 달라요. <a href="#/evidence">근거 보기</a></p>`;
  bindDateBar(renderDiet);
  bindSelBar($('.selbar'), 'diet', {
    redraw: renderDiet,
    selectAll: () => { (db.meals[curDate] || []).forEach((_, i) => SEL.diet.set.add(i)); },
    del: async () => {
      const idxs = [...SEL.diet.set];
      if (!idxs.length) return;
      if (!await appConfirm(`선택한 ${idxs.length}개 음식을 삭제할까요?`)) return;
      const snap = (db.meals[curDate] || []).map(e => ({ ...e }));
      db.meals[curDate] = (db.meals[curDate] || []).filter((_, i) => !SEL.diet.set.has(i));
      if (!db.meals[curDate].length) delete db.meals[curDate];
      save(); await exitSelect('diet');
      toast(`${idxs.length}개 음식을 삭제했어요`, { lbl: '실행 취소', fn: () => { db.meals[curDate] = snap; save(); renderDiet(); toast('되돌렸어요'); } });
    }
  });
  app.querySelectorAll('.add-food').forEach(b => b.onclick = () => openFoodPicker(b.dataset.meal));
  app.querySelectorAll('.food-row').forEach(b => {
    const iOf = () => +b.dataset.i;
    bindLongPress(b, { onLong: () => { SEL.diet.set.add(iOf()); enterSelect('diet', renderDiet); } });
    b.onclick = () => {
      const i = iOf();
      if (SEL.diet.on) {
        if (SEL.diet.set.has(i)) SEL.diet.set.delete(i); else SEL.diet.set.add(i);
        renderDiet();
        return;
      }
      const e = db.meals[curDate][i];
      openAmount({ ...e }, { meal: e.meal, editIndex: i });
    };
  });
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
const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
function choStr(s) {
  return [...String(s || '')].map(ch => {
    const c = ch.codePointAt(0);
    if (c >= 0xAC00 && c <= 0xD7A3) return CHO[Math.floor((c - 0xAC00) / 588)];
    return /[\s·()]/.test(ch) ? '' : ch.toLowerCase();
  }).join('');
}
function searchFoods(q, list = allFoods()) {
  const s = norm(q); if (!s) return list;
  const choOnly = /^[ㄱ-ㅎ0-9]+$/.test(s) && s.length >= 2;
  const scored = [];
  for (const f of list) {
    const n = norm(f.name), a = norm(f.aka) + norm(f.cat), words = String(f.aka || '').toLowerCase().split(/\s+/);
    let sc = n === s ? 0 : words.includes(s) ? 1 : n.startsWith(s) ? 2 : n.includes(s) ? 3 : a.includes(s) ? 4 : -1;
    if (sc < 0 && choOnly) {
      const cn = choStr(f.name), ca = choStr(f.aka || '');
      if (cn.includes(s) || ca.includes(s)) sc = 5;
    }
    if (sc < 0) continue;
    const bare = n.replace(/^(버거킹|맥도날드|롯데리아|스타벅스)/, '');
    const exactBare = bare === s ? 0 : 1;
    const setPen = (!s.includes('세트') && n.includes('세트')) ? 1 : 0;
    scored.push([sc, exactBare, setPen, n.length, scored.length, f]);
  }
  return scored.sort((x, y) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2] || x[3] - y[3] || x[4] - y[4]).map(x => x[5]);
}
function openFoodPicker(meal) {
  let q = '';
  let cat = foodCat || (recentFoods().length ? '최근' : '전체');
  const chips = ['최근', '즐겨찾기', '내 음식', '전체', ...window.FOOD_CATS];
  openSheet(`<h2>${meal}에 음식 추가</h2>
    <input class="search" id="fq" placeholder="음식 검색 (예: 몬스터와퍼, 감튀, 닭가슴살)" autocomplete="off">
    <div class="chips" id="fc"></div><div id="fl"></div>
    <button class="btn block" id="fcustom" style="margin-top:6px">✏️ 목록에 없어요 · 직접 입력</button>`, body => {
    let shown = [];
    const draw = () => {
      $('#fc', body).innerHTML = chips.map(c => `<button class="chip ${c === cat ? 'on' : ''}" data-c="${c}">${c}</button>`).join('');
      let list = cat === '최근' ? recentFoods() : cat === '즐겨찾기' ? db.favFoods.map(foodById).filter(Boolean) : cat === '내 음식' ? db.customFoods : cat === '전체' ? allFoods() : allFoods().filter(f => f.cat === cat);
      if (q) list = searchFoods(q);
      shown = list;
      $('#fl', body).innerHTML = list.slice(0, q ? 400 : 120).map((f, i) => `<button class="list-item" data-k="${i}"><div><div class="t">${db.favFoods.includes(f.id) ? '⭐ ' : ''}${esc(f.name)}</div><div class="s">${foodSub(f)}</div></div><span class="chev">＋</span></button>`).join('')
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
  const basis = f.each ? '1회 제공량당' : `100${u}당`;
  return `<div class="srcbox small">
    <div><b>${basis}</b> ${fmtMac(v.kcal)}kcal · 단백질 ${fmtProtein(v.protein, f)}g · 탄수 ${fmtMac(v.carbs)}g · 지방 ${fmtMac(v.fat)}g</div>
    ${f.state ? `<div>상태: ${esc(f.state)}</div>` : ''}
    <div class="muted">출처: ${f.src === '식약처 제품' ? esc(f.srcNote) : `${esc(SRC_LBL[f.src] || f.src || '')}${f.srcName ? ` — ${esc(f.srcName)}` : ''}${f.srcNote && f.src !== '직접 입력' ? `<br>${esc(f.srcNote)}` : ''}`}</div>
    ${f.pEst ? '<div class="warn">단백질은 추정값이에요(≈). 칼로리는 공식 값 그대로예요.</div>' : ''}
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
      ${f.each ? '' : `<button class="chip" data-p="g100">100${u}</button>`}</div></div>
    <div class="field" id="anf"><label>개수</label>
      <div class="stepper"><button class="btn" data-d="-0.5">−</button><input id="an" type="number" inputmode="decimal" step="0.5" min="0.25"><button class="btn" data-d="0.5">＋</button></div></div>
    ${f.each ? '' : `<div class="field"><label>또는 정확한 양 (${u})</label><div class="row"><input id="ag" class="num-in" type="number" inputmode="decimal" min="0" step="1" placeholder="예: 150"><span class="muted">${u}</span></div></div>`}
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
      const ag = $('#ag', body);
      if (ag && fromInput !== 'g') ag.value = g ? r1(g) : '';
      $('#atot', body).innerHTML = `<div class="small muted" style="margin-bottom:6px">${g ? `총 <b id="agt">${fmt(g)}${u}</b>${a.p != null ? ` = ${esc(porLbl(f, por[a.p]))} × ${fmt(a.n)}` : ''}` : '양을 골라 주세요'}</div>
        <div class="macro-grid four"><div><span class="muted small">칼로리</span><b id="akc">${fmtMac(mm.kcal)}</b></div><div><span class="muted small">단백질${f.pEst ? ' <span class="est-badge">추정</span>' : ''}</span><b id="apr">${fmtProtein(mm.protein, f)}g</b></div><div><span class="muted small">탄수</span><b>${fmtMac(mm.carbs)}g</b></div><div><span class="muted small">지방</span><b>${fmtMac(mm.fat)}g</b></div></div>`;
      $('#afav', body).textContent = db.favFoods.includes(f.id) ? '⭐ 즐겨찾기 해제' : '☆ 즐겨찾기에 추가';
    };
    draw();
    $('#ap', body).onclick = ev => { const c = ev.target.closest('[data-p]'); if (!c) return; if (c.dataset.p === 'g100') a = { g: 100 }; else a = { p: +c.dataset.p, n: a.p === +c.dataset.p ? a.n : 1 }; draw(); };
    body.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { a.n = Math.max(0.25, Math.round((a.n + +b.dataset.d) * 4) / 4); draw(); });
    $('#an', body).addEventListener('input', ev => { const v = Number(ev.target.value); if (v > 0) { a.n = v; draw('n'); $('#an', body).value = ev.target.value; } });
    const agIn = $('#ag', body); if (agIn) agIn.addEventListener('input', ev => { const v = Number(ev.target.value); if (v > 0) { a = { g: v }; draw('g'); } });
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
    ${selBarHtml('weight', ks.length)}
    ${ks.slice().reverse().map(d => `<div class="list-item${SEL.weight.on ? ' sel-mode' : ''}${SEL.weight.on && SEL.weight.set.has(d) ? ' sel-on' : ''}" data-wsel="${d}">${SEL.weight.on ? '<span class="sel-box" aria-hidden="true"></span>' : ''}<div style="flex:1"><div class="t">${labelD(d)}</div><div class="s">7일 평균 ${fmt(avg7(d))}kg</div></div><div class="row"><b>${fmt(db.weights[d])}kg</b>${SEL.weight.on ? '' : `<button class="mini del" data-wdel="${d}" aria-label="삭제" style="width:44px">✕</button>`}</div></div>`).join('')}`;
}
function bindWeightSection(el, rerender) {
  bindSelBar(el.querySelector('.selbar'), 'weight', {
    redraw: rerender,
    selectAll: () => { Object.keys(db.weights).forEach(d => SEL.weight.set.add(d)); },
    del: async () => {
      const dates = [...SEL.weight.set];
      if (!dates.length) return;
      if (!await appConfirm(`선택한 ${dates.length}개 체중 기록을 삭제할까요?`)) return;
      const snap = { ...db.weights };
      dates.forEach(d => delete db.weights[d]);
      save(); await exitSelect('weight');
      toast(`${dates.length}개 체중 기록을 삭제했어요`, { lbl: '실행 취소', fn: () => {
        Object.keys(db.weights).forEach(k => delete db.weights[k]);
        Object.assign(db.weights, snap);
        save(); rerender(); toast('되돌렸어요');
      } });
    }
  });
  el.querySelectorAll('[data-wsel]').forEach(row => {
    bindLongPress(row, {
      ignore: e => !!e.target.closest('[data-wdel]'),
      onLong: () => { SEL.weight.set.add(row.dataset.wsel); enterSelect('weight', rerender); }
    });
    if (SEL.weight.on) {
      row.addEventListener('click', e => {
        if (e.target.closest('[data-wdel]')) return;
        const d = row.dataset.wsel;
        if (SEL.weight.set.has(d)) SEL.weight.set.delete(d); else SEL.weight.set.add(d);
        rerender();
      });
    }
  });
  el.querySelectorAll('[data-wdel]').forEach(b => b.onclick = async () => { if (await appConfirm(`${labelD(b.dataset.wdel)} 체중 기록을 지울까요?`)) { delete db.weights[b.dataset.wdel]; save(); rerender(); } });
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
  return allEx().find(e => normName(e.name) === n || normName(e.en) === n || e.id === name) || allEx().find(e => String(e.aka || '').split(/\s+/).some(t => t && normName(t) === n)) || null;
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

// ───────── 루틴 (추천 템플릿 + 내 루틴 편집 + 오늘 시작)
// 템플릿 칸: [후보 운동 id(앞쪽 우선), 세트 수]. '내 헬스장 기구'가 켜져 있으면 후보 중 그 브랜드 기구로 자동으로 바꿔요.
const RT_TPL = [
  { id: 'full3', name: '주 3회 전신', freq: 3, desc: '하루씩 쉬면서 (예: 월·수·금). 바쁜 주나 컨디션이 떨어질 때도 좋아요.', days: [
    { name: '전신 A', items: [[['chest_press', 'machine_bench'], 4], [['lat_pulldown', 'iso_lat_pulldown'], 3], [['hack_squat', 'leg_press'], 4], [['seated_leg_curl', 'lying_leg_curl'], 4], [['machine_lateral'], 3], [['tri_ext_machine', 'triceps_pushdown'], 2]] },
    { name: '전신 B', items: [[['incline_machine_press'], 3], [['machine_row', 'low_row', 'seated_row'], 3], [['leg_press', 'horizontal_leg_press'], 3], [['hip_thrust_machine'], 4], [['machine_lateral'], 2], [['machine_preacher'], 2], [['rear_delt'], 2]] },
    { name: '전신 C', items: [[['machine_shoulder_press', 'hs_shoulder_press'], 3], [['high_row', 'lat_pulldown'], 3], [['pendulum_squat', 'hack_squat'], 3], [['lying_leg_curl', 'seated_leg_curl'], 3], [['pec_deck'], 3], [['seated_calf', 'calf_raise'], 3]] },
  ] },
  { id: 'ul4', name: '주 4회 상체/하체', freq: 4, desc: '상체·하체를 번갈아 (예: 월·화·목·금). 모든 부위를 주 2번씩 해요.', days: [
    { name: '상체 A', items: [[['chest_press', 'machine_bench'], 3], [['lat_pulldown', 'iso_lat_pulldown'], 3], [['incline_machine_press'], 3], [['machine_row', 'low_row', 'seated_row'], 3], [['machine_lateral'], 4], [['tri_ext_machine', 'triceps_pushdown'], 2], [['machine_preacher'], 2]] },
    { name: '하체 A', items: [[['hack_squat', 'leg_press'], 3], [['seated_leg_curl', 'lying_leg_curl'], 4], [['leg_ext'], 3], [['hip_thrust_machine'], 3], [['seated_calf', 'calf_raise'], 3]] },
    { name: '상체 B', items: [[['machine_shoulder_press', 'hs_shoulder_press'], 3], [['high_row', 'iso_lat_pulldown'], 3], [['pec_deck'], 3], [['low_row', 'machine_row'], 3], [['rear_delt'], 3], [['machine_lateral'], 3], [['machine_dip', 'triceps_pushdown'], 2], [['machine_preacher', 'cable_curl'], 2]] },
    { name: '하체 B', items: [[['pendulum_squat', 'leg_press'], 3], [['lying_leg_curl', 'seated_leg_curl'], 4], [['leg_press', 'horizontal_leg_press'], 3], [['abductor'], 2], [['adductor'], 2], [['calf_raise', 'seated_calf'], 4], [['ab_crunch_machine', 'cable_crunch'], 2]] },
  ] },
  { id: 'ppl5', name: '주 5회 상/하체 + 밀기/당기기/하체', freq: 5, desc: '상체·하체 다음 밀기·당기기·하체 (예: 월·화·수·금·토). 볼륨을 조금 더 넣고 싶을 때.', days: [
    { name: '상체', items: [[['chest_press', 'machine_bench'], 3], [['lat_pulldown', 'iso_lat_pulldown'], 3], [['machine_shoulder_press', 'hs_shoulder_press'], 2], [['machine_row', 'low_row', 'seated_row'], 3], [['machine_lateral'], 2], [['machine_preacher'], 2], [['tri_ext_machine', 'triceps_pushdown'], 2]] },
    { name: '하체 A', items: [[['hack_squat', 'leg_press'], 3], [['seated_leg_curl', 'lying_leg_curl'], 4], [['leg_ext'], 3], [['hip_thrust_machine'], 3], [['seated_calf', 'calf_raise'], 3]] },
    { name: '밀기', items: [[['incline_machine_press'], 3], [['pec_deck'], 3], [['hs_shoulder_press', 'machine_shoulder_press'], 2], [['machine_lateral'], 4], [['machine_dip', 'triceps_pushdown'], 3]] },
    { name: '당기기', items: [[['high_row', 'iso_lat_pulldown'], 3], [['iso_lat_pulldown', 'lat_pulldown'], 3], [['low_row', 'machine_row'], 3], [['rear_delt'], 3], [['machine_preacher', 'cable_curl'], 3]] },
    { name: '하체 B', items: [[['pendulum_squat', 'leg_press'], 3], [['lying_leg_curl', 'seated_leg_curl'], 4], [['leg_press', 'horizontal_leg_press'], 3], [['abductor'], 3], [['calf_raise', 'seated_calf'], 4], [['ab_crunch_machine', 'cable_crunch'], 3]] },
  ] },
];
// 노비스짐 교동점 맞춤: 사진·글로 확인된 프리웨이트(랙·바벨·덤벨·벤치)와 가능성 높은 케이블·스미스 위주.
// 모델이 확인 안 된 머신은 기본 동작으로 두고 💡 메모에 바꿀 거리를 적었어요. (fixed: 브랜드 자동 교체 안 함)
const NV = {
  press: '체스트프레스 머신(짐80·파나타 FO)이 비어 있으면 바꿔도 돼요 · 교동점 모델은 미확인',
  pull: '케이블 기구는 사진상 있을 가능성이 높아요 · 짐80·파나타 FO 랫풀다운으로 바꿔도 돼요',
  row: '로우 머신(짐80·파나타 FO 로우 로우·하이 로우)으로 바꿔도 돼요',
  lat: '사레레 머신(짐80·파나타 FO)이 있으면 바꿔도 돼요',
  cable: '케이블이 없거나 차 있으면 바꾸기에서 덤벨 동작으로',
  smith: '스미스머신은 사진상 있을 가능성이 높아요 · 없으면 바꾸기에서 바벨·덤벨 버전으로',
  squat: '핵스쿼트·펜듈럼(짐80·파나타 FO)이 있으면 바꿔도 돼요',
  hip: '부티빌더 오피셜 센터라 힙쓰러스트 머신이 비어 있으면 그걸로 해도 좋아요 · 모델은 미확인',
  abd: '부티빌더·아웃타이 머신이 있으면 그걸로 바꿔도 돼요',
  curl: '레그컬 기구가 있는지는 확인 못 했어요 · 없으면 노르딕 컬이나 덤벨 루마니안 데드리프트로',
  ext: '레그익스텐션 기구가 있는지는 확인 못 했어요 · 없으면 고블릿 스쿼트로',
  calf: '스미스가 없으면 덤벨 들고 카프레이즈',
};
RT_TPL.push(
  { id: 'novis4', gym: 'novis', fixed: true, name: '노비스짐 맞춤 (주 4회)', freq: 4, desc: '상체·하체를 번갈아 (예: 월·화·목·금). 교동점에서 확인된 프리웨이트존·덤벨 위주로 짰어요.', days: [
    { name: '상체 A', items: [[['bench'], 3, NV.press], [['lat_pulldown'], 3, NV.pull], [['incline_db'], 3], [['db_row'], 3, NV.row], [['lateral_raise'], 4, NV.lat], [['face_pull'], 3, NV.cable], [['triceps_pushdown'], 3, NV.cable], [['biceps_curl'], 4]] },
    { name: '하체 A', items: [[['squat'], 3, NV.squat], [['rdl'], 3], [['bss'], 2], [['hip_thrust'], 3, NV.hip], [['lying_leg_curl'], 3, NV.curl], [['smith_calf'], 3, NV.calf]] },
    { name: '상체 B', items: [[['db_shoulder'], 2], [['smith_incline'], 3, NV.smith], [['cable_fly'], 2, NV.cable], [['chest_supported_row'], 3, NV.row], [['close_pulldown'], 3, NV.pull], [['cable_lateral'], 4, NV.cable], [['cable_rear_fly'], 3, NV.cable], [['oh_triceps'], 2, NV.cable]] },
    { name: '하체 B', items: [[['smith_squat'], 3, NV.squat], [['db_rdl'], 3], [['leg_ext'], 3, NV.ext], [['seated_leg_curl'], 3, NV.curl], [['cable_abduction'], 2, NV.abd], [['smith_calf'], 4, NV.calf], [['cable_crunch'], 2, NV.cable]] },
  ] },
  { id: 'novis5', gym: 'novis', fixed: true, name: '노비스짐 맞춤 (주 5회)', freq: 5, desc: '상체·하체 다음 밀기·당기기·하체 (예: 월·화·수·금·토). 프리웨이트존이 넓어서 주 5회도 충분히 돌릴 수 있어요.', days: [
    { name: '상체', items: [[['bench'], 3, NV.press], [['lat_pulldown'], 3, NV.pull], [['db_shoulder'], 2], [['db_row'], 3, NV.row], [['lateral_raise'], 4, NV.lat], [['biceps_curl'], 3], [['triceps_pushdown'], 2, NV.cable]] },
    { name: '하체 A', items: [[['squat'], 3, NV.squat], [['rdl'], 3], [['bss'], 2], [['hip_thrust'], 3, NV.hip], [['lying_leg_curl'], 3, NV.curl], [['smith_calf'], 3, NV.calf]] },
    { name: '밀기', items: [[['incline_db'], 3], [['smith_incline'], 2, NV.smith], [['cable_fly'], 3, NV.cable], [['cable_lateral'], 4, NV.cable], [['oh_triceps'], 3, NV.cable]] },
    { name: '당기기', items: [[['chest_supported_row'], 3, NV.row], [['close_pulldown'], 3, NV.pull], [['cable_rear_fly'], 3, NV.cable], [['face_pull'], 3, NV.cable], [['hammer_curl'], 3]] },
    { name: '하체 B', items: [[['smith_squat'], 3, NV.squat], [['db_rdl'], 3], [['leg_ext'], 3, NV.ext], [['seated_leg_curl'], 3, NV.curl], [['cable_abduction'], 2, NV.abd], [['smith_calf'], 4, NV.calf], [['cable_crunch'], 3, NV.cable]] },
  ] },
);
const rtTpl = id => RT_TPL.find(t => t.id === id);
// 보이는 템플릿: 내 헬스장 맞춤을 맨 앞에, 다른 헬스장 것은 숨김
const rtVisible = () => { const g = db.profile.gym; return [...RT_TPL.filter(t => t.gym && t.gym === g), ...RT_TPL.filter(t => !t.gym)]; };
function normRoutine(r) {
  if (!isObj(r) || !Array.isArray(r.days)) return null;
  const days = r.days.filter(d => isObj(d) && Array.isArray(d.items)).slice(0, 7).map(d => ({ name: String(d.name || '루틴').slice(0, 30),
    items: d.items.filter(it => it && typeof it.exId === 'string').slice(0, 15).map(it => ({ exId: it.exId, sets: Math.max(1, Math.min(10, Math.round(+it.sets) || 3)), ...(typeof it.note === 'string' && it.note ? { note: it.note.slice(0, 160) } : {}) })) }));
  if (!days.length) return null;
  const log = {}; for (const [k, v] of Object.entries(isObj(r.log) ? r.log : {})) if (isDate(k) && Number.isInteger(v)) log[k] = v;
  return { tpl: String(r.tpl || ''), days, next: Number.isInteger(r.next) && r.next >= 0 && r.next < days.length ? r.next : 0, log };
}
// 후보 중 내 헬스장 브랜드 기구가 있으면 그걸로 (후보 순서 우선 → 브랜드 순서)
function pickSlot(cands, brands = myBrands()) {
  for (const c of cands) for (const b of brands) { const e = (window.BRAND_EX || []).find(x => x.base === c && x.brand === b); if (e) return e.id; }
  return cands[0];
}
const buildTpl = (t, brands) => t.days.map(d => ({ name: d.name, items: d.items.map(([c, n, note]) => ({ exId: t.fixed ? c[0] : pickSlot(c, brands), sets: n, ...(note ? { note } : {}) })) }));
const restFor = ex => { const k = exKind(ex); return k === 'free' ? '2~3분' : k === 'machine' ? '1분 30초~2분' : k === 'iso' ? '1~1분 30초' : (ex.rec ? ex.rec.rest : '1~2분'); };
const rtLine = (ex, n) => `${n}세트 × ${ex.type === 'weight' ? recReps(ex) : ex.rec ? ex.rec.reps : ''} · 휴식 ${restFor(ex)}`;
// 주간 부위별 세트: 주동근 1세트, 보조근 0.5세트로 셈
const MUSCLE_CATS = [['가슴', ['chest', 'chestU', 'chestL']], ['등', ['lats', 'rhomboids']], ['어깨 앞', ['frontDelt']], ['어깨 옆', ['sideDelt']], ['어깨 뒤', ['rearDelt']], ['이두', ['biceps']], ['삼두', ['triceps']], ['대퇴사두', ['quads']], ['햄스트링', ['hams']], ['둔근', ['glutes', 'gluteMed']], ['종아리', ['calves']], ['복근', ['abs', 'obliques']]];
function weeklySets(days) {
  const out = Object.fromEntries(MUSCLE_CATS.map(([n]) => [n, { d: 0, i: 0 }]));
  for (const d of days) for (const it of d.items) {
    const ex = exById(it.exId); if (!window.FORMS || ex.type === 'cardio') continue;
    const { p, s } = window.FORMS.musclesFor(ex);
    for (const [n, ks] of MUSCLE_CATS) { if (ks.some(k => p.includes(k))) out[n].d += it.sets; else if (ks.some(k => s.includes(k))) out[n].i += it.sets; }
  }
  return out;
}
function weeklyHtml(days) {
  const w = weeklySets(days), MAX = 26, X = v => Math.min(100, v / MAX * 100);
  const rows = MUSCLE_CATS.map(([n]) => {
    const { d, i } = w[n], t = d + i / 2;
    const st = t < 10 ? ['low', '적어요'] : t <= 20 ? ['ok', '좋아요'] : ['high', '많아요'];
    return `<div class="wk-row"><span class="wk-n">${n}</span><div class="wk-bar"><i class="band" style="left:${X(10)}%;width:${X(20) - X(10)}%"></i><b style="width:${X(d)}%"></b><s style="left:${X(d)}%;width:${X(i / 2)}%"></s></div><span class="wk-v ${st[0]}">${fmt(t)} <em>${st[1]}</em></span></div>`;
  }).join('');
  return `<div class="card wk"><h3 style="margin:0 0 4px">📊 주간 부위별 세트</h3>
    <p class="muted small" style="margin:0 0 8px">진한 막대 = 그 부위가 주동근인 세트, 연한 막대 = 보조로 쓰이는 세트(0.5세트로 셈). 초록 띠가 주 10~20세트 구간이에요.</p>${rows}
    <p class="muted small" style="margin:8px 0 0">어깨 앞·삼두처럼 프레스에서 보조로 많이 쓰이는 부위는 따로 안 해도 괜찮아요. 처음엔 범위 아래쪽으로 시작해 회복이 잘 되면 세트를 늘려요. <a href="#/evidence">근거</a></p></div>`;
}
function dayCardHtml(d, di, edit) {
  const sets = d.items.reduce((a, it) => a + it.sets, 0);
  return `<section class="card rt-day" data-d="${di}"><div class="rt-dh"><h3>${di + 1}일차 · ${esc(d.name)}</h3><span class="muted small">${d.items.length}종목 · ${sets}세트</span></div>
    ${d.items.map((it, k) => { const ex = exById(it.exId); return `<div class="rt-it" data-k="${k}">
      <div class="rt-t"><a href="#/ex/${encodeURIComponent(ex.id)}/guide">${esc(ex.name)}</a><div class="s">${brandTag(ex)}${esc(rtLine(ex, it.sets))}</div>${it.note ? `<div class="rt-note">💡 ${esc(it.note)}</div>` : ''}</div>
      ${edit ? `<div class="rt-ed"><button class="mini" data-act="minus" aria-label="세트 줄이기">−</button><button class="mini" data-act="plus" aria-label="세트 늘리기">＋</button><button class="mini" data-act="swap">바꾸기</button><button class="mini del" data-act="rm" aria-label="운동 빼기">✕</button></div>` : ''}</div>`; }).join('')}
    ${edit ? `<button class="btn sm" data-act="addIt" style="margin-top:6px">＋ 운동 추가</button>` : ''}</section>`;
}
const RT_WHY = `<div class="card rt-why"><h3 style="margin:0 0 6px">🧭 이렇게 짰어요</h3><p class="small" style="margin:0">· 부위마다 <b>주 10~20세트</b> 정도 (주당 세트가 많을수록 근육이 더 늘어나는 경향, 10세트 이상이 그보다 적은 것보다 효과가 컸어요)<br>· 부위마다 <b>주 2번</b> (같은 양이면 주 1번보다 2번이 근비대에 유리했어요)<br>· 머신·케이블 위주, 세트마다 <b>여유 1~2회</b> 남기고 반복 범위 위쪽을 채우면 무게 한 칸 올려요<br>· 체중 관리(리컴프) 중이면 세트를 무리하게 늘리기보다 꾸준히 하는 게 우선이에요. <a href="#/evidence">근거</a></p></div>`;
function renderRoutine(parts = []) {
  const [mode, arg] = parts;
  if (mode === 'tpl' && rtTpl(arg)) {
    const t = rtTpl(arg), days = buildTpl(t);
    setTitle(t.name);
    const gymHint = t.gym && window.GYMS[t.gym] ? `<p class="small muted" style="margin:6px 0 0">📍 ${esc(window.GYMS[t.gym].name)} 공개 글·사진 기준이에요. 모델까지 확인된 머신은 없어서 💡 메모에 바꿀 거리를 적었어요. <a href="#/gym">기구 목록·출처 보기</a></p>` : '';
    app.innerHTML = `<div class="card"><p style="margin:0">${esc(t.desc)}</p>${gymHint ? gymHint : myBrands().length ? `<p class="small muted" style="margin:6px 0 0">🏷️ 내 헬스장 기구(${myBrands().map(b => window.BRANDS[b]).join('·')})로 맞췄어요. 시작한 뒤 종목마다 바꿀 수 있어요.</p>` : `<p class="small muted" style="margin:6px 0 0">설정 → <b>내 헬스장 기구</b>에서 짐80·파나타를 고르면 그 기구로 바꿔 드려요.</p>`}</div>
      ${weeklyHtml(days)}${days.map((d, i) => dayCardHtml(d, i, false)).join('')}
      <button class="btn primary block" id="useTpl" style="min-height:54px">✅ 이 루틴으로 시작</button>`;
    $('#useTpl').onclick = async () => {
      if (db.routine && !await appConfirm('지금 루틴을 이 루틴으로 바꿀까요? (운동 기록은 그대로예요)')) return;
      db.routine = { tpl: t.id, days, next: 0, log: {} }; save(); toast('루틴을 저장했어요! 오늘 탭에서 바로 시작할 수 있어요'); go('#/routine');
    };
    return;
  }
  if (mode === 'list' || !db.routine) {
    setTitle('추천 루틴');
    app.innerHTML = `${RT_WHY}${rtVisible().map(t => { const days = buildTpl(t), w = weeklySets(days); const ok = MUSCLE_CATS.filter(([n]) => !['어깨 앞', '복근'].includes(n)).filter(([n]) => w[n].d + w[n].i / 2 >= 10).length;
      return `<button class="list-item rt-tpl" data-t="${t.id}"><div><div class="t">${esc(t.name)} ${t.gym ? '<span class="tag brand">📍 내 헬스장</span>' : ''}${db.routine && db.routine.tpl === t.id ? '<span class="tag">사용 중</span>' : ''}</div><div class="s">${esc(t.desc)}</div><div class="s">${days.map(d => esc(d.name)).join(' · ')} · 주요 부위 ${ok}/10곳 주 10세트 이상</div></div><span class="chev">›</span></button>`; }).join('')}`;
    app.querySelectorAll('[data-t]').forEach(b => b.onclick = () => go('#/routine/tpl/' + b.dataset.t));
    return;
  }
  const r = db.routine, t = rtTpl(r.tpl);
  setTitle('내 루틴');
  app.innerHTML = `<div class="card"><div class="rt-dh"><h3 style="margin:0">${esc(t ? t.name : '내 루틴')}</h3><span class="tag">다음: ${esc(r.days[r.next].name)}</span></div>
      <p class="muted small" style="margin:6px 0 0">종목마다 세트 −/＋, 바꾸기, 빼기를 할 수 있어요. 바꾸면 바로 저장돼요.</p></div>
    ${weeklyHtml(r.days)}<div id="rtDays">${r.days.map((d, i) => dayCardHtml(d, i, true)).join('')}</div>
    <div class="row" style="margin-bottom:10px"><button class="btn" id="rtList" style="flex:1">📚 다른 루틴 고르기</button>${t ? `<button class="btn" id="rtReset" style="flex:1">↺ 처음 구성으로</button>` : ''}</div>
    <button class="btn danger block" id="rtDel">루틴 끄기</button>`;
  $('#rtList').onclick = () => go('#/routine/list');
  if ($('#rtReset')) $('#rtReset').onclick = async () => { if (!await appConfirm('바꾼 내용을 지우고 처음 구성(내 헬스장 기구 기준)으로 되돌릴까요?')) return; r.days = buildTpl(t); r.next = 0; save(); renderRoutine(); toast('처음 구성으로 되돌렸어요'); };
  $('#rtDel').onclick = async () => { if (!await appConfirm('루틴을 끌까요? 운동 기록은 그대로 남아요.')) return; db.routine = null; save(); go('#/routine/list'); };
  $('#rtDays').onclick = e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const di = +b.closest('[data-d]').dataset.d, day = r.days[di], row = b.closest('[data-k]'), k = row ? +row.dataset.k : -1, act = b.dataset.act;
    const done = () => { save(); renderRoutine(); };
    if (act === 'minus') { day.items[k].sets = Math.max(1, day.items[k].sets - 1); return done(); }
    if (act === 'plus') { day.items[k].sets = Math.min(10, day.items[k].sets + 1); return done(); }
    if (act === 'rm') { if (day.items.length <= 1) return toast('하루에 최소 1종목은 있어야 해요'); day.items.splice(k, 1); toast('뺐어요'); return done(); }
    if (act === 'addIt') return openPicker(id => { closeSheet(); if (day.items.some(x => x.exId === id)) return toast('이미 있는 운동이에요'); day.items.push({ exId: id, sets: 3 }); done(); });
    if (act === 'swap') return openSwap(day.items[k].exId, id => { day.items[k].exId = id; delete day.items[k].note; closeSheet(); done(); toast('바꿨어요'); });
  };
}
// 같은 동작(그림 패턴)·같은 부위 운동 → 내 헬스장 기구 먼저
// 비슷한 동작끼리 묶기 (프리웨이트 ↔ 머신으로 바꿀 수 있게)
const PAT_FAM = { bench: 'press', chestpress: 'press', squat: 'sq', hack: 'sq', abd: 'abd', abdCable: 'abd', fly: 'rear', rearFlyCable: 'rear', facepull: 'rear' };
function swapCands(id) {
  const ex = exById(id), M = (window.FORMS && window.FORMS.MAP) || {}, pf = x => (M[x] ? PAT_FAM[M[x][0]] || M[x][0] : null), pat = pf(id), fam = ex.base || ex.id;
  return allEx().filter(e => e.id !== id && e.type === ex.type && e.group === ex.group && ((e.base || e.id) === fam || (pat && pf(e.id) === pat)))
    .map((e, i) => [brandRank(e), (e.base || e.id) === fam ? 0 : 1, i, e]).sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]).map(x => x[3]);
}
function openSwap(id, onPick) {
  const ex = exById(id), list = swapCands(id);
  openSheet(`<h2>바꾸기</h2><p class="muted small" style="margin:0 0 8px">지금: <b>${esc(ex.name)}</b><br>같은 동작·같은 부위 운동이에요${myGym() ? ` (${esc(myGym().short)}: ${esc(myGym().rankKo.slice(0, 3).join(' → '))} 순)` : myBrands().length ? ' (내 헬스장 기구 먼저)' : ''}.</p>
    <div id="swl">${exListHtml(list.slice(0, 40), e => brandTag(e) + esc([e.equip, e.primary].filter(Boolean).join(' · ')))}</div>
    <button class="btn block" id="swAll" style="margin-top:6px">🔎 전체 목록에서 고르기</button>`, body => {
    hydrateThumbs($('#swl', body));
    $('#swl', body).onclick = e => { const b = e.target.closest('[data-id]'); if (b) onPick(b.dataset.id); };
    $('#swAll', body).onclick = () => openPicker(onPick);
  });
}
// 오늘 탭: 루틴 카드
function targetSets(ex, n, prev) {
  const m = prev && prev.m;
  let w = null;
  if (m && ex.type === 'weight' && m.top > 0) { const [, hi] = progRange(ex), inc = minInc(ex), wk = m.work || [m.topReps]; w = wk.every(x => x >= hi) && inc > 0 ? r1(m.top + inc) : m.top; }
  else if (prev && (ex.type === 'assist' || ex.type === 'bw' || ex.type === 'time' || ex.type === 'cardio')) w = prev.sets[0] ? prev.sets[0].w : null;
  return Array.from({ length: n }, () => ({ w, r: null }));
}
function routineTodayHtml() {
  const r = db.routine;
  if (!r) return `<button class="list-item rt-cta" data-go="#/routine/list"><div><div class="t">📋 추천 루틴 보기</div><div class="s">주 3·4·5회 템플릿 · 짐80·파나타 기구로 맞춤</div></div><span class="chev">›</span></button>`;
  const doneIdx = r.log[curDate], today = db.workouts[curDate] || [];
  if (doneIdx != null && r.days[doneIdx]) {
    const d = r.days[doneIdx], n = d.items.filter(it => today.some(x => x.exId === it.exId && x.sets.some(s => s.r > 0))).length;
    return `<div class="card rt-today"><div class="rt-dh"><b>📋 오늘 루틴: ${esc(d.name)}</b><span class="muted small">${n}/${d.items.length} 종목 기록</span></div><div class="row" style="margin-top:8px"><button class="btn sm" data-go="#/routine" style="flex:1">루틴 보기</button></div></div>`;
  }
  const sel = rtSel != null && r.days[rtSel] ? rtSel : r.next, d = r.days[sel];
  return `<div class="card rt-today"><div class="rt-dh"><b>📋 오늘 할 루틴</b><button class="mini" data-go="#/routine" style="width:auto;padding:0 10px">편집 ›</button></div>
    <div class="chips" id="rtPick" style="margin-top:8px">${r.days.map((x, i) => `<button class="chip ${i === sel ? 'on' : ''}" data-di="${i}">${esc(x.name)}${i === r.next ? ' · 다음' : ''}</button>`).join('')}</div>
    <div class="muted small" style="margin:0 2px 8px">${d.items.map(it => esc(exById(it.exId).name)).join(' · ')}</div>
    <button class="btn primary block" id="rtStart" style="min-height:52px">▶ 오늘 루틴 시작 · ${esc(d.name)}</button>
    <div class="muted small" style="margin:6px 2px 0">지난번 무게와 다음 목표(더블 프로그레션)로 미리 채워 드려요.</div></div>`;
}
let rtSel = null;
function startRoutineDay(di) {
  const r = db.routine, d = r.days[di], items = db.workouts[curDate] || (db.workouts[curDate] = []);
  let added = 0;
  for (const it of d.items) {
    if (items.some(x => x.exId === it.exId)) continue;
    const ex = exById(it.exId);
    items.push({ exId: it.exId, sets: targetSets(ex, it.sets, prevSession(it.exId, curDate)) }); added++;
  }
  r.log[curDate] = di; r.next = (di + 1) % r.days.length; rtSel = null; save(); renderLog();
  toast(added ? `${d.name} ${added}종목을 채웠어요. 횟수만 입력하세요!` : '이미 다 추가돼 있어요');
}
function bindRoutineToday() {
  const p = $('#rtPick'); if (p) p.onclick = e => { const c = e.target.closest('[data-di]'); if (c) { rtSel = +c.dataset.di; renderLog(); } };
  const s = $('#rtStart'); if (s) s.onclick = () => startRoutineDay(rtSel != null && db.routine.days[rtSel] ? rtSel : db.routine.next);
  app.querySelectorAll('.rt-cta,.rt-today [data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
}
// 설정: 내 헬스장 기구
function gymCardHtml() {
  const m = myBrands(), c = b => (window.BRAND_EX || []).filter(e => e.brand === b).length, g = myGym();
  return `<div class="card" id="gymCard"><h3 style="margin:0 0 6px">📍 내 헬스장</h3>
    <select id="gymSel" aria-label="내 헬스장"><option value="">선택 안 함</option>${Object.values(window.GYMS || {}).map(x => `<option value="${x.id}" ${g && g.id === x.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>
    ${g ? `<p class="muted small" style="margin:8px 0 0">운동 목록·바꾸기에서 <b>${esc(g.rankKo.slice(0, 3).join(' → '))}</b> 순으로 먼저 보여 드려요. 추천 루틴에 <b>${esc(g.short)} 맞춤</b>이 생겨요.</p>
    <button class="list-item" data-go="#/gym" style="margin-top:8px"><div><div class="t">🏋️ ${esc(g.short)} 기구 목록 · 출처</div><div class="s">확인 ${g.eq.filter(e => e.conf === 'ok').length}개 · 가능성 높음 ${g.eq.filter(e => e.conf === 'likely').length}개</div></div><span class="chev">›</span></button>` : `<p class="muted small" style="margin:8px 0 0">헬스장을 고르면 그곳 기구를 먼저 보여 드리고, 맞춤 루틴을 추천해요.</p>`}
    <h3 style="margin:14px 0 6px">🏢 브랜드 기구</h3>
    <p class="muted small" style="margin:0 0 10px">고른 브랜드 기구가 운동 목록 앞쪽에 나오고, 추천 루틴도 그 기구로 맞춰요. 둘 다 고르면 위쪽이 먼저예요.${g ? ' (내 헬스장을 고르면 헬스장 순서가 먼저예요)' : ''}</p>
    ${Object.entries(window.BRANDS || {}).map(([k, n]) => `<label class="chk"><input type="checkbox" data-brand="${k}" ${m.includes(k) ? 'checked' : ''}> <b>${n}</b> <span class="muted small">${k === 'gym80' ? 'gym80 · 퓨어크라프트·시그넘' : 'Panatta · 프리웨이트 HP/스페셜/원·핏에보'} · ${c(k)}개</span></label>`).join('')}</div>`;
}
function bindGymCard() {
  const box = $('#gymCard'); if (!box) return;
  box.querySelectorAll('[data-go]').forEach(x => x.onclick = () => go(x.dataset.go));
  box.onchange = e => {
    if (e.target.id === 'gymSel') {
      const v = e.target.value; if (v) db.profile.gym = v; else delete db.profile.gym;
      save(); toast(v ? `${window.GYMS[v].short} 기구를 먼저 보여 드려요` : '내 헬스장을 껐어요'); return renderSettings();
    }
    const k = e.target.dataset.brand; if (!k) return;
    const m = myBrands().filter(b => b !== k); if (e.target.checked) m.push(k);
    if (m.length) db.profile.gymBrands = m; else delete db.profile.gymBrands;
    save(); toast(m.length ? `${m.map(b => window.BRANDS[b]).join('·')} 기구를 먼저 보여 드려요` : '브랜드 우선 표시를 껐어요');
  };
}

// 내 헬스장 기구 목록 (출처 포함)
function renderGym() {
  const g = myGym() || (window.GYMS && window.GYMS.novis);
  setTitle(`${g.short} 기구`);
  const src = l => l.map(x => `<a href="${esc(x.u)}" target="_blank" rel="noopener">${esc(x.t)}</a>`).join('<br>');
  const sec = (conf, h, sub) => `<h3 class="gym-h">${h}</h3><p class="muted small" style="margin:-4px 2px 8px">${sub}</p>` + g.eq.filter(e => e.conf === conf).map(e => `<div class="card gym-eq"><div class="rt-dh"><b>${esc(e.name)}</b><span class="tag ${conf === 'ok' ? 'ok' : 'likely'}">${conf === 'ok' ? '확인' : '가능성 높음'}</span></div>
      <p class="small" style="margin:6px 0 0">${esc(e.what)}</p>${e.app && e.app !== '—' ? `<p class="small muted" style="margin:4px 0 0">앱에서: ${esc(e.app)}</p>` : ''}<p class="small gym-src">출처<br>${src(e.src)}</p></div>`).join('');
  app.innerHTML = `<div class="card"><h3 style="margin:0">📍 ${esc(g.name)}</h3><p class="small" style="margin:6px 0 0">${esc(g.area)}<br>${esc(g.info)}</p><p class="small gym-src">출처<br>${src(g.infoSrc)}</p>
      <p class="muted small" style="margin:8px 0 0">공개된 글·사진에서 찾은 것만 적었어요. <b>모델 이름까지 확인된 머신은 아직 없어요.</b> ${esc(g.note)}</p></div>
    ${sec('ok', '✅ 확인된 기구', '글에 적혀 있거나 사진에 분명히 보여요')}
    ${sec('likely', '🤔 가능성 높음', '사진·글로 보면 있을 것 같지만 확실하지 않아요')}
    <button class="btn primary block" data-go="#/routine/tpl/novis4" style="min-height:52px;margin-top:6px">📋 노비스짐 맞춤 루틴 보기</button>`;
  app.querySelectorAll('[data-go]').forEach(x => x.onclick = () => go(x.dataset.go));
}

// ───────── 시작
route();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
window.__fitlog = { get db() { return db; }, overlays: () => ovStack.map(o => o.type), metrics, sessionsFor, isPlateau, plateauInfo, progRange, minInc, pct: (id, m) => pctValue(exById(id), m), nextTarget, calcTargets, dayTotals, parsePaste, foodById, macrosFor, searchFoods, filterEx, exById, keyMetrics, weeklySets, buildTpl, RT_TPL, pickSlot, swapCands, targetSets, normRoutine, myBrands, myGym, rtVisible, GYMS: window.GYMS };
})();
