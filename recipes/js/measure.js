/* 불 세기, 썰기 그림, 가정용 계량, 기존 34개 레시피의 수량.
   그림은 이 파일의 SVG로 직접 그렸어요. 외부 이미지 없음.
   1계량큰술 = 15ml, 1계량작은술 = 5ml.
   밥숟가락 1개 = 10–12ml (계량스푼과 다름).
   종이컵 1개 = 180ml, 소주잔 1개 = 50ml, 계량컵 1컵 = 200ml.
   식용유·참기름 1큰술(15ml) ≈ 13g. 간장 1큰술(15ml) ≈ 18g.
   정제소금 1작은술 ≈ 5g. 굵은소금은 같은 숟갈에 더 가벼워요. */
(function (root) {
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const HEAT = {
    "약불": { name: "약불", level: 1, ind: "1–2단", ind15: "2–3단", gas: "불꽃이 팬 바닥에 닿지 않아요. 파란 심지 높이는 약 1cm." },
    "중약불": { name: "중약불", level: 2, ind: "3–4단", ind15: "5–6단", gas: "불꽃 끝이 팬 바닥에 겨우 닿아요." },
    "중불": { name: "중불", level: 3, ind: "5단", ind15: "8단", gas: "불꽃이 팬 바닥 전체에 닿고, 옆면으로는 올라오지 않아요." },
    "중강불": { name: "중강불", level: 4, ind: "6–7단", ind15: "10–11단", gas: "불꽃이 팬 바닥을 덮고 옆면으로 약 1cm 올라와요." },
    "강불": { name: "강불", level: 5, ind: "8–9단", ind15: "13–15단", gas: "불꽃이 팬 옆면을 감싸요. 기름이 바로 흩날려요." }
  };
  const HEAT_ORDER = ["약불", "중약불", "중불", "중강불", "강불"];

  const G_PER_TBSP = {
    "설탕": 12, "흑설탕": 12, "소금": 15, "고춧가루": 8, "다진 마늘": 15, "다진 생강": 12,
    "생강": 12, "올리고당": 18, "고추장": 18, "된장": 18, "쌈장": 18, "두반장": 18,
    "케찹": 15, "굴소스": 18, "돈까스 소스": 18, "칠리소스": 18, "춘장": 18,
    "카레가루": 8, "전분": 9, "감자전분": 9, "옥수수전분": 9, "밀가루": 8, "빵가루": 5,
    "후추": 6, "통깨": 9, "참깨": 9, "식용유": 13, "참기름": 13, "들기름": 13,
    "간장": 18, "맛술": 16, "식초": 15, "물": 15
  };
  const DENSITY = {
    "간장": 1.2, "맛술": 1.07, "식초": 1, "물": 1, "식용유": 13 / 15, "참기름": 13 / 15, "들기름": 13 / 15,
    "올리고당": 18 / 15, "굴소스": 18 / 15, "케찹": 1, "칠리소스": 18 / 15, "돈까스 소스": 18 / 15
  };
  const LIQUIDS = new Set(["간장", "국간장", "진간장", "맛술", "미림", "식초", "물", "식용유", "참기름", "들기름", "올리고당", "굴소스", "케찹", "칠리소스", "돈까스 소스"]);
  const MEATS = new Set(["삼겹살", "닭가슴살", "닭다리살", "닭안심", "돼지 앞다리살", "돼지 다짐육", "돼지 안심", "소고기", "다진 소고기", "고등어", "동태", "새우", "오징어", "명태"]);
  const PANTRY = new Set([
    "간장", "설탕", "스테비아", "올리고당", "소금", "후추", "맛술", "다진 마늘", "케찹", "칠리소스",
    "돈까스 소스", "굴소스", "고춧가루", "고추장", "된장", "쌈장", "두반장", "참기름", "식용유",
    "들기름", "식초", "춘장", "카레가루", "전분", "감자전분", "밀가루", "빵가루", "통깨", "참깨", "액젓"
  ]);
  const PIECE = {
    "양파": { unit: "개", g: 200, label: "중간 양파 1개(껍질 뺀 가식부) 약 200g" },
    "파": { unit: "대", g: 70, label: "대파 1대 약 70g" },
    "계란": { unit: "개", g: 60, label: "특란 1개 껍질 포함 약 60g, 가식부 약 50g" },
    "감자": { unit: "개", g: 150, label: "중간 감자 1개 약 150g" },
    "고구마": { unit: "개", g: 150, label: "중간 고구마 1개 약 150g" },
    "당근": { unit: "개", g: 150, label: "중간 당근 1개 약 150g" },
    "애호박": { unit: "개", g: 250, label: "애호박 1개 약 250g" },
    "오이": { unit: "개", g: 150, label: "오이 1개 약 150g" },
    "두부": { unit: "모", g: 300, label: "두부 1모 약 300g" },
    "마늘": { unit: "쪽", g: 5, label: "마늘 1쪽 약 5g" },
    "생강": { unit: "쪽", g: 5, label: "생강 한 쪽(엄지 끝마디) 약 5g. 다진 1작은술은 약 5g" },
    "토마토": { unit: "개", g: 200, label: "중간 토마토 1개 약 200g" },
    "방울토마토": { unit: "개", g: 15, label: "방울토마토 1개 약 15g" },
    "청양고추": { unit: "개", g: 10, label: "청양고추 1개 약 10g" },
    "건고추": { unit: "개", g: 1, label: "건고추 1개 약 1g" },
    "팽이버섯": { unit: "봉", g: 150, label: "팽이버섯 1봉 약 150g" },
    "표고버섯": { unit: "개", g: 20, label: "생표고 1개 약 20g" },
    "밥": { unit: "공기", g: 210, label: "공기밥·즉석밥 1개 210g (약 305kcal, 단백질 약 6g)" },
    "찬밥": { unit: "공기", g: 210, label: "찬밥 1공기 210g" },
    "현미밥": { unit: "공기", g: 210, label: "현미밥 1공기 210g (약 325kcal, 단백질 약 7g)" },
    "참치캔": { unit: "캔", g: 100, label: "참치캔 1개 표기 100g. 기름을 따라 버리면 건더기 약 70g" },
    "라면": { unit: "봉", g: 120, label: "봉지라면 1개 면+스프 약 120g" },
    "무": { unit: "개", g: 1000, label: "무 1개 약 1kg (800–1200g 사이가 흔함)" },
    "배추": { unit: "포기", g: 2500, label: "배추 1포기 약 2.5kg" },
    "양배추": { unit: "통", g: 1000, label: "양배추 1통 약 1kg" },
    "브로콜리": { unit: "송이", g: 300, label: "브로콜리 1송이 약 300g" },
    "고등어": { unit: "토막", g: 150, label: "손질 고등어 1토막 약 150g" },
    "김": { unit: "장", g: 2.5, label: "김밥김 1장 약 2.5g. 도시락김 1봉은 약 4–5g" },
    "유부": { unit: "장", g: 15, label: "유부 1장 약 15g" }
  };
  const HANDFUL = {
    "김치": [100, "김치"], "콩나물": [50, "콩나물"], "숙주": [40, "숙주"], "부추": [50, "부추"],
    "시금치": [40, "시금치"], "닭가슴살": [100, "고기"], "삼겹살": [100, "고기"], "돼지 앞다리살": [100, "고기"],
    "돼지 안심": [100, "고기"], "소고기": [100, "고기"], "다진 소고기": [100, "고기"], "돼지 다짐육": [100, "고기"],
    "닭다리살": [100, "고기"], "닭안심": [100, "고기"], "새우": [80, "새우"], "오징어": [80, "오징어"]
  };
  const DEFAULT_UNIT = Object.assign({
    "삼겹살": "g", "닭가슴살": "g", "닭다리살": "g", "닭안심": "g", "돼지 앞다리살": "g", "돼지 다짐육": "g",
    "돼지 안심": "g", "소고기": "g", "다진 소고기": "g", "고등어": "g", "동태": "g", "새우": "g", "오징어": "g",
    "김치": "g", "멸치볶음": "g", "황태채볶음": "g", "스파게티면": "g", "당면": "g", "소면": "g", "우동면": "g",
    "오트밀": "g", "땅콩": "g", "어묵": "g", "브로콜리": "g", "양배추": "g", "콩나물": "g", "숙주": "g",
    "부추": "g", "시금치": "g", "배추": "g", "파프리카": "g", "팽이버섯": "g"
  }, Object.fromEntries(Object.entries(PIECE).map(([k, v]) => [k, v.unit])));
  Object.assign(DEFAULT_UNIT, {
    "간장": "ml", "맛술": "ml", "식초": "ml", "물": "ml", "식용유": "ml", "참기름": "ml", "들기름": "ml",
    "설탕": "g", "소금": "g", "후추": "g", "고춧가루": "g", "다진 마늘": "g", "올리고당": "g", "고추장": "g",
    "된장": "g", "케찹": "g", "굴소스": "g", "두반장": "g", "춘장": "g", "카레가루": "g", "돈까스 소스": "g",
    "칠리소스": "g", "전분": "g", "감자전분": "g", "밀가루": "g", "빵가루": "g", "스테비아": "g"
  });

  function pretty(n) {
    if (n == null || !isFinite(n)) return "";
    const x = Math.round(n * 10) / 10;
    if (Math.abs(x - Math.round(x)) < 0.05) return String(Math.round(x));
    return String(x);
  }
  function pieceOf(key) { return PIECE[key] || null; }
  function gPerTbsp(key) { return G_PER_TBSP[key] || null; }
  function densityOf(key) {
    if (DENSITY[key]) return DENSITY[key];
    const g = G_PER_TBSP[key];
    if (g && LIQUIDS.has(key)) return g / 15;
    return null;
  }
  function isLiquidKey(key, unit) {
    return unit === "ml" || LIQUIDS.has(key);
  }

  function asG(key, qty, unit) {
    if (qty == null || !isFinite(qty)) return null;
    if (unit === "g") return qty;
    if (unit === "kg") return qty * 1000;
    if (unit === "ml") {
      const d = densityOf(key) || (key === "물" ? 1 : null);
      return d ? qty * d : null;
    }
    if (unit === "큰술") {
      if (G_PER_TBSP[key]) return qty * G_PER_TBSP[key];
      const d = densityOf(key);
      return d ? qty * 15 * d : null;
    }
    if (unit === "작은술") {
      if (G_PER_TBSP[key]) return qty * G_PER_TBSP[key] / 3;
      const d = densityOf(key);
      return d ? qty * 5 * d : null;
    }
    const p = pieceOf(key);
    if (p && unit === p.unit) return qty * p.g;
    return null;
  }
  function asMl(key, qty, unit) {
    if (qty == null || !isFinite(qty)) return null;
    if (unit === "ml") return qty;
    if (unit === "L") return qty * 1000;
    if (unit === "큰술" && (isLiquidKey(key, unit) || densityOf(key))) return qty * 15;
    if (unit === "작은술" && (isLiquidKey(key, unit) || densityOf(key))) return qty * 5;
    const g = asG(key, qty, unit);
    const d = densityOf(key);
    if (g != null && d) return g / d;
    return null;
  }
  function convertQty(key, qty, from, to) {
    if (from === to) return qty;
    if (qty == null || !isFinite(qty)) return null;
    const f = normUnit(from);
    const t = normUnit(to);
    if (f === t) return qty;
    if (f === "kg" && t === "g") return qty * 1000;
    if (f === "g" && t === "kg") return qty / 1000;
    if (f === "L" && t === "ml") return qty * 1000;
    if (f === "ml" && t === "L") return qty / 1000;
    const g = asG(key, qty, f);
    const ml = asMl(key, qty, f);
    if (t === "g" && g != null) return g;
    if (t === "ml" && ml != null) return ml;
    if (t === "큰술") {
      if (ml != null && isLiquidKey(key, f)) return ml / 15;
      if (g != null && G_PER_TBSP[key]) return g / G_PER_TBSP[key];
    }
    if (t === "작은술") {
      if (ml != null && isLiquidKey(key, f)) return ml / 5;
      if (g != null && G_PER_TBSP[key]) return g / G_PER_TBSP[key] * 3;
    }
    const p = pieceOf(key);
    if (p && t === p.unit && g != null) return g / p.g;
    if (p && f === p.unit && t === "g") return qty * p.g;
    return null;
  }

  function normUnit(u) {
    const s = String(u || "").trim().toLowerCase().replace(/\s+/g, "");
    const map = {
      "g": "g", "그램": "g", "gram": "g", "grams": "g",
      "kg": "kg", "킬로그램": "kg",
      "ml": "ml", "밀리리터": "ml", "cc": "ml",
      "l": "L", "리터": "L",
      "개": "개", "개입": "개",
      "대": "대", "쪽": "쪽", "모": "모", "캔": "캔", "봉": "봉", "봉지": "봉",
      "공기": "공기", "토막": "토막", "장": "장", "줌": "줌", "송이": "송이", "통": "통", "포기": "포기",
      "큰술": "큰술", "스푼": "큰술", "tbsp": "큰술", "t": "큰술",
      "작은술": "작은술", "티스푼": "작은술", "tsp": "작은술"
    };
    return map[s] || String(u || "").trim();
  }

  function household(ing, mode) {
    const key = ing.key || ing.name;
    const qty = Number(ing.qty);
    const unit = ing.unit;
    if (!isFinite(qty) || !unit) return "이 재료는 수량 숫자가 없어요.";
    if (key === "계란 흰자") return "계란 1개를 깨서 흰자만 써요 (흰자 약 30–35g). 노른자는 이 요리에 넣지 않아요. 차감은 계란 1개예요.";
    const g0 = asG(key, qty, unit);
    if ((key === "후추" || key === "소금") && g0 != null && g0 <= 2) {
      return key === "후추"
        ? `후추 ${pretty(g0)}g은 한 꼬집이에요. 계량하면 1작은술(5ml)이 약 2g.`
        : `소금 ${pretty(g0)}g. 정제소금 1작은술(5ml)은 약 5g, 1/4작은술은 약 1.3g. 굵은소금은 같은 숟갈에 더 가벼워요.`;
    }
    const ml = asMl(key, qty, unit);
    const g = asG(key, qty, unit);
    const p = pieceOf(key);
    const bits = [];
    if (mode === "spoon") {
      if (ml != null && (unit === "ml" || LIQUIDS.has(key))) {
        if (ml >= 180) bits.push(`계량컵 약 ${pretty(ml / 200)}컵 (1컵 = 200ml)`);
        const tbsp = ml / 15;
        if (tbsp >= 0.9) bits.push(`계량스푼 ${pretty(tbsp)}큰술 (1큰술 = 15ml)`);
        else bits.push(`계량스푼 ${pretty(ml / 5)}작은술 (1작은술 = 5ml)`);
        if (G_PER_TBSP[key] && key !== "물") bits.push(`이 재료 1큰술 ≈ ${G_PER_TBSP[key]}g`);
      } else if (g != null && G_PER_TBSP[key] && !MEATS.has(key) && g <= 80) {
        bits.push(`계량스푼 약 ${pretty(g / G_PER_TBSP[key])}큰술 (1큰술 ≈ ${G_PER_TBSP[key]}g)`);
      } else if (p && g != null) {
        const count = unit === p.unit ? qty : g / p.g;
        bits.push(`${pretty(count)}${p.unit} · ${p.label}`);
      } else if (unit === "g") {
        bits.push(`${pretty(qty)}g. 저울이 기준이에요`);
      } else bits.push(`${pretty(qty)}${unit}`);
    } else if (ml != null && (unit === "ml" || LIQUIDS.has(key))) {
      const lo = ml / 12, hi = ml / 10;
      bits.push(`밥숟가락 약 ${pretty(Math.min(lo, hi))}–${pretty(Math.max(lo, hi))}개`);
      bits.push("밥숟가락 1개 = 10–12ml, 계량스푼 1큰술 = 15ml");
      if (ml >= 40) bits.push(`소주잔 약 ${pretty(ml / 50)}잔 (1잔 50ml)`);
      if (ml >= 150) bits.push(`종이컵 약 ${pretty(ml / 180)}컵 (1컵 180ml)`);
    } else if (g != null && G_PER_TBSP[key] && !MEATS.has(key) && !p && g <= 90) {
      const mlEq = g / G_PER_TBSP[key] * 15;
      const lo = mlEq / 12, hi = mlEq / 10;
      bits.push(`밥숟가락 약 ${pretty(Math.min(lo, hi))}–${pretty(Math.max(lo, hi))}개`);
      bits.push(`이 재료는 계량스푼 1큰술 ≈ ${G_PER_TBSP[key]}g, 밥숟가락 1개 ≈ ${pretty(G_PER_TBSP[key] * 11 / 15)}g`);
    } else if (HANDFUL[key] && g != null && g >= 40) {
      bits.push(`성인 남자 한 줌 약 ${pretty(g / HANDFUL[key][0])}줌 (${HANDFUL[key][1]} 한 줌 ≈ ${HANDFUL[key][0]}g)`);
    } else if (p && g != null) {
      const count = unit === p.unit ? qty : g / p.g;
      bits.push(`${pretty(count)}${p.unit} · ${p.label}`);
    } else if (unit === "g") bits.push(`${pretty(qty)}g. 저울이 기준이에요`);
    else bits.push(`${pretty(qty)}${unit}`);
    if (ing.cut) {
      const c = CUTS.find(x => x.name === ing.cut);
      if (c) bits.push(`썰기 ${c.name} (${c.size})`);
    }
    return bits.join(" · ");
  }

  function flamePaths(level) {
    const h = [0, 18, 28, 40, 52, 64][level] || 18;
    const c = ["#f6c89a", "#f0a05a", "#e0703a", "#d4532b", "#c2412d"][level - 1] || "#e0703a";
    const c2 = ["#ffe7c2", "#ffd19a", "#ffb15a", "#ff8a3d", "#ffd27a"][level - 1] || "#ffd19a";
    return `<path d="M20 ${78 - h} C20 ${78 - h - 8} 8 70 8 78 C8 92 32 92 32 78 C32 70 20 ${78 - h - 8} 20 ${78 - h} Z" fill="${c}"/>
      <path d="M20 ${78 - h * 0.55} C20 ${70} 14 74 14 80 C14 88 26 88 26 80 C26 74 20 70 20 ${78 - h * 0.55} Z" fill="${c2}"/>`;
  }
  function flameSvg(level, labeled) {
    const name = HEAT_ORDER[level - 1] || "";
    return `<svg class="flame" viewBox="0 0 40 96" role="img" aria-label="${esc(name)} 불꽃">${flamePaths(level)}${labeled ? `<text x="20" y="94" text-anchor="middle" font-size="8" fill="#6f655c">${esc(name)}</text>` : ""}</svg>`;
  }
  function heatSceneSvg() {
    const pans = HEAT_ORDER.map((name, i) => {
      const x = 18 + i * 72;
      const lv = i + 1;
      const h = [18, 28, 40, 52, 64][i];
      const c = ["#f6c89a", "#f0a05a", "#e0703a", "#d4532b", "#c2412d"][i];
      const c2 = ["#ffe7c2", "#ffd19a", "#ffb15a", "#ff8a3d", "#ffd27a"][i];
      return `<g transform="translate(${x} 0)">
        <path d="M28 ${118 - h} C28 ${100 - h} 10 108 10 124 C10 146 46 146 46 124 C46 108 28 ${100 - h} 28 ${118 - h} Z" fill="${c}"/>
        <path d="M28 ${128 - h * 0.45} C28 116 18 120 18 130 C18 142 38 142 38 130 C38 120 28 116 28 ${128 - h * 0.45} Z" fill="${c2}"/>
        <path d="M6 150 h44 l-6 14 h-32 z" fill="#c4b09a" stroke="#8c7358" stroke-width="1.5"/>
        <path d="M4 150 h48" stroke="#1c1612" stroke-width="2"/>
        <text x="28" y="178" text-anchor="middle" font-size="11" font-weight="700" fill="#1c1612">${esc(name)}</text>
        <text x="28" y="192" text-anchor="middle" font-size="9" fill="#6f655c">${esc(HEAT[name].ind)}</text>
      </g>`;
    }).join("");
    return `<svg class="heat-scene" viewBox="0 0 380 200" role="img" aria-label="약불부터 강불까지 불꽃이 팬 바닥에 닿는 정도">
      <rect x="0" y="0" width="380" height="200" rx="16" fill="#fffdfb"/>
      <text x="16" y="22" font-size="12" font-weight="700" fill="#6f655c">선은 팬 바닥. 불꽃이 바닥에 닿는지로 세요.</text>
      ${pans}
    </svg>`;
  }

  function parseHeat(str) {
    const s = String(str || "");
    const levels = [];
    const re = /중약불|중강불|약불|중불|강불/g;
    let m;
    while ((m = re.exec(s))) levels.push(m[0]);
    const apps = [];
    const air = s.match(/에어프라이어(?:\s*(\d+)\s*°C)?/);
    if (air) apps.push({ kind: "air", temp: air[1] || "" });
    const oven = s.match(/오븐(?:\s*(\d+)\s*°C)?/);
    if (oven) apps.push({ kind: "oven", temp: oven[1] || "" });
    if (/전자레인지/.test(s)) apps.push({ kind: "mw" });
    if (/밥솥|취사/.test(s)) apps.push({ kind: "rice" });
    if (/냉장/.test(s)) apps.push({ kind: "cold" });
    if (/불 끄기|불끄기/.test(s)) apps.push({ kind: "off" });
    if (/불 없음|불없음/.test(s)) apps.push({ kind: "none" });
    return { levels, apps, raw: s };
  }
  function appBadge(app) {
    const map = {
      air: ["에어프라이어", app.temp ? app.temp + "°C" : "온도는 단계에 적힌 대로", "예열 없이, 한 겹"],
      oven: ["오븐", app.temp ? app.temp + "°C" : "온도는 단계에 적힌 대로", "가정용 오븐. 팬이 도는 컨벡션이면 15°C 낮춰요"],
      mw: ["전자레인지", "700W 기준", "1000W면 시간의 약 70%"],
      rice: ["전기밥솥", "취사", "끝나면 바로 섞어요"],
      cold: ["불 없음", "냉장·실온", "온도만 재워요"],
      off: ["불 끄기", "손질·마무리", "잔열만 남아요"],
      none: ["불 없음", "썰기·섞기", "불 올리기 전"]
    };
    const row = map[app.kind] || ["조리", "", ""];
    return `<span class="heat app"><b>${esc(row[0])}</b><small>${esc(row[1])}${row[2] ? " · " + esc(row[2]) : ""}</small></span>`;
  }
  function heatBadges(str) {
    const p = parseHeat(str);
    const parts = [];
    p.levels.forEach((name, i) => {
      const h = HEAT[name];
      parts.push(`<span class="heat lv${h.level}">${flameSvg(h.level)}<span><b>${esc(h.name)}</b><small>인덕션 ${esc(h.ind)} · ${esc(h.gas)}</small></span></span>`);
      if (i < p.levels.length - 1) parts.push(`<span class="heat-arrow" aria-hidden="true">→</span>`);
    });
    p.apps.forEach(a => parts.push(appBadge(a)));
    if (!parts.length && p.raw) parts.push(`<span class="heat app"><b>${esc(p.raw)}</b><small>이 단계의 불</small></span>`);
    return `<div class="heats">${parts.join("")}</div>`;
  }

  function board() {
    return `<rect x="8" y="28" width="204" height="86" rx="10" fill="#f6ead8" stroke="#e0cbb0"/>`;
  }
  function dim(x1, y1, x2, y2, text) {
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#245c78" stroke-width="1.2"/>
      <text x="${(x1 + x2) / 2}" y="${y1 - 3}" text-anchor="middle" font-size="11" font-weight="700" fill="#245c78">${esc(text)}</text>`;
  }
  const CUTS = [
    {
      name: "채썰기",
      size: "길이 5cm · 두께 0.3cm",
      finger: "두께는 성냥개비. 길이는 검지 두 마디(약 4cm)에서 세 마디(약 6cm). 굵은 채는 두께만 0.7–1cm(새끼손가락 굵기)로 늘려요.",
      use: "양파, 당근, 파프리카, 파채",
      svg: () => `<svg class="cutsvg" viewBox="0 0 220 130" role="img" aria-label="채썰기. 길이 5센티미터, 두께 0.3센티미터">${board()}
        ${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${28 + i * 14}" y="48" width="6" height="52" rx="2" fill="${i % 2 ? "#e07a3d" : "#f4a261"}"/>`).join("")}
        ${dim(28, 42, 118, 42, "5cm")}<text x="150" y="78" font-size="11" fill="#6f655c">두께 0.3cm</text></svg>`
    },
    {
      name: "깍둑썰기",
      size: "한 변 1.5cm",
      finger: "한 변은 검지 한마디의 4분의 3 정도(약 1.5cm). 2cm라고 적힌 레시피는 엄지 한마디예요.",
      use: "감자, 당근, 닭가슴살, 두부",
      svg: () => `<svg class="cutsvg" viewBox="0 0 220 130" role="img" aria-label="깍둑썰기. 한 변 1.5센티미터">${board()}
        ${[0, 1, 2].map(r => [0, 1, 2].map(c => `<g transform="translate(${40 + c * 36} ${46 + r * 22})"><rect x="6" y="6" width="22" height="16" fill="#f4a261"/><rect x="6" y="6" width="22" height="5" fill="#e07a3d"/><rect x="6" y="6" width="5" height="16" fill="#c96a32"/></g>`).join("")).join("")}
        ${dim(46, 40, 82, 40, "1.5cm")}</svg>`
    },
    {
      name: "다지기",
      size: "알갱이 0.2–0.3cm",
      finger: "칼등으로 다져 알이 거의 안 보여야 해요. 0.5cm가 보이면 아직 다진 게 아니에요.",
      use: "마늘, 생강, 양파(함박·미트볼), 고기 소보로",
      svg: () => `<svg class="cutsvg" viewBox="0 0 220 130" role="img" aria-label="다지기. 알갱이 0.2에서 0.3센티미터">${board()}
        ${Array.from({ length: 42 }, (_, i) => {
          const x = 36 + (i % 14) * 11 + (i % 3);
          const y = 48 + Math.floor(i / 14) * 14;
          return `<rect x="${x}" y="${y}" width="4" height="4" rx="1" fill="${i % 2 ? "#f4e2c4" : "#e7d3b0"}"/>`;
        }).join("")}
        <text x="110" y="112" text-anchor="middle" font-size="11" fill="#245c78" font-weight="700">0.2–0.3cm</text></svg>`
    },
    {
      name: "어슷썰기",
      size: "두께 0.5cm · 빗면 길이 4–5cm",
      finger: "칼을 45도로 눕혀요. 두께는 새끼손가락 반 정도.",
      use: "대파, 고추, 어묵",
      svg: () => `<svg class="cutsvg" viewBox="0 0 220 130" role="img" aria-label="어슷썰기. 두께 0.5센티미터">${board()}
        ${[0, 1, 2, 3].map(i => `<ellipse cx="${48 + i * 28}" cy="74" rx="16" ry="8" transform="rotate(-28 ${48 + i * 28} 74)" fill="${i % 2 ? "#3d8b4a" : "#f7f1e4"}" stroke="#2f6d3a"/>`).join("")}
        <text x="110" y="112" text-anchor="middle" font-size="11" fill="#245c78" font-weight="700">두께 0.5cm · 각도 약 45도</text></svg>`
    },
    {
      name: "반달썰기",
      size: "두께 0.5cm",
      finger: "둥근 채소를 반으로 가른 뒤 0.5cm 두께. 검지 손톱 두께보다 조금 두꺼워요.",
      use: "무, 오이, 당근",
      svg: () => `<svg class="cutsvg" viewBox="0 0 220 130" role="img" aria-label="반달썰기. 두께 0.5센티미터">${board()}
        ${[0, 1, 2, 3, 4].map(i => `<path d="M${30 + i * 34} 92 A16 16 0 0 1 ${62 + i * 34} 92 Z" fill="${i % 2 ? "#f4a261" : "#f7f3ea"}" stroke="#c96a32"/>`).join("")}
        <text x="110" y="114" text-anchor="middle" font-size="11" fill="#245c78" font-weight="700">두께 0.5cm</text></svg>`
    },
    {
      name: "송송썰기",
      size: "두께 0.3cm 고리",
      finger: "파를 세운 채 잘게. 고리 두께는 성냥개비와 같아요.",
      use: "대파 초록, 쪽파, 실파",
      svg: () => `<svg class="cutsvg" viewBox="0 0 220 130" role="img" aria-label="송송썰기. 두께 0.3센티미터">${board()}
        ${[0, 1, 2, 3, 4, 5, 6].map(i => `<ellipse cx="${36 + i * 24}" cy="72" rx="8" ry="8" fill="none" stroke="#3d8b4a" stroke-width="4"/>`).join("")}
        <text x="110" y="112" text-anchor="middle" font-size="11" fill="#245c78" font-weight="700">고리 두께 0.3cm</text></svg>`
    },
    {
      name: "편썰기",
      size: "두께 0.3cm · 넓은 면",
      finger: "도마에 붙여 얇고 넓게. 불고기용은 0.2cm, 레시피에 0.5cm·1.5cm라고 적혀 있으면 그 두께가 우선이에요.",
      use: "고기, 양파, 표고, 당근",
      svg: () => `<svg class="cutsvg" viewBox="0 0 220 130" role="img" aria-label="편썰기. 두께 0.3센티미터">${board()}
        ${[0, 1, 2, 3].map(i => `<ellipse cx="${46 + i * 40}" cy="${70 - i * 4}" rx="28" ry="10" fill="#e7b7a8" stroke="#c4897c"/>`).join("")}
        <text x="110" y="114" text-anchor="middle" font-size="11" fill="#245c78" font-weight="700">두께 0.3cm</text></svg>`
    },
    {
      name: "나박썰기",
      size: "1cm × 1cm × 두께 0.2cm",
      finger: "정사각형에 가깝게 얇게. 두께는 동전보다 얇아요.",
      use: "무, 오이, 당근 (국·냉채)",
      svg: () => `<svg class="cutsvg" viewBox="0 0 220 130" role="img" aria-label="나박썰기. 1센티미터 정사각, 두께 0.2센티미터">${board()}
        ${[0, 1, 2].map(r => [0, 1, 2, 3].map(c => `<rect x="${36 + c * 40}" y="${48 + r * 18}" width="28" height="12" rx="2" fill="${(r + c) % 2 ? "#f7f3ea" : "#f4a261"}" stroke="#e0cbb0"/>`).join("")).join("")}
        <text x="110" y="116" text-anchor="middle" font-size="11" fill="#245c78" font-weight="700">1cm × 1cm · 두께 0.2cm</text></svg>`
    },
    {
      name: "한입크기",
      size: "한 변 2–3cm",
      finger: "한 번에 들어가는 크기. 엄지두 마디(약 2.5cm)를 기준으로 봐요.",
      use: "삼겹, 닭가슴 덩이, 김치, 감자",
      svg: () => `<svg class="cutsvg" viewBox="0 0 220 130" role="img" aria-label="한입크기. 한 변 2에서 3센티미터">${board()}
        <path d="M40 78 l22 -20 26 8 8 22 -24 12 z" fill="#e7b7a8" stroke="#c4897c"/>
        <path d="M108 70 l30 -8 18 24 -10 18 -28 4 z" fill="#f4a261" stroke="#c96a32"/>
        <path d="M78 96 l16 8 20 -6 4 14 -22 8 z" fill="#c96a32"/>
        ${dim(40, 46, 96, 46, "2.5cm")}</svg>`
    },
    {
      name: "쐐기썰기",
      size: "두께 1cm 부채꼴",
      finger: "감자를 8–12쪽으로. 가장 두꺼운 곳이 약 1cm.",
      use: "감자, 토마토",
      svg: () => `<svg class="cutsvg" viewBox="0 0 220 130" role="img" aria-label="쐐기썰기. 두께 1센티미터">${board()}
        ${[0, 1, 2, 3, 4].map(i => `<path d="M${30 + i * 36} 96 L${48 + i * 36} 52 L${66 + i * 36} 96 Z" fill="${i % 2 ? "#f4a261" : "#e07a3d"}"/>`).join("")}
        <text x="110" y="116" text-anchor="middle" font-size="11" fill="#245c78" font-weight="700">두꺼운 곳 1cm</text></svg>`
    }
  ];
  function cutByName(name) { return CUTS.find(c => c.name === name) || null; }
  function cutFigure(name) {
    const c = cutByName(name);
    if (!c) return "";
    return `<a class="cutfig" href="#/cuts/${encodeURIComponent(c.name)}">${c.svg()}<span><b>${esc(c.name)}</b><small>${esc(c.size)}</small></span></a>`;
  }

  const PATCH = {
    "kimchi-samgyeop-jjageuli": { serves: 3, stepCuts: [[], [], [], [], ["채썰기", "어슷썰기"], []], ings: {
      "삼겹살": { q: 500, u: "g", cut: "한입크기" }, "김치": { q: 400, u: "g", cut: "한입크기" },
      "양파": { q: 0.5, u: "개", cut: "채썰기" }, "파": { q: 1, u: "대", cut: "어슷썰기" },
      "다진 마늘": { q: 15, u: "g" }, "고춧가루": { q: 16, u: "g" }, "간장": { q: 30, u: "ml" },
      "맛술": { q: 30, u: "ml" }, "설탕": { q: 12, u: "g" }, "물": { q: 400, u: "ml" }, "소금": { q: 1.3, u: "g" }
    }},
    "ganjang-samgyeop-jorim": { serves: 3, stepCuts: [[], [], ["채썰기", "어슷썰기"], [], []], ings: {
      "삼겹살": { q: 500, u: "g", cut: "한입크기" }, "양파": { q: 0.5, u: "개", cut: "채썰기" },
      "파": { q: 1, u: "대", cut: "어슷썰기" }, "다진 마늘": { q: 15, u: "g" }, "간장": { q: 60, u: "ml" },
      "맛술": { q: 45, u: "ml" }, "설탕": { q: 12, u: "g" }, "올리고당": { q: 18, u: "g" },
      "물": { q: 150, u: "ml" }, "후추": { q: 0.2, u: "g" }, "밥": { q: 210, u: "g", per: 1 }, "계란": { q: 2, u: "개", per: 1 }
    }},
    "dak-ganjang-jangjorim": { serves: 4, stepCuts: [["깍둑썰기"], [], [], []], ings: {
      "닭가슴살": { q: 600, u: "g", cut: "깍둑썰기" }, "다진 마늘": { q: 15, u: "g" }, "간장": { q: 60, u: "ml" },
      "맛술": { q: 45, u: "ml" }, "설탕": { q: 12, u: "g" }, "올리고당": { q: 18, u: "g" },
      "파": { q: 0.5, u: "대", cut: "어슷썰기" }, "후추": { q: 0.3, u: "g" }, "물": { q: 200, u: "ml" }
    }},
    "dak-kimchi-jjim": { serves: 4, stepCuts: [[], [], [], [], ["어슷썰기"]], ings: {
      "닭가슴살": { q: 600, u: "g", cut: "편썰기" }, "김치": { q: 400, u: "g", cut: "한입크기" },
      "양파": { q: 0.5, u: "개", cut: "채썰기" }, "파": { q: 0.5, u: "대", cut: "어슷썰기" },
      "다진 마늘": { q: 15, u: "g" }, "고춧가루": { q: 8, u: "g" }, "간장": { q: 15, u: "ml" },
      "맛술": { q: 15, u: "ml" }, "설탕": { q: 4, u: "g" }, "소금": { q: 1.3, u: "g" }, "후추": { q: 0.3, u: "g" },
      "물": { q: 150, u: "ml" }, "식용유": { q: 5, u: "ml" }
    }},
    "jeyuk-bokkeum": { serves: 2, stepCuts: [["편썰기"], [], [], ["채썰기"], ["어슷썰기"]], ings: {
      "돼지 앞다리살": { q: 400, u: "g", cut: "편썰기" }, "양파": { q: 0.5, u: "개", cut: "채썰기" },
      "파": { q: 0.5, u: "대", cut: "어슷썰기" }, "고추장": { q: 27, u: "g" }, "다진 마늘": { q: 15, u: "g" },
      "고춧가루": { q: 8, u: "g" }, "간장": { q: 15, u: "ml" }, "설탕": { q: 12, u: "g" },
      "올리고당": { q: 9, u: "g" }, "맛술": { q: 15, u: "ml" }, "후추": { q: 0.3, u: "g" }, "식용유": { q: 15, u: "ml" }
    }},
    "chamchi-kimchi-jjigae": { serves: 2, stepCuts: [[], [], [], ["깍둑썰기"]], ings: {
      "참치캔": { q: 2, u: "캔" }, "김치": { q: 250, u: "g", cut: "한입크기" }, "두부": { q: 200, u: "g", cut: "깍둑썰기" },
      "양파": { q: 0.25, u: "개" }, "파": { q: 0.5, u: "대", cut: "송송썰기" }, "다진 마늘": { q: 8, u: "g" },
      "고춧가루": { q: 8, u: "g" }, "간장": { q: 5, u: "ml" }, "물": { q: 400, u: "ml" }
    }},
    "godeungeo-mu-jorim": { serves: 2, stepCuts: [[], ["반달썰기"], [], [], ["어슷썰기"]], ings: {
      "고등어": { q: 300, u: "g" }, "무": { q: 200, u: "g", cut: "반달썰기" }, "양파": { q: 0.5, u: "개", cut: "편썰기" },
      "파": { q: 0.5, u: "대", cut: "어슷썰기" }, "다진 마늘": { q: 15, u: "g" }, "고춧가루": { q: 12, u: "g" },
      "간장": { q: 30, u: "ml" }, "맛술": { q: 30, u: "ml" }, "설탕": { q: 4, u: "g" }, "소금": { q: 2, u: "g" },
      "물": { q: 300, u: "ml" }, "생강": { q: 5, u: "g" }
    }},
    "gyeran-kimchi-bokkeumbap": { serves: 1, stepCuts: [[], ["깍둑썰기"], [], [], ["송송썰기"]], ings: {
      "밥": { q: 210, u: "g" }, "김치": { q: 100, u: "g", cut: "깍둑썰기" }, "계란": { q: 3, u: "개" },
      "다진 마늘": { q: 5, u: "g" }, "고춧가루": { q: 3, u: "g" }, "간장": { q: 5, u: "ml" },
      "파": { q: 10, u: "g", cut: "송송썰기" }, "식용유": { q: 8, u: "ml" }, "참기름": { q: 5, u: "ml" }, "멸치볶음": { q: 20, u: "g" }
    }},
    "hwangtae-gyeran-guk": { serves: 1, stepCuts: [[], [], [], ["송송썰기"]], ings: {
      "황태채볶음": { q: 15, u: "g" }, "계란": { q: 2, u: "개" }, "파": { q: 10, u: "g", cut: "송송썰기" },
      "다진 마늘": { q: 3, u: "g" }, "물": { q: 400, u: "ml" }, "소금": { q: 1.3, u: "g" }
    }},
    "chili-dak": { serves: 6, stepCuts: [["한입크기"], [], [], [], []], ings: {
      "닭가슴살": { q: 1000, u: "g", cut: "한입크기" }, "맛술": { q: 60, u: "ml" }, "소금": { q: 2.5, u: "g" },
      "후추": { q: 0.3, u: "g" }, "칠리소스": { q: 108, u: "g" }, "케찹": { q: 30, u: "g" },
      "고춧가루": { q: 16, u: "g" }, "간장": { q: 30, u: "ml" }, "올리고당": { q: 36, u: "g" }, "다진 마늘": { q: 23, u: "g" }
    }},
    "ketchup-dak-gui": { serves: 2, stepCuts: [["편썰기"], [], [], []], ings: {
      "닭가슴살": { q: 400, u: "g", cut: "편썰기" }, "케찹": { q: 45, u: "g" }, "간장": { q: 15, u: "ml" },
      "올리고당": { q: 18, u: "g" }, "다진 마늘": { q: 15, u: "g" }, "소금": { q: 1.3, u: "g" },
      "후추": { q: 0.3, u: "g" }, "식용유": { q: 5, u: "ml" }
    }},
    "donkatsu-dak-steak": { serves: 1, ings: {
      "닭가슴살": { q: 200, u: "g", cut: "편썰기" }, "돈까스 소스": { q: 36, u: "g" }, "케찹": { q: 15, u: "g" },
      "다진 마늘": { q: 5, u: "g" }, "맛술": { q: 5, u: "ml" }, "소금": { q: 1.3, u: "g" },
      "후추": { q: 0.3, u: "g" }, "식용유": { q: 5, u: "ml" }, "물": { q: 30, u: "ml" }
    }},
    "hambak-steak": { serves: 2, stepCuts: [["다지기"], ["다지기"], [], [], []], ings: {
      "다진 소고기": { q: 300, u: "g" }, "양파": { q: 80, u: "g", cut: "다지기" }, "계란": { q: 1, u: "개" },
      "빵가루": { q: 15, u: "g" }, "소금": { q: 2.5, u: "g" }, "후추": { q: 0.3, u: "g" },
      "식용유": { q: 15, u: "ml" }, "케찹": { q: 30, u: "g" }, "돈까스 소스": { q: 36, u: "g" },
      "설탕": { q: 4, u: "g" }, "물": { q: 60, u: "ml" }
    }},
    "tomato-tuna-pasta": { serves: 1, stepCuts: [[], [], ["다지기"], [], []], ings: {
      "스파게티면": { q: 90, u: "g" }, "참치캔": { q: 1, u: "캔" }, "토마토": { q: 150, u: "g", cut: "한입크기" },
      "양파": { q: 50, u: "g", cut: "다지기" }, "다진 마늘": { q: 15, u: "g" }, "케찹": { q: 15, u: "g" },
      "식용유": { q: 15, u: "ml" }, "소금": { q: 6, u: "g" }, "후추": { q: 0.3, u: "g" }, "물": { q: 1050, u: "ml" }
    }},
    "oven-dakdari": { serves: 2, ings: {
      "닭다리살": { q: 400, u: "g" }, "다진 마늘": { q: 15, u: "g" }, "식용유": { q: 15, u: "ml" },
      "소금": { q: 2.5, u: "g" }, "후추": { q: 0.3, u: "g" }, "양파": { q: 0.25, u: "개", cut: "쐐기썰기" }
    }},
    "tomato-meatball": { serves: 3, stepCuts: [["다지기"], [], [], []], ings: {
      "다진 소고기": { q: 400, u: "g" }, "양파": { q: 80, u: "g", cut: "다지기" }, "다진 마늘": { q: 15, u: "g" },
      "계란": { q: 1, u: "개" }, "빵가루": { q: 20, u: "g" }, "토마토": { q: 2, u: "개", cut: "한입크기" },
      "케찹": { q: 30, u: "g" }, "간장": { q: 15, u: "ml" }, "설탕": { q: 4, u: "g" }, "소금": { q: 2.5, u: "g" },
      "후추": { q: 0.3, u: "g" }, "식용유": { q: 15, u: "ml" }, "물": { q: 150, u: "ml" }
    }},
    "oven-gamja-dak": { serves: 2, stepCuts: [[], ["쐐기썰기"], [], []], ings: {
      "닭가슴살": { q: 300, u: "g" }, "감자": { q: 300, u: "g", cut: "쐐기썰기" }, "양파": { q: 80, u: "g", cut: "쐐기썰기" },
      "다진 마늘": { q: 15, u: "g" }, "식용유": { q: 15, u: "ml" }, "소금": { q: 2.5, u: "g" },
      "후추": { q: 0.3, u: "g" }, "케찹": { q: 15, u: "g" }
    }},
    "teriyaki-dak": { serves: 6, stepCuts: [["한입크기"], [], [], [], []], ings: {
      "닭가슴살": { q: 1000, u: "g", cut: "한입크기" }, "맛술": { q: 60, u: "ml" }, "소금": { q: 2.5, u: "g" },
      "후추": { q: 0.3, u: "g" }, "간장": { q: 90, u: "ml" }, "올리고당": { q: 72, u: "g" },
      "설탕": { q: 12, u: "g" }, "굴소스": { q: 18, u: "g" }, "다진 마늘": { q: 23, u: "g" }, "물": { q: 90, u: "ml" }
    }},
    "oyakodon": { serves: 2, stepCuts: [[], ["편썰기"], [], ["송송썰기"]], ings: {
      "닭가슴살": { q: 250, u: "g", cut: "한입크기" }, "양파": { q: 0.5, u: "개", cut: "편썰기" },
      "계란": { q: 3, u: "개" }, "밥": { q: 420, u: "g" }, "간장": { q: 45, u: "ml" }, "맛술": { q: 45, u: "ml" },
      "설탕": { q: 12, u: "g" }, "다진 마늘": { q: 5, u: "g" }, "파": { q: 10, u: "g", cut: "송송썰기" }, "물": { q: 200, u: "ml" }
    }},
    "gyudon": { serves: 2, stepCuts: [[], ["편썰기"], ["편썰기"], []], ings: {
      "소고기": { q: 250, u: "g", cut: "편썰기" }, "양파": { q: 150, u: "g", cut: "편썰기" }, "밥": { q: 420, u: "g" },
      "간장": { q: 45, u: "ml" }, "맛술": { q: 45, u: "ml" }, "설탕": { q: 12, u: "g" }, "올리고당": { q: 18, u: "g" },
      "다진 마늘": { q: 15, u: "g" }, "물": { q: 100, u: "ml" }, "계란 노른자 또는 온천란": { q: 1, u: "개", key: "계란" }
    }},
    "shogayaki": { serves: 2, stepCuts: [["편썰기", "다지기"], ["편썰기"], ["송송썰기"]], ings: {
      "돼지 앞다리살": { q: 360, u: "g", cut: "편썰기" }, "생강": { q: 15, u: "g", cut: "다지기" },
      "간장": { q: 38, u: "ml" }, "맛술": { q: 30, u: "ml" }, "설탕": { q: 12, u: "g" }, "다진 마늘": { q: 5, u: "g" },
      "파": { q: 10, u: "g", cut: "송송썰기" }, "식용유": { q: 5, u: "ml" }
    }},
    "karaage": { serves: 2, stepCuts: [["한입크기"], [], [], []], ings: {
      "닭다리살": { q: 400, u: "g", cut: "한입크기" }, "감자전분": { q: 45, u: "g" }, "간장": { q: 23, u: "ml" },
      "맛술": { q: 15, u: "ml" }, "다진 마늘": { q: 15, u: "g" }, "생강": { q: 5, u: "g" },
      "후추": { q: 0.3, u: "g" }, "식용유": { q: 15, u: "ml" }
    }},
    "chicken-katsu": { serves: 2, ings: {
      "닭가슴살": { q: 300, u: "g" }, "밀가루": { q: 24, u: "g" }, "계란": { q: 1, u: "개" }, "빵가루": { q: 40, u: "g" },
      "식용유": { q: 22, u: "ml" }, "돈까스 소스": { q: 36, u: "g" }, "소금": { q: 1.3, u: "g" }, "후추": { q: 0.3, u: "g" }
    }},
    "soboro-don": { serves: 2, stepCuts: [["다지기"], [], [], ["송송썰기"]], ings: {
      "닭가슴살": { q: 300, u: "g", cut: "다지기" }, "계란": { q: 2, u: "개" }, "밥": { q: 420, u: "g" },
      "간장": { q: 30, u: "ml" }, "맛술": { q: 30, u: "ml" }, "설탕": { q: 12, u: "g" },
      "다진 마늘": { q: 5, u: "g" }, "파": { q: 10, u: "g", cut: "송송썰기" }
    }},
    "tamagoyaki": { serves: 1, ings: {
      "계란": { q: 4, u: "개" }, "맛술": { q: 5, u: "ml" }, "설탕": { q: 2, u: "g" }, "소금": { q: 1.3, u: "g" },
      "식용유": { q: 5, u: "ml" }, "파": { q: 10, u: "g", cut: "송송썰기" }
    }},
    "mapo-tofu": { serves: 2, stepCuts: [["깍둑썰기"], [], [], [], ["송송썰기"]], ings: {
      "두부": { q: 1, u: "모", cut: "깍둑썰기" }, "돼지 다짐육": { q: 100, u: "g" }, "두반장": { q: 18, u: "g" },
      "다진 마늘": { q: 15, u: "g" }, "고춧가루": { q: 8, u: "g" }, "간장": { q: 15, u: "ml" },
      "굴소스": { q: 6, u: "g" }, "파": { q: 0.5, u: "대", cut: "송송썰기" }, "설탕": { q: 2, u: "g" },
      "전분": { q: 3, u: "g" }, "식용유": { q: 15, u: "ml" }, "물": { q: 150, u: "ml" }
    }},
    "tomato-egg": { serves: 2, stepCuts: [["깍둑썰기"], [], [], ["쐐기썰기"], ["송송썰기"]], ings: {
      "닭가슴살": { q: 200, u: "g", cut: "깍둑썰기" }, "계란": { q: 4, u: "개" }, "토마토": { q: 300, u: "g", cut: "쐐기썰기" },
      "다진 마늘": { q: 5, u: "g" }, "설탕": { q: 8, u: "g" }, "케찹": { q: 15, u: "g" },
      "맛술": { q: 5, u: "ml" }, "소금": { q: 1.3, u: "g" }, "식용유": { q: 15, u: "ml" }, "파": { q: 10, u: "g", cut: "송송썰기" }
    }},
    "kungpao": { serves: 2, stepCuts: [["깍둑썰기"], [], [], ["어슷썰기"], []], ings: {
      "닭가슴살": { q: 300, u: "g", cut: "깍둑썰기" }, "땅콩": { q: 30, u: "g" }, "건고추": { q: 6, u: "개" },
      "파": { q: 30, u: "g", cut: "어슷썰기" }, "다진 마늘": { q: 15, u: "g" }, "간장": { q: 23, u: "ml" },
      "맛술": { q: 15, u: "ml" }, "올리고당": { q: 18, u: "g" }, "식초": { q: 15, u: "ml" },
      "전분": { q: 9, u: "g" }, "식용유": { q: 15, u: "ml" }, "후추": { q: 0.3, u: "g" }, "물": { q: 30, u: "ml" }
    }},
    "pepper-japchae": { serves: 2, stepCuts: [[], ["편썰기"], [], ["채썰기"], []], ings: {
      "돼지 앞다리살": { q: 250, u: "g", cut: "편썰기" }, "파프리카": { q: 150, u: "g", cut: "채썰기" },
      "양파": { q: 0.5, u: "개", cut: "채썰기" }, "당근": { q: 50, u: "g", cut: "채썰기" },
      "표고버섯": { q: 2, u: "개", cut: "편썰기" }, "당면": { q: 40, u: "g" }, "간장": { q: 30, u: "ml" },
      "굴소스": { q: 18, u: "g" }, "맛술": { q: 15, u: "ml" }, "설탕": { q: 4, u: "g" }, "다진 마늘": { q: 15, u: "g" },
      "전분": { q: 3, u: "g" }, "후추": { q: 0.3, u: "g" }, "식용유": { q: 20, u: "g" }, "물": { q: 500, u: "ml" }
    }},
    "yuringi": { serves: 2, stepCuts: [[], [], [], [], ["채썰기"]], ings: {
      "닭가슴살": { q: 300, u: "g", cut: "편썰기" }, "전분": { q: 18, u: "g" }, "계란 흰자": { q: 1, u: "개" },
      "간장": { q: 45, u: "ml" }, "맛술": { q: 15, u: "ml" }, "식초": { q: 30, u: "ml" }, "설탕": { q: 12, u: "g" },
      "다진 마늘": { q: 15, u: "g" }, "고춧가루": { q: 3, u: "g" }, "참기름": { q: 5, u: "ml" },
      "파": { q: 30, u: "g", cut: "채썰기" }, "후추": { q: 0.3, u: "g" }, "식용유": { q: 15, u: "ml" }, "물": { q: 45, u: "ml" }
    }},
    "buchu-pork": { serves: 2, stepCuts: [["편썰기"], [], []], ings: {
      "돼지 앞다리살": { q: 250, u: "g", cut: "편썰기" }, "부추": { q: 150, u: "g" }, "다진 마늘": { q: 15, u: "g" },
      "간장": { q: 23, u: "ml" }, "굴소스": { q: 18, u: "g" }, "맛술": { q: 15, u: "ml" },
      "고춧가루": { q: 3, u: "g" }, "후추": { q: 0.3, u: "g" }, "식용유": { q: 15, u: "ml" }
    }},
    "egg-fried-rice": { serves: 1, stepCuts: [["다지기"], [], ["다지기"], [], ["송송썰기"]], ings: {
      "밥": { q: 210, u: "g" }, "계란": { q: 2, u: "개" }, "닭가슴살": { q: 80, u: "g", cut: "다지기" },
      "당근": { q: 20, u: "g", cut: "다지기" }, "파": { q: 20, u: "g", cut: "송송썰기" }, "다진 마늘": { q: 5, u: "g" },
      "간장": { q: 5, u: "ml" }, "굴소스": { q: 6, u: "g" }, "식용유": { q: 15, u: "ml" }, "후추": { q: 0.3, u: "g" }
    }},
    "tangsuyuk": { serves: 2, stepCuts: [["깍둑썰기"], [], [], [], []], ings: {
      "돼지 안심": { q: 250, u: "g", cut: "깍둑썰기" }, "전분": { q: 45, u: "g" }, "계란": { q: 1, u: "개" },
      "맛술": { q: 5, u: "ml" }, "소금": { q: 1.3, u: "g" }, "후추": { q: 0.3, u: "g" }, "식용유": { q: 15, u: "ml" },
      "설탕": { q: 36, u: "g" }, "식초": { q: 30, u: "ml" }, "간장": { q: 15, u: "ml" }, "케찹": { q: 30, u: "g" }, "물": { q: 150, u: "ml" }
    }},
    "jjamppong-ramyeon": { serves: 1, stepCuts: [["편썰기"], [], ["채썰기"], ["송송썰기"]], ings: {
      "라면": { q: 1, u: "봉" }, "닭가슴살": { q: 120, u: "g", cut: "편썰기" }, "김치": { q: 80, u: "g" },
      "양파": { q: 50, u: "g", cut: "채썰기" }, "파": { q: 10, u: "g", cut: "송송썰기" }, "다진 마늘": { q: 15, u: "g" },
      "고춧가루": { q: 8, u: "g" }, "간장": { q: 5, u: "ml" }, "식용유": { q: 5, u: "ml" }, "물": { q: 500, u: "ml" }
    }}
  };

  function hydrate(list) {
    (list || []).forEach(r => {
      const p = PATCH[r.id];
      if (p) {
        r.serves = p.serves;
        (r.ingredients || []).forEach(ing => {
          const x = p.ings[ing.key];
          if (!x) return;
          if (ing.qty == null) ing.qty = x.q;
          if (!ing.unit) ing.unit = x.u;
          if (x.cut && !ing.cut) ing.cut = x.cut;
          if (x.per) ing.perServing = true;
          if (x.key) ing.key = x.key;
        });
        (p.stepCuts || []).forEach((cuts, i) => {
          if (cuts && cuts.length && r.steps[i] && !r.steps[i].cuts) r.steps[i].cuts = cuts;
        });
      }
      if (!r.serves) {
        const m = String(r.servings || "").match(/(\d+)/);
        r.serves = m ? Number(m[1]) : 1;
      }
    });
  }

  function defaultUnit(name) { return DEFAULT_UNIT[name] || "g"; }
  function isPantry(name) { return PANTRY.has(name); }

  const UNITS = ["g", "ml", "개", "대", "쪽", "모", "캔", "봉", "공기", "토막", "장", "줌", "송이", "통", "포기", "큰술", "작은술"];

  root.RecipeKit = {
    HEAT, HEAT_ORDER, CUTS, PANTRY, PIECE, UNITS, PATCH,
    esc, pretty, normUnit, household, convertQty, asG, asMl, pieceOf, defaultUnit, isPantry,
    flameSvg, heatSceneSvg, heatBadges, parseHeat, cutByName, cutFigure, hydrate
  };
})(globalThis);
