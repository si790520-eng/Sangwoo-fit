/* 핏로그 · 운동 자세 그림 (오프라인 인라인 SVG)
   - 동작 패턴별로 시작/끝 자세를 관절 각도로 정의하고, 같은 엔진으로 그려요.
   - 옆모습(side)과 앞/뒤모습(front/back, 3D 각도를 평면에 투영) 두 가지 시점.
   - 외부 이미지 없이 189개 운동 전부를 덮어요. */
(function () {
'use strict';
const R = Math.PI / 180;
const LEN = { torso: 54, neck: 5, head: 11, thigh: 46, shin: 44, foot: 15, ua: 31, fa: 27 };
const C = { body: '#dfe6f0', bodyEdge: '#0f1115', far: '#8792a6', eq: '#5b6578', eqHi: '#8a94a7', eqDark: '#3a414f', hi: '#fb923c', hi2: '#fdba74', path: '#4ade80', ground: '#2b303b', mark: '#4ade80' };
const GY = 200;
const f1 = n => Math.round(n * 10) / 10;
const P = p => `${f1(p[0])},${f1(p[1])}`;
const add = (p, v, k = 1) => [p[0] + v[0] * k, p[1] + v[1] * k];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const len = v => Math.hypot(v[0], v[1]);
const nrm = v => { const l = len(v) || 1; return [v[0] / l, v[1] / l]; };
const dirD = a => [Math.sin(a * R), Math.cos(a * R)]; // 아래 방향 0°, +는 앞(+x)
const angOf = v => Math.atan2(v[0], v[1]) / R;
const lerp = (a, b, t) => a + (b - a) * t;

// ───────── 2관절 IK (허리→발목, 어깨→손)
function ik(v, l1, l2, pick) {
  let d = len(v); const max = l1 + l2 - 0.6, min = Math.abs(l1 - l2) + 2;
  if (d > max) d = max; if (d < min) d = min;
  const base = angOf(v), a1 = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)))) / R;
  const cands = [base + a1, base - a1].map(a => {
    const j = dirD(a).map(x => x * l1), end = dirD(base).map(x => x * d);
    return { a, j, b: angOf(sub(end, j)) };
  });
  const score = { fwd: c => c.j[0], back: c => -c.j[0], down: c => c.j[1], up: c => -c.j[1] }[pick || 'fwd'];
  return score(cands[0]) >= score(cands[1]) ? [cands[0].a, cands[0].b] : [cands[1].a, cands[1].b];
}

// ───────── 옆모습 관절 계산
const SIDE0 = { tr: 0, hd: 0, th: [0, 0], sh: [0, 0], ft: [90, 90], ua: [0, 0], fa: [0, 0], wr: [0, 0], at: ['ankleN', [160, GY - 4]] };
function sideJ(p0) {
  const p = { ...SIDE0, ...p0 };
  const J = { hip: [0, 0] };
  const u = [Math.sin(p.tr * R), -Math.cos(p.tr * R)];
  const n = [Math.cos(p.tr * R), Math.sin(p.tr * R)];
  J.shoulder = add(J.hip, u, LEN.torso);
  const hu = [Math.sin((p.tr + p.hd) * R), -Math.cos((p.tr + p.hd) * R)];
  J.head = add(J.shoulder, hu, LEN.neck + LEN.head);
  const th = p.th.slice(), sh = p.sh.slice(), ua = p.ua.slice(), fa = p.fa.slice();
  ['N', 'F'].forEach((s, i) => {
    const lk = i ? (p.lkF || p.lk) : p.lk;
    if (lk) { const r = ik(lk, LEN.thigh, LEN.shin, (i ? p.kbF : p.kb) || p.kb || 'fwd'); th[i] = r[0]; sh[i] = r[1]; }
    const hk = i ? (p.hkF || p.hk) : p.hk;
    if (hk) { const r = ik(hk, LEN.ua, LEN.fa + 4, (i ? p.ebF : p.eb) || p.eb || 'down'); ua[i] = r[0]; fa[i] = r[1]; }
    else if (p.rel) { ua[i] += p.tr; fa[i] += p.tr; }
    J['knee' + s] = add(J.hip, dirD(th[i]), LEN.thigh);
    J['ankle' + s] = add(J['knee' + s], dirD(sh[i]), LEN.shin);
    J['toe' + s] = add(J['ankle' + s], dirD(p.ft[i]), LEN.foot);
    J['elbow' + s] = add(J.shoulder, dirD(ua[i]), LEN.ua);
    J['wrist' + s] = add(J['elbow' + s], dirD(fa[i]), LEN.fa);
    J['hand' + s] = add(J['wrist' + s], dirD(fa[i] + p.wr[i]), 5);
  });
  const [aj, at] = p.at; const o = J[aj] || J.hip; const dx = at[0] - o[0], dy = at[1] - o[1];
  for (const k in J) J[k] = [J[k][0] + dx, J[k][1] + dy];
  J._u = u; J._n = n; J._hu = hu; J._p = p;
  return J;
}

// ───────── 앞/뒤모습 관절 계산 (팔·다리 = [올림각 e, 수평각 h])
// e: 0=아래, 90=수평, 180=위 / h: 0=옆으로, 90=정면(사람 앞쪽), 180=안쪽으로
const FRONT0 = { tl: 1, lean: 0, shr: 0, ua: [[12, 0], [12, 0]], fa: [[8, 0], [8, 0]], th: [[5, 0], [5, 0]], sh: [[2, 0], [2, 0]], at: ['hip', [160, 112]] };
const d3 = (s, [e, h]) => [s * Math.sin(e * R) * Math.cos(h * R), Math.cos(e * R), Math.sin(e * R) * Math.sin(h * R)];
function frontJ(p0) {
  const p = { ...FRONT0, ...p0 };
  const J = { hip: [0, 0] }, Z = {};
  const lu = [Math.sin(p.lean * R), -Math.cos(p.lean * R)], lr = [Math.cos(p.lean * R), Math.sin(p.lean * R)];
  const tl = LEN.torso * p.tl;
  J.chest = add(J.hip, lu, tl);
  J.head = add(J.chest, lu, (LEN.neck + LEN.head) * Math.max(0.55, p.tl) + 2 - p.shr * 0.3);
  ['L', 'R'].forEach((s, i) => {
    const sg = i ? 1 : -1;
    J['shoulder' + s] = add(add(J.chest, lr, sg * 19), lu, -3 + p.shr);
    J['hipJ' + s] = add(J.hip, lr, sg * 9);
    const seg = (from, a, l, key) => { const v = d3(sg, a); J[key] = add(J[from], v, l); Z[key] = v[2]; };
    seg('shoulder' + s, p.ua[i], LEN.ua, 'elbow' + s);
    seg('elbow' + s, p.fa[i], LEN.fa, 'wrist' + s);
    J['hand' + s] = add(J['wrist' + s], d3(sg, p.fa[i]), 5);
    seg('hipJ' + s, p.th[i], LEN.thigh, 'knee' + s);
    seg('knee' + s, p.sh[i], LEN.shin, 'ankle' + s);
    J['toe' + s] = add(J['ankle' + s], [sg * 4, 3]);
  });
  const [aj, at] = p.at; const o = J[aj] || J.hip; const dx = at[0] - o[0], dy = at[1] - o[1];
  for (const k in J) J[k] = [J[k][0] + dx, J[k][1] + dy];
  J._lu = lu; J._lr = lr; J._p = p; J._z = Z;
  return J;
}

// ───────── 도형
function capsule(a, b, w1, w2) {
  const d = nrm(sub(b, a)), n = [-d[1], d[0]], r1 = w1 / 2, r2 = w2 / 2;
  const a1 = add(a, n, r1), b1 = add(b, n, r2), b2 = add(b, n, -r2), a2 = add(a, n, -r1);
  return `M${P(a1)}L${P(b1)}A${f1(r2)} ${f1(r2)} 0 0 0 ${P(b2)}L${P(a2)}A${f1(r1)} ${f1(r1)} 0 0 0 ${P(a1)}Z`;
}
function smooth(pts) { // 닫힌 Catmull-Rom → 베지어
  const n = pts.length; let d = `M${P(pts[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${P(c1)} ${P(c2)} ${P(p2)}`;
  }
  return d + 'Z';
}
const path = (d, fill, extra = '') => `<path d="${d}" fill="${fill}"${extra}/>`;
const EDGE = ` stroke="${C.bodyEdge}" stroke-width="1.6" stroke-linejoin="round"`;

// ───────── 근육 하이라이트 (옆모습)
function sideHi(J, m, col) {
  const u = J._u, n = J._n, H = J.hip, S = J.shoulder, out = [];
  const ell = (c, rx, ry, rot) => `<ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="${rx}" ry="${ry}" transform="rotate(${f1(rot)} ${f1(c[0])} ${f1(c[1])})" fill="${col}"/>`;
  const rot = Math.atan2(u[1], u[0]) / R;
  const limb = (a, b, w1, w2, side, off = 0.28) => { // side: +1 = 해부학적 앞쪽
    const d = nrm(sub(b, a)), fn = [d[1], -d[0]], o = side * off;
    const a2 = add(add(a, fn, o * w1), d, w1 * 0.25), b2 = add(add(b, fn, o * w2), d, -w2 * 0.35);
    return path(capsule(a2, b2, w1 * 0.55, w2 * 0.55), col);
  };
  const T = { chest: () => ell(add(add(S, u, -13), n, 9), 9, 5.5, rot), chestU: () => ell(add(add(S, u, -8), n, 9), 7, 5, rot), chestL: () => ell(add(add(S, u, -17), n, 9), 7, 5, rot),
    frontDelt: () => ell(add(S, n, 4), 6, 6.5, rot), sideDelt: () => ell(add(S, u, 1), 6.5, 6.5, rot), rearDelt: () => ell(add(S, n, -4), 6, 6.5, rot),
    abs: () => ell(add(add(H, u, 22), n, 9), 14, 4.5, rot), obliques: () => ell(add(add(H, u, 18), n, 3), 10, 6, rot),
    lats: () => ell(add(add(S, u, -20), n, -8), 15, 5, rot), rhomboids: () => ell(add(add(S, u, -8), n, -9), 8, 4, rot), traps: () => ell(add(add(S, u, 3), n, -5), 7, 4, rot + 20),
    lowBack: () => ell(add(add(H, u, 14), n, -9), 10, 3.6, rot), glutes: () => ell(add(add(H, u, -1), n, -9), 8, 8, rot), gluteMed: () => ell(add(add(H, u, 6), n, -5), 6, 5, rot),
    hipFlexor: () => ell(add(add(H, u, 3), n, 9), 6, 4, rot),
    quads: () => limb(H, J.kneeN, 17, 12, 1), hams: () => limb(H, J.kneeN, 17, 12, -1), adductors: () => limb(H, J.kneeN, 15, 10, 0, 0),
    calves: () => limb(J.kneeN, J.ankleN, 13, 7, -1), biceps: () => limb(S, J.elbowN, 11, 9, 1), triceps: () => limb(S, J.elbowN, 11, 9, -1), forearm: () => limb(J.elbowN, J.wristN, 9, 6, 0, 0) };
  for (const k of m) if (T[k]) out.push(T[k]());
  return out.join('');
}
// ───────── 근육 하이라이트 (앞/뒤모습)
function frontHi(J, m, col, back) {
  const lu = J._lu, lr = J._lr, ch = J.chest, H = J.hip, tl = J._p.tl, dn = [-lu[0], -lu[1]];
  const ell = (c, rx, ry, rot = 0) => `<ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="${rx}" ry="${f1(ry)}" transform="rotate(${f1(rot + J._p.lean)} ${f1(c[0])} ${f1(c[1])})" fill="${col}"/>`;
  const both = f => [-1, 1].map(f).join('');
  const lim = (a, b, w1, w2, o = 0) => { const d = nrm(sub(b, a)); return path(capsule(add(add(a, d, 3), [lr[0] * o, lr[1] * o]), add(add(b, d, -2), [lr[0] * o, lr[1] * o]), w1, w2), col); };
  const sideOf = s => s < 0 ? 'L' : 'R';
  const F = {
    chest: () => both(s => ell(add(add(ch, lr, s * 9.5), dn, 12 * tl), 9, 7 * tl)), chestU: () => both(s => ell(add(add(ch, lr, s * 9.5), dn, 8 * tl), 8.5, 5 * tl)), chestL: () => both(s => ell(add(add(ch, lr, s * 9.5), dn, 16 * tl), 8.5, 5 * tl)),
    frontDelt: () => both(s => ell(add(J['shoulder' + sideOf(s)], lr, s * 2), 6, 6.5)), sideDelt: () => both(s => ell(add(J['shoulder' + sideOf(s)], lr, s * 4), 5, 7)),
    abs: () => path(capsule(add(ch, dn, 22 * tl), add(H, dn, -5 * tl), 13, 11), col), obliques: () => both(s => ell(add(add(H, lr, s * 13), dn, -16 * tl), 4, 9 * tl, s * -8)),
    hipFlexor: () => both(s => ell(add(add(H, lr, s * 8), dn, 1), 4.5, 4)), upperTraps: () => both(s => ell(add(add(ch, lr, s * 11), dn, -2), 7, 3, s * 20)),
    quads: () => both(s => lim(J['hipJ' + sideOf(s)], J['knee' + sideOf(s)], 11, 9)), adductors: () => both(s => lim(J['hipJ' + sideOf(s)], J['knee' + sideOf(s)], 6, 4, -s * 4)),
    biceps: () => both(s => lim(J['shoulder' + sideOf(s)], J['elbow' + sideOf(s)], 7, 6)), forearm: () => both(s => lim(J['elbow' + sideOf(s)], J['wrist' + sideOf(s)], 6, 4)),
    gluteMed: () => both(s => ell(add(add(H, lr, s * 15), dn, -2), 4, 6)), calves: () => both(s => lim(J['knee' + sideOf(s)], J['ankle' + sideOf(s)], 7, 4, s * 2)),
  };
  const B = {
    rearDelt: () => both(s => ell(add(J['shoulder' + sideOf(s)], lr, s * 2), 6, 6.5)), sideDelt: () => both(s => ell(add(J['shoulder' + sideOf(s)], lr, s * 4), 5, 7)),
    traps: () => path(smooth([add(ch, dn, -6), add(add(ch, lr, 14), dn, 1), add(ch, dn, 22 * tl), add(add(ch, lr, -14), dn, 1)]), col), upperTraps: () => both(s => ell(add(add(ch, lr, s * 11), dn, -2), 7, 3, s * 20)),
    rhomboids: () => both(s => ell(add(add(ch, lr, s * 6.5), dn, 10 * tl), 4.5, 7 * tl)), lats: () => both(s => path(smooth([add(add(ch, lr, s * 16), dn, 10 * tl), add(add(ch, lr, s * 8), dn, 26 * tl), add(add(H, lr, s * 5), dn, -12 * tl), add(add(H, lr, s * 12), dn, -20 * tl)]), col)),
    lowBack: () => both(s => path(capsule(add(add(H, lr, s * 4.5), dn, -24 * tl), add(add(H, lr, s * 4.5), dn, -4 * tl), 6, 6), col)),
    glutes: () => both(s => ell(add(add(H, lr, s * 9), dn, 5), 9, 8)), gluteMed: () => both(s => ell(add(add(H, lr, s * 13), dn, -3), 6, 5)),
    hams: () => both(s => lim(J['hipJ' + sideOf(s)], J['knee' + sideOf(s)], 10, 8)), adductors: () => both(s => lim(J['hipJ' + sideOf(s)], J['knee' + sideOf(s)], 5, 4, -s * 4)),
    calves: () => both(s => lim(J['knee' + sideOf(s)], J['ankle' + sideOf(s)], 9, 5)), triceps: () => both(s => lim(J['shoulder' + sideOf(s)], J['elbow' + sideOf(s)], 7, 6)), forearm: () => both(s => lim(J['elbow' + sideOf(s)], J['wrist' + sideOf(s)], 6, 4)),
    obliques: () => both(s => ell(add(add(H, lr, s * 13), dn, -16 * tl), 4, 9 * tl, s * -8)),
  };
  const T = back ? B : F;
  return m.filter(k => T[k]).map(k => T[k]()).join('');
}

// ───────── 사람 그리기 (옆모습)
function drawSide(J, hiP, hiS) {
  const u = J._u, n = J._n, H = J.hip, S = J.shoulder;
  const far = [], near = [];
  const limb = (arr, s, col, edge) => {
    arr.push(path(capsule(J.hip, J['knee' + s], 17, 12), col, edge));
    arr.push(path(capsule(J['knee' + s], J['ankle' + s], 12, 7.5), col, edge));
    arr.push(path(capsule(J['ankle' + s], J['toe' + s], 7, 5), col, edge));
  };
  const arm = (arr, s, col, edge) => {
    arr.push(path(capsule(S, J['elbow' + s], 11, 8.5), col, edge));
    arr.push(path(capsule(J['elbow' + s], J['wrist' + s], 8.5, 6), col, edge));
    arr.push(`<circle cx="${f1(J['hand' + s][0])}" cy="${f1(J['hand' + s][1])}" r="4.2" fill="${col}"${edge}/>`);
  };
  limb(far, 'F', C.far, ''); arm(far, 'F', C.far, '');
  const T = [add(add(H, n, 10), u, -3), add(add(H, n, 10.5), u, 22), add(add(S, n, 13.5), u, -17), add(add(S, n, 11), u, -4), add(add(S, n, 4), u, 6), add(add(S, n, -6), u, 4),
    add(add(S, n, -11.5), u, -10), add(add(H, n, -9.5), u, 26), add(add(H, n, -13.5), u, 6), add(add(H, n, -7), u, -8), add(add(H, n, 4), u, -9)];
  const torso = path(smooth(T), C.body, EDGE);
  const neck = path(capsule(add(S, u, 2), add(J.head, J._hu, -LEN.head + 2), 9, 8), C.body);
  const head = `<circle cx="${f1(J.head[0])}" cy="${f1(J.head[1])}" r="${LEN.head}" fill="${C.body}"${EDGE}/>`;
  const hn = [Math.cos((J._p.tr + J._p.hd) * R), Math.sin((J._p.tr + J._p.hd) * R)];
  const eye = add(add(J.head, hn, 6), J._hu, 1.5);
  limb(near, 'N', C.body, EDGE); arm(near, 'N', C.body, EDGE);
  const hi = (hiS.length ? sideHi(J, hiS, C.hi2) : '') + sideHi(J, hiP, C.hi);
  // 근육 표시는 몸통/다리 위, 팔(가까운 쪽) 아래로 — 팔 근육은 팔 위에 다시 표시
  const armHi = ['biceps', 'triceps', 'forearm', 'frontDelt', 'sideDelt', 'rearDelt'];
  const hiArm = sideHi(J, hiS.filter(k => armHi.includes(k)), C.hi2) + sideHi(J, hiP.filter(k => armHi.includes(k)), C.hi);
  const legNear = near.slice(0, 3).join(''), armNear = near.slice(3).join('');
  return `<g class="fig">${far.join('')}${neck}${torso}${head}<circle cx="${f1(eye[0])}" cy="${f1(eye[1])}" r="1.6" fill="#0f1115"/>${legNear}${hi}${armNear}${hiArm}</g>`;
}
// ───────── 사람 그리기 (앞/뒤모습)
function drawFront(J, hiP, hiS, back) {
  const lu = J._lu, lr = J._lr, ch = J.chest, H = J.hip, tl = J._p.tl, dn = [-lu[0], -lu[1]], Z = J._z;
  const pts = s => [add(add(ch, lr, s * 7), dn, -4), add(add(ch, lr, s * 19), dn, -1 - J._p.shr), add(add(ch, lr, s * 22), dn, 6), add(add(ch, lr, s * 17), dn, 20 * tl), add(add(H, lr, s * 14), dn, -18 * tl), add(add(H, lr, s * 16), dn, 2), add(add(H, lr, s * 9), dn, 9)];
  const L = pts(-1), Rr = pts(1).reverse();
  const torso = path(smooth([...L, add(H, dn, 8), ...Rr]), C.body, EDGE);
  const neck = path(capsule(add(ch, dn, 2), add(J.head, dn, -6), 11, 10), C.body);
  const head = `<circle cx="${f1(J.head[0])}" cy="${f1(J.head[1])}" r="${LEN.head}" fill="${C.body}"${EDGE}/>`;
  const items = [];
  const zOf = k => (back ? -1 : 1) * (Z[k] || 0);
  ['L', 'R'].forEach(s => {
    items.push({ z: zOf('knee' + s) * 0.5 - 0.01, d: path(capsule(J['hipJ' + s], J['knee' + s], 16, 12), C.body, EDGE) });
    items.push({ z: (zOf('knee' + s) + zOf('ankle' + s)) * 0.5 - 0.02, d: path(capsule(J['knee' + s], J['ankle' + s], 12, 7.5), C.body, EDGE) + path(capsule(J['ankle' + s], J['toe' + s], 8, 7), C.body, EDGE) });
    items.push({ z: zOf('elbow' + s) * 0.5 + 0.001, d: path(capsule(J['shoulder' + s], J['elbow' + s], 11.5, 8.5), C.body, EDGE), arm: s });
    items.push({ z: (zOf('elbow' + s) + zOf('wrist' + s)) * 0.5 + 0.002, d: path(capsule(J['elbow' + s], J['wrist' + s], 8.5, 6), C.body, EDGE) + `<circle cx="${f1(J['hand' + s][0])}" cy="${f1(J['hand' + s][1])}" r="4.3" fill="${C.body}"${EDGE}/>` });
  });
  const behind = items.filter(i => i.z < -0.05), front = items.filter(i => i.z >= -0.05).sort((a, b) => a.z - b.z);
  const legs = front.filter(i => !('arm' in i) && i.z < 0.3), rest = front.filter(i => !legs.includes(i));
  const hi = (hiS.length ? frontHi(J, hiS, C.hi2, back) : '') + frontHi(J, hiP, C.hi, back);
  const spine = back ? `<path d="M${P(add(ch, dn, 2))}L${P(add(H, dn, -6))}" stroke="#9aa6b8" stroke-width="1.2" fill="none" stroke-dasharray="2 3"/>` : '';
  return `<g class="fig">${behind.map(i => i.d).join('')}${neck}${torso}${head}${legs.map(i => i.d).join('')}${hi}${spine}${rest.map(i => i.d).join('')}</g>`;
}

