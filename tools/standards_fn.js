(function () {
'use strict';
const S = window.STANDARDS;
const BEATS = [5, 20, 50, 80, 95]; // Strength Level: 입문 5% · 초보 20% · 중급 50% · 상급 80% · 엘리트 95%를 앞섬
const LV = ['입문', '초보', '초중급', '중급', '상급', '최상급'];
const lerpRow = (rows, x) => {
  if (x <= rows[0][0]) return rows[0].slice(1);
  for (let i = 1; i < rows.length; i++) if (x <= rows[i][0]) { const a = rows[i - 1], b = rows[i], t = (x - a[0]) / (b[0] - a[0]); return a.slice(1).map((v, k) => v + (b[k + 1] - v) * t); }
  return rows[rows.length - 1].slice(1);
};
function thresholds(slug, sex, age, bw) {
  const T = S.sl[slug] && S.sl[slug][sex === 'f' ? 'f' : 'm'];
  if (!T || !(bw > 0)) return null;
  let th = lerpRow(T.bw, bw);
  if (age > 0) { // 체중표 × (해당 나이 기준 ÷ 전성기 나이 기준)
    const peak = T.age.reduce((m, r) => (r[3] > m[3] ? r : m), T.age[0]).slice(1), at = lerpRow(T.age, age);
    th = th.map((v, i) => (peak[i] > 0 ? v * at[i] / peak[i] : v));
  }
  return th;
}
// value: 추정 1RM(kg) 또는 맨몸 횟수. 반환 { top, beats, level, lv, th, reps }
function percentile(exId, value, prof) {
  const slug = S.map[exId];
  if (!slug || !prof || !(value > 0)) return null;
  const th = thresholds(slug, prof.sex, prof.age, prof.bw);
  if (!th) return null;
  let beats;
  if (value < th[0]) beats = Math.max(1, BEATS[0] * value / th[0]);
  else if (value >= th[4]) beats = Math.min(99, 95 + 4 * (value - th[4]) / Math.max(1, th[4] - th[3]));
  else for (let i = 1; i < 5; i++) if (value < th[i]) { beats = BEATS[i - 1] + (BEATS[i] - BEATS[i - 1]) * (value - th[i - 1]) / (th[i] - th[i - 1]); break; }
  const lv = value < th[0] ? 0 : value < th[1] ? 1 : value < th[2] ? 2 : value < th[3] ? 3 : value < th[4] ? 4 : 5;
  const top = Math.max(1, Math.min(99, Math.round(100 - beats)));
  return { top, beats: Math.round(beats), lv, level: LV[lv], th, reps: !!S.sl[slug].r, slug, name: S.sl[slug].n, next: lv < 5 ? { level: LV[lv + 1], at: th[lv] } : null };
}
// ExRx 비훈련자 기준 (18~39세만, 벤치·스쿼트·데드·프레스)
function untrained(exId, prof) {
  const k = S.exmap[exId];
  if (!k || !prof || !(prof.bw > 0) || !(prof.age >= 18 && prof.age <= 39)) return null;
  const rows = S.exrx[k] && S.exrx[k][prof.sex === 'f' ? 'f' : 'm'];
  if (!rows) return null;
  const r = rows.find(x => !x[0].endsWith('+') && prof.bw <= +x[0]) || rows[rows.length - 1];
  return { kg: r[1], cls: r[0] };
}
window.STD = { percentile, untrained, thresholds, has: id => !!S.map[id], LV, cut: S.cut };
})();
