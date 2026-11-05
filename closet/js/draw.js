/* 179cm 운동하는 체형의 남자 마네킹 + 옷 실루엣 */
(function (root) {
  const SKIN = "#F0CDBA";
  const SKIN_SHADOW = "#E2B79F";
  const HAIR = "#2A2420";
  const LINE = "#3A312C";
  const CX = 160;

  function shade(hex, n) { return root.ClosetColor.shade(hex, n); }
  function luma(hex) { return root.ClosetColor.luma(hex); }
  function safe(hex) { return root.ClosetColor.safeHex(hex); }

  function edge(hex) {
    return luma(hex) > 196 ? "#D3CBC2" : shade(hex, -48);
  }
  function ink(hex) {
    return luma(hex) > 168 ? "rgba(32,26,22,.55)" : "rgba(255,255,255,.62)";
  }

  const ARM = {
    L: [{ x: 122, y: 168 }, { x: 74, y: 248 }, { x: 60, y: 338 }, { x: 70, y: 424 }],
    R: [{ x: 198, y: 168 }, { x: 246, y: 248 }, { x: 260, y: 338 }, { x: 250, y: 424 }]
  };

  function armSlice(side, kind) {
    const full = ARM[side];
    if (kind === "short") {
      const a = full[0];
      const b = full[1];
      return [a, { x: a.x * 0.42 + b.x * 0.58, y: a.y * 0.42 + b.y * 0.58 }];
    }
    return full;
  }

  function offsetPolyline(points, radii, sign) {
    const out = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[Math.max(0, i - 1)];
      const b = points[Math.min(points.length - 1, i + 1)];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      dx /= len;
      dy /= len;
      const nx = -dy * sign;
      const ny = dx * sign;
      out.push({ x: points[i].x + nx * radii[i], y: points[i].y + ny * radii[i] });
    }
    return out;
  }

  function poly(points) {
    if (!points.length) return "";
    return points.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";
  }

  function ribbon(points, radii) {
    const L = offsetPolyline(points, radii, 1);
    const R = offsetPolyline(points, radii, -1);
    return poly(L.concat(R.reverse()));
  }

  function radiiFor(len, bulky) {
    const b = bulky ? 3 : 0;
    if (len === "short") return [22 + b, 18 + b];
    return [23 + b, 17 + b, 15 + b, 13 + b];
  }

const FITS = {
  chino:    { hipOut: 54, thighOut: 48, kneeOut: 38, ankleOut: 28, hipIn: 7, thighIn: 8, kneeIn: 7, ankleIn: 7 },
  straight: { hipOut: 60, thighOut: 58, kneeOut: 52, ankleOut: 48, hipIn: 7, thighIn: 7, kneeIn: 7, ankleIn: 7 },
  semi:     { hipOut: 68, thighOut: 74, kneeOut: 72, ankleOut: 68, hipIn: 6, thighIn: 6, kneeIn: 6, ankleIn: 6 },
  wide:     { hipOut: 76, thighOut: 90, kneeOut: 100, ankleOut: 108, hipIn: 6, thighIn: 6, kneeIn: 6, ankleIn: 6 }
};

  function fitKey(subtype) {
    if (subtype === "chino") return "chino";
    if (subtype === "wide" || subtype === "curved") return "wide";
    if (subtype === "semi") return "semi";
    return "straight";
  }

  function legPoints(side, fit, hemY) {
    const s = side === "L" ? -1 : 1;
    const ys = [338, 420, 508, hemY];
    const outer = [fit.hipOut, fit.thighOut, fit.kneeOut, fit.ankleOut];
    const inner = [fit.hipIn, fit.thighIn, fit.kneeIn, fit.ankleIn];
    const pts = [];
    for (let i = 0; i < 4; i++) pts.push({ x: CX + s * outer[i], y: ys[i] });
    for (let i = 3; i >= 0; i--) pts.push({ x: CX + s * inner[i], y: ys[i] });
    return pts;
  }

  function ankleCenter(side, fit) {
    const s = side === "L" ? -1 : 1;
    const mid = (fit.ankleOut + fit.ankleIn) / 2;
    return CX + s * mid;
  }

  let uid = 0;
  function nextId(prefix) {
    uid += 1;
    return `${prefix || "m"}${uid}`;
  }

  function grad(id, hex) {
    return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${shade(hex, -26)}"/>
      <stop offset="42%" stop-color="${hex}"/>
      <stop offset="100%" stop-color="${shade(hex, -14)}"/>
    </linearGradient>`;
  }

  function body() {
    const skinArm = (side) => ribbon(armSlice(side, "long"), [16, 13, 11, 10]);
    return `
      <path d="${skinArm("L")}" fill="${SKIN}"/>
      <path d="${skinArm("R")}" fill="${SKIN}"/>
      <path d="M108 166
        C100 188 104 230 112 278
        C116 304 108 328 102 348
        L132 362
        C148 370 172 370 188 362
        L218 348
        C212 328 204 304 208 278
        C216 230 220 188 212 166
        C196 150 176 146 160 148
        C144 146 124 150 108 166 Z" fill="${SKIN}"/>
      <path d="M136 118 L184 118 L188 150 L132 150 Z" fill="${SKIN}"/>
      <path d="M142 132 Q160 140 178 132" fill="none" stroke="${SKIN_SHADOW}" stroke-width="2"/>
    `;
  }

  function hands() {
    function hand(side) {
      const p = ARM[side][3];
      const s = side === "L" ? -1 : 1;
      const x = p.x + s * 1;
      const y = p.y + 16;
      return `<path d="M ${x - 11} ${y - 6}
        C ${x - 16} ${y + 10}, ${x - 8} ${y + 24}, ${x + 1} ${y + 22}
        C ${x + 12} ${y + 18}, ${x + 14} ${y + 2}, ${x + 6} ${y - 10}
        C ${x + s * 2} ${y - 18}, ${x - 6} ${y - 14}, ${x - 11} ${y - 6} Z" fill="${SKIN}"/>
        <path d="M ${x + s * 8} ${y - 2} l ${s * 6} ${4} l ${-s * 2} ${5} l ${-s * 6} ${-3} Z" fill="${SKIN_SHADOW}"/>`;
    }
    return hand("L") + hand("R");
  }

  function head() {
    return `
      <path d="M118 92 C114 78 124 62 140 58 C132 78 134 100 140 112 L124 108 Z" fill="${SKIN}"/>
      <path d="M202 92 C206 78 196 62 180 58 C188 78 186 100 180 112 L196 108 Z" fill="${SKIN}"/>
      <path d="M160 40
        C186 42 198 62 196 86
        C194 112 180 126 160 128
        C140 126 126 112 124 86
        C122 62 134 42 160 40 Z" fill="${SKIN}"/>
      <path d="M124 84
        C120 62 132 40 160 36
        C188 40 200 62 196 84
        C190 70 176 60 160 60
        C144 60 130 70 124 84 Z" fill="${HAIR}"/>
      <path d="M142 84 h10 M172 84 h10" stroke="${LINE}" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M140 76 q5 -4 10 0 M174 76 q5 -4 10 0" fill="none" stroke="${LINE}" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M160 90 q-2 8 0 14" fill="none" stroke="${SKIN_SHADOW}" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M152 112 q8 5 16 0" fill="none" stroke="#C48B78" stroke-width="1.4" stroke-linecap="round"/>
    `;
  }

  function sleeve(side, kind, fill, bulky, sw) {
    const pts = armSlice(side, kind);
    const rad = radiiFor(kind, bulky);
    return `<path d="${ribbon(pts, rad)}" fill="${fill}" stroke="${sw}" stroke-width="1"/>`;
  }

  function torsoPoints(hemY, ease, neckDrop) {
    const sL = 106 - ease;
    const sR = 214 + ease;
    const wL = 116 - ease * 0.45;
    const wR = 204 + ease * 0.45;
    const hL = 112 - ease * 0.65;
    const hR = 208 + ease * 0.65;
    return [
      { x: sL, y: 172 },
      { x: sL - 4, y: 214 },
      { x: wL, y: 268 },
      { x: wL - 2, y: 308 },
      { x: hL, y: hemY },
      { x: hR, y: hemY },
      { x: wR + 2, y: 308 },
      { x: wR, y: 268 },
      { x: sR + 4, y: 214 },
      { x: sR, y: 172 },
      { x: 186, y: 156 },
      { x: CX, y: 156 + neckDrop },
      { x: 134, y: 156 }
    ];
  }

  function openPanels(hemY, ease, gap, neckDrop) {
    const f = torsoPoints(hemY, ease, neckDrop);
    const left = [
      f[0], f[1], f[2], f[3], f[4],
      { x: CX - gap, y: hemY },
      { x: CX - gap, y: 176 },
      { x: 146, y: 158 },
      f[12]
    ];
    const right = [
      { x: 174, y: 158 },
      { x: CX + gap, y: 176 },
      { x: CX + gap, y: hemY },
      f[5], f[6], f[7], f[8], f[9],
      f[10]
    ];
    return [left, right];
  }

function shoulderCaps(fill, sw, ease) {
  const e = ease || 0;
  return `
    <ellipse cx="${116 - e * 0.2}" cy="168" rx="${18 + e * 0.15}" ry="12" fill="${fill}" stroke="${sw}" stroke-width="1"/>
    <ellipse cx="${204 + e * 0.2}" cy="168" rx="${18 + e * 0.15}" ry="12" fill="${fill}" stroke="${sw}" stroke-width="1"/>
  `;
}

  function ribBand(y, x1, x2, hex, lines) {
    const h = 14;
    const col = ink(hex);
    let s = `<path d="M${x1} ${y} H${x2} V${y + h} H${x1} Z" fill="${shade(hex, -18)}"/>`;
    const n = lines || 3;
    for (let i = 1; i <= n; i++) {
      const yy = y + (h * i) / (n + 1);
      s += `<path d="M${x1 + 2} ${yy.toFixed(1)} H${x2 - 2}" stroke="${col}" stroke-width="1" opacity=".7"/>`;
    }
    return s;
  }

  function buttons(x, y1, y2, n, hex) {
    let s = "";
    const fill = luma(hex) > 170 ? shade(hex, -50) : shade(hex, 46);
    for (let i = 0; i < n; i++) {
      const y = y1 + ((y2 - y1) * (i + 0.5)) / n;
      s += `<circle cx="${x}" cy="${y.toFixed(1)}" r="3.1" fill="${fill}" stroke="${edge(hex)}" stroke-width=".6"/>`;
    }
    return s;
  }

  function collarDress(hex) {
    const dark = shade(hex, -28);
    return `
      <path d="M134 154 L108 196 L126 200 L160 168 L150 154 Z" fill="${hex}" stroke="${dark}" stroke-width="1"/>
      <path d="M186 154 L212 196 L194 200 L160 168 L170 154 Z" fill="${hex}" stroke="${dark}" stroke-width="1"/>
      <path d="M138 152 H182 L176 166 H144 Z" fill="${shade(hex, -12)}" stroke="${dark}" stroke-width="1"/>
    `;
  }

  function collarPolo(hex) {
    const dark = shade(hex, -30);
    return `
      <path d="M136 156 L118 186 L132 188 L158 166 Z" fill="${hex}" stroke="${dark}" stroke-width="1"/>
      <path d="M184 156 L202 186 L188 188 L162 166 Z" fill="${hex}" stroke="${dark}" stroke-width="1"/>
      <path d="M146 154 H174 L170 164 H150 Z" fill="${shade(hex, -10)}"/>
    `;
  }

  function lapel(kind, open, hex) {
    const dark = shade(hex, -24);
    if (kind === "small") {
      return `
        <path d="M146 156 L128 176 L140 198 L158 176 Z" fill="${shade(hex, 8)}" stroke="${dark}" stroke-width="1"/>
        <path d="M174 156 L192 176 L180 198 L162 176 Z" fill="${shade(hex, 8)}" stroke="${dark}" stroke-width="1"/>
      `;
    }
    if (!open && kind !== "point") {
      return `
        <path d="M150 156 L118 178 L132 236 L160 198 Z" fill="${shade(hex, 10)}" stroke="${dark}" stroke-width="1"/>
        <path d="M170 156 L202 178 L188 236 L160 198 Z" fill="${shade(hex, 6)}" stroke="${dark}" stroke-width="1"/>
      `;
    }
    const wide = open ? 18 : 0;
    return `
      <path d="M${148 - wide * 0.2} 156 L${104 - wide} 182 L${120 - wide * 0.4} ${250 + (open ? 16 : 0)} L${154 - (open ? 6 : 0)} 206 Z" fill="${shade(hex, 12)}" stroke="${dark}" stroke-width="1"/>
      <path d="M${172 + wide * 0.2} 156 L${216 + wide} 182 L${200 + wide * 0.4} ${250 + (open ? 16 : 0)} L${166 + (open ? 6 : 0)} 206 Z" fill="${shade(hex, 6)}" stroke="${dark}" stroke-width="1"/>
    `;
  }

  function hood(hex) {
    const dark = shade(hex, -30);
    return `
      <path d="M128 162
        C104 150 92 112 102 74
        C112 36 148 26 160 26
        C172 26 208 36 218 74
        C228 112 216 150 192 162
        C180 142 140 142 128 162 Z" fill="${shade(hex, -8)}" stroke="${dark}" stroke-width="1"/>
      <path d="M142 158 C132 120 138 78 160 70 C182 78 188 120 178 158" fill="none" stroke="${ink(hex)}" stroke-width="1.4" opacity=".55"/>
    `;
  }

  function drawstrings(hex) {
    const col = luma(hex) > 150 ? shade(hex, -40) : shade(hex, 70);
    return `
      <path d="M152 168 q-8 36 -2 58" fill="none" stroke="${col}" stroke-width="1.6"/>
      <path d="M168 168 q8 36 2 58" fill="none" stroke="${col}" stroke-width="1.6"/>
      <rect x="145" y="224" width="5" height="8" rx="1" fill="${shade(col, -20)}"/>
      <rect x="170" y="224" width="5" height="8" rx="1" fill="${shade(col, -20)}"/>
    `;
  }

  function kangaroo(hex) {
    return `<path d="M118 300
      C118 286 132 280 160 280
      C188 280 202 286 202 300
      L202 348 Q160 360 118 348 Z" fill="${shade(hex, -12)}" stroke="${edge(hex)}" stroke-width="1"/>
      <path d="M128 312 Q160 322 192 312" fill="none" stroke="${ink(hex)}" stroke-width="1" opacity=".45"/>`;
  }

  function quiltLines(clipId, hem, hex) {
    const col = ink(hex);
    let s = `<g clip-path="url(#${clipId})">`;
    for (let y = 196; y < hem - 6; y += 18) {
      s += `<path d="M70 ${y} H250" stroke="${col}" stroke-width="1.1" opacity=".55"/>`;
    }
    s += `</g>`;
    return s;
  }

  function chestPockets(hex) {
    const line = edge(hex);
    const flap = shade(hex, -14);
    return `
      <path d="M112 214 h28 v22 h-28 z" fill="${flap}" stroke="${line}" stroke-width="1"/>
      <path d="M112 214 h28 l-2 6 h-24 z" fill="${shade(hex, -22)}"/>
      <path d="M180 214 h28 v22 h-28 z" fill="${flap}" stroke="${line}" stroke-width="1"/>
      <path d="M180 214 h28 l-2 6 h-24 z" fill="${shade(hex, -22)}"/>
    `;
  }

  function hipFlaps(hex, hem) {
    const y = Math.min(hem - 70, 430);
    const line = edge(hex);
    return `
      <path d="M112 ${y} h32 v28 h-32 z" fill="${shade(hex, -10)}" stroke="${line}" stroke-width="1"/>
      <path d="M176 ${y} h32 v28 h-32 z" fill="${shade(hex, -10)}" stroke="${line}" stroke-width="1"/>
    `;
  }

  function raglanSeams(hex) {
    const col = ink(hex);
    return `
      <path d="M142 160 L108 230" fill="none" stroke="${col}" stroke-width="1.2" opacity=".7"/>
      <path d="M178 160 L212 230" fill="none" stroke="${col}" stroke-width="1.2" opacity=".7"/>
    `;
  }

  function isBulky(item) {
    if (!item) return false;
    if (item.volume === "big" && ["sweat", "hoodie", "sweatshirt", "puffer", "padding"].includes(item.subtype)) return true;
    return /루즈|오버|Oversized|oversized/i.test(`${item.name} ${item.brand}`);
  }

  function garmentBody(spec, hex, open) {
    const ease = spec.ease + (spec.bulky ? 6 : 0);
    const sw = edge(hex);
    const hem = spec.hem;
    let paths = "";
    if (open && spec.openable) {
      const [l, r] = openPanels(hem, ease, spec.gap || 16, spec.neckDrop || 16);
      paths += `<path d="${poly(l)}" fill="currentFill" stroke="${sw}" stroke-width="1"/>`;
      paths += `<path d="${poly(r)}" fill="currentFill" stroke="${sw}" stroke-width="1"/>`;
    } else {
      paths += `<path d="${poly(torsoPoints(hem, ease, spec.neckDrop || 18))}" fill="currentFill" stroke="${sw}" stroke-width="1"/>`;
    }
    return { paths, ease, sw, hem };
  }

  function drawGarment(item, opts) {
    const hex = safe(item.color);
    const id = nextId(opts.prefix || "g");
    const gid = id + "f";
    const bulky = isBulky(item);
    const st = item.subtype;
    const tuck = !!opts.tuck;
    const outerOpen = !!opts.outerOpen;

    const spec = specFor(st, tuck, bulky);
    const open = spec.openable && (spec.forceOpen || (spec.outer && outerOpen));
    const body = garmentBody(spec, hex, open);
    const sleeveKind = spec.sleeve;
    let inner = "";
    if (spec.hood && !opts.skipHood) inner += hood(hex);
    inner += shoulderCaps("currentFill", body.sw, body.ease);
    if (sleeveKind !== "none") {
      inner += sleeve("L", sleeveKind, "currentFill", bulky, body.sw);
      inner += sleeve("R", sleeveKind, "currentFill", bulky, body.sw);
    }
    inner += body.paths.replaceAll("currentFill", `url(#${gid})`);
    inner = inner.replaceAll("currentFill", `url(#${gid})`);

    if (spec.rib) {
      const x1 = 112 - body.ease * 0.65;
      const x2 = 208 + body.ease * 0.65;
      if (!open) inner += ribBand(spec.hem - 2, x1, x2, hex, 3);
      else {
        inner += ribBand(spec.hem - 2, x1, CX - (spec.gap || 16), hex, 2);
        inner += ribBand(spec.hem - 2, CX + (spec.gap || 16), x2, hex, 2);
      }
      if (sleeveKind === "long") {
        inner += ribCuff("L", hex);
        inner += ribCuff("R", hex);
      }
    }
    if (spec.quilt && !open) {
      const clip = id + "c";
      inner += `<clipPath id="${clip}">${body.paths.replaceAll("currentFill", "#000")}</clipPath>`;
      inner += quiltLines(clip, spec.hem, hex);
    } else if (spec.quilt && open) {
      inner += quiltLinesOpen(spec.hem, hex, spec.gap || 16);
    }
    if (spec.pockets === "chest") inner += chestPockets(hex);
    if (spec.pockets === "flap" && !open) inner += hipFlaps(hex, spec.hem);
    if (spec.kangaroo) inner += kangaroo(hex);
    if (spec.raglan) inner += raglanSeams(hex);
    if (spec.zipper && !open) inner += zipper(hex, spec.hem);
    if (spec.buttons && !open) inner += buttons(CX, spec.buttonTop || 190, spec.hem - 28, spec.buttons, hex);
    if (spec.cardiButtons) inner += buttons(CX + 8, 210, spec.hem - 24, spec.cardiButtons, hex);
    if (spec.drawstrings) inner += drawstrings(hex);
    if (spec.lapel) inner += lapel(spec.lapel, open, hex);
    if (spec.collar === "dress") inner += collarDress(hex);
    if (spec.collar === "polo") inner += collarPolo(hex);
    if (spec.placket && !open) {
      inner += `<path d="M${CX - 1} 168 V${spec.hem - 8}" stroke="${ink(hex)}" stroke-width="1.4"/>`;
    }
    if (st === "leather" && !open) {
      inner += `<path d="M118 176 C130 210 128 280 120 320" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="8" stroke-linecap="round"/>`;
    }
    if (spec.denimStitch) inner += denimStitch(hex, spec.hem, open, spec.gap || 16);

    return `<g>${`<defs>${grad(gid, hex)}</defs>`}${inner}</g>`;
  }

  function ribCuff(side, hex) {
    const p = ARM[side][3];
    const col = ink(hex);
    return `
      <rect x="${p.x - 12}" y="${p.y - 8}" width="24" height="14" rx="3" fill="${shade(hex, -16)}" transform="rotate(${side === "L" ? -8 : 8} ${p.x} ${p.y})"/>
      <path d="M${p.x - 8} ${p.y - 2} h16 M${p.x - 8} ${p.y + 3} h16" stroke="${col}" stroke-width="1" opacity=".7"/>
    `;
  }

  function zipper(hex, hem) {
    const col = luma(hex) > 160 ? "#5c564e" : "#d9d3c8";
    return `
      <path d="M${CX} 168 V${hem - 16}" stroke="${col}" stroke-width="2"/>
      <rect x="${CX - 3}" y="214" width="6" height="10" rx="1" fill="${col}"/>
    `;
  }

  function quiltLinesOpen(hem, hex, gap) {
    const col = ink(hex);
    let s = "";
    for (let y = 196; y < hem - 6; y += 18) {
      s += `<path d="M78 ${y} H${CX - gap - 2}" stroke="${col}" stroke-width="1.1" opacity=".5"/>`;
      s += `<path d="M${CX + gap + 2} ${y} H242" stroke="${col}" stroke-width="1.1" opacity=".5"/>`;
    }
    return s;
  }

  function denimStitch(hex, hem, open, gap) {
    const col = luma(hex) < 80 ? "#C6B48A" : "#6A5340";
    if (open) {
      return `
        <path d="M${CX - gap} 176 V${hem}" fill="none" stroke="${col}" stroke-width="1.2"/>
        <path d="M${CX + gap} 176 V${hem}" fill="none" stroke="${col}" stroke-width="1.2"/>
      `;
    }
    return `<path d="M${CX - 6} 176 V${hem - 4} M${CX + 6} 176 V${hem - 4}" fill="none" stroke="${col}" stroke-width="1"/>`;
  }

  function specFor(st, tuck, bulky) {
    const base = {
      sleeve: "long", ease: 2, neckDrop: 22, hem: tuck ? 308 : 386,
      openable: false, rib: false, bulky
    };
    const map = {
      tee: { sleeve: "short", hem: tuck ? 308 : 372, neckDrop: 26, ease: 1 },
      longtee: { hem: tuck ? 308 : 384, neckDrop: 26, ease: 1 },
      crop: { hem: 262, neckDrop: 22, ease: 3 },
      thermal: { hem: tuck ? 308 : 388, neckDrop: 20, raglan: true, ease: 1 },
      polo: { sleeve: "short", hem: tuck ? 308 : 376, neckDrop: 12, collar: "polo", placket: true, buttons: 2, buttonTop: 176, ease: 1 },
      shirt: { hem: tuck ? 310 : 398, neckDrop: 14, collar: "dress", placket: true, buttons: 5, buttonTop: 188, ease: 2 },
      knit: { hem: tuck ? 312 : 396, neckDrop: 24, rib: true, ease: 3 },
      pullover: { hem: tuck ? 312 : 400, neckDrop: 24, rib: true, ease: 4 },
      cardi: { hem: 408, neckDrop: 46, rib: true, ease: 4, openable: true, forceOpen: true, gap: 11, cardiButtons: 5, lapel: "small" },
      sweat: { hem: 404, neckDrop: 22, rib: true, ease: bulky ? 12 : 8 },
      sweatshirt: { hem: 408, neckDrop: 22, rib: true, ease: bulky ? 14 : 9 },
      hoodie: { hem: 412, neckDrop: 18, rib: true, ease: bulky ? 14 : 10, hood: true, drawstrings: true, kangaroo: true },
      coat: { hem: 516, neckDrop: 16, ease: 12, openable: true, outer: true, gap: 20, lapel: "notch", buttons: 4, buttonTop: 210, pockets: "flap" },
      balmacaan: { hem: 524, neckDrop: 12, ease: 16, openable: true, outer: true, gap: 16, lapel: "small", buttons: 4, buttonTop: 200, raglan: true },
      leather: { hem: 328, neckDrop: 16, ease: 4, openable: true, outer: true, gap: 15, lapel: "notch", zipper: true },
      denimjacket: { hem: 366, neckDrop: 14, ease: 8, openable: true, outer: true, gap: 15, lapel: "point", buttons: 5, buttonTop: 188, pockets: "chest", denimStitch: true },
      bomber: { hem: 356, neckDrop: 8, ease: 9, openable: true, outer: true, gap: 13, zipper: true, rib: true },
      puffer: { hem: 392, neckDrop: 10, ease: 16, openable: true, outer: true, gap: 15, zipper: true, quilt: true },
      padding: { hem: 460, neckDrop: 10, ease: 16, openable: true, outer: true, gap: 16, zipper: true, quilt: true }
    };
    return Object.assign(base, map[st] || map.tee);
  }

  const PANT_HEM = 604;
  const FLOOR = 640;

  function rolledHem(shoeType) {
    if (shoeType === "combat") return 508;
    if (shoeType === "boot") return 548;
    return 572;
  }

  function pantsOutline(fit, hem) {
    const L = (v) => (CX - v).toFixed(1);
    const R = (v) => (CX + v).toFixed(1);
    return `M ${L(fit.hipOut)} 332
      L ${L(fit.hipOut)} 306
      Q ${CX} 296 ${R(fit.hipOut)} 306
      L ${R(fit.hipOut)} 332
      L ${R(fit.thighOut)} 430
      L ${R(fit.kneeOut)} 508
      L ${R(fit.ankleOut)} ${hem}
      L ${R(fit.ankleIn)} ${hem}
      L ${R(fit.kneeIn)} 508
      L ${R(fit.thighIn)} 430
      L ${R(fit.hipIn)} 368
      C ${R(8)} 392 ${L(8)} 392 ${L(fit.hipIn)} 368
      L ${L(fit.thighIn)} 430
      L ${L(fit.kneeIn)} 508
      L ${L(fit.ankleIn)} ${hem}
      L ${L(fit.ankleOut)} ${hem}
      L ${L(fit.kneeOut)} 508
      L ${L(fit.thighOut)} 430
      Z`;
  }

  function pants(item, roll, hemY) {
    const hex = safe(item.color);
    const gid = nextId("p") + "f";
    const fit = FITS[fitKey(item.subtype)];
    const denim = item.subtype !== "chino";
    const hem = hemY || (roll ? 572 : PANT_HEM);
    const sw = edge(hex);
    const stitch = luma(hex) < 90 ? "#C6B48A" : "#5c4636";
    let details = `<path d="M${CX} 310 V368" stroke="${ink(hex)}" stroke-width="1.5"/>`;
    if (denim) {
      details += `<path d="M${(CX - (fit.hipOut + fit.ankleOut) / 2).toFixed(1)} 340 L${(CX - fit.ankleOut + 4).toFixed(1)} ${hem - 2}" stroke="${stitch}" stroke-width="1.15"/>`;
      details += `<path d="M${(CX + (fit.hipOut + fit.ankleOut) / 2).toFixed(1)} 340 L${(CX + fit.ankleOut - 4).toFixed(1)} ${hem - 2}" stroke="${stitch}" stroke-width="1.15"/>`;
    } else {
      details += `<path d="M${CX - fit.hipOut * 0.42} 328 L${CX - (fit.ankleOut + fit.ankleIn) * 0.22} ${hem - 6}" stroke="${ink(hex)}" stroke-width="1.1" opacity=".5"/>`;
      details += `<path d="M${CX + fit.hipOut * 0.42} 328 L${CX + (fit.ankleOut + fit.ankleIn) * 0.22} ${hem - 6}" stroke="${ink(hex)}" stroke-width="1.1" opacity=".5"/>`;
    }
    let cuff = "";
    if (roll) {
      const y = hem;
      const h = 16;
      const cuffPath = (sign) => {
        const o = fit.ankleOut + 3;
        const inn = fit.ankleIn;
        const x1 = CX + sign * o;
        const x2 = CX + sign * inn;
        const a = Math.min(x1, x2);
        const b = Math.max(x1, x2);
        return `M${a} ${y} H${b} V${y + h} H${a} Z`;
      };
      cuff = `
        <path d="${cuffPath(-1)}" fill="${shade(hex, -22)}" stroke="${sw}" stroke-width="1"/>
        <path d="${cuffPath(1)}" fill="${shade(hex, -22)}" stroke="${sw}" stroke-width="1"/>
        <path d="M${CX - fit.ankleOut} ${hem + 5} H${CX - fit.ankleIn}" stroke="${ink(hex)}" stroke-width="1"/>
        <path d="M${CX + fit.ankleIn} ${hem + 5} H${CX + fit.ankleOut}" stroke="${ink(hex)}" stroke-width="1"/>
      `;
    }
    return `
      <g>
        <defs>${grad(gid, hex)}</defs>
        <path d="${pantsOutline(fit, hem)}" fill="url(#${gid})" stroke="${sw}" stroke-width="1.4"/>
        ${details}
        ${cuff}
      </g>`;
  }

  function shoePair(item, fit, roll, hem) {
    const hex = safe(item.color);
    const type = item.subtype;
    const parts = ["L", "R"].map((side) => shoe(side, type, hex, ankleCenter(side, fit), hem, roll)).join("");
    return `<g>${parts}</g>`;
  }

  function shoe(side, type, hex, ax, hem, roll) {
    const s = side === "L" ? -1 : 1;
    const sw = edge(hex);
    const soleC = shade(hex, -46);
    const hi = luma(hex) > 150 ? "rgba(40,32,24,.55)" : "rgba(255,255,255,.75)";
    const bottom = FLOOR;
    const tall = type === "combat" ? 118 : type === "boot" ? 78 : 0;
    const top = tall
      ? (roll ? hem + 6 : Math.min(hem - 12, bottom - tall))
      : (roll ? hem + 2 : hem - 30);
    const toe = ax + s * (type === "derby" ? 46 : 38);
    const heel = ax - s * (type === "derby" ? 14 : 16);
    const half = type === "combat" ? 15 : type === "boot" ? 14 : type === "sneaker" ? 15 : 12;
    const sl = ax - half;
    const sr = ax + half;
    const footY = bottom - (type === "derby" ? 18 : 22);
    let shape = "";
    if (tall) {
      shape += `<path d="M${sl} ${top} H${sr} V${footY} H${sl} Z" fill="${hex}" stroke="${sw}" stroke-width="1.1"/>`;
    } else {
      shape += `<path d="M${sl + 2} ${top + 8} Q${ax} ${top} ${sr - 2} ${top + 8} L${sr - 1} ${footY} L${sl + 1} ${footY} Z" fill="${hex}" stroke="${sw}" stroke-width="1"/>`;
    }
    shape += `
      <path d="M${heel} ${footY + 2}
        L${Math.min(sl, heel)} ${footY}
        L${Math.max(sr, heel)} ${footY}
        L${toe} ${footY + 2}
        Q${toe + s * 3} ${bottom - 8} ${toe - s * 2} ${bottom - 5}
        L${heel} ${bottom - 5}
        Q${heel - s * 5} ${bottom - 12} ${heel} ${footY + 2} Z" fill="${hex}" stroke="${sw}" stroke-width="1.1"/>
      <path d="M${heel - s * 4} ${bottom - 7} H${toe + s * 3} V${bottom} H${heel - s * 5} Z" fill="${soleC}"/>
    `;
    if (type === "sneaker") {
      shape += `
        <path d="M${sl + 3} ${top + 3} H${sr - 3}" stroke="${shade(hex, -24)}" stroke-width="4"/>
        <path d="M${ax - 8} ${top + 14} h5 l3 6 h5 l3 -6 h5" fill="none" stroke="${hi}" stroke-width="1.3"/>
        <path d="M${ax + s * 6} ${footY + 4} h${s * 14}" stroke="${hi}" stroke-width="1.4"/>
      `;
    } else if (type === "derby") {
      shape += `
        <path d="M${heel + s * 2} ${footY - 2} v-10 h${s * 8}" fill="none" stroke="${hi}" stroke-width="1.3"/>
        <path d="M${ax - 2} ${footY + 2} l${s * 4} 5 m0 0 l${s * 4} -4" fill="none" stroke="${hi}" stroke-width="1.1"/>
        <path d="M${ax + s * 2} ${footY + 1} q${s * 16} 6 ${s * 22} 12" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2"/>
      `;
    } else {
      shape += `
        <path d="M${sl + 2} ${top + 6} H${sr - 2}" stroke="${hi}" stroke-width="2"/>
        <path d="M${ax - 4} ${top + 16} l4 7 h5 l4 -7 M${ax - 3} ${top + 32} l4 7 h5 l4 -7 M${ax - 2} ${top + 48} l4 7 h5 l4 -7" fill="none" stroke="${hi}" stroke-width="1.2"/>
        <path d="M${ax + s * 4} ${footY - 2} Q${toe - s * 8} ${footY - 6} ${toe - s * 6} ${footY + 4}" fill="none" stroke="${hi}" stroke-width="1.2"/>
        <path d="M${heel + s * 2} ${bottom - 14} v9" stroke="${shade(hex, -20)}" stroke-width="4"/>
      `;
    }
    return shape;
  }

  function belt(item, fit) {
    const hex = safe(item.color);
    const x1 = CX - fit.hipOut + 2;
    const x2 = CX + fit.hipOut - 2;
    const y = 306;
    return `
      <path d="M${x1} ${y} H${x2} V${y + 12} H${x1} Z" fill="${hex}"/>
      <rect x="${CX - 8}" y="${y - 1}" width="16" height="14" rx="2" fill="${shade(hex, 36)}" stroke="${shade(hex, -20)}" stroke-width="1"/>
      <rect x="${CX - 3}" y="${y + 3}" width="6" height="6" rx="1" fill="${shade(hex, -30)}"/>
    `;
  }

  function emptyHint() {
    return `<text x="160" y="250" text-anchor="middle" fill="#8a8176" font-size="13" font-family="sans-serif">옷을 누르면 바로 입어요</text>`;
  }

  function coversWaist(worn, toggles) {
    const pieces = [worn.inner, worn.shirt, worn.sweat, worn.knit].filter(Boolean);
    if (!pieces.length) return false;
    if (toggles.tuck && !worn.sweat) {
      const onlyCrop = pieces.every((p) => p.subtype === "crop");
      if (onlyCrop) return false;
      if (worn.sweat) return true;
      return false;
    }
    return pieces.some((p) => p.subtype !== "crop");
  }

  function render(worn, toggles, prefix) {
    uid = (prefix || "m").length * 17;
    const t = toggles || { tuck: false, outerOpen: true, hemRoll: false };
    const fit = worn.bottom ? FITS[fitKey(worn.bottom.subtype)] : FITS.straight;
    const any = Object.values(worn).some(Boolean);
    const shoeType = worn.shoes ? worn.shoes.subtype : "";
    const hem = t.hemRoll ? rolledHem(shoeType) : PANT_HEM;
    const defs = "";
    let svg = "";
    svg += `<ellipse cx="160" cy="${FLOOR + 6}" rx="86" ry="7" fill="rgba(70,52,36,.08)"/>`;
    svg += body();
    if (worn.bottom) svg += pants(worn.bottom, !!t.hemRoll, hem);
    const order = ["inner", "shirt", "sweat", "knit", "outer"];
    for (const key of order) {
      if (!worn[key]) continue;
      const tuckThis = !!t.tuck && ["inner", "shirt", "knit"].includes(key) && worn[key].subtype !== "cardi";
      svg += drawGarment(worn[key], {
        tuck: tuckThis,
        outerOpen: key === "outer" ? !!t.outerOpen : false,
        prefix
      });
    }
    if (worn.shoes) svg += shoePair(worn.shoes, fit, !!t.hemRoll && !!worn.bottom, hem);
    const showBelt = worn.belt && !coversWaist(worn, t);
    if (showBelt) svg += belt(worn.belt, fit);
    svg += hands();
    svg += head();
    if (!any) svg += emptyHint();
    return `<svg class="mann" viewBox="24 16 272 650" role="img" aria-label="마네킹">
      ${defs}${svg}
    </svg>`;
  }

  root.ClosetDraw = { render, fitKey };
})(typeof window !== "undefined" ? window : globalThis);