window.FORM_ENGINE = { R, LEN, C, GY, f1, P, add, sub, len, nrm, dirD, angOf, lerp, ik, sideJ, frontJ, capsule, smooth, path, drawSide, drawFront, sideHi, frontHi };
})();

/* ───────── 기구 + 장면 렌더링 ───────── */
(function () {
'use strict';
const E = window.FORM_ENGINE;
const { C, GY, f1, P, add, sub, nrm, dirD, sideJ, frontJ, capsule, path } = E;
const ln = (pts, w, c, extra = '') => `<polyline points="${pts.map(P).join(' ')}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
const circ = (p, r, fill, extra = '') => `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="${r}" fill="${fill}"${extra}/>`;
const jp = (J, j, off) => { const p = Array.isArray(j) ? j : J[j]; return off ? add(p, off) : p; };
function eqSide(it, J) {
  const u = J._u, n = J._n;
  switch (it.t) {
    case 'line': return ln(it.p, it.w || 6, it.c || C.eq, it.dash ? ` stroke-dasharray="${it.dash}"` : '');
    case 'rect': return `<rect x="${it.x}" y="${it.y}" width="${it.w}" height="${it.h}" rx="${it.r ?? 4}" fill="${it.c || C.eq}"/>`;
    case 'bench': { const a = it.a, b = it.b, legs = (it.legs || [a, b]).map(p => ln([p, [p[0], GY]], 5, C.eqDark)).join(''); return legs + ln([a, b], it.w || 10, it.c || C.eq); }
    case 'stack': { let s = `<rect x="${it.x}" y="${it.y}" width="${it.w}" height="${it.h}" rx="3" fill="${C.eqDark}"/>`; for (let y = it.y + 6; y < it.y + it.h - 2; y += 7) s += `<rect x="${it.x + 3}" y="${y}" width="${it.w - 6}" height="5" rx="1.5" fill="${C.eq}"/>`; return s; }
    case 'torsopad': { const H = J.hip; const a = add(add(H, u, it.a), n, it.off), b = add(add(H, u, it.b), n, it.off); return ln([a, b], it.w || 10, it.c || C.eq); }
    case 'roller': return circ(jp(J, it.j, it.off), it.r || 6.5, it.c || C.eq);
    case 'bar': { const p = jp(J, it.j || 'handN', it.off); return circ(p, it.r || 15, C.eqDark, ` stroke="${C.eqHi}" stroke-width="2.5"`) + circ(p, 4, C.eqHi); }
    case 'db': { const p = jp(J, it.j || 'handN', it.off); return circ(p, it.r || 7, C.eqDark, ` stroke="${C.eqHi}" stroke-width="2"`); }
    case 'kb': { const p = jp(J, it.j || 'handN'); return circ(add(p, [0, 9]), 9, C.eqDark, ` stroke="${C.eqHi}" stroke-width="2"`) + `<path d="M${P(add(p, [-5, 4]))}Q${P(add(p, [0, -6]))} ${P(add(p, [5, 4]))}" stroke="${C.eqHi}" stroke-width="2.5" fill="none"/>`; }
    case 'cable': { const p = jp(J, it.j || 'handN', it.off); return ln([it.from, p], 1.6, '#c7ced9') + circ(it.from, 5, C.eqDark, ` stroke="${C.eqHi}" stroke-width="1.5"`) + (it.grip === false ? '' : circ(p, 3, C.eqHi)); }
    case 'lever': { const p = jp(J, it.j || 'handN', it.off); return ln([it.piv, p], it.w || 7, it.c || C.eq) + circ(it.piv, 5, C.eqDark) + circ(p, 4.5, C.eqHi); }
    case 'fplate': { const c = add(jp(J, it.j), dirD(it.na), it.off ?? 6), d = dirD(it.na + 90); return ln([add(c, d, -it.l / 2), add(c, d, it.l / 2)], 6, it.c || C.eqHi); }
    case 'band': return ln([jp(J, it.a), jp(J, it.b)], 3, '#f472b6');
    case 'limbpad': { const a = J[it.a], b = J[it.b], d = nrm(sub(b, a)), fn = [d[1], -d[0]]; const c = add(add(a, sub(b, a), it.at ?? 0.85), fn, (it.side || 1) * (it.d ?? 8)); return circ(c, it.r || 7, it.c || C.eq); }
    case 'limbbar': { const a = J[it.a], b = J[it.b], d = nrm(sub(b, a)), fn = [d[1], -d[0]], o = (it.side || 1) * (it.d ?? 9); return ln([add(add(a, fn, o), d, it.from ?? 4), add(add(b, fn, o), d, it.to ?? 2)], it.w || 8, it.c || C.eq); }
    case 'wheel': { const p = jp(J, it.j || 'handN', it.off); return circ(p, it.r || 9, C.eqDark, ` stroke="${C.eqHi}" stroke-width="2.5"`) + circ(p, 2.5, C.eqHi); }
    case 'circle': return circ(it.c, it.r, it.fill || 'none', ` stroke="${it.s || C.eq}" stroke-width="${it.w || 3}"`);
    case 'pathd': return `<path d="${it.d}" fill="${it.fill || 'none'}" stroke="${it.s || C.eq}" stroke-width="${it.w || 3}" stroke-linecap="round"/>`;
    default: return '';
  }
}
function eqFront(it, J) {
  switch (it.t) {
    case 'line': case 'rect': case 'stack': case 'bench': return eqSide(it, J);
    case 'fbar': { const a = J.handL, b = J.handR, d = nrm(sub(b, a)), x = it.ext ?? 26; const A = add(a, d, -x), B = add(b, d, x);
      return ln([A, B], 4, C.eqHi) + (it.plates === false ? '' : [A, B].map((p, i) => `<rect x="${f1(p[0] - 4 + (i ? -4 : 4))}" y="${f1(p[1] - 15)}" width="8" height="30" rx="2" fill="${C.eqDark}" stroke="${C.eqHi}" stroke-width="1.5"/>`).join('')); }
    case 'fdb': return ['L', 'R'].map(s => { const p = J['hand' + s], v = it.vert ? [0, 1] : [1, 0]; return ln([add(p, v, -9), add(p, v, 9)], 3.5, C.eqHi) + [-1, 1].map(k => { const q = add(p, v, 9 * k); return `<rect x="${f1(q[0] - (it.vert ? 6 : 3))}" y="${f1(q[1] - (it.vert ? 3 : 6))}" width="${it.vert ? 12 : 6}" height="${it.vert ? 6 : 12}" rx="2" fill="${C.eqDark}" stroke="${C.eqHi}" stroke-width="1.3"/>`; }).join(''); }).join('');
    case 'fcable': return ['L', 'R'].map((s, i) => { if (it.only && it.only !== s) return ''; const from = it.from[it.cross ? 1 - i : i]; return ln([from, J['hand' + s]], 1.6, '#c7ced9') + circ(from, 5, C.eqDark, ` stroke="${C.eqHi}" stroke-width="1.5"`) + circ(J['hand' + s], 3, C.eqHi); }).join('');
    case 'fcable1': { const p = jp(J, it.j); return ln([it.from, p], 1.6, '#c7ced9') + circ(it.from, 5, C.eqDark, ` stroke="${C.eqHi}" stroke-width="1.5"`) + circ(p, 3, C.eqHi); }
    case 'fpad': return (it.j || []).map(j => { const p = jp(J, j, it.offs ? it.offs[j] : it.off); return `<rect x="${f1(p[0] - it.w / 2)}" y="${f1(p[1] - it.h / 2)}" width="${it.w}" height="${it.h}" rx="${Math.min(it.w, it.h) / 2}" fill="${it.c || C.eq}"/>`; }).join('');
    case 'flever': return ['L', 'R'].map((s, i) => ln([it.piv[i], J['hand' + s]], it.w || 6, C.eq) + circ(it.piv[i], 4.5, C.eqDark) + circ(J['hand' + s], 4, C.eqHi)).join('');
    case 'band': return ln([jp(J, it.a), jp(J, it.b)], 3, '#f472b6');
    case 'midcable': { const m = [(J.handL[0] + J.handR[0]) / 2, (J.handL[1] + J.handR[1]) / 2]; return ln([it.from, m], 1.6, '#c7ced9') + circ(it.from, 5, C.eqDark, ` stroke="${C.eqHi}" stroke-width="1.5"`); }
    case 'rope': { const a = J.handL, b = J.handR, m = [(a[0] + b[0]) / 2, it.over ? Math.min(a[1], b[1]) - 70 : 203]; return `<path d="M${P(a)}Q${P([m[0], m[1] * 2 - (a[1] + b[1]) / 2])} ${P(b)}" fill="none" stroke="#f472b6" stroke-width="2"/>`; }
    case 'circle': case 'pathd': return eqSide(it, J);
    case 'grip': return ['L', 'R'].map(s => ln([add(J['hand' + s], [0, -7]), add(J['hand' + s], [0, 7])], 4.5, C.eqHi)).join('');
    default: return '';
  }
}
// 자세 보간
function lerpPose(a, b, t) {
  if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * t;
  if (Array.isArray(a) && Array.isArray(b)) return a.map((x, i) => (typeof x === 'string' ? x : lerpPose(x, b[i] ?? x, t)));
  if (a && typeof a === 'object' && b && typeof b === 'object') { const o = {}; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) o[k] = k in a && k in b ? lerpPose(a[k], b[k], t) : (k in a ? a[k] : b[k]); return o; }
  return a ?? b;
}
const jointsOf = (pat, pose) => (pat.view === 'side' ? sideJ(pose) : frontJ(pose));
function scene(pat, t, opt = {}) {
  const pose = opt.pose || lerpPose(pat.s, pat.e, t);
  const J = jointsOf(pat, pose);
  const draw = pat.view === 'side' ? eqSide : eqFront;
  const back = (pat.eq || []).filter(i => !i.front).map(i => draw(i, J)).join('');
  const frontEq = (pat.eq || []).filter(i => i.front).map(i => draw(i, J)).join('');
  const fig = pat.view === 'side' ? E.drawSide(J, opt.hiP || [], opt.hiS || []) : E.drawFront(J, opt.hiP || [], opt.hiS || [], pat.view === 'back');
  const fig2 = pat.rot ? `<g transform="rotate(${pat.rot[0]} ${pat.rot[1]} ${pat.rot[2]})">${fig}</g>` : fig;
  return { J, svg: back + fig2 + frontEq };
}
// 움직임 경로 화살표 (양방향)
function pathArrow(pat) {
  return (pat.path || []).map(j => {
    const pts = []; for (let i = 0; i <= 16; i++) { const J = jointsOf(pat, lerpPose(pat.s, pat.e, i / 16)); pts.push(J[j]); }
    let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (L < 12) return '';
    const off = pat.pathOff || [0, 0], q = pts.map(p => add(p, off));
    return `<polyline points="${q.map(P).join(' ')}" fill="none" stroke="${C.path}" stroke-width="2.4" stroke-dasharray="5 4" stroke-linecap="round" marker-start="url(#fa-s)" marker-end="url(#fa-e)" opacity=".95"/>`;
  }).join('');
}
const DEFS = `<defs><marker id="fa-e" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" fill="${C.path}"/></marker><marker id="fa-s" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" fill="${C.path}"/></marker></defs>`;
function marks(pat, J) {
  return (pat.cues || []).map((c, i) => c[1] && J[c[1]] ? [i + 1, c[1], c[2]] : null).filter(Boolean).map(([n, j, off]) => {
    const p = add(J[j], off || [12, -12]);
    return `<g class="mk"><line x1="${f1(J[j][0])}" y1="${f1(J[j][1])}" x2="${f1(p[0])}" y2="${f1(p[1])}" stroke="${C.mark}" stroke-width="1.4"/><circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="8.5" fill="#0f1115" stroke="${C.mark}" stroke-width="2"/><text x="${f1(p[0])}" y="${f1(p[1] + 4)}" text-anchor="middle" font-size="11" font-weight="800" fill="${C.mark}">${n}</text></g>`;
  }).join('');
}
const ground = pat => pat.noGround ? '' : `<line x1="8" y1="${GY}" x2="312" y2="${GY}" stroke="${C.ground}" stroke-width="2"/>`;
window.FORM_SCENE = { scene, pathArrow, marks, DEFS, ground, lerpPose, jointsOf };
})();

/* ───────── 동작 패턴 (시작/끝 자세 + 기구 + 핵심 포인트) ───────── */
(function () {
'use strict';
const E = window.FORM_ENGINE;
const { GY, add, sub, sideJ } = E;
const A = GY - 4; // 서 있을 때 발목 높이
const BR = {
  push: '내릴 때 들이마시고, 밀 때 "후—" 내쉬어요. 무거운 세트는 들이마신 채 배에 힘(복압)을 주고 민 뒤 내쉬어요.',
  pull: '당길 때 내쉬고, 천천히 되돌아갈 때 들이마셔요.',
  leg: '내려가기 전에 크게 들이마셔 배에 힘을 주고(복압), 올라오면서(또는 올라온 뒤) 내쉬어요.',
  iso: '힘주는 구간에서 내쉬고, 천천히 돌아올 때 들이마셔요. 숨을 오래 참지 않아요.',
  core: '배를 조일 때 내쉬어요. 버티는 동작은 숨을 참지 말고 짧게 계속 쉬어요.',
  cardio: '코로 들이마시고 입으로 길게 내쉬며 리듬을 유지해요. 말은 할 수 있지만 노래는 힘든 정도가 중강도예요.',
};
const handTo = (pose, tgt, eb, tgtF) => { const J = sideJ({ ...pose, hk: null, hkF: null }); const o = { ...pose, hk: sub(tgt, J.shoulder) }; if (tgtF) o.hkF = sub(tgtF, J.shoulder); if (eb) o.eb = eb; return o; };
const footTo = (pose, tgt, kb, tgtF, kbF) => { const J = sideJ({ ...pose, lk: null, lkF: null }); const o = { ...pose, lk: sub(tgt, J.hip) }; if (tgtF) o.lkF = sub(tgtF, J.hip); if (kb) o.kb = kb; if (kbF) o.kbF = kbF; return o; };
const relHand = (pose, f, eb) => { const J = sideJ({ ...pose, hk: null }); return { ...pose, hk: sub(f(J), J.shoulder), eb: eb || pose.eb }; };
const S = o => ({ view: 'side', ...o });
const Fv = o => ({ view: 'front', ...o });
const Bv = o => ({ view: 'back', ...o });
const PT = {};
const POST = (x, y1 = 20) => ({ t: 'line', p: [[x, GY], [x, y1]], w: 6, c: '#3a414f' });
const RAIL = x => ({ t: 'line', p: [[x, 20], [x, GY]], w: 4, c: '#3a414f' });

PT.squat = (o = {}) => {
  const load = o.load || 'bar';
  const AR = { bar: { rel: true, ua: [-48, -48], fa: [150, 150] }, front: { rel: true, ua: [78, 78], fa: [243, 243] }, goblet: { rel: true, ua: [10, 10], fa: [148, 148] }, bw: { rel: true, ua: [84, 84], fa: [84, 84] }, db: { ua: [0, 0], fa: [0, 0] } };
  const arms = AR[load === 'smith' || load === 'box' ? 'bar' : load === 'belt' ? 'db' : load];
  const deep = load === 'front' || load === 'goblet' ? { tr: 24, th: [101, 101], sh: [-42, -42] } : { tr: 40, th: [97, 97], sh: [-33, -33] };
  const s = { tr: 4, th: [0, 0], sh: [0, 0], at: ['ankleN', [165, A]], ...arms };
  let e = { ...s, ...deep };
  let s2 = s;
  if (o.jump) { s2 = { ...s, tr: 30, th: [70, 70], sh: [-30, -30], ua: [-30, -30], fa: [-20, -20], rel: false }; e = { ...s, tr: 6, th: [0, 0], sh: [0, 0], ft: [25, 25], ua: [150, 150], fa: [160, 160], rel: false, at: ['ankleN', [165, A - 24]] }; }
  const eq = [];
  if (['bar', 'front', 'smith', 'box'].includes(load)) eq.push({ t: 'bar', j: 'handN', front: true, off: load === 'front' ? [2, 2] : [-4, 2] });
  if (load === 'smith') eq.unshift(RAIL(150), RAIL(180));
  if (load === 'box') eq.unshift({ t: 'rect', x: 92, y: 150, w: 46, h: 50 });
  if (load === 'goblet') eq.push({ t: 'db', j: 'handN', front: true, r: 8 });
  if (load === 'db') eq.push({ t: 'db', j: 'handN', front: true }, { t: 'db', j: 'handF' });
  if (load === 'belt') eq.push({ t: 'cable', from: [150, GY - 2], j: 'hip', off: [0, 8], grip: false }, { t: 'rect', x: 100, y: GY - 6, w: 130, h: 6, c: '#3a414f' });
  return S({ s: s2, e, eq, path: ['hip'], pathOff: [-26, 0], lab: o.jump ? ['준비', '점프'] : ['선 자세', '앉은 자세'],
    cues: [['발은 어깨너비, 발끝은 살짝 바깥(15~30°)', 'toeN', [18, -14]], ['무릎은 발끝 방향으로 — 안으로 모이지 않게', 'kneeN', [18, -10]], ['허리는 곧게, 엉덩이를 뒤·아래로 보내며 앉기', 'hip', [-24, -10]], ['발 전체(특히 뒤꿈치)로 바닥을 밀며 일어나기']], breath: BR.leg });
};
PT.hack = (o = {}) => {
  const k = o.k || 'hack';
  const tr = k === 'v' ? -26 : k === 'reverse' ? 34 : -40;
  const ank = [205, 166];
  const r = tr * Math.PI / 180, u = [Math.sin(r), -Math.cos(r)], n = [Math.cos(r), Math.sin(r)];
  const hs = k === 'reverse' ? add(ank, [-26, -84]) : add(ank, [-48, -72]);
  const he = k === 'reverse' ? add(ank, [-70, -40]) : k === 'pendulum' ? add(hs, [26, 46]) : add(hs, [-u[0] * 42, -u[1] * 42]);
  const s = { tr, ft: [105, 105], at: ['hip', hs], lk: sub(ank, hs), kb: 'fwd', hk: k === 'reverse' ? [14, 30] : [10, -3], eb: 'down' };
  const e = { ...s, at: ['hip', he], lk: sub(ank, he) };
  const off = k === 'reverse' ? 14 : -14;
  const rail0 = add(add(hs, n, off * 1.6), u, 70), rail1 = add(add(he, n, off * 1.6), u, -40);
  const eq = [
    { t: 'line', p: [rail0, rail1], w: 5, c: '#3a414f' },
    { t: 'line', p: [add(ank, [-16, 9]), add(ank, [30, -3])], w: 7, c: '#7b8698' },
    { t: 'line', p: [add(ank, [8, 5]), [ank[0] + 8, GY]], w: 6, c: '#3a414f' },
    { t: 'torsopad', a: -6, b: 60, off, w: 11 },
    { t: 'roller', j: 'shoulder', off: k === 'reverse' ? [6, -6] : [-2, -8], r: 6.5, front: true },
  ];
  const cues = k === 'reverse'
    ? [['가슴을 패드에, 발은 발판 위쪽', 'shoulder', [22, -14]], ['엉덩이를 뒤로 빼며 깊게 앉기', 'hip', [-26, 6]], ['무릎은 발끝 방향', 'kneeN', [16, -12]], ['엉덩이를 앞으로 밀며 일어나기']]
    : [['등·엉덩이를 패드에 완전히 붙이기', 'hip', [-26, 6]], ['발은 발판 중간, 어깨너비', 'toeN', [16, -14]], ['무릎은 발끝 방향, 허벅지가 발판과 평행 이하까지', 'kneeN', [16, -12]], ['올라올 때 무릎을 끝까지 잠그지 않기 · 끝나면 안전 손잡이 걸기']];
  return S({ s, e, eq, path: ['hip'], pathOff: k === 'reverse' ? [0, 0] : [-14, 10], lab: ['시작 (선 자세)', '앉은 자세'], cues, breath: BR.leg });
};
PT.legpress = (o = {}) => {
  const k = o.k || '45';
  const hip = k === 'horiz' ? [100, 150] : [92, 158];
  const tr = k === 'horiz' ? -22 : -56;
  const rd = k === 'horiz' ? [1, -0.06] : [0.71, -0.71];
  const s0 = add(hip, rd, 84), e0 = add(hip, rd, 44);
  const ftS = k === 'horiz' ? 180 : -135;
  const s = { tr, at: ['hip', hip], lk: sub(s0, hip), kb: 'up', ft: [ftS, ftS] };
  let e = { ...s, lk: sub(e0, hip) };
  if (k === 'calf') e = { ...s, lk: sub(add(s0, rd, 8), hip), ft: [ftS + 45, ftS + 45] };
  if (k === 'single') { s.lkF = [16, 40]; s.kbF = 'fwd'; e.lkF = [16, 40]; e.kbF = 'fwd'; }
  const sH = handTo(s, add(hip, [12, 4]), 'down'), eH = handTo(e, add(hip, [12, 4]), 'down');
  const eq = [
    { t: 'line', p: [add(add(hip, rd, 30), [10, 18]), add(add(hip, rd, 150), [10, 18])], w: 5, c: '#3a414f' },
    { t: 'fplate', j: 'ankleN', na: k === 'horiz' ? 90 : 135, off: 8, l: 46, front: true },
    { t: 'torsopad', a: -8, b: 62, off: -14, w: 11 },
    { t: 'line', p: [add(hip, [-14, 12]), add(hip, [26, 12])], w: 10 },
    { t: 'line', p: [add(hip, [4, 16]), [hip[0] + 4, GY]], w: 6, c: '#3a414f' },
  ];
  return S({ s: sH, e: eH, eq, path: ['ankleN'], pathOff: [18, 14], lab: k === 'calf' ? ['발뒤꿈치 내림', '발끝으로 밀기'] : ['다리 편 자세', '내린 자세'],
    cues: k === 'calf' ? [['무릎은 살짝만 굽혀 고정', 'kneeN', [-6, -18]], ['발 앞쪽(볼)만 발판에', 'toeN', [16, -6]], ['발목만 움직여 끝까지 밀고 1초 멈춤']]
      : [['허리·엉덩이를 등받이에 붙인 채 유지', 'hip', [-22, 12]], ['발은 발판 중간, 어깨너비', 'toeN', [14, -10]], ['무릎은 발끝 방향, 엉덩이가 들리기 전까지만 내리기', 'kneeN', [-14, -16]], ['밀 때 무릎을 완전히 잠그지 않기']], breath: BR.leg });
};
PT.lunge = (o = {}) => {
  const k = o.k || 'lunge';
  if (o.sissy) {
    const s2 = { tr: 2, at: ['toeN', [180, GY - 2]], ft: [62, 62], th: [0, 0], sh: [0, 0], ua: [60, 60], fa: [60, 60] };
    const e2 = { ...s2, tr: -32, th: [50, 50], sh: [-62, -62] };
    return S({ s: s2, e: e2, eq: [POST(245, 60)], path: ['kneeN'], pathOff: [10, 0], lab: ['선 자세', '뒤로 기댄 자세'],
      cues: [['발뒤꿈치를 들고 기둥을 가볍게 잡기', 'toeN', [16, -12]], ['무릎을 앞으로 내밀며 몸통·허벅지를 일직선으로', 'kneeN', [18, -6]], ['무릎이 아프면 범위를 줄이기']], breath: BR.leg });
  }
  const fa = k === 'step' ? [196, 160] : [196, A], ba = k === 'bss' ? [92, 146] : [104, 190];
  const sHip = k === 'step' ? [152, 118] : [152, 110], eHip = k === 'step' ? [186, 76] : k === 'bss' ? [148, 146] : [150, 146];
  const ftF = k === 'bss' ? 20 : 62;
  const base = { tr: 6, ft: [90, ftF], kb: 'fwd', kbF: k === 'step' ? 'fwd' : 'down', ua: [0, 0], fa: [0, 0] };
  const s = { ...base, at: ['hip', sHip], lk: sub(fa, sHip), lkF: sub(k === 'step' ? [130, A] : ba, sHip) };
  const e = { ...base, tr: 8, at: ['hip', eHip], lk: sub(fa, eHip), lkF: sub(k === 'step' ? [178, 150] : ba, eHip), ft: [90, k === 'step' ? 40 : ftF] };
  if (o.bar) { s.rel = e.rel = true; s.ua = e.ua = [-48, -48]; s.fa = e.fa = [150, 150]; }
  const eq = [];
  if (!o.bar) eq.push({ t: 'db', j: 'handN', front: true }, { t: 'db', j: 'handF' });
  else eq.push({ t: 'bar', j: 'handN', off: [-4, 2], front: true });
  if (o.smith) eq.unshift(RAIL(150));
  if (k === 'bss') eq.unshift({ t: 'bench', a: [62, 156], b: [104, 156], legs: [[70, 156], [98, 156]] });
  if (k === 'step') eq.unshift({ t: 'rect', x: 168, y: 166, w: 60, h: 34 });
  return S({ s, e, eq, path: ['hip'], pathOff: [-24, 0], lab: k === 'step' ? ['발 올리기', '올라선 자세'] : ['시작', '내려간 자세'],
    cues: [['앞발 전체로 바닥을 누르기, 무릎은 발끝 방향', 'kneeN', [18, -10]], ['몸통은 세우고 골반은 정면', 'shoulder', [22, -8]], [k === 'step' ? '뒷발로 차지 말고 앞다리 힘으로 오르기' : '뒷무릎은 바닥 가까이 수직으로 내리기', 'kneeF', [-20, -6]], ['앞발 뒤꿈치로 밀며 올라오기']], breath: BR.leg });
};
PT.legext = () => {
  const hip = [120, 136];
  const s = { tr: -12, at: ['hip', hip], th: [86, 86], sh: [-6, -6], ft: [84, 84], hk: [16, 52] };
  const e = { ...s, sh: [82, 82], ft: [168, 168] };
  return S({ s, e, eq: [{ t: 'torsopad', a: -4, b: 58, off: -14, w: 11 }, { t: 'line', p: [[96, 148], [160, 148]], w: 10 }, { t: 'line', p: [[124, 154], [124, GY]], w: 6, c: '#3a414f' },
    { t: 'limbpad', a: 'kneeN', b: 'ankleN', at: 0.88, side: 1, d: 9, r: 7, front: true }],
    path: ['ankleN'], pathOff: [10, 0], lab: ['굽힌 자세', '편 자세'],
    cues: [['무릎 관절을 머신 회전축에 맞추기', 'kneeN', [4, -20]], ['패드는 발목 바로 위 정강이에', 'ankleN', [16, 8]], ['허벅지 앞 힘으로 끝까지 펴고 1초 멈춤'], ['내릴 때 천천히 (2~3초)']], breath: BR.iso });
};
PT.legcurl = (o = {}) => {
  const k = o.k || 'seated';
  if (k === 'lying') {
    const s = { tr: 92, at: ['hip', [160, 142]], th: [-92, -92], sh: [-92, -92], ft: [-20, -20], hk: [14, 26], hd: -18 };
    const e = { ...s, sh: [-205, -205], ft: [-120, -120] };
    return S({ s, e, eq: [{ t: 'bench', a: [80, 156], b: [240, 156], legs: [[100, 156], [220, 156]] }, { t: 'limbpad', a: 'kneeN', b: 'ankleN', at: 0.9, side: -1, d: 9, front: true }],
      path: ['ankleN'], pathOff: [0, -8], lab: ['편 자세', '굽힌 자세'],
      cues: [['무릎은 벤치 끝 바로 밖, 회전축에 맞추기', 'kneeN', [0, -22]], ['엉덩이가 들리지 않게 골반을 패드에 눌러요', 'hip', [0, -24]], ['발뒤꿈치를 엉덩이 쪽으로 당기기', 'ankleN', [-6, -22]], ['펼 때 천천히']], breath: BR.iso });
  }
  if (k === 'standing') {
    const s = { tr: 6, at: ['ankleF', [160, A]], th: [4, 0], sh: [4, 0], ua: [60, 60], fa: [80, 80] };
    const e = { ...s, th: [10, 0], sh: [-110, 0], ft: [0, 90] };
    return S({ s, e, eq: [{ t: 'line', p: [[225, GY], [225, 70], [205, 70]], w: 6, c: '#3a414f' }, { t: 'limbpad', a: 'kneeN', b: 'ankleN', at: 0.9, side: -1, d: 9, front: true }], path: ['ankleN'], lab: ['편 자세', '굽힌 자세'],
      cues: [['무릎을 패드에 대고 골반은 고정', 'kneeN', [18, -6]], ['발뒤꿈치를 엉덩이 쪽으로', 'ankleN', [-20, 6]], ['상체가 따라 숙여지지 않게']], breath: BR.iso });
  }
  const s = { tr: -14, at: ['hip', [116, 136]], th: [86, 86], sh: [82, 82], ft: [168, 168], hk: [18, 50] };
  const e = { ...s, sh: [-16, -16], ft: [80, 80] };
  return S({ s, e, eq: [{ t: 'torsopad', a: -4, b: 58, off: -14, w: 11 }, { t: 'line', p: [[92, 148], [156, 148]], w: 10 }, { t: 'line', p: [[120, 154], [120, GY]], w: 6, c: '#3a414f' },
    { t: 'limbpad', a: 'hip', b: 'kneeN', at: 0.72, side: 1, d: 11, r: 6.5, front: true }, { t: 'limbpad', a: 'kneeN', b: 'ankleN', at: 0.9, side: -1, d: 9, front: true }],
    path: ['ankleN'], pathOff: [0, 8], lab: ['편 자세', '굽힌 자세'],
    cues: [['무릎을 회전축에, 허벅지 패드로 고정', 'kneeN', [4, -24]], ['패드는 아킬레스건 바로 위', 'ankleN', [14, 12]], ['발뒤꿈치를 아래·뒤로 끝까지 당기기'], ['돌아갈 때 천천히']], breath: BR.iso });
};
PT.calf = (o = {}) => {
  const k = o.k || 'stand';
  if (k === 'seated') {
    const s = { tr: 2, at: ['toeN', [196, 176]], th: [88, 88], sh: [0, 0], ft: [112, 112], hk: [24, 40] };
    const e = { ...s, ft: [54, 54] };
    return S({ s, e, eq: [{ t: 'rect', x: 182, y: 178, w: 40, h: 22 }, { t: 'line', p: [[100, 150], [160, 150]], w: 10 }, { t: 'limbpad', a: 'hip', b: 'kneeN', at: 0.92, side: 1, d: 11, r: 7, front: true }],
      path: ['kneeN'], pathOff: [0, -14], lab: ['내린 자세', '올린 자세'], cues: [['패드는 무릎 바로 위 허벅지에', 'kneeN', [14, -20]], ['발 앞쪽만 발판에, 발뒤꿈치 끝까지 내리기', 'toeN', [18, -8]], ['끝까지 올려 1초 멈춤']], breath: BR.iso });
  }
  const arms = k === 'machine' ? { ua: [150, 150], fa: [200, 200] } : k === 'smith' ? { rel: true, ua: [-48, -48], fa: [150, 150] } : { ua: [0, 0], fa: [0, 0] };
  const s = { tr: 0, at: ['toeN', [184, 172]], ft: [114, 114], ...arms };
  const e = { ...s, ft: [52, 52] };
  const eq = [{ t: 'rect', x: 168, y: 174, w: 46, h: 26 }];
  if (k === 'machine') eq.push({ t: 'roller', j: 'shoulder', off: [0, -9], r: 8, front: true }, POST(120, 40));
  if (k === 'smith') eq.push(RAIL(150), { t: 'bar', j: 'handN', off: [-4, 2], front: true });
  return S({ s, e, eq, path: ['head'], pathOff: [20, 0], lab: ['내린 자세', '올린 자세'], cues: [['발 앞쪽(볼)만 발판 끝에', 'toeN', [18, -10]], ['무릎은 곧게(살짝만 굽힘) 고정', 'kneeN', [18, -8]], ['발뒤꿈치를 끝까지 내렸다가 끝까지 올려 1초 멈춤']], breath: BR.iso });
};
PT.abd = (o = {}) => {
  const out = o.k !== 'add';
  const sTh = out ? 76 : 34, eTh = out ? 38 : 78;
  const base = { at: ['hip', [160, 150]], ua: [[24, 10], [24, 10]], fa: [[14, 40], [14, 40]], sh: [[0, 0], [0, 0]] };
  const s = { ...base, th: [[90, sTh], [90, sTh]] }, e = { ...base, th: [[90, eTh], [90, eTh]] };
  const offs = out ? { kneeL: [-9, 2], kneeR: [9, 2] } : { kneeL: [9, 2], kneeR: [-9, 2] };
  return Fv({ s, e, eq: [{ t: 'rect', x: 136, y: 84, w: 48, h: 72, c: '#3a414f' }, { t: 'rect', x: 128, y: 152, w: 64, h: 10 }, { t: 'line', p: [[160, 162], [160, GY]], w: 6, c: '#3a414f' },
    { t: 'fpad', j: ['kneeL', 'kneeR'], offs, w: 9, h: 30, front: true }, { t: 'line', p: [[96, 196], [224, 196]], w: 5, c: '#7b8698' }],
    path: ['kneeL', 'kneeR'], pathOff: [0, -20], lab: out ? ['모은 자세', '벌린 자세'] : ['벌린 자세', '모은 자세'],
    cues: out ? [['무릎 바깥쪽을 패드에', 'kneeR', [22, -18]], ['등은 등받이에, 허리 곧게 (살짝 앞으로 숙이면 엉덩이에 더)', 'chest', [26, -20]], ['엉덩이 옆 힘으로 끝까지 벌리고 1초 멈춤'], ['모을 때 패드가 쾅 닫히지 않게 천천히']]
      : [['무릎 안쪽을 패드에', 'kneeR', [22, -18]], ['편하게 벌어지는 범위로 시작 각도 맞추기', 'kneeL', [-24, -18]], ['허벅지 안쪽 힘으로 모으고 1초 멈춤'], ['벌릴 때 천천히 늘리기']], breath: BR.iso });
};
PT.abdCable = () => {
  const s = { at: ['ankleL', [148, A]], th: [[3, 0], [4, 0]], sh: [[2, 0], [3, 0]], ua: [[60, 0], [14, 0]], fa: [[100, 180], [10, 0]] };
  const e = { ...s, th: [[3, 0], [40, 0]], sh: [[2, 0], [40, 0]] };
  return Fv({ s, e, eq: [POST(92, 40), { t: 'fcable1', from: [96, 192], j: 'ankleR', front: true }], path: ['ankleR'], lab: ['모은 자세', '벌린 자세'],
    cues: [['기둥을 잡고 몸통은 곧게', 'handL', [-18, -18]], ['발끝은 정면, 엉덩이 옆 힘으로 다리 벌리기', 'ankleR', [20, -16]], ['몸이 기울어지지 않는 범위까지만']], breath: BR.iso });
};
PT.bandwalk = () => {
  const s = { at: ['hip', [160, 122]], th: [[18, 20], [18, 20]], sh: [[8, 0], [8, 0]], ua: [[20, 70], [20, 70]], fa: [[80, 120], [80, 120]] };
  const e = { ...s, th: [[18, 20], [40, 20]], sh: [[8, 0], [22, 0]] };
  return Fv({ s, e, eq: [{ t: 'band', a: 'kneeL', b: 'kneeR', front: true }], path: ['ankleR'], lab: ['시작', '옆으로 한 걸음'],
    cues: [['무릎 위 또는 발목에 밴드, 살짝 앉은 자세', 'kneeL', [-22, -14]], ['발끝은 정면, 무릎이 안으로 모이지 않게', 'kneeR', [22, -14]], ['상체를 흔들지 않고 작게 옆으로 걷기']], breath: BR.iso });
};
PT.hinge = (o = {}) => {
  const k = o.k || 'dl';
  const stand = { tr: 0, th: [0, 0], sh: [0, 0], at: ['ankleN', [160, A]], hk: [2, 60] };
  let s, e, lab = ['선 자세', '숙인 자세'];
  if (k === 'dl' || k === 'sumo' || k === 'trap') {
    const low = k === 'sumo' ? { tr: 44, th: [96, 96], sh: [-16, -16] } : { tr: 60, th: [85, 85], sh: [-25, -25] };
    s = handTo({ ...stand, ...low }, [170, GY - 15]); e = stand; lab = ['바닥에서 시작', '선 자세'];
  } else if (k === 'rack') {
    s = handTo({ ...stand, tr: 44, th: [26, 26], sh: [-8, -8] }, [168, 146]); e = stand; lab = ['시작 (무릎 높이)', '선 자세'];
  } else if (k === 'gm') {
    s = { ...stand, hk: null, rel: true, ua: [-48, -48], fa: [150, 150] }; e = { ...s, tr: 76, th: [14, 14], sh: [-4, -4] };
  } else if (k === 'sl') {
    s = { ...stand }; e = { ...s, tr: 80, th: [12, -80], sh: [-6, -80], ft: [90, 0] };
  } else if (k === 'swing') {
    s = { ...stand, tr: 58, th: [40, 40], sh: [-14, -14], hk: [-16, 58] }; e = { ...stand, hk: [60, 2] }; lab = ['다리 사이로', '가슴 높이'];
  } else if (k === 'pull') {
    s = { ...stand, tr: 62, th: [30, 30], sh: [-10, -10], hk: [-30, 56] }; e = { ...stand, hk: [-8, 60] }; lab = ['숙인 자세', '선 자세'];
  } else {
    s = { ...stand }; e = { ...stand, tr: k === 'sldl' ? 82 : 72, th: k === 'sldl' ? [6, 6] : [22, 22], sh: k === 'sldl' ? [0, 0] : [-8, -8] };
  }
  const eq = [];
  const load = o.load || 'bar';
  if (load === 'bar') eq.push({ t: 'bar', j: 'handN', front: true, off: k === 'gm' ? [-4, 2] : [0, 0] });
  if (load === 'db') eq.push({ t: 'db', j: 'handN', front: true }, { t: 'db', j: 'handF' });
  if (load === 'kb') eq.push({ t: 'kb', j: 'handN', front: true });
  if (load === 'cable') eq.push({ t: 'cable', from: [60, 190], j: 'handN', front: true });
  if (k === 'rack') eq.unshift({ t: 'line', p: [[205, GY], [205, 150], [160, 150]], w: 5, c: '#3a414f' });
  const floor = ['dl', 'sumo', 'trap', 'rack'].includes(k);
  const cues = k === 'sl' ? [['서 있는 다리 무릎은 살짝 굽혀 고정', 'kneeN', [18, -8]], ['골반이 옆으로 돌아가지 않게 정면 유지', 'hip', [-22, -14]], ['뒷다리·몸통이 일직선으로 함께 내려가기']]
    : k === 'swing' ? [['엉덩이를 뒤로 접었다가 앞으로 강하게 펴기 (스쿼트 아님)', 'hip', [-24, -10]], ['팔은 힘 빼고 엉덩이 힘으로 올리기', 'handN', [14, -16]], ['맨 위에서 엉덩이·복부 조이기']]
    : [[k === 'pull' ? '케이블은 다리 사이로, 팔은 힘 빼기' : '바는 몸에 붙여 발 중앙 위로', 'handN', [18, 10]], ['허리는 중립(곧게), 등 말리지 않기', 'shoulder', [8, -22]], [floor ? '다리로 바닥을 밀고, 바가 무릎을 지나면 엉덩이를 앞으로' : '엉덩이를 뒤로 빼며 햄스트링이 당길 때까지만', 'hip', [-24, -10]], ['맨 위에서 허리를 뒤로 젖히지 않기']];
  return S({ s, e, eq, path: [k === 'gm' ? 'shoulder' : k === 'sl' ? 'ankleF' : 'handN'], pathOff: k === 'gm' ? [0, -16] : [16, 0], lab, cues, breath: BR.leg });
};
PT.backext = (o = {}) => {
  if (o.superman) {
    const s = { tr: 90, at: ['hip', [160, GY - 9]], th: [-90, -90], sh: [-90, -90], ft: [-2, -2], ua: [90, 90], fa: [90, 90] };
    const e = { ...s, tr: 76, th: [-102, -102], sh: [-104, -104], ua: [102, 102], fa: [104, 104] };
    return S({ s, e, eq: [], path: ['handN'], lab: ['엎드린 자세', '들어 올린 자세'], cues: [['엎드려 팔은 머리 위로 길게', 'handN', [8, -18]], ['등·엉덩이 힘으로 팔다리를 동시에 살짝 들기', 'hip', [0, -24]], ['목은 바닥을 보며 중립, 2초 멈춤']], breath: BR.core });
  }
  const s = { tr: 160, at: ['hip', [168, 112]], lk: [-62, 62], ft: [45, 45], rel: true, ua: [30, 30], fa: [150, 150], hd: -20 };
  const e = { ...s, tr: 46, hd: 0 };
  return S({ s, e, eq: [{ t: 'circle', c: [178, 122], r: 9, fill: '#5b6578', s: '#5b6578', w: 1 }, { t: 'line', p: [[178, 122], [140, 186], [140, GY]], w: 6, c: '#3a414f' }, { t: 'circle', c: [100, 172], r: 7, fill: '#5b6578', s: '#5b6578', w: 1 }],
    path: ['head'], lab: ['내려간 자세', '일직선'], cues: [['패드는 골반 바로 아래 (허리 접히는 곳이 패드 밖)', 'hip', [24, 4]], ['등을 곧게 편 채 엉덩이 힘으로 올라오기', 'shoulder', [18, -16]], ['다리와 일직선까지만 — 과하게 젖히지 않기']], breath: BR.core });
};
PT.thrust = (o = {}) => {
  const k = o.k || 'bb';
  const ank = [218, A];
  if (k === 'bridge') {
    const s = footTo({ tr: -90, at: ['shoulder', [96, GY - 10]], ua: [92, 92], fa: [92, 92] }, ank, 'up');
    const e = footTo({ ...s, tr: -112, lk: null }, ank, 'up');
    return S({ s, e, eq: [], path: ['hip'], pathOff: [0, -14], lab: ['누운 자세', '올린 자세'], cues: [['발은 엉덩이 가까이, 발바닥 전체로', 'toeN', [16, -14]], ['엉덩이를 조이며 어깨~무릎 일직선까지', 'hip', [0, -26]], ['허리를 젖히지 말고 갈비뼈는 내리기']], breath: BR.iso });
  }
  const sh = [100, 146];
  const s0 = footTo({ tr: -46, at: ['shoulder', sh] }, ank, 'up');
  const e0 = footTo({ tr: -92, at: ['shoulder', sh] }, ank, 'up');
  const bar = J => add(J.hip, [0, -13]);
  const s = handTo(s0, bar(sideJ(s0)), 'down'), e = handTo(e0, bar(sideJ(e0)), 'down');
  const eq = [{ t: 'bench', a: [40, 154], b: [104, 154], legs: [[52, 154], [96, 154]] }];
  if (k === 'bb' || k === 'smith') eq.push({ t: 'bar', j: 'hip', off: [0, -14], r: 14, front: true });
  if (k === 'machine') eq.push({ t: 'roller', j: 'hip', off: [0, -13], r: 8, front: true });
  if (k === 'smith') eq.unshift(RAIL(150));
  return S({ s, e, eq, path: ['hip'], pathOff: [0, -26], lab: ['내린 자세', '올린 자세'],
    cues: [['날개뼈 아래를 벤치 모서리에', 'shoulder', [-10, -22]], ['정강이가 수직이 되게 발 위치', 'kneeN', [16, -14]], ['엉덩이를 조여 몸통이 바닥과 평행할 때까지', 'hip', [10, 24]], ['턱은 살짝 당기고 허리는 젖히지 않기']], breath: BR.iso });
};
PT.kickback = (o = {}) => {
  if (o.k === 'cable') {
    const s = { tr: 22, at: ['ankleF', [150, A]], th: [8, 0], sh: [8, 0], ua: [66, 66], fa: [80, 80], ft: [90, 90] };
    const e = { ...s, th: [-38, 0], sh: [-40, 0], ft: [20, 90] };
    return S({ s, e, eq: [POST(232, 60), { t: 'cable', from: [228, 190], j: 'ankleN', front: true }], path: ['ankleN'], lab: ['시작', '뒤로 민 자세'],
      cues: [['기둥을 잡고 상체 살짝 숙여 고정', 'handN', [16, -16]], ['허리 대신 엉덩이로 다리를 뒤로', 'hip', [-22, -14]], ['허리가 꺾이기 전까지만']], breath: BR.iso });
  }
  const s = { tr: 60, at: ['ankleF', [128, A]], th: [52, 12], sh: [-30, 0], ft: [60, 90], rel: true, ua: [-60, -60], fa: [30, 30] };
  const e = { ...s, th: [-50, 12], sh: [-44, 0], ft: [20, 90] };
  return S({ s, e, eq: [{ t: 'torsopad', a: 8, b: 50, off: 15, w: 10 }, POST(200, 120), { t: 'fplate', j: 'ankleN', na: -40, off: 6, l: 30, front: true }],
    path: ['ankleN'], lab: ['굽힌 자세', '민 자세'], cues: [['가슴·팔을 패드에 대고 몸통 고정', 'shoulder', [12, -22]], ['허리는 중립, 엉덩이로 다리를 뒤로 밀기', 'hip', [-10, -24]], ['끝에서 엉덩이를 1초 조이기']], breath: BR.iso });
};
PT.bench = (o = {}) => {
  const a = o.a || 0, load = o.load || 'bar';
  const tr = -90 + a;
  const hip = a > 0 ? [186, 150] : a < 0 ? [178, 126] : [180, 136];
  const r = tr * Math.PI / 180, u = [Math.sin(r), -Math.cos(r)], n = [Math.cos(r), Math.sin(r)];
  const ank = a < 0 ? add(hip, [30, 42]) : [a > 0 ? 226 : 218, A];
  const base = footTo({ tr, at: ['hip', hip], ft: [90, 90] }, ank, 'up');
  const s = { ...base, hk: [a > 0 ? 6 : a < 0 ? -6 : 0, -60], eb: 'down' };
  const e = { ...s, hk: add(add([0, 0], u, -14), n, 24) };
  const p0 = add(add(hip, n, -16), u, -14), p1 = add(add(hip, n, -16), u, 80);
  const eq = [{ t: 'bench', a: p0, b: p1, legs: a > 0 ? [add(hip, [-6, 16])] : [p0, add(p1, [10, 0])] }];
  if (a > 0) eq.push({ t: 'line', p: [add(hip, [-20, 14]), add(hip, [20, 14])], w: 10 });
  if (a < 0) eq.push({ t: 'roller', j: 'ankleN', off: [6, -6], r: 7, front: true });
  if (load === 'bar') eq.push({ t: 'bar', j: 'handN', front: true });
  if (load === 'smith') eq.push(RAIL(124), { t: 'bar', j: 'handN', front: true });
  if (load === 'db') eq.push({ t: 'db', j: 'handN', front: true, r: 8 }, { t: 'db', j: 'handF', r: 8 });
  return S({ s, e, eq, path: ['handN'], pathOff: [18, 0], lab: ['팔 편 자세', '내린 자세'],
    cues: [['어깨뼈를 모아 아래로, 가슴을 살짝 들기', 'shoulder', [-18, 20]], ['발은 바닥에 단단히', 'toeN', [16, -12]], [load === 'db' ? '덤벨은 가슴 옆까지, 팔꿈치 45~70°' : '바는 가슴 중앙~아래로, 팔꿈치 45~70°', 'elbowN', [18, 14]], ['손목은 곧게 세우고 엉덩이는 벤치에']], breath: BR.push });
};
PT.chestpress = (o = {}) => {
  const k = o.k || 'flat';
  const hip = [116, 152];
  const s = footTo({ tr: k === 'incline' ? -24 : -12, at: ['hip', hip], ft: [90, 90] }, [158, A], 'fwd');
  const S0 = { ...s, hk: [16, 12], eb: 'back' };
  const end = { flat: [58, 4], incline: [44, -34], decline: [52, 26] }[k];
  const E0 = { ...S0, hk: end, eb: 'down' };
  const J = sideJ(E0);
  const piv = add(J.handN, k === 'decline' ? [40, -70] : [46, -60]);
  const eq = [{ t: 'torsopad', a: -6, b: 62, off: -14, w: 11 }, { t: 'line', p: [add(hip, [-24, 12]), add(hip, [22, 12])], w: 10 }, { t: 'line', p: [add(hip, [-6, 16]), [hip[0] - 6, GY]], w: 6, c: '#3a414f' },
    { t: 'stack', x: 262, y: 70, w: 30, h: 128 }, { t: 'line', p: [piv, [277, piv[1]], [277, 70]], w: 6, c: '#3a414f' }, { t: 'lever', piv, j: 'handN', front: true }];
  return S({ s: S0, e: E0, eq, path: ['handN'], pathOff: [0, 16], lab: ['가슴 늘린 자세', '민 자세'],
    cues: [[k === 'incline' ? '손잡이가 가슴 위쪽(쇄골 아래) 높이' : k === 'decline' ? '손잡이가 가슴 아래쪽 높이' : '손잡이가 가슴 중간 높이가 되게 시트 조절', 'handN', [8, -22]], ['등·엉덩이를 등받이에, 어깨뼈 모으기', 'shoulder', [-26, -10]], ['팔꿈치를 잠그기 직전까지 밀기', 'elbowN', [6, 22]], ['돌아올 때 가슴이 늘어나는 지점까지 천천히']], breath: BR.push });
};
PT.cablepress = () => {
  const s = { tr: 8, at: ['ankleN', [170, A]], th: [14, -14], sh: [0, -14], hk: [16, 12], eb: 'back', ft: [90, 90] };
  const e = { ...s, hk: [60, 4], eb: 'down' };
  return S({ s, e, eq: [POST(34), { t: 'cable', from: [40, 96], j: 'handN', front: true }], path: ['handN'], pathOff: [0, 14], lab: ['가슴 옆', '민 자세'],
    cues: [['앞뒤로 발을 벌려 몸 고정', 'kneeN', [18, -6]], ['가슴을 편 채 앞으로 밀기', 'handN', [8, -20]], ['어깨가 앞으로 말리지 않게']], breath: BR.push });
};
PT.fly = (o = {}) => {
  const k = o.k || 'pecdeck';
  if (k === 'pecdeck' || k === 'rear') {
    const rear = k === 'rear';
    const open = { ua: [[88, -8], [88, -8]], fa: [[84, 2], [84, 2]] }, close = { ua: [[88, 96], [88, 96]], fa: [[88, 112], [88, 112]] };
    const base = { at: ['hip', [160, 150]], th: [[90, 80], [90, 80]], sh: [[0, 0], [0, 0]] };
    const s = { ...base, ...(rear ? close : open) }, e = { ...base, ...(rear ? open : close) };
    const eq = [{ t: 'rect', x: 156, y: 30, w: 8, h: 40, c: '#3a414f' }, { t: 'rect', x: 128, y: 152, w: 64, h: 10 }, { t: 'line', p: [[160, 162], [160, GY]], w: 6, c: '#3a414f' },
      { t: 'flever', piv: [[132, 80], [188, 80]], front: true }, { t: 'grip', front: true }];
    if (!rear) eq.unshift({ t: 'rect', x: 136, y: 80, w: 48, h: 74, c: '#3a414f' });
    return (rear ? Bv : Fv)({ s, e, eq, path: ['handL', 'handR'], pathOff: [0, -2], lab: rear ? ['모은 자세 (뒤에서 본 모습)', '벌린 자세'] : ['벌린 자세', '모은 자세'],
      cues: rear ? [['가슴을 패드에 붙이고 손잡이는 어깨 높이', 'shoulderL', [-26, -20]], ['팔꿈치는 살짝 굽혀 고정, 팔 전체로 크게 벌리기', 'elbowR', [22, -20]], ['어깨 으쓱 금지 — 뒤쪽 어깨로 밀기', 'shoulderR', [26, -26]], ['돌아올 때 천천히, 무게가 쉬지 않게']]
        : [['손잡이(팔)가 가슴 중간 높이가 되게 시트 조절', 'handR', [6, 24]], ['팔꿈치는 살짝 굽힌 채 끝까지 고정', 'elbowL', [-22, -20]], ['등·머리는 등받이에, 어깨는 내리고 가슴은 펴기', 'shoulderR', [24, -26]], ['큰 원을 그리듯 모아 1초 쥐어짜고, 벌릴 땐 어깨 뒤로 넘기지 않기']], breath: BR.iso });
  }
  if (k === 'db') {
    const base = { at: ['hip', [160, 156]], th: [[4, 0], [4, 0]], sh: [[2, 0], [2, 0]] };
    const s = { ...base, ua: [[90, 90], [90, 90]], fa: [[90, 92], [90, 92]] }, e = { ...base, ua: [[96, -22], [96, -22]], fa: [[96, -14], [96, -14]] };
    return Fv({ s, e, noGround: true, eq: [{ t: 'rect', x: 140, y: 60, w: 40, h: 150, c: '#3a414f' }, { t: 'fdb', front: true, vert: true }], path: ['handL', 'handR'], lab: ['모은 자세 (위에서 본 모습)', '벌린 자세'],
      cues: [['벤치에 누워 어깨뼈를 모으고 가슴 펴기', 'shoulderL', [-26, -18]], ['팔꿈치를 살짝 굽힌 각도 그대로 큰 원 그리기', 'elbowR', [22, -18]], ['가슴이 늘어나는 정도까지만 내리기 (어깨 앞이 아프면 범위 줄이기)']], breath: BR.iso });
  }
  const pul = { mid: [[18, 98], [302, 98]], high: [[18, 26], [302, 26]], low: [[18, 192], [302, 192]] }[k];
  const sA = { mid: [88, -14], high: [118, -10], low: [42, -10] }[k], eA = { mid: [88, 96], high: [52, 94], low: [118, 94] }[k];
  const base = { at: ['ankleL', [146, A]], th: [[4, 0], [4, 0]], sh: [[2, 0], [2, 0]] };
  const s = { ...base, ua: [sA, sA], fa: [[sA[0] - 2, sA[1] + 8], [sA[0] - 2, sA[1] + 8]] }, e = { ...base, ua: [eA, eA], fa: [[eA[0] - 4, eA[1] + 14], [eA[0] - 4, eA[1] + 14]] };
  return Fv({ s, e, eq: [POST(12, 18), POST(308, 18), { t: 'fcable', from: pul, front: true }], path: ['handL', 'handR'], lab: ['벌린 자세', '모은 자세'],
    cues: [['한 발 앞으로, 상체 살짝 숙여 고정', 'chest', [26, -22]], ['팔꿈치는 살짝 굽혀 고정', 'elbowR', [22, -16]], [k === 'high' ? '위→아래로, 손이 배꼽 앞에서 만나게' : k === 'low' ? '아래→위로, 손이 턱 앞에서 만나게' : '가슴 앞에서 손을 모아 1초 쥐어짜기'], ['돌아갈 때 천천히']], breath: BR.iso });
};
PT.rearFlyCable = () => {
  const base = { at: ['ankleL', [146, A]], th: [[4, 0], [4, 0]], sh: [[2, 0], [2, 0]] };
  const s = { ...base, ua: [[88, 100], [88, 100]], fa: [[88, 110], [88, 110]] }, e = { ...base, ua: [[88, -6], [88, -6]], fa: [[87, 0], [87, 0]] };
  return Bv({ s, e, eq: [POST(12, 18), POST(308, 18), { t: 'fcable', from: [[18, 70], [302, 70]], cross: true, front: true }], path: ['handL', 'handR'], lab: ['교차한 자세 (뒤에서 본 모습)', 'T자로 벌린 자세'],
    cues: [['케이블을 X자로 교차해 반대 손으로', 'handR', [22, -20]], ['팔꿈치 살짝 굽혀 고정, 어깨 높이로 벌리기', 'elbowL', [-22, -20]], ['어깨 으쓱 금지, 뒤쪽 어깨로']], breath: BR.iso });
};
PT.bentRear = () => {
  const base = { at: ['hip', [160, 120]], tl: 0.42, th: [[6, 0], [6, 0]], sh: [[2, 0], [2, 0]] };
  const s = { ...base, ua: [[4, 6], [4, 6]], fa: [[4, 10], [4, 10]] }, e = { ...base, ua: [[84, -4], [84, -4]], fa: [[82, 4], [82, 4]] };
  return Bv({ s, e, eq: [{ t: 'fdb', front: true }], path: ['handL', 'handR'], lab: ['내린 자세 (뒤에서 본 모습)', '벌린 자세'],
    cues: [['엉덩이를 뒤로 빼 상체를 바닥과 거의 평행하게', 'hip', [-26, 10]], ['팔꿈치 살짝 굽혀 고정, 옆으로 어깨 높이까지', 'elbowR', [22, -18]], ['반동 없이, 새끼손가락 쪽이 살짝 위']], breath: BR.iso });
};
PT.lateral = (o = {}) => {
  const k = o.k || 'db', mach = k === 'machine';
  const base = { at: mach ? ['hip', [160, 150]] : ['ankleL', [148, A]], th: mach ? [[90, 80], [90, 80]] : [[4, 0], [4, 0]], sh: [[2, 0], [2, 0]] };
  const fS = mach ? [100, 90] : [12, 18], fE = mach ? [120, 80] : [82, 16];
  const s = { ...base, ua: [[12, 12], [12, 12]], fa: [fS, fS] }, e = { ...base, ua: [[86, 10], [86, 10]], fa: [fE, fE] };
  const eq = [];
  if (k === 'db') eq.push({ t: 'fdb', front: true });
  if (k === 'cable') eq.push(POST(18, 40), POST(302, 40), { t: 'fcable', from: [[24, 194], [296, 194]], cross: true, front: true });
  if (mach) eq.push({ t: 'rect', x: 128, y: 152, w: 64, h: 10 }, { t: 'line', p: [[160, 162], [160, GY]], w: 6, c: '#3a414f' }, { t: 'fpad', j: ['elbowL', 'elbowR'], offs: { elbowL: [-5, -2], elbowR: [5, -2] }, w: 12, h: 14, front: true });
  return Fv({ s, e, eq, path: ['handL', 'handR'], lab: ['내린 자세', '어깨 높이'],
    cues: [['팔꿈치를 살짝 굽혀 고정', 'elbowR', [22, -16]], ['손이 아니라 팔꿈치를 옆으로 밀어 올리는 느낌', 'handL', [-24, -16]], ['어깨 높이까지만, 어깨 으쓱·반동 금지', 'shoulderR', [26, -24]], ['내릴 때 2초 천천히']], breath: BR.iso });
};
PT.frontRaise = (o = {}) => {
  const s = { tr: 0, at: ['ankleN', [150, A]], ua: [6, 6], fa: [8, 8] }, e = { ...s, ua: [90, 90], fa: [92, 92] };
  const eq = o.cable ? [{ t: 'cable', from: [138, GY - 2], j: 'handN', front: true }] : [{ t: 'db', j: 'handN', front: true }, { t: 'db', j: 'handF' }];
  return S({ s, e, eq, path: ['handN'], lab: ['내린 자세', '어깨 높이'], cues: [['팔꿈치 살짝 굽혀 고정', 'elbowN', [14, 16]], ['어깨 높이까지만 들기', 'handN', [12, -18]], ['몸을 뒤로 젖히는 반동 금지', 'hip', [-24, -10]]], breath: BR.iso });
};
PT.yraise = () => {
  const s = { tr: 48, at: ['ankleN', [110, A]], th: [-22, -22], sh: [-22, -22], ft: [70, 70], ua: [0, 0], fa: [0, 0] }, e = { ...s, ua: [136, 136], fa: [136, 136] };
  return S({ s, e, eq: [{ t: 'torsopad', a: -4, b: 56, off: 15, w: 10 }, POST(188, 150), { t: 'db', j: 'handN', front: true }], path: ['handN'], lab: ['내린 자세', 'Y자로 올린 자세'],
    cues: [['인클라인 벤치에 가슴을 대고 엎드리기', 'shoulder', [-10, -22]], ['엄지를 위로, 팔을 Y자로 귀 옆까지', 'handN', [16, -10]], ['어깨 으쓱 대신 날개뼈를 아래로']], breath: BR.iso });
};
PT.uprow = () => {
  const s = { at: ['ankleL', [148, A]], ua: [[8, 180], [8, 180]], fa: [[8, 180], [8, 180]] }, e = { ...s, ua: [[94, 10], [94, 10]], fa: [[36, 172], [36, 172]] };
  return Fv({ s, e, eq: [{ t: 'fbar', ext: 30, front: true }], path: ['elbowL', 'elbowR'], lab: ['내린 자세', '당긴 자세'], cues: [['어깨너비보다 넓게 잡기', 'handR', [24, 10]], ['팔꿈치가 손보다 높게, 어깨 높이까지만', 'elbowL', [-22, -16]], ['어깨가 찝히면 범위 줄이기']], breath: BR.pull });
};
PT.shrug = (o = {}) => {
  const s = { at: ['ankleL', [148, A]], ua: [[6, 0], [6, 0]], fa: [[4, 0], [4, 0]], shr: 0 }, e = { ...s, shr: 8 };
  return Fv({ s, e, eq: [o.db ? { t: 'fdb', front: true, vert: true } : { t: 'fbar', ext: 34, front: true }], path: ['shoulderR'], pathOff: [10, 0], lab: ['내린 자세', '올린 자세'],
    cues: [['팔은 힘을 빼고 곧게', 'elbowL', [-22, 0]], ['어깨를 귀 쪽으로 똑바로 올려 1초', 'shoulderR', [24, -18]], ['어깨를 돌리지 않기']], breath: BR.iso });
};
PT.ohp = (o = {}) => {
  const k = o.k || 'bar';
  if (k === 'bar' || k === 'smith' || k === 'landmine') {
    const seated = k === 'smith';
    const s = seated ? footTo({ tr: -6, at: ['hip', [126, 148]], ft: [90, 90] }, [168, A], 'fwd') : { tr: 0, at: ['ankleN', [150, A]] };
    const S0 = { ...s, hk: k === 'landmine' ? [16, 2] : [14, -4], eb: 'down' }, E0 = { ...S0, hk: k === 'landmine' ? [40, -46] : [2, -60] };
    const eq = [];
    if (k === 'landmine') eq.push({ t: 'lever', piv: [300, GY - 4], j: 'handN', w: 5, front: true });
    else eq.push({ t: 'bar', j: 'handN', front: true });
    if (seated) eq.unshift(RAIL(140), { t: 'torsopad', a: -6, b: 60, off: -14, w: 11 }, { t: 'line', p: [[104, 160], [146, 160]], w: 10 });
    return S({ s: S0, e: E0, eq, path: ['handN'], pathOff: [14, 0], lab: ['어깨 앞', '머리 위'],
      cues: [[k === 'landmine' ? '바 끝을 어깨 앞에서 시작' : '바는 쇄골 위, 손목은 곧게', 'handN', [16, 8]], ['엉덩이·복부를 조여 허리가 꺾이지 않게', 'hip', [-24, -8]], [k === 'landmine' ? '위·앞으로 밀어 팔 펴기' : '바가 지나가면 머리를 살짝 앞으로, 귀 옆에서 팔 펴기', 'head', [-20, -14]]], breath: BR.push });
  }
  const base = { at: ['hip', [160, 150]], th: [[90, 70], [90, 70]], sh: [[0, 0], [0, 0]] };
  const s = k === 'arnold' ? { ...base, ua: [[40, 88], [40, 88]], fa: [[175, 0], [175, 0]] } : { ...base, ua: [[94, 0], [94, 0]], fa: [[176, 0], [176, 0]] };
  const e = { ...base, ua: [[160, 0], [160, 0]], fa: [[168, 180], [168, 180]] };
  const eq = [{ t: 'rect', x: 136, y: 80, w: 48, h: 74, c: '#3a414f' }, { t: 'rect', x: 128, y: 152, w: 64, h: 10 }, { t: 'line', p: [[160, 162], [160, GY]], w: 6, c: '#3a414f' }];
  eq.push(k === 'db' || k === 'arnold' ? { t: 'fdb', front: true } : { t: 'grip', front: true });
  return Fv({ s, e, eq, path: ['handL', 'handR'], lab: k === 'arnold' ? ['손바닥이 나를 향한 자세', '머리 위'] : ['귀 높이', '머리 위'],
    cues: [['등을 등받이에 붙이고 허리 곧게', 'chest', [28, -22]], ['팔꿈치는 손목 바로 아래, 살짝 앞쪽', 'elbowR', [22, 10]], [k === 'arnold' ? '팔을 돌리며 밀어 올리기 (손바닥 앞으로)' : '귀 높이에서 머리 위로 밀기, 팔꿈치 잠그지 않기', 'handL', [-22, -14]]], breath: BR.push });
};
PT.pike = () => {
  const hand = [214, GY - 5];
  const s = handTo(footTo({ tr: 140, at: ['hip', [142, 104]], ft: [40, 40] }, [96, A], 'fwd'), hand, 'back');
  const e = handTo(footTo({ tr: 146, at: ['hip', [148, 120]], ft: [40, 40] }, [96, A], 'fwd'), hand, 'back');
  return S({ s, e, eq: [], path: ['head'], lab: ['엉덩이를 높인 자세', '머리를 내린 자세'], cues: [['엉덩이를 높게, 몸을 ㅅ자로', 'hip', [0, -24]], ['머리를 손 앞쪽 바닥으로 내리기', 'head', [18, 12]], ['팔꿈치는 45° 정도로']], breath: BR.push });
};
PT.row = (o = {}) => {
  const k = o.k || 'bent';
  if (['bent', 'pendlay', 'tbar', 'smith'].includes(k)) {
    const tr = k === 'pendlay' ? 80 : k === 'tbar' ? 50 : 60;
    const base = { tr, at: ['ankleN', [160, A]], th: [28, 28], sh: [-12, -12] };
    const s = k === 'pendlay' ? handTo(base, [176, GY - 15]) : { ...base, hk: [0, 60] };
    const e = relHand(base, J => add(add(J.hip, J._u, 16), J._n, 15), 'up');
    const eq = [];
    if (k === 'tbar') eq.push({ t: 'lever', piv: [36, GY - 3], j: 'handN', w: 5 }, { t: 'bar', j: 'handN', r: 13, front: true });
    else eq.push({ t: 'bar', j: 'handN', front: true });
    if (k === 'smith') eq.unshift(RAIL(176));
    return S({ s, e, eq, path: ['handN'], pathOff: [16, 0], lab: ['팔 편 자세', '당긴 자세'],
      cues: [[`상체를 ${k === 'pendlay' ? '바닥과 거의 평행하게' : '45~70°'} 숙이고 허리는 곧게`, 'shoulder', [6, -22]], ['바를 배꼽 쪽으로, 팔꿈치는 뒤로', 'elbowN', [-6, -20]], ['무릎은 살짝 굽혀 고정, 반동 금지', 'kneeN', [18, -6]]], breath: BR.pull });
  }
  if (k === 'db') {
    const base = { tr: 78, at: ['ankleN', [176, A]], th: [15, -10], sh: [-5, -90], ft: [90, 0], hkF: [6, 60] };
    const s = { ...base, hk: [0, 58] }, e = relHand(base, J => add(add(J.hip, J._u, 10), J._n, 10), 'up');
    return S({ s, e, eq: [{ t: 'bench', a: [96, 166], b: [246, 166], legs: [[110, 166], [232, 166]] }, { t: 'db', j: 'handN', front: true }], path: ['handN'], pathOff: [14, 0], lab: ['팔 편 자세', '당긴 자세'],
      cues: [['한 손·한 무릎을 벤치에, 등은 평평하게', 'shoulder', [8, -22]], ['덤벨을 골반 쪽으로 당기기 (팔꿈치는 몸통 옆)', 'elbowN', [-4, -22]], ['몸통이 돌아가지 않게']], breath: BR.pull });
  }
  if (k === 'chest') {
    const base = { tr: 50, at: ['ankleN', [118, A]], th: [-22, -22], sh: [-22, -22], ft: [70, 70] };
    const s = { ...base, hk: [0, 58] }, e = relHand(base, J => add(add(J.hip, J._u, 20), J._n, 14), 'up');
    return S({ s, e, eq: [{ t: 'torsopad', a: -4, b: 62, off: 15, w: 10 }, POST(196, 150), { t: 'db', j: 'handN', front: true }], path: ['handN'], pathOff: [14, 0], lab: ['팔 편 자세', '당긴 자세'],
      cues: [['가슴을 패드에 붙여 허리 부담 없이', 'shoulder', [10, -22]], ['팔꿈치를 뒤로 당겨 날개뼈 모으기', 'elbowN', [-4, -22]], ['내릴 때 등이 늘어나게 천천히']], breath: BR.pull });
  }
  if (k === 'inverted') {
    const bar = [151, 96];
    const s = handTo({ tr: -72, at: ['ankleN', [270, A]], th: [72, 72], sh: [72, 72], ft: [162, 162] }, bar, 'down');
    const e = handTo({ tr: -60, at: ['ankleN', [270, A]], th: [60, 60], sh: [60, 60], ft: [150, 150] }, bar, 'down');
    return S({ s, e, eq: [{ t: 'line', p: [[151, GY], [151, 96]], w: 4, c: '#3a414f' }, { t: 'circle', c: bar, r: 4, fill: '#8a94a7', s: '#8a94a7', w: 1 }], path: ['shoulder'], lab: ['매달린 자세', '당긴 자세'],
      cues: [['몸을 머리~발뒤꿈치 일직선으로', 'hip', [0, 22]], ['가슴을 바로 당기기', 'shoulder', [-20, -16]], ['엉덩이가 처지지 않게']], breath: BR.pull });
  }
  const seatAt = [118, 158];
  const seat = { tr: k === 'cable' ? 12 : 0, at: ['hip', seatAt] };
  const b0 = footTo(seat, k === 'cable' ? [196, 168] : [160, A], k === 'cable' ? 'up' : 'fwd');
  const hS = { cable: [58, 4], machine: [54, 8], low: [48, 30], high: [38, -44] }[k], hE = { cable: [10, 22], machine: [2, 16], low: [-4, 36], high: [6, 14] }[k];
  const s = { ...b0, hk: hS, eb: 'down' }, e = { ...b0, tr: k === 'cable' ? -4 : 0, hk: hE, eb: k === 'high' ? 'down' : 'back' };
  const eq = [{ t: 'line', p: [add(seatAt, [-30, 12]), add(seatAt, [24, 12])], w: 10 }, { t: 'line', p: [add(seatAt, [-6, 16]), [seatAt[0] - 6, GY]], w: 6, c: '#3a414f' }];
  if (k === 'cable') eq.push({ t: 'line', p: [[208, 150], [208, 182]], w: 6, c: '#7b8698' }, { t: 'cable', from: [300, 150], j: 'handN', front: true }, { t: 'stack', x: 286, y: 40, w: 28, h: 100 });
  else eq.push({ t: 'torsopad', a: 18, b: 48, off: 15, w: 10 }, { t: 'lever', piv: k === 'high' ? [210, 30] : [228, 70], j: 'handN', front: true });
  return S({ s, e, eq, path: ['handN'], pathOff: [0, 14], lab: ['팔 뻗은 자세', '당긴 자세'],
    cues: [[k === 'cable' ? '무릎 살짝 굽히고 허리 곧게' : '가슴 패드에 가슴을 붙이기', 'shoulder', [-22, -16]], ['어깨를 내리고 팔꿈치로 뒤로 당기기', 'elbowN', [-8, 20]], ['날개뼈를 모으고 1초, 돌아갈 땐 등이 늘어나게']], breath: BR.pull });
};
PT.facepull = () => {
  const s = { tr: 0, at: ['ankleN', [150, A]], th: [10, -10], sh: [0, -10], hk: [56, 4], eb: 'down' }, e = { ...s, hk: [4, -14], eb: 'up' };
  return S({ s, e, eq: [POST(304), { t: 'cable', from: [298, 62], j: 'handN', front: true }], path: ['handN'], pathOff: [0, -10], lab: ['팔 뻗은 자세', '얼굴로 당긴 자세'],
    cues: [['도르래는 얼굴 높이, 로프를 엄지가 뒤로 오게', 'handN', [12, 14]], ['팔꿈치를 높게, 손을 귀 옆으로 벌리며 당기기', 'elbowN', [-6, -22]], ['몸이 뒤로 젖혀지지 않게']], breath: BR.pull });
};
PT.straightArm = () => {
  const s = { tr: 22, at: ['ankleN', [140, A]], th: [12, 12], sh: [-6, -6], hk: [44, -40] }, e = { ...s, hk: [6, 58] };
  return S({ s, e, eq: [POST(300, 16), { t: 'cable', from: [294, 26], j: 'handN', front: true }], path: ['handN'], pathOff: [10, 0], lab: ['위', '허벅지 앞'],
    cues: [['팔꿈치는 살짝 굽혀 끝까지 고정', 'elbowN', [16, -14]], ['광배로 바를 허벅지까지 쓸어내리기', 'handN', [16, 4]], ['상체 각도는 그대로']], breath: BR.pull });
};
PT.pullover = (o = {}) => {
  if (o.machine) {
    const base = footTo({ tr: -4, at: ['hip', [126, 150]] }, [168, A], 'fwd');
    const s = { ...base, hk: [-18, -54], eb: 'fwd' }, e = { ...base, hk: [26, 46], eb: 'fwd' };
    return S({ s, e, eq: [{ t: 'torsopad', a: -6, b: 62, off: -14, w: 11 }, { t: 'line', p: [[100, 162], [150, 162]], w: 10 }, { t: 'limbpad', a: 'shoulder', b: 'elbowN', at: 0.95, side: -1, d: 2, r: 7, front: true }],
      path: ['elbowN'], lab: ['머리 위', '몸 앞'], cues: [['어깨를 회전축 높이에 맞추기', 'shoulder', [-24, -10]], ['팔꿈치로 패드를 눌러 원을 그리기', 'elbowN', [18, -10]], ['손은 가볍게, 광배로']], breath: BR.pull });
  }
  const base = footTo({ tr: -90, at: ['hip', [196, 136]], ft: [90, 90] }, [232, A], 'up');
  const s = { ...base, hk: [0, -60] }, e = { ...base, hk: [-56, -6], eb: 'up' };
  return S({ s, e, eq: [{ t: 'bench', a: [100, 152], b: [230, 152], legs: [[112, 152], [218, 152]] }, { t: 'db', j: 'handN', front: true, r: 8 }], path: ['handN'], lab: ['가슴 위', '머리 뒤'],
    cues: [['팔꿈치를 살짝 굽혀 고정', 'elbowN', [14, -16]], ['갈비뼈가 들리지 않게 복부에 힘', 'hip', [-20, 22]], ['가슴·광배가 늘어나는 데까지만 머리 뒤로']], breath: BR.pull });
};
PT.pulldown = (o = {}) => {
  const k = o.k || 'wide';
  const base = { at: ['hip', [160, 150]], th: [[90, 80], [90, 80]], sh: [[0, 0], [0, 0]] };
  const sU = k === 'wide' || k === 'iso' ? [164, 0] : [172, 0], sF = k === 'wide' || k === 'iso' ? [170, 0] : [174, 0];
  const eU = k === 'close' || k === 'reverse' ? [40, 60] : [48, 0], eF = [175, 180];
  const s = { ...base, ua: [sU, sU], fa: [sF, sF] }, e = { ...base, ua: [eU, eU], fa: [eF, eF] };
  const eq = [{ t: 'rect', x: 128, y: 152, w: 64, h: 10 }, { t: 'line', p: [[160, 162], [160, GY]], w: 6, c: '#3a414f' }, { t: 'fpad', j: ['kneeL', 'kneeR'], off: [0, -9], w: 22, h: 9, front: true }];
  if (k === 'iso') eq.push({ t: 'flever', piv: [[120, 6], [200, 6]], front: true });
  else if (k === 'one') { s.ua = [[20, 0], sU]; e.ua = [[20, 0], eU]; s.fa = [[70, 90], sF]; e.fa = [[70, 90], eF]; eq.push({ t: 'fcable1', from: [196, 6], j: 'handR', front: true }); }
  else eq.push({ t: 'midcable', from: [160, 6] }, { t: 'fbar', ext: k === 'wide' ? 16 : 6, plates: false, front: true });
  return Fv({ s, e, eq, path: k === 'one' ? ['handR'] : ['handL', 'handR'], lab: ['팔 편 자세', '당긴 자세'],
    cues: [['허벅지를 패드에 고정, 가슴을 펴기', 'kneeL', [-24, -12]], ['어깨를 먼저 내리고 팔꿈치를 옆구리로', 'elbowR', [24, -8]], [k === 'wide' ? '바를 쇄골~윗가슴까지' : '손잡이를 가슴 쪽으로', 'handL', [-22, -16]], ['올라갈 때 등이 늘어나게 천천히']], breath: BR.pull });
};
PT.pullup = (o = {}) => {
  const k = o.k || 'pull';
  const assist = k === 'assist';
  const legs = assist ? { th: [[90, 90], [90, 90]], sh: [[90, -90], [90, -90]] } : { th: [[4, 0], [4, 0]], sh: [[22, -90], [22, -90]] };
  const s = { at: ['handL', [k === 'chin' ? 134 : 122, 30]], ua: [[160, 0], [160, 0]], fa: [[165, 0], [165, 0]], ...legs };
  const e = { ...s, ua: [[43, 0], [43, 0]], fa: [[176, 180], [176, 180]] };
  const eq = [{ t: 'line', p: [[60, 30], [260, 30]], w: 5, c: '#8a94a7' }, POST(60, 30), POST(260, 30)];
  if (assist) eq.push({ t: 'fpad', j: ['kneeL', 'kneeR'], off: [0, 8], w: 34, h: 8, front: true });
  return Fv({ s, e, eq, path: ['chest'], pathOff: [0, -6], lab: ['매달린 자세', '턱이 바 위'],
    cues: [[k === 'chin' ? '어깨너비로 손바닥이 나를 향하게' : '어깨보다 조금 넓게 잡기', 'handR', [22, 10]], ['어깨를 먼저 끌어내리고 팔꿈치를 옆구리로', 'elbowL', [-24, 6]], [assist ? '무릎을 패드에 — 보조 kg이 낮을수록 어려워요' : '몸을 흔들지 말고 턱이 바 위까지', assist ? 'kneeR' : 'head', assist ? [24, 6] : [22, -10]], ['내려갈 때 팔을 거의 펴기']], breath: BR.pull });
};
PT.dips = (o = {}) => {
  const k = o.k || 'bar';
  if (k === 'bench') {
    const s = footTo({ tr: -4, at: ['handN', [104, 136]], ua: [-12, -12], fa: [-12, -12] }, [238, A], 'up');
    const e = footTo({ ...s, lk: null, ua: [-74, -74], fa: [-6, -6] }, [238, A], 'up');
    return S({ s, e, eq: [{ t: 'bench', a: [60, 142], b: [112, 142], legs: [[66, 142], [106, 142]] }], path: ['shoulder'], pathOff: [-14, 0], lab: ['팔 편 자세', '내린 자세'],
      cues: [['손은 엉덩이 바로 옆 벤치 끝에', 'handN', [-18, -14]], ['엉덩이는 벤치에 가깝게 수직으로 내리기', 'hip', [-20, 12]], ['어깨가 앞으로 말리면 범위 줄이기']], breath: BR.push });
  }
  if (k === 'machine') {
    const base = footTo({ tr: 0, at: ['hip', [126, 150]] }, [168, A], 'fwd');
    const s = { ...base, hk: [10, 18], eb: 'back' }, e = { ...base, hk: [4, 56] };
    return S({ s, e, eq: [{ t: 'torsopad', a: -6, b: 60, off: -14, w: 11 }, { t: 'line', p: [[100, 162], [150, 162]], w: 10 }, { t: 'lever', piv: [60, 120], j: 'handN', front: true }], path: ['handN'], pathOff: [14, 0], lab: ['굽힌 자세', '편 자세'],
      cues: [['어깨를 내리고 가슴 펴기', 'shoulder', [-22, -12]], ['팔꿈치를 몸 옆에 붙인 채 아래로 밀기', 'elbowN', [16, -10]], ['끝에서 삼두를 조이고 천천히 올라오기']], breath: BR.push });
  }
  const hand = [168, 118];
  const legs = k === 'assist' ? { th: [86, 86], sh: [-90, -90], ft: [0, 0] } : { th: [8, 8], sh: [-60, -60], ft: [20, 20] };
  const s = { tr: 8, at: ['handN', hand], ua: [4, 4], fa: [4, 4], ...legs }, e = { ...s, tr: 22, ua: [-60, -60], fa: [20, 20] };
  const eq = [{ t: 'line', p: [[120, hand[1] + 4], [228, hand[1] + 4]], w: 5, c: '#8a94a7', front: true }, POST(220, hand[1] + 4)];
  if (k === 'assist') eq.push({ t: 'limbbar', a: 'kneeN', b: 'ankleN', side: 1, d: 9, w: 8, front: true });
  return S({ s, e, eq, path: ['shoulder'], pathOff: [-16, 0], lab: ['팔 편 자세', '내린 자세'],
    cues: [['어깨를 내리고 가슴을 살짝 앞으로 (가슴 위주)', 'shoulder', [-24, -12]], ['어깨 앞이 불편하지 않은 깊이까지만', 'elbowN', [-22, 10]], k === 'assist' ? ['무릎을 패드에 — 보조 kg이 낮을수록 어려워요', 'kneeN', [20, 10]] : ['반동 없이 밀어 올리기']], breath: BR.push });
};
PT.pushdown = (o = {}) => {
  const s = { tr: 8, at: ['ankleN', [150, A]], ua: [4, 4], fa: [140, 140] }, e = { ...s, fa: [4, 4] };
  return S({ s, e, eq: [POST(214, 14), { t: 'cable', from: [206, 22], j: 'handN', front: true }], path: ['handN'], pathOff: [14, 0], lab: ['가슴 앞', '편 자세'],
    cues: [['팔꿈치는 옆구리에 붙여 고정', 'elbowN', [-22, 4]], [o.rope ? '아래에서 로프를 양옆으로 벌리기' : '팔을 끝까지 펴고 1초 조이기', 'handN', [18, 6]], ['상체로 누르지 않기 (반동 금지)']], breath: BR.iso });
};
PT.ohext = (o = {}) => {
  const seated = o.k === 'db';
  const s = seated ? footTo({ tr: 0, at: ['hip', [130, 150]], ua: [168, 168], fa: [-18, -18] }, [170, A], 'fwd') : { tr: 26, at: ['ankleN', [170, A]], th: [18, -16], sh: [0, -16], ua: [152, 152], fa: [-22, -22] };
  const e = { ...s, fa: seated ? [-192, -192] : [-208, -208] };
  const eq = seated ? [{ t: 'torsopad', a: -6, b: 54, off: -14, w: 11 }, { t: 'line', p: [[106, 162], [154, 162]], w: 10 }, { t: 'db', j: 'handN', front: true, r: 8 }] : [POST(40, 14), { t: 'cable', from: [46, 30], j: 'handN', front: true }];
  return S({ s, e, eq, path: ['handN'], lab: ['머리 뒤로 내린 자세', '편 자세'],
    cues: [['팔꿈치는 머리 옆에서 앞을 향하게 고정', 'elbowN', [18, -10]], ['장두가 늘어나도록 깊게 내리기', 'handN', [-20, 6]], ['허리가 꺾이지 않게 복부에 힘']], breath: BR.iso });
};
PT.skull = () => {
  const base = footTo({ tr: -90, at: ['hip', [196, 136]], ft: [90, 90] }, [232, A], 'up');
  const s = { ...base, ua: [195, 195], fa: [-30, -30] }, e = { ...base, ua: [195, 195], fa: [-165, -165] };
  return S({ s, e, eq: [{ t: 'bench', a: [100, 152], b: [230, 152], legs: [[112, 152], [218, 152]] }, { t: 'bar', j: 'handN', front: true, r: 13 }], path: ['handN'], lab: ['이마 쪽으로 내린 자세', '편 자세'],
    cues: [['팔꿈치는 어깨너비, 천장을 향해 고정', 'elbowN', [18, -10]], ['바를 이마~머리 위쪽으로 천천히', 'handN', [-18, -14]], ['팔꿈치가 벌어지지 않게']], breath: BR.iso });
};
PT.trikick = (o = {}) => {
  const s = { tr: 70, at: ['ankleN', [160, A]], th: [24, 24], sh: [-10, -10], ua: [-72, -72], fa: [6, 6] }, e = { ...s, fa: [-72, -72] };
  const eq = o.cable ? [POST(290, 40), { t: 'cable', from: [286, 186], j: 'handN', front: true }] : [{ t: 'db', j: 'handN', front: true }];
  return S({ s, e, eq, path: ['handN'], lab: ['굽힌 자세', '편 자세'], cues: [['상체를 숙이고 위팔을 몸통과 나란히 고정', 'elbowN', [-4, -20]], ['팔꿈치만 펴서 손을 뒤로', 'handN', [-20, 10]], ['위팔이 내려가지 않게']], breath: BR.iso });
};
PT.triMachine = () => {
  const base = footTo({ tr: -4, at: ['hip', [120, 150]] }, [162, A], 'fwd');
  const s = { ...base, ua: [52, 52], fa: [176, 176] }, e = { ...s, fa: [52, 52] };
  return S({ s, e, eq: [{ t: 'torsopad', a: -6, b: 60, off: -14, w: 11 }, { t: 'line', p: [[96, 162], [146, 162]], w: 10 }, { t: 'limbbar', a: 'shoulder', b: 'elbowN', side: 1, d: -9, w: 8, front: true }], path: ['handN'], lab: ['굽힌 자세', '편 자세'],
    cues: [['팔꿈치를 회전축에 맞춰 패드에 고정', 'elbowN', [14, 14]], ['팔꿈치만 펴서 끝까지', 'handN', [18, 6]], ['천천히 돌아오기']], breath: BR.iso });
};
PT.curl = (o = {}) => {
  const k = o.k || 'stand';
  if (k === 'preacher' || k === 'machine') {
    const base = footTo({ tr: 14, at: ['hip', [118, 150]] }, [162, A], 'fwd');
    const s = { ...base, ua: [40, 40], fa: [44, 44] }, e = { ...base, ua: [40, 40], fa: [178, 178] };
    const eq = [{ t: 'line', p: [[96, 162], [146, 162]], w: 10 }, { t: 'line', p: [[120, 162], [120, GY]], w: 6, c: '#3a414f' }, { t: 'limbpad', a: 'shoulder', b: 'elbowN', at: 0.75, side: 1, d: 9, r: 0, front: true }, { t: 'limbbar', a: 'shoulder', b: 'elbowN', side: 1, d: 9, w: 10 }];
    eq.push(k === 'machine' ? { t: 'lever', piv: [0, 0], j: 'handN', none: true } : { t: 'bar', j: 'handN', front: true, r: 13 });
    return S({ s, e, eq: eq.filter(x => !x.none), path: ['handN'], lab: ['편 자세', '굽힌 자세'],
      cues: [['겨드랑이를 패드 위 끝에 붙이기', 'shoulder', [-22, -12]], ['팔꿈치를 패드에 고정한 채 굽히기', 'elbowN', [18, 14]], ['완전히 펴기 직전까지 천천히 내리기 (팔꿈치 잠금 주의)']], breath: BR.iso });
  }
  if (k === 'incline') {
    const base = footTo({ tr: -42, at: ['hip', [130, 150]] }, [190, A], 'fwd');
    const s = { ...base, ua: [-8, -8], fa: [-6, -6] }, e = { ...base, ua: [-8, -8], fa: [134, 134] };
    return S({ s, e, eq: [{ t: 'torsopad', a: -6, b: 62, off: -14, w: 11 }, { t: 'line', p: [[106, 162], [154, 162]], w: 10 }, { t: 'db', j: 'handN', front: true }], path: ['handN'], lab: ['편 자세', '굽힌 자세'],
      cues: [['벤치를 45~60°로, 팔은 바닥 쪽으로 늘어뜨리기', 'elbowN', [-20, 10]], ['위팔은 고정한 채 팔꿈치만 굽히기', 'handN', [16, -6]], ['이두가 늘어나는 느낌으로 천천히 내리기']], breath: BR.iso });
  }
  if (k === 'conc') {
    const base = footTo({ tr: 40, at: ['hip', [120, 150]] }, [176, A], 'fwd');
    const s = { ...base, ua: [6, 6], fa: [4, 4] }, e = { ...base, ua: [6, 6], fa: [150, 150] };
    return S({ s, e, eq: [{ t: 'line', p: [[96, 162], [144, 162]], w: 10 }, { t: 'db', j: 'handN', front: true }], path: ['handN'], lab: ['편 자세', '굽힌 자세'],
      cues: [['팔꿈치를 허벅지 안쪽에 대고 고정', 'elbowN', [18, 6]], ['새끼손가락 쪽을 살짝 돌리며 올리기', 'handN', [16, -8]], ['몸으로 끌어올리지 않기']], breath: BR.iso });
  }
  if (k === 'wrist') {
    const base = footTo({ tr: 30, at: ['hip', [120, 150]] }, [176, A], 'fwd');
    const s = { ...base, ua: [30, 30], fa: [90, 90], wr: [-70, -70] }, e = { ...s, wr: [60, 60] };
    return S({ s, e, eq: [{ t: 'line', p: [[96, 162], [144, 162]], w: 10 }, { t: 'db', j: 'handN', front: true, r: 6 }], path: ['handN'], lab: ['손목 내린 자세', '말아 올린 자세'],
      cues: [['아래팔을 허벅지(또는 벤치)에 올려 고정', 'elbowN', [-6, 16]], ['손목만 천천히 말아 올리기', 'handN', [16, -10]]], breath: BR.iso });
  }
  const cable = k === 'cable' || k === 'bayesian';
  const bay = k === 'bayesian';
  const s = { tr: 0, at: ['ankleN', [150, A]], ua: bay ? [-26, -26] : [0, 0], fa: bay ? [-24, -24] : [2, 2] };
  if (bay) { s.th = [-14, 12]; s.sh = [0, 12]; }
  const e = { ...s, fa: bay ? [118, 118] : [140, 140] };
  const eq = [];
  if (k === 'bar') eq.push({ t: 'bar', j: 'handN', front: true, r: 13 });
  else if (cable) eq.push(POST(bay ? 22 : 220, 40), { t: 'cable', from: bay ? [28, 186] : [214, 188], j: 'handN', front: true });
  else eq.push({ t: 'db', j: 'handN', front: true }, { t: 'db', j: 'handF' });
  return S({ s, e, eq, path: ['handN'], lab: ['편 자세', '굽힌 자세'],
    cues: [['팔꿈치는 몸 옆에 고정 — 앞뒤로 움직이지 않게', 'elbowN', [-22, 4]], [k === 'hammer' ? '손바닥이 서로 마주 보게 들기' : '새끼손가락 쪽이 위로 오게 돌리며 올리기', 'handN', [16, -8]], ['상체 반동 없이, 내릴 때 2~3초']], breath: BR.iso });
};
PT.crunch = (o = {}) => {
  const k = o.k || 'crunch';
  if (k === 'cable') {
    const s = { tr: 30, at: ['kneeN', [170, 192]], th: [90, 90], sh: [90, 90], ft: [180, 180], ua: [140, 140], fa: [190, 190] };
    const e = { ...s, tr: 86, ua: [96, 96], fa: [150, 150] };
    return S({ s, e, noGround: false, eq: [POST(230, 14), { t: 'cable', from: [224, 24], j: 'handN', front: true }], path: ['head'], lab: ['편 자세', '말아 숙인 자세'],
      cues: [['무릎을 꿇고 로프를 머리 옆에', 'handN', [16, -10]], ['엉덩이는 고정, 갈비뼈를 골반 쪽으로 말기', 'shoulder', [-6, -24]], ['팔로 당기지 말고 복근으로']], breath: BR.core });
  }
  if (k === 'machine') {
    const base = footTo({ tr: -4, at: ['hip', [126, 150]] }, [168, A], 'fwd');
    const s = { ...base, ua: [150, 150], fa: [20, 20] }, e = { ...base, tr: 34, ua: [150, 150], fa: [20, 20] };
    return S({ s, e, eq: [{ t: 'line', p: [[100, 162], [150, 162]], w: 10 }, { t: 'limbpad', a: 'shoulder', b: 'elbowN', at: 0.2, side: -1, d: 8, r: 6, front: true }], path: ['head'], lab: ['편 자세', '말아 숙인 자세'],
      cues: [['패드를 가슴·어깨에 맞추기', 'shoulder', [-22, -12]], ['허리가 아니라 명치를 접는 느낌', 'chest', [16, -10]], ['천천히 돌아오기']], breath: BR.core });
  }
  const dec = k === 'decline';
  const hip = dec ? [170, 130] : [170, GY - 8];
  const legs = footTo({ tr: -90, at: ['hip', hip], ft: [90, 90] }, dec ? [242, 108] : [226, A], 'up');
  const s = { ...legs, ua: [210, 210], fa: [140, 140] };
  const e = { ...s, tr: k === 'situp' || dec ? -10 : -56 };
  const eq = dec ? [{ t: 'line', p: [[90, 156], [240, 112]], w: 10 }, { t: 'roller', j: 'ankleN', off: [6, -6], r: 7, front: true }, { t: 'line', p: [[120, 150], [120, GY]], w: 6, c: '#3a414f' }] : [];
  return S({ s, e, eq, rot: dec ? null : null, path: ['head'], lab: ['누운 자세', '말아 올린 자세'],
    cues: [['무릎을 세우고 허리를 바닥에 붙이기', 'kneeN', [12, -14]], [k === 'situp' || dec ? '등을 말며 천천히 올라오기' : '어깨뼈가 뜰 만큼만 갈비뼈를 골반 쪽으로', 'shoulder', [-6, -22]], ['손으로 목을 당기지 않기', 'head', [-20, -12]]], breath: BR.core });
};
PT.hold = (o = {}) => {
  const k = o.k || 'plank';
  if (k === 'hollow') {
    const s = { tr: -100, at: ['hip', [160, GY - 8]], th: [-80, -80], sh: [0, 0], ft: [-80, -80], ua: [-170, -170], fa: [0, 0] };
    const bad = { ...s, tr: -90, th: [-70, -70] };
    return S({ s, e: s, hold: true, bad, badLab: '❌ 허리가 뜸', eq: [], path: [], lab: ['바른 자세', '❌ 허리가 뜸'],
      cues: [['허리를 바닥에 꾹 눌러 붙이기', 'hip', [0, 20]], ['팔·다리를 뻗어 바나나 모양', 'ankleN', [10, -14]], ['힘들면 무릎을 굽혀 강도 낮추기']], breath: BR.core });
  }
  const side = k === 'side';
  const s = { tr: -100, at: ['handN', [88, GY - 5]], th: [-100, -100], sh: [0, 0], ft: [-10, -10], ua: [0, 0], fa: [-90, -90] };
  s.th = [-100, -100];
  const plank = { tr: -99, at: ['elbowN', [92, GY - 5]], th: [-81, -81], sh: [0, 0], ft: [-10, -10], ua: [0, 0], fa: [90, 90] };
  plank.th = [81, 81]; plank.tr = 99;
  const P = { tr: 99, at: ['elbowN', [92, GY - 5]], th: [0, 0], sh: [0, 0], ft: [-10, -10], ua: [-99, -99], fa: [-9, -9] };
  P.th = [0, 0];
  const good = { ...P, rel: true, ua: [-99, -99], fa: [-9, -9] };
  const bad = { ...good, th: [-18, -18], sh: [10, 10] };
  return S({ s: good, e: good, hold: true, bad, eq: [], path: [], lab: ['바른 자세', '❌ 엉덩이가 처짐'],
    cues: [['팔꿈치는 어깨 바로 아래', 'elbowN', [10, -20]], [side ? '머리~발이 옆에서 봐도 일직선' : '머리~발뒤꿈치 일직선, 엉덩이 들거나 처지지 않게', 'hip', [0, -22]], ['배꼽을 당기고 엉덩이를 조이기'], ['20~40초씩 짧게, 자세가 무너지면 쉬기']], breath: BR.core });
};
PT.legraise = (o = {}) => {
  const k = o.k || 'lying';
  if (k === 'hang' || k === 'knee' || k === 'captain') {
    const s = { tr: 0, at: ['handN', [150, 26]], ua: [180, 180], fa: [180, 180], th: [0, 0], sh: [0, 0] };
    if (k === 'captain') Object.assign(s, { at: ['elbowN', [146, 96]], ua: [0, 0], fa: [90, 90], rel: false });
    const e = { ...s, tr: k === 'hang' ? -14 : -6, th: k === 'hang' ? [96, 96] : [108, 108], sh: k === 'hang' ? [96, 96] : [0, 0] };
    const eq = k === 'captain' ? [{ t: 'torsopad', a: -10, b: 60, off: -14, w: 11 }, { t: 'line', p: [[120, 96], [176, 96]], w: 7, front: true }, POST(120, 96)] : [{ t: 'line', p: [[90, 26], [230, 26]], w: 5, c: '#8a94a7' }];
    return S({ s, e, noGround: k !== 'captain', eq, path: ['kneeN'], lab: ['매달린 자세', '올린 자세'],
      cues: [['몸이 흔들리지 않게 어깨를 살짝 끌어내리기', 'shoulder', [-22, 4]], [k === 'hang' ? '골반을 말아 다리를 엉덩이 높이 이상' : '무릎을 가슴 쪽으로, 골반을 말기', 'kneeN', [18, -8]], ['내릴 때 천천히 (반동 금지)']], breath: BR.core });
  }
  const hip = [160, GY - 8];
  const s0 = { tr: -90, at: ['hip', hip], ua: [-90, -90], fa: [0, 0] };
  const map = {
    lying: [{ th: [-80, -80], sh: [0, 0] }, { th: [0, 0], sh: [0, 0] }],
    reverse: [{ th: [-180, -180], sh: [-90, -90] }, { th: [-200, -200], sh: [-110, -110], tr: -70 }],
    vup: [{ th: [-86, -86], sh: [0, 0], ua: [-170, -170] }, { tr: -45, th: [-32, -32], sh: [0, 0], ua: [-60, -60] }],
    deadbug: [{ th: [-180, -180], sh: [-90, -90], ua: [-180, -180] }, { th: [-120, -180], sh: [-30, -90], ua: [-260, -180] }],
    bicycle: [{ tr: -70, th: [-150, -110], sh: [-80, -30], ua: [-210, -210], fa: [140, 140] }, { tr: -70, th: [-110, -150], sh: [-30, -80], ua: [-210, -210], fa: [140, 140] }],
  }[k] || [{ th: [-80, -80] }, { th: [0, 0] }];
  if (k === 'mountain') {
    const P = { tr: 104, at: ['handN', [96, GY - 5]], th: [0, 0], sh: [0, 0], ft: [-10, -10], ua: [-104, -104], fa: [0, 0] };
    const P2 = { ...P, th: [-74, 0], sh: [-170, 0] };
    return S({ s: P, e: P2, eq: [], path: ['kneeN'], lab: ['팔 편 플랭크', '무릎 당긴 자세'], cues: [['손은 어깨 바로 아래', 'handN', [16, -14]], ['엉덩이 높이를 유지한 채 무릎을 가슴으로 번갈아', 'kneeN', [12, -16]], ['빠르기보다 자세 먼저']], breath: BR.core });
  }
  const s = { ...s0, ...map[0] }, e = { ...s0, ...map[1] };
  return S({ s, e, eq: [], path: [k === 'deadbug' ? 'handN' : 'ankleN'], lab: ['시작', '끝'],
    cues: [['허리를 바닥에 붙인 상태 유지', 'hip', [0, 18]], [k === 'deadbug' ? '반대쪽 팔·다리를 천천히 뻗기' : k === 'bicycle' ? '팔꿈치와 반대 무릎을 가깝게' : '허리가 뜨기 직전까지만 다리 내리기', 'kneeN', [16, -14]], ['천천히, 숨 참지 않기']], breath: BR.core });
};
PT.twist = () => {
  const s = { tl: 0.25, at: ['hip', [160, 186]], th: [[90, 70], [90, 70]], sh: [[30, 70], [30, 70]], ua: [[40, 60], [70, 60]], fa: [[50, 100], [50, 100]] };
  const e = { ...s, ua: [[70, 60], [40, 60]], fa: [[50, 80], [50, 80]], lean: 0.25 };
  const s2 = { ...s, lean: -0.25 };
  return Fv({ s: s2, e, eq: [{ t: 'fdb', front: true, vert: true }], path: ['handL', 'handR'], lab: ['왼쪽', '오른쪽'], cues: [['상체를 살짝 뒤로 기울이고 허리 곧게', 'chest', [28, -20]], ['팔이 아니라 갈비뼈를 돌리기', 'handR', [24, 8]], ['발은 바닥에 (어려우면)']], breath: BR.core });
};
PT.abwheel = () => {
  const s = { tr: 140, at: ['kneeN', [110, GY - 6]], th: [90, 90], sh: [90, 90], ft: [180, 180] };
  const sH = handTo(s, [176, GY - 8], 'back');
  const e = handTo({ ...s, tr: 100, th: [60, 60] }, [238, GY - 8], 'back');
  return S({ s: sH, e, eq: [{ t: 'wheel', j: 'handN', r: 8, front: true }], path: ['handN'], pathOff: [0, -14], lab: ['무릎 아래', '뻗은 자세'], cues: [['배를 조이고 허리가 꺾이지 않게', 'hip', [-4, -24]], ['허리가 처지기 전까지만 굴리기', 'handN', [0, -22]], ['돌아올 때도 복근으로']], breath: BR.core });
};
PT.chop = (o = {}) => {
  const low = o.k === 'low';
  const base = { at: ['ankleL', [138, A]], th: [[6, 0], [6, 0]], sh: [[2, 0], [2, 0]] };
  const hi = { ua: [[140, 60], [120, 50]], fa: [[140, 60], [120, 50]], lean: 0.12 }, lo = { ua: [[30, -40], [40, -50]], fa: [[30, -40], [40, -50]], lean: -0.12 };
  const s = { ...base, ...(low ? lo : hi) }, e = { ...base, ...(low ? hi : lo) };
  return Fv({ s, e, eq: [POST(300, 14), { t: 'fcable1', from: low ? [296, 190] : [296, 22], j: 'handR', front: true }], path: ['handR'], lab: ['시작', '끝'],
    cues: [['양손으로 손잡이, 팔은 길게', 'handR', [22, -10]], ['골반·가슴을 함께 돌리며 대각선으로', 'chest', [28, -20]], ['허리를 비틀지 말고 엉덩이도 같이']], breath: BR.core });
};
PT.pallof = () => {
  const s = { tr: 0, at: ['ankleN', [150, A]], th: [10, -10], sh: [0, -10], hk: [16, 22], eb: 'back' }, e = { ...s, hk: [56, 20], eb: 'down' };
  return S({ s, e, eq: [POST(304), { t: 'cable', from: [298, 92], j: 'handN', front: true }], path: ['handN'], lab: ['가슴 앞', '뻗은 자세'], cues: [['케이블이 옆에서 당기게 서기 (그림은 위에서 본 방향)', 'shoulder', [-22, -12]], ['팔을 앞으로 뻗어 2초 버티기', 'handN', [8, -18]], ['몸이 돌아가지 않게 버티는 게 핵심']], breath: BR.core });
};
PT.sidebend = () => {
  const base = { at: ['ankleL', [148, A]], ua: [[4, 0], [100, 0]], fa: [[4, 0], [150, 0]] };
  const s = { ...base, lean: 0.25 }, e = { ...base, lean: -0.15 };
  return Fv({ s, e, eq: [{ t: 'fdb', front: true, only: 0 }], path: ['chest'], lab: ['기울인 자세', '세운 자세'], cues: [['앞뒤가 아닌 옆으로만 기울이기', 'chest', [26, -20]], ['반대쪽 옆구리로 끌어올리기']], breath: BR.core });
};
PT.pushup = (o = {}) => {
  const k = o.k || 'floor';
  const hand = k === 'incline' ? [96, 140] : [96, GY - 5];
  const ank = k === 'decline' ? [260, 150] : k === 'knee' ? null : [266, A];
  const trS = k === 'incline' ? 70 : k === 'decline' ? 104 : 98;
  let s = { tr: trS, at: ['handN', hand], th: [0, 0], sh: [0, 0], ft: [-10, -10], rel: true, ua: [-trS, -trS], fa: [0, 0] };
  let e = { ...s, tr: trS - (k === 'incline' ? -4 : 0), ua: [-trS - 74, -trS - 74], fa: [-trS + 6, -trS + 6] };
  const eq = [];
  if (k === 'incline') eq.push({ t: 'bench', a: [50, 146], b: [110, 146], legs: [[56, 146], [104, 146]] });
  if (k === 'decline') eq.push({ t: 'bench', a: [236, 156], b: [300, 156], legs: [[242, 156], [294, 156]] });
  return S({ s, e, eq, path: ['shoulder'], pathOff: [0, -14], lab: ['팔 편 자세', '내린 자세'],
    cues: [[k === 'diamond' ? '두 손을 모아 다이아몬드 모양' : '손은 어깨보다 조금 넓게', 'handN', [16, -14]], ['머리~발뒤꿈치 일직선', 'hip', [0, -22]], ['팔꿈치는 몸통에서 45° 정도로, 가슴이 바닥 가까이']], breath: BR.push });
};
PT.run = (o = {}) => {
  const k = o.k || 'run';
  const walk = k === 'walk' || k === 'incline';
  const s = { tr: walk ? 4 : 10, at: ['hip', [160, walk ? 108 : 104]], th: walk ? [26, -18] : [48, -30], sh: walk ? [-6, -20] : [-70, -40], ft: [90, 90], ua: walk ? [-24, 24] : [-40, 40], fa: walk ? [10, 40] : [70, 110] };
  const e = { ...s, th: s.th.slice().reverse(), sh: s.sh.slice().reverse(), ua: s.ua.slice().reverse(), fa: s.fa.slice().reverse() };
  const eq = [];
  if (k === 'stair') eq.push({ t: 'pathd', d: 'M60 200 V170 H120 V140 H180 V110 H240' });
  else if (k === 'ellip') eq.push({ t: 'line', p: [[90, GY], [240, GY]], w: 8, c: '#3a414f' });
  else eq.push({ t: 'line', p: [[70, GY], [260, k === 'incline' ? GY - 18 : GY]], w: 8, c: '#3a414f' });
  return S({ s, e, noGround: true, eq, path: [], lab: ['한 걸음', '다음 걸음'], cues: [['상체는 곧게, 시선은 앞', 'head', [16, -10]], ['손잡이를 꽉 잡지 않기 (자연스럽게 팔 흔들기)', 'handN', [16, 4]], ['말은 할 수 있는 강도가 기본', 'kneeN', [18, -6]]], breath: BR.cardio });
};
PT.bike = (o = {}) => {
  const base = { tr: 20, at: ['hip', [130, 110]], ft: [90, 90], hk: [60, 10], eb: 'down' };
  const crank = [150, 160];
  const s = footTo(base, add(crank, [18, -12]), 'fwd', add(crank, [-18, 12]), 'fwd');
  const e = footTo(base, add(crank, [-18, 12]), 'fwd', add(crank, [18, -12]), 'fwd');
  return S({ s, e, noGround: false, eq: [{ t: 'line', p: [[126, 118], [150, 160], [150, GY]], w: 6, c: '#3a414f' }, { t: 'circle', c: crank, r: 22, fill: 'none', s: '#3a414f', w: 3 }, { t: 'line', p: [[196, 116], [210, 116]], w: 6, c: '#7b8698' }], path: [], lab: ['페달 위', '페달 아래'],
    cues: [['안장 높이: 페달 가장 아래에서 무릎이 살짝 굽게', 'kneeN', [18, -8]], ['상체 힘을 빼고 페달을 둥글게', 'ankleN', [18, 6]]], breath: BR.cardio });
};
PT.rower = () => {
  const catchP = footTo({ tr: 22, at: ['hip', [120, 172]], ft: [70, 70], hk: [70, 10], eb: 'down' }, [178, 176], 'up');
  const fin = footTo({ tr: -24, at: ['hip', [84, 172]], ft: [80, 80], hk: [26, 26], eb: 'back' }, [178, 176], 'up');
  return S({ s: catchP, e: fin, eq: [{ t: 'line', p: [[40, 184], [250, 184]], w: 6, c: '#3a414f' }, { t: 'cable', from: [240, 160], j: 'handN', front: true }], path: ['hip'], lab: ['캐치(앞)', '피니시(뒤)'],
    cues: [['순서: 다리 → 상체 → 팔', 'hip', [-10, -40]], ['돌아갈 땐 팔 → 상체 → 다리', 'handN', [10, -18]], ['허리는 곧게, 어깨는 내리기']], breath: BR.cardio });
};
PT.rope = () => {
  const s = { tr: 4, at: ['ankleN', [160, A - 10]], ft: [30, 30], th: [8, 8], sh: [-10, -10], ua: [20, 20], fa: [60, 60] }, e = { ...s, at: ['ankleN', [160, A]], ft: [90, 90] };
  return S({ s, e, noGround: false, eq: [{ t: 'pathd', d: 'M150 150 C60 150 60 224 160 226 C260 224 250 150 180 150' }], path: [], lab: ['점프', '착지'], cues: [['손목으로 줄 돌리기', 'handN', [16, -6]], ['발 앞꿈치로 낮게 뛰기', 'toeN', [16, -12]]], breath: BR.cardio });
};
PT.swim = () => {
  const s = { tr: 92, at: ['hip', [150, 100]], th: [-4, 4], sh: [0, 0], ft: [-10, -10], ua: [-176, 0], fa: [-176, 0] }, e = { ...s, th: [4, -4], ua: [0, -176], fa: [0, -176] };
  return S({ s, e, noGround: true, eq: [{ t: 'pathd', d: 'M10 96 Q40 88 70 96 T130 96 T190 96 T250 96 T310 96' }], path: [], lab: ['팔 앞', '팔 바꿈'], cues: [['몸을 수평으로 길게', 'hip', [0, 20]], ['숨은 고개를 옆으로 돌려 쉬기', 'head', [16, -14]]], breath: BR.cardio });
};
// ── 엎드린/누운 자세 (머리 +x 방향, th = -tr 이면 몸이 일직선)
const PRONE = (tr, extra = {}) => ({ tr, th: [-tr, -tr], sh: [-tr, -tr], ft: [0, 0], ...extra });
PT.pushup = (o = {}) => {
  const k = o.k || 'floor';
  const ank = k === 'decline' ? [70, 146] : [76, GY - 12];
  const top = k === 'incline' ? 54 : k === 'decline' ? 98 : 70, bot = k === 'incline' ? 66 : k === 'decline' ? 108 : 84;
  const sh0 = sideJ(PRONE(top, { at: ['ankleN', ank], ua: [0, 0], fa: [0, 0] })).shoulder;
  const hand = k === 'incline' ? [sh0[0] + 3, sh0[1] + 56] : [sh0[0] + 3, GY - 5];
  const s = handTo(PRONE(top, { at: ['ankleN', ank] }), hand, 'back');
  const e = handTo(PRONE(bot, { at: ['ankleN', ank] }), hand, 'back');
  const eq = [];
  if (k === 'incline') eq.push({ t: 'bench', a: [hand[0] - 30, hand[1] + 6], b: [hand[0] + 40, hand[1] + 6], legs: [[hand[0] - 24, hand[1] + 6], [hand[0] + 34, hand[1] + 6]] });
  if (k === 'decline') eq.push({ t: 'bench', a: [36, 152], b: [104, 152], legs: [[42, 152], [98, 152]] });
  return S({ s, e, eq, path: ['shoulder'], pathOff: [0, -16], lab: ['팔 편 자세', '내린 자세'],
    cues: [[k === 'diamond' ? '두 손을 가슴 아래에 모아 다이아몬드 모양' : '손은 어깨보다 조금 넓게', 'handN', [16, -16]], ['머리~발뒤꿈치 일직선 (엉덩이 처짐 금지)', 'hip', [0, -24]], ['팔꿈치는 몸통에서 45° 정도로, 가슴이 바닥 가까이까지'], [k === 'incline' ? '높은 곳을 짚을수록 쉬워요' : k === 'decline' ? '발을 높일수록 윗가슴·어깨 비중이 커져요' : '힘들면 무릎을 대고 해도 좋아요']], breath: BR.push });
};
PT.hold = (o = {}) => {
  const k = o.k || 'plank';
  if (k === 'hollow') {
    const good = { tr: -78, at: ['hip', [160, GY - 9]], th: [100, 100], sh: [100, 100], ft: [100, 100], ua: [-112, -112], fa: [-112, -112] };
    const bad = { ...good, tr: -86, th: [128, 128], sh: [128, 128], ft: [128, 128] };
    return S({ s: good, e: good, hold: true, bad, eq: [], path: [], lab: ['바른 자세', '❌ 다리가 너무 높고 허리가 뜸'],
      cues: [['허리를 바닥에 꾹 눌러 붙이기', 'hip', [0, -22]], ['팔·다리를 뻗어 바나나 모양', 'ankleN', [8, -18]], ['힘들면 무릎을 굽혀 강도 낮추기']], breath: BR.core });
  }
  const side = k === 'side';
  const good = PRONE(80, { at: ['elbowN', [214, GY - 5]], ua: [0, 0], fa: [90, 90] });
  const bad = { ...good, th: [-62, -62], sh: [-90, -90] };
  return S({ s: good, e: good, hold: true, bad, eq: [], path: [], lab: ['바른 자세', side ? '❌ 골반이 아래로 처짐' : '❌ 엉덩이가 처짐'],
    cues: [[side ? '팔꿈치는 어깨 바로 아래, 몸을 옆으로 세우기' : '팔꿈치는 어깨 바로 아래', 'elbowN', [14, -22]], [side ? '머리~발이 일직선, 골반을 위로 밀기' : '머리~발뒤꿈치 일직선, 엉덩이 들거나 처지지 않게', 'hip', [0, -24]], ['배꼽을 당기고 엉덩이를 조이기'], ['20~40초씩, 자세가 무너지면 쉬기']], breath: BR.core });
};
const _legraise = PT.legraise;
PT.legraise = (o = {}) => {
  const k = o.k || 'lying';
  if (k === 'hang' || k === 'knee' || k === 'captain') return _legraise(o);
  if (k === 'mountain') {
    const sh0 = sideJ(PRONE(70, { at: ['ankleN', [76, GY - 12]], ua: [0, 0], fa: [0, 0] })).shoulder;
    const P = handTo(PRONE(70, { at: ['ankleN', [76, GY - 12]] }), [sh0[0] + 3, GY - 5], 'back');
    const J0 = sideJ(P);
    const P2 = { ...P, at: ['handN', J0.handN], th: [40, -70], sh: [-30, -70], lk: null, kb: null };
    return S({ s: { ...P, at: ['handN', J0.handN] }, e: P2, eq: [], path: ['kneeN'], lab: ['팔 편 플랭크', '무릎 당긴 자세'],
      cues: [['손은 어깨 바로 아래', 'handN', [16, -16]], ['엉덩이 높이를 유지한 채 무릎을 가슴으로 번갈아', 'kneeN', [8, -22]], ['빠르기보다 자세 먼저']], breath: BR.core });
  }
  const base = { tr: -90, at: ['hip', [170, GY - 9]], ft: [90, 90], ua: [10, 10], fa: [90, 90] };
  const P = {
    lying: [{ th: [94, 94], sh: [94, 94], ft: [180, 180] }, { th: [172, 172], sh: [172, 172], ft: [260, 260] }],
    reverse: [{ th: [168, 168], sh: [84, 84] }, { tr: -78, th: [212, 212], sh: [126, 126] }],
    vup: [{ th: [96, 96], sh: [96, 96], ft: [180, 180], ua: [-96, -96], fa: [-96, -96] }, { tr: -42, th: [138, 138], sh: [138, 138], ft: [220, 220], ua: [118, 118], fa: [124, 124] }],
    deadbug: [{ th: [180, 180], sh: [90, 90], ua: [180, 180], fa: [180, 180] }, { th: [100, 180], sh: [100, 90], ft: [180, 90], ua: [180, -100], fa: [180, -100] }],
    bicycle: [{ tr: -72, th: [168, 112], sh: [84, 112], ft: [180, 180], ua: [-140, -140], fa: [40, 40] }, { tr: -72, th: [112, 168], sh: [112, 84], ft: [180, 180], ua: [-140, -140], fa: [40, 40] }],
  }[k];
  const s = { ...base, ...P[0] }, e = { ...base, ...P[1] };
  const txt = { lying: '허리가 뜨기 직전까지만 다리를 내리기', reverse: '무릎을 가슴 쪽으로, 엉덩이를 살짝 들어 골반 말기', vup: '팔과 다리를 동시에 들어 V자 만들기', deadbug: '반대쪽 팔·다리를 천천히 뻗기', bicycle: '팔꿈치와 반대 무릎을 가깝게 비틀기' }[k];
  return S({ s, e, eq: [], path: [k === 'deadbug' ? 'ankleN' : k === 'vup' ? 'head' : 'kneeN'], lab: ['시작', '끝'],
    cues: [['허리를 바닥에 붙인 상태 유지', 'hip', [-6, -22]], [txt, k === 'deadbug' ? 'ankleN' : 'kneeN', [14, -16]], ['천천히, 숨 참지 않기']], breath: BR.core });
};
PT.nordic = () => {
  const s = { tr: 0, at: ['kneeN', [130, GY - 7]], th: [0, 0], sh: [-90, -90], ft: [-180, -180], ua: [10, 10], fa: [60, 60] };
  const e = { ...s, tr: 58, th: [-58, -58], ua: [80, 80], fa: [90, 90] };
  return S({ s, e, eq: [{ t: 'roller', j: 'ankleN', off: [-2, -9], r: 7, front: true }, { t: 'rect', x: 70, y: GY - 6, w: 90, h: 6, c: '#3a414f' }], path: ['head'], lab: ['무릎 꿇은 자세', '앞으로 버티며 내려간 자세'],
    cues: [['발목을 패드(또는 파트너)로 고정', 'ankleN', [-10, -22]], ['무릎~머리를 일직선으로 유지', 'hip', [-22, -14]], ['햄스트링으로 버티며 최대한 천천히 내려가기', 'head', [16, -14]], ['못 버티는 지점에서 손으로 받고 밀어 올라오기']], breath: BR.leg });
};
const _crunch = PT.crunch;
PT.crunch = (o = {}) => {
  if (o.k !== 'cable') return _crunch(o);
  const s = { tr: 16, at: ['kneeN', [140, GY - 7]], th: [0, 0], sh: [-90, -90], ft: [-180, -180], ua: [150, 150], fa: [200, 200] };
  const e = { ...s, tr: 72, ua: [96, 96], fa: [150, 150] };
  return S({ s, e, eq: [POST(232, 14), { t: 'cable', from: [226, 24], j: 'handN', front: true }], path: ['head'], lab: ['편 자세', '말아 숙인 자세'],
    cues: [['무릎을 꿇고 로프를 머리 옆에', 'handN', [16, -12]], ['엉덩이는 고정, 갈비뼈를 골반 쪽으로 말기', 'shoulder', [-8, -26]], ['팔로 당기지 말고 복근으로']], breath: BR.core });
};
PT.swim = () => {
  const s = { tr: 90, at: ['hip', [150, 100]], th: [-86, -96], sh: [-86, -96], ft: [-80, -100], ua: [92, -60], fa: [92, -80] };
  const e = { ...s, th: [-96, -86], sh: [-96, -86], ft: [-100, -80], ua: [-60, 92], fa: [-80, 92] };
  return S({ s, e, noGround: true, eq: [{ t: 'pathd', d: 'M10 92 Q40 84 70 92 T130 92 T190 92 T250 92 T310 92', s: '#38bdf8', w: 2 }], path: [], lab: ['팔 앞으로', '팔 바꿈'],
    cues: [['몸을 수평으로 길게 뻗기', 'hip', [0, 22]], ['숨은 고개를 옆으로 돌려 쉬기', 'head', [16, -16]], ['다리는 허벅지부터 작게 차기', 'ankleN', [-6, 18]]], breath: BR.cardio });
};
window.FORM_PT = { PT, BR };
})();

/* ───────── 운동 → 그림 연결 + 가이드 HTML ───────── */
(function () {
'use strict';
const { PT, BR } = window.FORM_PT;
const SC = window.FORM_SCENE, E = window.FORM_ENGINE;
const M = {
  bench: ['bench'], incline_bench: ['bench', { a: 35 }], decline_bench: ['bench', { a: -20 }], close_grip_bench: ['bench'],
  db_bench: ['bench', { load: 'db' }], incline_db: ['bench', { a: 35, load: 'db' }], decline_db: ['bench', { a: -20, load: 'db' }],
  smith_bench: ['bench', { load: 'smith' }], smith_incline: ['bench', { a: 35, load: 'smith' }], smith_decline: ['bench', { a: -20, load: 'smith' }],
  chest_press: ['chestpress'], machine_bench: ['chestpress'], incline_machine_press: ['chestpress', { k: 'incline' }], decline_machine_press: ['chestpress', { k: 'decline' }],
  cable_chest_press: ['cablepress'], pec_deck: ['fly', { k: 'pecdeck' }], rear_delt: ['fly', { k: 'rear' }], db_fly: ['fly', { k: 'db' }], incline_db_fly: ['fly', { k: 'db' }],
  cable_fly: ['fly', { k: 'mid' }], cable_cross_high: ['fly', { k: 'high' }], cable_cross_low: ['fly', { k: 'low' }], db_pullover: ['pullover'], pullover_machine: ['pullover', { machine: true }],
  dips: ['dips'], assisted_dips: ['dips', { k: 'assist' }], machine_dip: ['dips', { k: 'machine' }], bench_dips: ['dips', { k: 'bench' }],
  pushup: ['pushup'], incline_pushup: ['pushup', { k: 'incline' }], decline_pushup: ['pushup', { k: 'decline' }], diamond_pushup: ['pushup', { k: 'diamond' }], pike_pushup: ['pike'],
  deadlift: ['hinge', { k: 'dl' }], sumo_dl: ['hinge', { k: 'sumo' }], trap_bar_dl: ['hinge', { k: 'trap' }], rack_pull: ['hinge', { k: 'rack' }], rdl: ['hinge', { k: 'rdl' }], db_rdl: ['hinge', { k: 'rdl', load: 'db' }],
  sldl: ['hinge', { k: 'sldl' }], good_morning: ['hinge', { k: 'gm' }], single_leg_rdl: ['hinge', { k: 'sl', load: 'db' }], kb_swing: ['hinge', { k: 'swing', load: 'kb' }], cable_pull_through: ['hinge', { k: 'pull', load: 'cable' }],
  lat_pulldown: ['pulldown', { k: 'wide' }], close_pulldown: ['pulldown', { k: 'close' }], reverse_pulldown: ['pulldown', { k: 'reverse' }], iso_lat_pulldown: ['pulldown', { k: 'iso' }], one_arm_pulldown: ['pulldown', { k: 'one' }],
  pullup: ['pullup'], chinup: ['pullup', { k: 'chin' }], assisted_pullup: ['pullup', { k: 'assist' }],
  barbell_row: ['row', { k: 'bent' }], pendlay_row: ['row', { k: 'pendlay' }], tbar_row: ['row', { k: 'tbar' }], meadows_row: ['row', { k: 'tbar' }], smith_row: ['row', { k: 'smith' }],
  db_row: ['row', { k: 'db' }], chest_supported_row: ['row', { k: 'chest' }], inverted_row: ['row', { k: 'inverted' }], seated_row: ['row', { k: 'cable' }], one_arm_cable_row: ['row', { k: 'cable' }],
  machine_row: ['row', { k: 'machine' }], hs_seated_row: ['row', { k: 'machine' }], low_row: ['row', { k: 'low' }], high_row: ['row', { k: 'high' }],
  face_pull: ['facepull'], straight_arm_pulldown: ['straightArm'], back_ext: ['backext'], superman: ['backext', { superman: true }],
  shrug: ['shrug'], smith_shrug: ['shrug'], db_shrug: ['shrug', { db: true }],
  ohp: ['ohp', { k: 'bar' }], smith_ohp: ['ohp', { k: 'smith' }], landmine_press: ['ohp', { k: 'landmine' }], db_shoulder: ['ohp', { k: 'db' }], arnold_press: ['ohp', { k: 'arnold' }],
  machine_shoulder_press: ['ohp', { k: 'machine' }], hs_shoulder_press: ['ohp', { k: 'machine' }],
  lateral_raise: ['lateral', { k: 'db' }], cable_lateral: ['lateral', { k: 'cable' }], machine_lateral: ['lateral', { k: 'machine' }], front_raise: ['frontRaise'], cable_front_raise: ['frontRaise', { cable: true }],
  upright_row: ['uprow'], bent_rear_raise: ['bentRear'], cable_rear_fly: ['rearFlyCable'], y_raise: ['yraise'],
  squat: ['squat'], front_squat: ['squat', { load: 'front' }], goblet_squat: ['squat', { load: 'goblet' }], smith_squat: ['squat', { load: 'smith' }], box_squat: ['squat', { load: 'box' }],
  belt_squat: ['squat', { load: 'belt' }], bw_squat: ['squat', { load: 'bw' }], sumo_squat: ['squat', { load: 'goblet' }], jump_squat: ['squat', { load: 'bw', jump: true }],
  hack_squat: ['hack'], v_squat: ['hack', { k: 'v' }], pendulum_squat: ['hack', { k: 'pendulum' }], reverse_hack_squat: ['hack', { k: 'reverse' }],
  leg_press: ['legpress'], leg_press_single: ['legpress', { k: 'single' }], horizontal_leg_press: ['legpress', { k: 'horiz' }], leg_press_calf: ['legpress', { k: 'calf' }],
  lunge: ['lunge'], walking_lunge: ['lunge'], reverse_lunge: ['lunge'], lateral_lunge: ['lunge'], curtsy_lunge: ['lunge'], smith_lunge: ['lunge', { smith: true }],
  bss: ['lunge', { k: 'bss' }], smith_bss: ['lunge', { k: 'bss', smith: true }], step_up: ['lunge', { k: 'step' }], sissy_squat: ['lunge', { sissy: true }],
  leg_ext: ['legext'], leg_curl: ['legcurl', { k: 'seated' }], seated_leg_curl: ['legcurl', { k: 'seated' }], lying_leg_curl: ['legcurl', { k: 'lying' }], standing_leg_curl: ['legcurl', { k: 'standing' }],
  nordic_curl: ['nordic'],
  calf_raise: ['calf', { k: 'machine' }], seated_calf: ['calf', { k: 'seated' }], smith_calf: ['calf', { k: 'smith' }],
  adductor: ['abd', { k: 'add' }], abductor: ['abd'], cable_abduction: ['abdCable'], band_walk: ['bandwalk'],
  hip_thrust: ['thrust', { k: 'bb' }], smith_hip_thrust: ['thrust', { k: 'smith' }], hip_thrust_machine: ['thrust', { k: 'machine' }], glute_bridge: ['thrust', { k: 'bridge' }], frog_pump: ['thrust', { k: 'bridge' }],
  glute_kickback_machine: ['kickback', { k: 'machine' }], cable_kickback: ['kickback', { k: 'cable' }],
  biceps_curl: ['curl'], hammer_curl: ['curl', { k: 'hammer' }], ez_curl: ['curl', { k: 'bar' }], reverse_curl: ['curl', { k: 'bar' }], cable_curl: ['curl', { k: 'cable' }], rope_hammer_curl: ['curl', { k: 'cable' }],
  bayesian_curl: ['curl', { k: 'bayesian' }], preacher_curl: ['curl', { k: 'preacher' }], machine_preacher: ['curl', { k: 'machine' }], incline_db_curl: ['curl', { k: 'incline' }],
  concentration_curl: ['curl', { k: 'conc' }], wrist_curl: ['curl', { k: 'wrist' }],
  triceps_pushdown: ['pushdown'], rope_pushdown: ['pushdown', { rope: true }], oh_triceps: ['ohext'], db_oh_ext: ['ohext', { k: 'db' }], skull_crusher: ['skull'],
  cable_tri_kickback: ['trikick', { cable: true }], db_kickback: ['trikick'], tri_ext_machine: ['triMachine'],
  plank: ['hold'], side_plank: ['hold', { k: 'side' }], hollow_hold: ['hold', { k: 'hollow' }], mountain_climber: ['legraise', { k: 'mountain' }],
  crunch: ['crunch'], cable_crunch: ['crunch', { k: 'cable' }], ab_crunch_machine: ['crunch', { k: 'machine' }], decline_situp: ['crunch', { k: 'decline' }],
  hanging_leg_raise: ['legraise', { k: 'hang' }], hanging_knee_raise: ['legraise', { k: 'knee' }], captain_chair: ['legraise', { k: 'captain' }], lying_leg_raise: ['legraise', { k: 'lying' }],
  reverse_crunch: ['legraise', { k: 'reverse' }], v_up: ['legraise', { k: 'vup' }], dead_bug: ['legraise', { k: 'deadbug' }], bicycle_crunch: ['legraise', { k: 'bicycle' }],
  russian_twist: ['twist'], ab_wheel: ['abwheel'], woodchopper: ['chop'], pallof_press: ['pallof'], db_side_bend: ['sidebend'],
  treadmill: ['run'], outdoor_run: ['run'], walking: ['run', { k: 'walk' }], incline_walk: ['run', { k: 'incline' }], stairmaster: ['run', { k: 'stair' }], elliptical: ['run', { k: 'ellip' }],
  stationary_bike: ['bike'], hiit_bike: ['bike'], assault_bike: ['bike'], rowing_machine: ['rower'], jump_rope: ['rope'], swimming: ['swim'],
};
const FALLBACK = { 가슴: ['chestpress'], 등: ['row', { k: 'cable' }], 어깨: ['ohp', { k: 'machine' }], 하체: ['squat', { load: 'bw' }], 둔근: ['thrust', { k: 'bridge' }], 팔: ['curl'], 복근: ['crunch'], 유산소: ['run'] };
const TOP = { pec_deck: ['arms', 0, 86], db_fly: ['arms', 0, 86], incline_db_fly: ['arms', 0, 86], cable_fly: ['arms', 0, 86], cable_cross_high: ['arms', 0, 86], cable_cross_low: ['arms', 0, 86],
  rear_delt: ['arms', 86, 0], cable_rear_fly: ['arms', 86, 0], bent_rear_raise: ['arms', 86, 0], abductor: ['legs', 6, 38], adductor: ['legs', 38, 6], cable_abduction: ['leg1', 4, 34] };
function topInset(pat, t) {
  const T = pat.top; if (!T) return '';
  const a = (T[1] + (T[2] - T[1]) * t) * Math.PI / 180, ox = 238, oy = 4, cx = ox + 38, cy = oy + 42;
  const L = (x1, y1, x2, y2, w, c) => `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
  let g = `<rect x="${ox}" y="${oy}" width="78" height="84" rx="10" fill="#0f1115" stroke="#2b303b"/><text x="${ox + 39}" y="${oy + 80}" text-anchor="middle" font-size="9" fill="#8792a6">위에서 본 모습</text>`;
  if (T[0] === 'arms') {
    g += `<ellipse cx="${cx}" cy="${cy}" rx="17" ry="7" fill="#dfe6f0"/><circle cx="${cx}" cy="${cy}" r="6.5" fill="#cbd5e1" stroke="#0f1115"/>`;
    [-1, 1].forEach(sd => { const sx = cx + sd * 15, ex = sx + sd * Math.cos(a) * 26, ey = cy - Math.sin(a) * 26; g += L(sx, cy, ex, ey, 6, '#fb923c') + `<circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="3.4" fill="#8a94a7"/>`; });
    g += `<text x="${cx}" y="${oy + 11}" text-anchor="middle" font-size="8.5" fill="#8792a6">↑ 앞</text>`;
  } else {
    g += `<ellipse cx="${cx}" cy="${cy + 14}" rx="14" ry="7" fill="#dfe6f0"/>`;
    [-1, 1].forEach(sd => { if (T[0] === 'leg1' && sd < 0) { g += L(cx - 7, cy + 12, cx - 7, cy - 18, 7, '#dfe6f0'); return; } const hx = cx + sd * 7, kx = hx + sd * Math.sin(a) * 30, ky = cy + 12 - Math.cos(a) * 30; g += L(hx, cy + 12, kx, ky, 7, T[0] === 'leg1' || T[1] < T[2] ? '#fb923c' : '#fdba74') + `<rect x="${(kx + sd * 4 - 3).toFixed(1)}" y="${(ky - 2).toFixed(1)}" width="6" height="12" rx="3" fill="#8a94a7"/>`; });
    g += `<text x="${cx}" y="${oy + 11}" text-anchor="middle" font-size="8.5" fill="#8792a6">↑ 앞</text>`;
  }
  return g;
}
const cache = {};
function patternFor(ex) {
  if (!ex) return null;
  if (cache[ex.id]) return cache[ex.id];
  const m = M[ex.id] || (ex.steps ? FALLBACK[ex.group] : null);
  if (!m || !PT[m[0]]) return null;
  const p = PT[m[0]](m[1] || {});
  p.key = m[0] + (m[1] ? ':' + JSON.stringify(m[1]) : '');
  if (TOP[ex.id]) p.top = TOP[ex.id];
  return (cache[ex.id] = p);
}
const RULES = [
  [/대흉근\s*\(?\s*상부/, 'chestU'], [/대흉근\s*\(?\s*하부/, 'chestL'], [/대흉근|전거근/, 'chest'],
  [/전면 삼각|^전면$|어깨$/, 'frontDelt'], [/측면 삼각|^측면$/, 'sideDelt'], [/후면 삼각|회전근개/, 'rearDelt'],
  [/삼두/, 'triceps'], [/이두/, 'biceps'], [/상완근|상완요골|전완|악력/, 'forearm'],
  [/광배|^등$/, 'lats'], [/능형|중부 승모|승모근 중부|대원근|하부 승모|상부 등/, 'rhomboids'], [/상부 승모|승모근 상부/, 'upperTraps'], [/^승모근$/, 'traps'],
  [/척추기립|요방형/, 'lowBack'], [/중둔|소둔/, 'gluteMed'], [/대둔|^둔근$/, 'glutes'], [/햄스트링/, 'hams'], [/대퇴사두/, 'quads'], [/내전근/, 'adductors'],
  [/비복|가자미|종아리/, 'calves'], [/복직|복횡|코어/, 'abs'], [/복사/, 'obliques'], [/장요근|고관절 굴곡/, 'hipFlexor'],
  [/하체|심폐|전신/, 'quads'], [/하체|심폐|전신/, 'glutes'], [/하체|심폐|전신/, 'calves'], [/전신/, 'lats'],
];
function musclesOf(txt) {
  const out = [];
  String(txt || '').split(/[,·\/]/).map(s => s.trim()).filter(Boolean).forEach(t => { RULES.forEach(([re, k]) => { if (re.test(t) && !out.includes(k)) out.push(k); }); });
  return out;
}
function musclesFor(ex) {
  const id = ex.base || ex.id;
  const p = musclesOf(ex.primary), s = musclesOf(ex.secondary).filter(k => !p.includes(k));
  if (id === 'abductor' || id === 'cable_abduction' || id === 'band_walk') { if (!p.includes('gluteMed')) p.unshift('gluteMed'); }
  if (id === 'adductor' && !p.includes('adductors')) p.unshift('adductors');
  return { p, s };
}
const FRONT_KEYS = ['chest', 'chestU', 'chestL', 'frontDelt', 'sideDelt', 'abs', 'obliques', 'hipFlexor', 'quads', 'adductors', 'biceps', 'forearm', 'upperTraps', 'calves', 'gluteMed'];
const BACK_KEYS = ['rearDelt', 'sideDelt', 'traps', 'upperTraps', 'rhomboids', 'lats', 'lowBack', 'glutes', 'gluteMed', 'hams', 'adductors', 'calves', 'triceps', 'forearm', 'obliques'];
const STAND = { at: ['ankleL', [0, 0]], ua: [[14, 0], [14, 0]], fa: [[10, 0], [10, 0]], th: [[4, 0], [4, 0]], sh: [[2, 0], [2, 0]] };
function bodyMapSvg(ex) {
  const { p, s } = musclesFor(ex);
  const one = (back, x) => {
    const J = E.frontJ({ ...STAND, at: ['ankleL', [x - 9, 196]] });
    const keys = back ? BACK_KEYS : FRONT_KEYS;
    return E.drawFront(J, p.filter(k => keys.includes(k)), s.filter(k => keys.includes(k)), back) + `<text x="${x}" y="214" text-anchor="middle" font-size="11" fill="#8792a6">${back ? '뒤' : '앞'}</text>`;
  };
  const leg = `<g font-size="11" fill="#cbd5e1"><rect x="8" y="8" width="11" height="11" rx="3" fill="${E.C.hi}"/><text x="24" y="18">주동근</text><rect x="8" y="26" width="11" height="11" rx="3" fill="${E.C.hi2}"/><text x="24" y="36">보조근</text></g>`;
  return `<svg class="bodymap" viewBox="0 0 320 220" role="img" aria-label="타깃 근육: ${esc(ex.primary || '')}">${leg}${one(false, 120)}${one(true, 220)}</svg>`;
}
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
const VB = '0 0 320 214';
function frameSvg(pat, ex, t, opt = {}) {
  const { p, s } = musclesFor(ex);
  const r = SC.scene(pat, t, { hiP: p, hiS: s, pose: opt.pose });
  return { J: r.J, body: SC.ground(pat) + r.svg };
}
function mainSvg(pat, ex) {
  const ghost = pat.hold ? '' : `<g opacity=".13">${SC.scene(pat, 0).svg}</g>`;
  const f = frameSvg(pat, ex, 0);
  return `<svg class="form-main" viewBox="${VB}" role="img" aria-label="${esc(ex.name)} 동작 그림">${SC.DEFS}${SC.ground(pat)}${ghost}${pat.hold ? '' : SC.pathArrow(pat)}<g class="live">${SC.scene(pat, 0, { hiP: musclesFor(ex).p, hiS: musclesFor(ex).s }).svg}</g><g class="mks">${SC.marks(pat, f.J)}</g><g class="top">${topInset(pat, 0)}</g></svg>`;
}
function miniSvg(pat, ex, which) {
  const pose = pat.hold ? (which ? pat.bad : pat.s) : null;
  const f = frameSvg(pat, ex, which, { pose });
  const bad = pat.hold && which;
  return `<figure class="form-mini${bad ? ' bad' : ''}"><svg viewBox="${VB}" role="img" aria-label="${esc(pat.lab[which])}">${f.body}${pat.hold ? '' : topInset(pat, which)}</svg><figcaption>${pat.hold || /^(시작|끝)/.test(pat.lab[which]) ? '' : (which ? '끝 · ' : '시작 · ')}${esc(pat.lab[which])}</figcaption></figure>`;
}
function guideFigureHtml(ex) {
  const pat = patternFor(ex);
  if (!pat) return '';
  const cues = pat.cues.map((c, i) => `<li><span class="cue-n">${i + 1}</span><span>${esc(c[0])}</span></li>`).join('');
  return `<div class="card form-card">
    <h3 style="margin-top:0">🖼️ 자세 그림</h3>
    <div class="form-stage" data-anim="${pat.hold ? 0 : 1}">${mainSvg(pat, ex)}
      ${pat.hold ? '' : '<button class="form-play" type="button" aria-label="움직임 멈춤/재생">⏸</button>'}</div>
    <div class="form-cap muted small">${pat.hold ? '버티는 동작이에요. 아래에서 바른 자세와 흔한 실수를 비교해 보세요.' : `<b>${/^시작/.test(pat.lab[0]) ? esc(pat.lab[0]) : `시작(${esc(pat.lab[0])})`}</b> ↔ <b>${/^끝/.test(pat.lab[1]) ? esc(pat.lab[1]) : `끝(${esc(pat.lab[1])})`}</b> · 흐린 그림은 시작 자세, 초록 점선은 움직이는 길이에요.`}</div>
    <div class="form-minis">${miniSvg(pat, ex, 0)}${miniSvg(pat, ex, 1)}</div>
    <h3>📍 핵심 포인트</h3><ol class="cues">${cues}</ol>
    <div class="breath">🌬️ <b>호흡</b> ${esc(pat.breath || BR.iso)}</div>
  </div>
  <div class="card"><h3 style="margin-top:0">💪 어디에 자극이 오나요?</h3>${bodyMapSvg(ex)}
    <div class="small"><b>주동근</b> ${esc(ex.primary)}</div>${ex.secondary ? `<div class="muted small"><b>보조근</b> ${esc(ex.secondary)}</div>` : ''}</div>`;
}
let raf = 0;
function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
function start(root, ex) {
  stop();
  const pat = patternFor(ex);
  const stage = root && root.querySelector('.form-stage');
  if (!pat || !stage || pat.hold) return;
  const live = stage.querySelector('.live'), mks = stage.querySelector('.mks'), top = stage.querySelector('.top'), btn = stage.querySelector('.form-play');
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const { p, s } = musclesFor(ex);
  const T = 3600; let playing = !reduce, t0 = performance.now(), last = 0;
  const ease = x => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  const phase = ms => { const u = (ms % T) / T; if (u < 0.12) return 0; if (u < 0.5) return ease((u - 0.12) / 0.38); if (u < 0.62) return 1; return 1 - ease((u - 0.62) / 0.38); };
  const draw = t => { const r = SC.scene(pat, t, { hiP: p, hiS: s }); live.innerHTML = r.svg; mks.innerHTML = SC.marks(pat, r.J); if (top && pat.top) top.innerHTML = topInset(pat, t); };
  const tick = now => { if (!document.body.contains(live)) return stop(); if (playing) { last = now - t0; draw(phase(last)); } raf = requestAnimationFrame(tick); };
  if (btn) { btn.textContent = playing ? '⏸' : '▶'; btn.onclick = () => { playing = !playing; if (playing) t0 = performance.now() - last; btn.textContent = playing ? '⏸' : '▶'; }; }
  raf = requestAnimationFrame(tick);
}
// 브랜드 기구(brands.js)는 같은 동작의 기본 운동 그림을 그대로 써요
for (const e of window.EXERCISES || []) if (e.base) { if (M[e.base] && !M[e.id]) M[e.id] = M[e.base]; if (TOP[e.base] && !TOP[e.id]) TOP[e.id] = TOP[e.base]; }
const THUMB_CACHE = {};
const G_ICON = { 가슴: '💪', 등: '🏋️', 어깨: '🤸', 하체: '🦵', 둔근: '🍑', 팔: '💪', 복근: '🎯', 유산소: '🏃', 기타: '•' };
function thumbFallback(ex, size) {
  const g = (ex && ex.group) || '기타';
  const icon = G_ICON[g] || G_ICON['기타'];
  return `<span class="ex-thumb-fb" data-g="${esc(g)}" style="width:${size}px;height:${size}px" title="${esc(g)}">${icon}</span>`;
}
function thumbHtml(ex, size = 44) {
  if (!ex) return thumbFallback({ group: '기타' }, size);
  if (THUMB_CACHE[ex.id]) return THUMB_CACHE[ex.id];
  const pat = patternFor(ex);
  if (!pat) return (THUMB_CACHE[ex.id] = thumbFallback(ex, size));
  const f = frameSvg(pat, ex, 0);
  const svg = `<svg class="ex-thumb-svg" viewBox="${VB}" width="${size}" height="${size}" aria-hidden="true" focusable="false">${SC.DEFS}${f.body}</svg>`;
  return (THUMB_CACHE[ex.id] = svg);
}
window.FORMS = { topInset, patternFor, musclesFor, bodyMapSvg, guideFigureHtml, start, stop, MAP: M, thumbHtml, frameSvg };
})();
