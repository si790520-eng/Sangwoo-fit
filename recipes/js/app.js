(function () {
  const FRIDGE_KEY = "recipes.fridge.v1";
  const CUSTOM_KEY = "recipes.custom.v1";
  const INTRO_KEY = "recipes.intro.v1";
  const MEASURE_KEY = "recipes.measure.v1";
  const UNDO_KEY = "recipes.cookUndo.v1";
  const Kit = globalThis.RecipeKit;
  const CATS = ["한식", "양식", "중식", "일식", "고단백·밀프렙"];
  const FCATS = ["양념", "채소", "고기·단백질", "기타"];
  const SEED = [
    ["간장", "양념"], ["설탕", "양념"], ["스테비아", "양념"], ["올리고당", "양념"],
    ["소금", "양념"], ["후추", "양념"], ["맛술", "양념"], ["다진 마늘", "양념"],
    ["케찹", "양념"], ["칠리소스", "양념"], ["돈까스 소스", "양념"], ["굴소스", "양념"],
    ["고춧가루", "양념"],
    ["양파", "채소"], ["파", "채소"], ["김치", "채소"],
    ["계란", "고기·단백질"], ["닭가슴살", "고기·단백질"], ["삼겹살", "고기·단백질"],
    ["멸치볶음", "기타"], ["황태채볶음", "기타"], ["라면", "기타"]
  ];
  const ALIAS = {
    "다진 마늘": ["마늘다진", "다진마늘"],
    "케찹": ["케첩", "토마토케첩", "토마토케찹"],
    "파": ["대파", "쪽파", "실파"],
    "김치": ["배추김치"],
    "계란": ["달걀"],
    "맛술": ["미림"],
    "밥": ["쌀밥", "찬밥", "흰쌀밥", "즉석밥", "공기밥"],
    "고춧가루": ["고추가루"],
    "돈까스 소스": ["돈가스소스", "돈까스소스"],
    "삼겹살": ["삼겹", "돼지삼겹살"],
    "닭가슴살": ["닭가슴"],
    "후추": ["후춧가루", "검은후추"],
    "설탕": ["백설탕"],
    "식용유": ["포도씨유", "카놀라유", "올리브유"],
    "굴소스": ["굴소스"],
    "칠리소스": ["스위트칠리"],
    "라면": ["봉지라면"],
    "멸치볶음": ["잔멸치볶음"],
    "황태채볶음": ["황태볶음"],
    "참치캔": ["참치", "동원참치"],
    "계란 흰자": ["흰자", "난백", "계란", "달걀"],
    "돼지 앞다리살": ["앞다리", "앞다리살", "제육용"],
    "돼지 다짐육": ["다진돼지", "돼지다짐"],
    "다진 소고기": ["소고기다짐", "다진소고기"],
    "소고기": ["우둔", "설도", "수입우둔", "수입설도"],
    "닭다리살": ["닭다리", "봉", "뼈없는닭다리"],
    "스파게티면": ["파스타", "스파게티"],
    "감자전분": ["감자전분", "전분"],
    "전분": ["감자전분", "옥수수전분"],
    "두부": ["부침두부", "찌개두부"],
    "돼지 안심": ["안심", "돼지고기안심"],
    "새우": ["냉동새우", "생새우", "칵테일새우"],
    "오징어": ["냉동오징어", "오징어채"],
    "동태": ["동태포", "명태", "코다리"],
    "현미밥": ["현미밥"],
    "오트밀": ["귀리", "롤드오트", "압착귀리"],
    "카레가루": ["카레분"],
    "춘장": ["짜장소스"],
    "브로콜리": ["냉동브로콜리"],
    "숙주": ["숙주나물"],
    "시금치": ["시금치나물"],
    "파프리카": ["피망"],
    "당근": ["홍당무"],
    "무": ["무우"],
    "표고버섯": ["표고", "생표고"],
    "팽이버섯": ["팽이"],
    "청양고추": ["청양"],
    "건고추": ["마른고추"],
    "소면": ["소면사리"],
    "우동면": ["우동사리", "생우동", "우동"],
    "김": ["김밥김", "도시락김"],
    "닭안심": ["닭안심살"],
    "현미": ["현미쌀"],
    "마늘": ["통마늘"],
    "식초": ["양조식초", "사과식초"],
    "참기름": ["참기름"],
    "고추장": ["고추장"],
    "된장": ["재래된장"],
    "두반장": ["두반장"]
  };

  if (Kit) Kit.hydrate(globalThis.RECIPES || []);

  const view = document.getElementById("view");
  const titleEl = document.getElementById("title");
  const backBtn = document.getElementById("back");
  const toastEl = document.getElementById("toast");
  let toastT = 0;
  let cat = sessionStorage.getItem("recipes.cat") || "한식";
  if (!CATS.includes(cat)) cat = "한식";
  let q = "";
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferredPrompt = e; });

  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const uid = () => Math.random().toString(36).slice(2, 10);
  const norm = s => String(s || "").trim().toLowerCase().replace(/\s+/g, "");
  const pretty = n => Kit ? Kit.pretty(n) : String(n);

  function parseLegacy(q, u) {
    const unit0 = Kit.normUnit(u);
    if (typeof q === "number" && isFinite(q)) return { qty: q, unit: unit0, legacy: "" };
    const s = String(q ?? "").trim();
    if (!s) return { qty: null, unit: unit0, legacy: "" };
    const m = s.match(/^(-?\d+(?:[.,]\d+)?)\s*(.*)$/);
    if (!m) return { qty: null, unit: unit0, legacy: s };
    const qty = parseFloat(m[1].replace(",", "."));
    const extra = (m[2] || "").trim();
    const extraUnit = Kit.normUnit(extra);
    const unit = unit0 || (extraUnit !== extra ? extraUnit : "");
    const legacy = extra && unit0 ? s : "";
    return { qty, unit, legacy };
  }
  function migrateItem(item) {
    if (!item || typeof item !== "object") return item;
    if (item.v === 2 && (item.track === "amount" || item.track === "toggle")) return item;
    const name = String(item.name || "").trim();
    const parsed = parseLegacy(item.qty, item.unit);
    const pantry = Kit.isPantry(name);
    const noNumber = parsed.qty == null && !String(item.unit || "").trim() && !parsed.legacy;
    const track = pantry && noNumber ? "toggle" : "amount";
    const unit = parsed.unit || Kit.defaultUnit(name);
    return {
      id: item.id || uid(),
      name,
      cat: item.cat || "기타",
      v: 2,
      track,
      qty: track === "toggle" ? null : parsed.qty,
      unit,
      present: true,
      depleted: track === "amount" && parsed.qty === 0,
      legacyQty: parsed.legacy || ""
    };
  }
  function loadFridge() {
    const raw = localStorage.getItem(FRIDGE_KEY);
    if (raw == null) {
      const seeded = SEED.map(([name, c]) => migrateItem({ id: uid(), name, qty: "", unit: "", cat: c }));
      localStorage.setItem(FRIDGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    let data = [];
    try { const d = JSON.parse(raw); data = Array.isArray(d) ? d : []; }
    catch { data = []; }
    let changed = false;
    const list = data.map(item => {
      const next = migrateItem(item);
      if (next !== item) changed = true;
      return next;
    }).filter(item => item && item.name);
    if (changed) saveFridge(list);
    return list;
  }
  function saveFridge(list) { localStorage.setItem(FRIDGE_KEY, JSON.stringify(list)); }
  function loadCustom() {
    try { const d = JSON.parse(localStorage.getItem(CUSTOM_KEY) || "[]"); return Array.isArray(d) ? d : []; }
    catch { return []; }
  }
  function saveCustom(list) { localStorage.setItem(CUSTOM_KEY, JSON.stringify(list)); }
  function loadUndo() {
    try { return JSON.parse(localStorage.getItem(UNDO_KEY) || "null"); }
    catch { return null; }
  }
  function saveUndo(snap) { localStorage.setItem(UNDO_KEY, JSON.stringify(snap)); }
  function clearUndo() { localStorage.removeItem(UNDO_KEY); }
  function allRecipes() { return [...(globalThis.RECIPES || []), ...loadCustom()]; }
  function findRecipe(id) { return allRecipes().find(r => r.id === id); }
  function measureMode() { return localStorage.getItem(MEASURE_KEY) === "spoon" ? "spoon" : "life"; }

  function namesMatch(fridgeName, key) {
    const a = norm(fridgeName);
    const b = norm(key);
    if (!a || !b) return false;
    if (a === b) return true;
    const aliases = ALIAS[key] || [];
    if (aliases.some(x => norm(x) === a)) return true;
    for (const [canon, list] of Object.entries(ALIAS)) {
      if (norm(canon) === b && list.some(x => norm(x) === a)) return true;
    }
    return false;
  }
  function itemAvailable(item) {
    if (!item || item.depleted) return false;
    if (item.track === "toggle") return item.present !== false;
    if (typeof item.qty === "number" && item.qty <= 0) return false;
    return true;
  }
  function findItem(fridge, ing) {
    const key = ing.key || ing.name;
    return fridge.find(item => namesMatch(item.name, key) || namesMatch(item.name, ing.name)) || null;
  }
  function hasIng(fridge, ing) {
    const item = findItem(fridge, ing);
    return itemAvailable(item);
  }
  function tally(recipe, fridge) {
    const ings = recipe.ingredients || [];
    const mains = ings.filter(i => i.main && !i.water);
    const required = ings.filter(i => !i.water && !i.optional);
    const ownedMain = mains.filter(i => hasIng(fridge, i)).length;
    const missing = required.filter(i => !hasIng(fridge, i));
    const ratio = mains.length ? ownedMain / mains.length : (required.length ? (required.length - missing.length) / required.length : 1);
    return { mains, ownedMain, missing, ratio };
  }
  function ranked() {
    const fridge = loadFridge();
    return allRecipes().map(r => ({ r, ...tally(r, fridge) })).sort((a, b) =>
      a.missing.length - b.missing.length || b.ratio - a.ratio || b.ownedMain - a.ownedMain || a.r.title.localeCompare(b.r.title, "ko")
    );
  }
  function recipeServes(r) {
    const n = Number(r.serves);
    if (n > 0) return n;
    const m = String(r.servings || "").match(/(\d+)/);
    return m ? Number(m[1]) : 1;
  }
  function needQty(ing, selected, serves) {
    if (ing.qty == null || !isFinite(Number(ing.qty))) return null;
    const q = Number(ing.qty);
    return ing.perServing ? q * selected : q * (selected / serves);
  }
  function buildLines(recipe, fridge, selected) {
    const serves = recipeServes(recipe);
    return (recipe.ingredients || []).map((ing, index) => {
      const key = ing.key || ing.name;
      const need = needQty(ing, selected, serves);
      const item = findItem(fridge, ing);
      const base = { index, ing, key, name: ing.name, optional: !!ing.optional, need, needUnit: ing.unit, item };
      if (ing.water) return { ...base, kind: "water" };
      if (need == null) return { ...base, kind: "norecipe" };
      if (!item) return { ...base, kind: "missing" };
      if (item.track === "toggle") return { ...base, kind: item.present === false ? "toggle-missing" : "toggle" };
      if (item.qty == null || item.qty === "") return { ...base, kind: "noqty" };
      const take = Kit.convertQty(key, need, ing.unit, item.unit);
      if (take == null || !isFinite(take)) return { ...base, kind: "unit" };
      let next = Math.round((Number(item.qty) - take) * 100) / 100;
      if ((item.unit === "g" || item.unit === "ml") && next > 0 && next < 0.05 && take >= 1) next = 0;
      if (next < -0.001) return { ...base, kind: "short", take, next: 0, short: Math.round((take - Number(item.qty)) * 100) / 100 };
      return { ...base, kind: "ok", take, next: Math.max(0, next) };
    });
  }
  function lineText(line) {
    const need = line.need == null ? "" : `${pretty(line.need)}${line.needUnit || ""}`;
    const item = line.item;
    if (line.kind === "water") return `${need} · 수돗물 · 냉장고에서 빼지 않아요`;
    if (line.kind === "norecipe") return "레시피에 수량 숫자가 없어 자동으로 빼지 않아요";
    if (line.kind === "missing") return `${need} 필요 · 냉장고에 없음`;
    if (line.kind === "toggle") return "양념 · 있음 · 있음/없음으로 관리해서 수량은 안 줄여요";
    if (line.kind === "toggle-missing") return "양념 · 없음 · 수량은 안 줄여요";
    if (line.kind === "noqty") return `${need} 필요 · 냉장고에 이름은 있는데 수량이 비어 있어요. 이번엔 숫자를 빼지 않아요`;
    if (line.kind === "unit") return `${need} 필요 · 냉장고 단위(${item.unit || "없음"})와 맞춰 환산할 수 없어요`;
    const have = `${pretty(item.qty)}${item.unit}`;
    const take = `${pretty(line.take)}${item.unit}`;
    const left = `${pretty(line.next)}${item.unit}`;
    if (line.kind === "short") return `${need} 필요 · ${take}만큼 빼면 가진 ${have}보다 ${pretty(line.short)}${item.unit} 부족해요. 0으로 맞추고 다 떨어짐으로 남겨요`;
    const same = line.needUnit === item.unit;
    const tail = line.next <= 0 ? " · 다 떨어짐" : "";
    return `${same ? need : need + " → " + take} 차감 · ${have} → ${left}${tail}`;
  }

  function toast(msg, action) {
    toastEl.innerHTML = "";
    const span = document.createElement("span");
    span.textContent = msg;
    toastEl.appendChild(span);
    if (action) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = action.label;
      b.onclick = () => { toastEl.hidden = true; action.fn(); };
      toastEl.appendChild(b);
    }
    toastEl.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(() => { toastEl.hidden = true; }, action ? 8000 : 2200);
  }
  function setTitle(t) { titleEl.textContent = t; }
  function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }
  function tabOn(name) {
    document.querySelectorAll(".nav button").forEach(b => b.classList.toggle("on", b.dataset.tab === name));
  }
  function macroBox(r) {
    return `<div class="macros">
      <div class="macro"><span>칼로리 추정치</span><b>${esc(r.kcal)}</b></div>
      <div class="macro"><span>단백질 추정치</span><b>${esc(r.protein)}</b></div>
    </div>`;
  }
  function card(r, extra) {
    const own = r.own ? `<span class="chip own">평소 메뉴</span>` : "";
    const custom = r.custom ? `<span class="chip info">내가 추가</span>` : "";
    return `<button class="card recipe" type="button" data-id="${esc(r.id)}">
      <div class="kicker"><span class="chip">${esc(r.cat)}</span>${own}${custom}</div>
      <h2>${esc(r.title)}</h2>
      <p class="meta">${esc(r.servings)} · ${esc(r.time)}</p>
      <p class="meta">${esc(r.basis)} · ${esc(r.kcal)} · 단백질 ${esc(r.protein)} <i class="est">추정치</i></p>
      ${extra || ""}
    </button>`;
  }
  function segHtml() {
    const mode = measureMode();
    return `<div class="seg" role="group" aria-label="계량 표시">
      <button type="button" data-mode="spoon" class="${mode === "spoon" ? "on" : ""}">계량스푼·컵</button>
      <button type="button" data-mode="life" class="${mode === "life" ? "on" : ""}">생활 도구</button>
    </div>`;
  }
  function bindSeg(repaint) {
    view.querySelectorAll("[data-mode]").forEach(b => b.onclick = () => {
      localStorage.setItem(MEASURE_KEY, b.dataset.mode);
      repaint();
    });
  }
  function cutsOf(recipe) {
    const names = [];
    (recipe.ingredients || []).forEach(i => { if (i.cut && !names.includes(i.cut)) names.push(i.cut); });
    (recipe.steps || []).forEach(s => (s.cuts || []).forEach(c => { if (!names.includes(c)) names.push(c); }));
    return names;
  }

  function listHtml(items, fridge) {
    if (!items.length) return `<div class="empty"><p>이 분류에서 찾는 요리가 없어요.</p><p class="note">다른 분류 탭을 눌러 보세요.</p></div>`;
    return items.map(r => {
      const t = tally(r, fridge);
      const miss = t.missing.slice(0, 3).map(i => i.name).join(", ");
      const more = t.missing.length > 3 ? ` 외 ${t.missing.length - 3}` : "";
      const line = t.missing.length
        ? `<p class="miss-line">없는 재료 ${t.missing.length} · ${esc(miss)}${esc(more)}</p>`
        : `<p class="miss-line" style="color:var(--good)">재료가 냉장고에 있어요</p>`;
      const main = t.mains.length ? `<p class="meta">주요 재료 ${t.ownedMain}/${t.mains.length}</p>` : "";
      return card(r, main + line);
    }).join("");
  }
  function filteredRecipes() {
    const ql = norm(q.trim());
    let items = allRecipes().filter(r => r.cat === cat);
    if (!ql) return items;
    return items.filter(r => norm([r.title, r.blurb, (r.keywords || []).join(" "), (r.ingredients || []).map(i => i.name + (i.amount || "")).join(" "), (r.steps || []).map(s => s.text).join(" ")].join(" ")).includes(ql));
  }
  function bindCards(root) {
    (root || view).querySelectorAll("[data-id]").forEach(b => b.onclick = () => go("#/r/" + b.dataset.id));
  }
  function listView() {
    setTitle("레시피");
    backBtn.hidden = true;
    tabOn("list");
    const fridge = loadFridge();
    const counts = Object.fromEntries(CATS.map(c => [c, allRecipes().filter(r => r.cat === c).length]));
    const intro = localStorage.getItem(INTRO_KEY) ? "" : `<div class="card" id="intro">
      <p style="margin:0 0 8px"><b>상우님 퇴근 후 집밥</b></p>
      <p class="note" style="margin:0 0 10px">27세 · 벌크 한 끼는 밥 포함 대략 600–800kcal, 단백질 35–50g을 봐요. 하루는 2,400–2,500kcal, 단백질 140–160g. 우유·버터·치즈는 레시피에 넣지 않았어요. 요리 완료를 누르면 냉장고 수량이 줄어요. 칼로리·단백질은 추정치예요.</p>
      <button class="btn" type="button" id="hideIntro">안내 닫기</button>
    </div>`;
    view.innerHTML = `
      <input class="search" id="q" placeholder="${esc(cat)}에서 검색" value="${esc(q)}" enterkeyhint="search" autocomplete="off">
      <div class="tabs" role="tablist">${CATS.map(c => `<button class="tab${c === cat ? " on" : ""}" type="button" data-cat="${esc(c)}" role="tab" aria-selected="${c === cat}">${esc(c)}<small>${counts[c]}</small></button>`).join("")}</div>
      ${intro}
      <div id="results">${listHtml(filteredRecipes(), fridge)}</div>
      <button class="btn block" type="button" id="addBtn" style="margin-top:6px">+ 내 레시피 추가</button>
      <p class="note" style="text-align:center;margin-top:12px">기록은 이 폰에만 저장돼요. 가이드에서 썰기·불·계량을 볼 수 있어요.</p>`;
    const box = $("#q");
    let composing = false;
    box.addEventListener("compositionstart", () => { composing = true; });
    box.addEventListener("compositionend", () => { composing = false; q = box.value; $("#results").innerHTML = listHtml(filteredRecipes(), loadFridge()); bindCards($("#results")); });
    box.addEventListener("input", () => { if (composing) return; q = box.value; $("#results").innerHTML = listHtml(filteredRecipes(), loadFridge()); bindCards($("#results")); });
    view.querySelectorAll("[data-cat]").forEach(b => b.onclick = () => { cat = b.dataset.cat; sessionStorage.setItem("recipes.cat", cat); listView(); });
    bindCards($("#results"));
    $("#addBtn").onclick = () => go("#/new");
    const hide = $("#hideIntro");
    if (hide) hide.onclick = () => { localStorage.setItem(INTRO_KEY, "1"); listView(); };
  }

  function detailView(id) {
    const r = findRecipe(id);
    if (!r) { go("#/"); return; }
    setTitle(r.title);
    backBtn.hidden = false;
    tabOn("");
    const fridge = loadFridge();
    const t = tally(r, fridge);
    const mode = measureMode();
    const ings = (r.ingredients || []).map(i => {
      const home = i.qty != null ? `<div class="home">${esc(Kit.household(i, mode))}</div>` : "";
      const cut = i.cut ? `<a class="chip info" href="#/cuts/${encodeURIComponent(i.cut)}">${esc(i.cut)}</a>` : "";
      if (i.water) return `<div class="ing"><span class="dot"></span><div><div class="nm">${esc(i.name)} <span class="chip">물 · 비교 안 함</span> ${cut}</div><div class="amt">${esc(i.amount)}</div>${home}${i.note ? `<div class="sub">${esc(i.note)}</div>` : ""}</div></div>`;
      const owned = hasIng(fridge, i);
      const cls = i.optional ? "opt" : owned ? "have" : "lack";
      const tag = i.optional ? (owned ? "선택 · 있음" : "선택 · 없음") : owned ? "있음" : "없음";
      const chip = owned ? "good" : i.optional ? "info" : "miss";
      return `<div class="ing"><span class="dot ${cls}"></span><div><div class="nm">${esc(i.name)} <span class="chip ${chip}">${tag}</span>${i.main ? ` <span class="chip">주요</span>` : ""} ${cut}</div><div class="amt">${esc(i.amount)}</div>${home}${i.note ? `<div class="sub">${esc(i.note)}</div>` : ""}</div></div>`;
    }).join("");
    const cuts = cutsOf(r);
    const strip = cuts.length ? `<h3 class="section">이 요리의 썰기</h3><div class="cut-strip">${cuts.map(name => Kit.cutFigure(name)).join("")}</div>` : "";
    const steps = (r.steps || []).map((s, i) => `<div class="step"><div class="num">${i + 1}</div><div>
      ${Kit.heatBadges(s.heat)}
      <div class="pills"><span class="pill time">${esc(s.time)}</span></div>
      <div>${esc(s.text)}</div>
      ${(s.cuts || []).map(name => Kit.cutFigure(name)).join("")}
    </div></div>`).join("");
    const st = r.storage || {};
    view.innerHTML = `
      <div class="kicker"><span class="chip">${esc(r.cat)}</span>${r.own ? `<span class="chip own">평소 메뉴</span>` : ""}${r.custom ? `<span class="chip info">내가 추가</span>` : ""}</div>
      <p class="meta" style="margin:0 0 8px">${esc(r.blurb || "")}</p>
      <p class="meta">인분 ${esc(r.servings)} · ${esc(r.time)} · 기준 ${esc(r.basis)}</p>
      ${macroBox(r)}
      ${segHtml()}
      <p class="note">계량스푼 1큰술 = 15ml. 밥숟가락 1개 = 10–12ml. 둘은 같은 숟가락이 아니에요.</p>
      ${r.riceNote ? `<p class="note" style="margin:8px 0 0">${esc(r.riceNote)}</p>` : ""}
      ${t.missing.length ? `<p class="miss-line">없는 재료: ${esc(t.missing.map(i => i.name).join(", "))}</p>` : `<p class="miss-line" style="color:var(--good)">냉장고 재료로 바로 만들 수 있어요</p>`}
      ${r.budget ? `<p class="note">${esc(r.budget)}</p>` : ""}
      ${r.tools ? `<p class="note">도구 · ${esc(r.tools.join(" · "))}</p>` : ""}
      ${strip}
      <h3 class="section">재료</h3>
      <div class="card" style="padding-top:4px;padding-bottom:4px">${ings}</div>
      <button class="btn primary block" type="button" id="cookBtn">요리 완료 · 냉장고에서 빼기</button>
      <h3 class="section">단계별 조리법</h3>
      ${steps}
      <h3 class="section">보관법</h3>
      <div class="store">
        <div><b>냉장</b>${esc(st.fridge || "—")}</div>
        <div><b>냉동</b>${esc(st.freezer || "—")}</div>
        <div><b>데우기</b>${esc(st.reheat || "—")}</div>
      </div>
      ${r.tip ? `<h3 class="section">메모</h3><div class="tip">${esc(r.tip)}</div>` : ""}
      ${r.custom ? `<div class="row" style="margin-top:14px"><button class="btn" type="button" id="edit">수정</button><button class="danger" type="button" id="del">삭제</button></div>` : ""}
      <p class="note" style="margin-top:14px">칼로리·단백질 숫자는 추정치예요. 기름을 얼마나 남기는지, 국물을 남기는지에 따라 달라요.</p>`;
    bindSeg(() => detailView(id));
    $("#cookBtn").onclick = () => openCook(r);
    if (r.custom) {
      $("#edit").onclick = () => go("#/edit/" + r.id);
      $("#del").onclick = () => {
        if ($("#del").dataset.armed !== "1") {
          $("#del").dataset.armed = "1";
          $("#del").textContent = "한 번 더 누르면 삭제";
          return;
        }
        saveCustom(loadCustom().filter(x => x.id !== r.id));
        toast("지웠어요");
        go("#/");
      };
    }
  }

  function openCook(recipe) {
    const serves = recipeServes(recipe);
    let selected = serves;
    const skip = new Set();
    let ready = false;
    const sheet = document.createElement("div");
    sheet.className = "sheet";
    document.body.appendChild(sheet);
    const close = () => sheet.remove();
    const paint = () => {
      const fridge = loadFridge();
      const lines = buildLines(recipe, fridge, selected);
      if (!ready) {
        lines.forEach(line => {
          if (line.kind === "water" || line.kind === "toggle" || line.kind === "toggle-missing") skip.add(line.index);
          if (line.optional && (line.kind === "missing" || line.kind === "noqty" || line.kind === "norecipe")) skip.add(line.index);
        });
        ready = true;
      }
      sheet.innerHTML = `<div class="panel cook-panel" role="dialog" aria-modal="true" aria-labelledby="cookTitle">
        <h2 id="cookTitle" class="page-h">냉장고에서 빼기</h2>
        <p class="note" style="margin-top:0">${esc(recipe.title)} · 레시피 전체는 ${serves}인분. 만든 인분만큼 재료를 나눠 빼요.</p>
        <div class="stepper">
          <button type="button" id="svMinus" aria-label="인분 줄이기">−</button>
          <b>${selected}인분 만듦</b>
          <button type="button" id="svPlus" aria-label="인분 늘리기">+</button>
        </div>
        <div class="deduct-list" style="margin-top:8px">
          ${lines.map(line => {
            const on = !skip.has(line.index);
            const can = line.kind === "ok" || line.kind === "short";
            return `<label class="deduct"><input type="checkbox" data-i="${line.index}" ${on ? "checked" : ""}><div><div class="nm">${esc(line.name)}${line.optional ? " · 선택" : ""}</div><p class="note">${esc(lineText(line))}</p>${on && !can ? `<p class="note">체크해도 숫자가 줄지 않아요.</p>` : ""}</div></label>`;
          }).join("")}
        </div>
        <div class="sheet-actions">
          <button class="btn primary block" type="button" id="cookYes">이대로 빼기</button>
          <button class="btn block" type="button" id="cookNo">취소</button>
        </div>
      </div>`;
      sheet.onclick = e => { if (e.target === sheet) close(); };
      $("#svMinus", sheet).onclick = () => { selected = Math.max(1, selected - 1); paint(); };
      $("#svPlus", sheet).onclick = () => { selected = Math.min(serves * 2, selected + 1); paint(); };
      sheet.querySelectorAll("[data-i]").forEach(box => box.onchange = () => {
        const i = Number(box.dataset.i);
        if (box.checked) skip.delete(i); else skip.add(i);
        paint();
      });
      $("#cookNo", sheet).onclick = close;
      $("#cookYes", sheet).onclick = () => {
        const fresh = loadFridge();
        const linesNow = buildLines(recipe, fresh, selected);
        const before = JSON.parse(JSON.stringify(fresh));
        let n = 0;
        linesNow.forEach(line => {
          if (skip.has(line.index)) return;
          if (line.kind !== "ok" && line.kind !== "short") return;
          const item = fresh.find(x => x.id === line.item.id);
          if (!item) return;
          item.qty = line.next;
          item.depleted = line.next <= 0;
          if (item.depleted) item.qty = 0;
          n++;
        });
        if (!n) { toast("숫자를 뺀 재료가 없어요. 수량이나 단위를 확인해 주세요"); return; }
        saveFridge(fresh);
        saveUndo({ at: Date.now(), title: recipe.title, servings: selected, fridge: before });
        close();
        toast(`${recipe.title} ${selected}인분만큼 뺐어요`, { label: "실행 취소", fn: undoCook });
        if ((location.hash || "").startsWith("#/r/")) detailView(recipe.id);
      };
    };
    paint();
  }
  function undoCook() {
    const snap = loadUndo();
    if (!snap || !Array.isArray(snap.fridge)) { toast("되돌릴 요리가 없어요"); return; }
    saveFridge(snap.fridge);
    clearUndo();
    toast("냉장고를 요리 전으로 돌려놨어요");
    route();
  }

  function nowView() {
    setTitle("지금 만들기");
    backBtn.hidden = true;
    tabOn("now");
    const rows = ranked();
    const ready = rows.filter(x => x.missing.length === 0).length;
    view.innerHTML = `
      <div class="card"><p style="margin:0"><b>지금 만들 수 있는 요리</b></p>
        <p class="note" style="margin:6px 0 0">수량이 0이거나 다 떨어짐, 양념이 없음이면 없는 재료로 봐요. 수량을 아직 안 적은 재료는 있는 것으로 봐요. 물은 세지 않아요. 바로 가능한 요리가 ${ready}개예요.</p></div>
      ${rows.map(x => {
        const miss = x.missing.length ? `<p class="miss-line">없는 재료 · ${esc(x.missing.map(i => i.name).join(", "))}</p>` : `<p class="miss-line" style="color:var(--good)">없는 재료 없음</p>`;
        const main = `<p class="meta">주요 재료 ${x.ownedMain}/${x.mains.length || 0}</p>`;
        return card(x.r, main + miss);
      }).join("")}`;
    view.querySelectorAll("[data-id]").forEach(b => b.onclick = () => go("#/r/" + b.dataset.id));
  }

  function qtyLabel(item) {
    if (item.track === "toggle") return item.present === false ? "없음" : "있음";
    if (item.depleted || item.qty === 0) return "다 떨어짐";
    if (item.qty == null || item.qty === "") return item.legacyQty ? `이전 기록 ${item.legacyQty}` : "수량 미입력";
    return `${pretty(item.qty)}${item.unit || ""}`;
  }
  function fridgeView() {
    setTitle("내 냉장고");
    backBtn.hidden = true;
    tabOn("fridge");
    const list = loadFridge();
    const undo = loadUndo();
    const groups = FCATS.map(c => {
      const items = list.filter(i => i.cat === c);
      if (!items.length) return "";
      const ordered = items.slice().sort((a, b) => Number(!!a.depleted || a.qty === 0 || a.present === false) - Number(!!b.depleted || b.qty === 0 || b.present === false));
      return `<h3 class="group-h">${esc(c)}</h3>` + ordered.map(i => `<button class="card fr-item${i.depleted || i.qty === 0 ? " depleted" : ""}" type="button" data-fid="${esc(i.id)}"><span><b>${esc(i.name)}</b>${i.track === "toggle" ? `<span class="chip">양념</span>` : ""}</span><span class="qty">${esc(qtyLabel(i))}</span></button>`).join("");
    }).join("");
    const units = Kit.UNITS.map(u => `<option>${esc(u)}</option>`).join("");
    view.innerHTML = `
      ${undo ? `<div class="card"><p style="margin:0 0 8px"><b>마지막 요리 완료</b></p><p class="note" style="margin:0 0 8px">${esc(undo.title)} ${esc(undo.servings)}인분을 빼기 전으로 돌려요. 그 뒤에 고친 수량도 같이 돌아가요.</p><button class="btn block" type="button" id="undoBtn">실행 취소</button></div>` : ""}
      <div class="card"><p style="margin:0 0 8px"><b>재료 추가</b></p>
        <form id="addF">
          <div class="field"><label for="fn">이름</label><input id="fn" name="name" required placeholder="예: 닭가슴살" maxlength="40"></div>
          <div class="row">
            <div class="field"><label for="fq">수량</label><input id="fq" name="qty" inputmode="decimal" placeholder="예: 500"></div>
            <div class="field"><label for="fu">단위</label><select id="fu" name="unit">${units}</select></div>
          </div>
          <label class="check"><input type="checkbox" name="toggle" id="ft"> 양념이라 있음/없음만 기록</label>
          <div class="field"><label for="fc">분류</label><select id="fc" name="cat">${FCATS.map(c => `<option>${esc(c)}</option>`).join("")}</select></div>
          <button class="btn primary block" type="submit">냉장고에 넣기</button>
        </form>
      </div>
      <div class="tip" style="margin-bottom:12px">간장·설탕 같은 양념은 있음/없음만 두거나, g·ml로 적으면 요리 완료 때 빠져요. 수량을 비워 두면 있는 것으로만 보고 숫자는 빼지 않아요. 0이 되면 다 떨어짐으로 남아요.</div>
      ${groups || `<div class="empty">냉장고가 비었어요.</div>`}
      <button class="btn block" type="button" id="clearEmpty" style="margin-top:8px">다 떨어진 항목 치우기</button>
      <button class="btn block" type="button" id="reseed" style="margin-top:8px">기본 재료 다시 채우기</button>
      <p class="note" style="text-align:center">없는 이름만 추가해요. 지금 수량은 그대로예요.</p>`;
    const nameBox = $("#fn");
    nameBox.addEventListener("change", () => { if (Kit.isPantry(nameBox.value.trim())) $("#ft").checked = true; });
    $("#addF").onsubmit = e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const name = String(fd.get("name") || "").trim();
      if (!name) return;
      const cur = loadFridge();
      if (cur.some(i => norm(i.name) === norm(name))) { toast("이미 있어요"); return; }
      const toggle = fd.get("toggle") === "on" || $("#ft").checked;
      const qtyRaw = String(fd.get("qty") || "").trim();
      const qty = qtyRaw === "" ? null : Number(qtyRaw.replace(",", "."));
      cur.push({
        id: uid(), name, cat: fd.get("cat") || "기타", v: 2,
        track: toggle ? "toggle" : "amount",
        qty: toggle ? null : (Number.isFinite(qty) ? qty : null),
        unit: fd.get("unit") || Kit.defaultUnit(name),
        present: true,
        depleted: !toggle && qty === 0,
        legacyQty: ""
      });
      saveFridge(cur);
      toast("넣었어요");
      fridgeView();
    };
    view.querySelectorAll("[data-fid]").forEach(b => b.onclick = () => openFridgeSheet(b.dataset.fid));
    const undoBtn = $("#undoBtn");
    if (undoBtn) undoBtn.onclick = undoCook;
    $("#clearEmpty").onclick = () => {
      const next = loadFridge().filter(i => !(i.depleted || i.qty === 0));
      const removed = loadFridge().length - next.length;
      saveFridge(next);
      toast(removed ? `${removed}개를 치웠어요` : "다 떨어진 항목이 없어요");
      fridgeView();
    };
    $("#reseed").onclick = () => {
      const cur = loadFridge();
      let n = 0;
      for (const [name, c] of SEED) {
        if (!cur.some(i => norm(i.name) === norm(name))) {
          cur.push(migrateItem({ id: uid(), name, qty: "", unit: "", cat: c }));
          n++;
        }
      }
      saveFridge(cur);
      toast(n ? `${n}개를 채웠어요` : "기본 재료가 이미 있어요");
      fridgeView();
    };
  }

  function openFridgeSheet(id) {
    const list = loadFridge();
    const item = list.find(i => i.id === id);
    if (!item) return;
    const units = Kit.UNITS.map(u => `<option${u === item.unit ? " selected" : ""}>${esc(u)}</option>`).join("");
    const sheet = document.createElement("div");
    sheet.className = "sheet";
    sheet.innerHTML = `<div class="panel" role="dialog" aria-modal="true">
      <h2 class="page-h">재료 수정</h2>
      <form id="ef">
        <div class="field"><label>이름</label><input name="name" required value="${esc(item.name)}" maxlength="40"></div>
        <label class="check"><input type="checkbox" name="toggle" ${item.track === "toggle" ? "checked" : ""}> 있음/없음만 기록</label>
        <label class="check" id="presentRow"><input type="checkbox" name="present" ${item.present !== false ? "checked" : ""}> 있음</label>
        <div class="row" id="qtyRow">
          <div class="field"><label>수량</label><input name="qty" inputmode="decimal" value="${item.qty == null ? "" : esc(item.qty)}"></div>
          <div class="field"><label>단위</label><select name="unit">${units}</select></div>
        </div>
        ${item.legacyQty ? `<p class="note">예전 기록: ${esc(item.legacyQty)}</p>` : ""}
        <div class="field"><label>분류</label><select name="cat">${FCATS.map(c => `<option${c === item.cat ? " selected" : ""}>${esc(c)}</option>`).join("")}</select></div>
        <button class="btn primary block" type="submit">저장</button>
      </form>
      <button class="danger block" type="button" id="rm" style="margin-top:8px">냉장고에서 빼기</button>
      <button class="btn block" type="button" id="close" style="margin-top:8px">닫기</button>
    </div>`;
    document.body.appendChild(sheet);
    const close = () => sheet.remove();
    const sync = () => {
      const toggle = sheet.querySelector('[name="toggle"]').checked;
      $("#qtyRow", sheet).style.display = toggle ? "none" : "flex";
      $("#presentRow", sheet).style.display = toggle ? "flex" : "none";
    };
    sync();
    sheet.querySelector('[name="toggle"]').onchange = sync;
    sheet.addEventListener("click", e => { if (e.target === sheet) close(); });
    $("#close", sheet).onclick = close;
    $("#ef", sheet).onsubmit = e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const toggle = fd.get("toggle") === "on";
      const qtyRaw = String(fd.get("qty") || "").trim();
      const qty = qtyRaw === "" ? null : Number(qtyRaw.replace(",", "."));
      item.name = String(fd.get("name") || "").trim() || item.name;
      item.cat = fd.get("cat") || item.cat;
      item.v = 2;
      item.track = toggle ? "toggle" : "amount";
      item.unit = fd.get("unit") || item.unit;
      if (toggle) {
        item.present = fd.get("present") === "on";
        item.depleted = false;
      } else {
        item.qty = Number.isFinite(qty) ? qty : null;
        item.present = true;
        item.depleted = item.qty === 0;
      }
      saveFridge(list);
      close();
      toast("고쳤어요");
      fridgeView();
    };
    $("#rm", sheet).onclick = () => {
      saveFridge(loadFridge().filter(i => i.id !== id));
      close();
      toast("뺐어요");
      fridgeView();
    };
  }

  function guideView() {
    setTitle("가이드");
    backBtn.hidden = true;
    tabOn("guide");
    view.innerHTML = `
      <a class="card guide-link" href="#/cuts"><b>기본기 · 썰기</b><p class="note" style="margin:6px 0 0">채썰기, 깍둑, 다지기, 어슷, 반달, 송송, 편, 나박, 한입. cm와 손가락 기준.</p></a>
      <a class="card guide-link" href="#/heat"><b>불 세기</b><p class="note" style="margin:6px 0 0">약불부터 강불. 인덕션 1–9단, 가스 불꽃이 팬에 닿는 높이.</p></a>
      <a class="card guide-link" href="#/measure"><b>계량</b><p class="note" style="margin:6px 0 0">계량스푼 15ml와 밥숟가락 10–12ml, 종이컵, 소주잔.</p></a>
      <div class="card"><b>하루 먹는 양</b><p class="note">벌크 기준 하루 2,400–2,500kcal, 단백질 140–160g. 유제품은 넣지 않아요. 고단백·밀프렙의 브로콜리 닭 도시락 한 개가 단백질 약 50g대예요.</p></div>
      <div class="card"><b>앱으로 설치</b><p class="note">인터넷이 없어도 한 번 연 화면은 다시 열려요. 스토어 앱으로 가기 전의 설치예요.</p>
        <button class="btn block" type="button" id="installBtn">홈 화면에 추가</button>
        <p class="note" id="installHelp" hidden>아이폰은 사파리 공유 → 홈 화면에 추가. 안드로이드는 크롬 메뉴 → 앱 설치 또는 홈 화면에 추가.</p>
      </div>`;
    $("#installBtn").onclick = async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt = null;
        return;
      }
      $("#installHelp").hidden = false;
    };
  }
  function cutsView() {
    setTitle("기본기");
    backBtn.hidden = false;
    tabOn("guide");
    view.innerHTML = `<p class="note">레시피의 두께가 여기 표준과 다르면, 레시피에 적힌 cm가 우선이에요. 그림은 이 앱에서 직접 그렸어요.</p>` +
      Kit.CUTS.map(c => `<a class="card guide-link cutcard" href="#/cuts/${encodeURIComponent(c.name)}">${c.svg()}<b>${esc(c.name)}</b><p class="note" style="margin:4px 0 0">${esc(c.size)}</p></a>`).join("");
  }
  function cutDetail(name) {
    const c = Kit.cutByName(name);
    if (!c) { go("#/cuts"); return; }
    setTitle(c.name);
    backBtn.hidden = false;
    tabOn("guide");
    view.innerHTML = `<div class="card cutcard">${c.svg()}
      <p><b>${esc(c.size)}</b></p>
      <p>${esc(c.finger)}</p>
      <p class="note">주로 ${esc(c.use)}</p>
    </div>
    <button class="btn block" type="button" id="allCuts">기본기 전체</button>`;
    $("#allCuts").onclick = () => go("#/cuts");
  }
  function heatView() {
    setTitle("불 세기");
    backBtn.hidden = false;
    tabOn("guide");
    const rows = Kit.HEAT_ORDER.map(name => {
      const h = Kit.HEAT[name];
      return `<div class="card">${Kit.heatBadges(name)}<p class="note" style="margin:8px 0 0">15단 인덕션이면 ${esc(h.ind15)}. ${esc(h.gas)}</p></div>`;
    }).join("");
    view.innerHTML = `
      ${Kit.heatSceneSvg()}
      <p class="note">가정용 인덕션 1–9단 기준이에요. 같은 단수라도 제품 화력(W)은 달라요. 물 200ml가 작은 냄비에서 끓기까지 강불은 대략 2–3분, 중불은 대략 4–6분이에요. 냄비와 물 온도에 따라 달라집니다.</p>
      ${rows}
      <div class="card"><b>다른 기구</b>
        <p>에어프라이어는 예열 없이 적힌 온도와 시간, 한 겹. 오븐은 예열을 단계에 적었어요. 팬이 도는 컨벡션이면 온도를 15°C 낮춰요.</p>
        <p>전자레인지는 700W 기준. 1000W면 시간의 약 70%만 돌려요.</p>
        <p>전기밥솥은 취사 한 번. 카레 가루는 취사가 끝난 뒤에 넣어요.</p>
        <p>닭은 자른 속이 하얗고 육즙이 맑을 때, 중심 74°C. 돼지 덩어리는 속이 회색일 때, 약 70°C. 다진 고기는 분홍이 없어야 해요.</p>
      </div>`;
  }
  function measureView() {
    setTitle("계량");
    backBtn.hidden = false;
    tabOn("guide");
    view.innerHTML = `
      ${segHtml()}
      <div class="card"><b>숟가락 두 종류</b>
        ${spoonSvg()}
        <p>계량스푼 1큰술 = 15ml, 1작은술 = 5ml. 밥숟가락 1개 = 10–12ml라서, 같은 ‘한 술’이 아니에요. 간장 30ml는 계량스푼 2큰술이고, 밥숟가락으로는 2.5–3개예요.</p>
      </div>
      <div class="card"><b>컵과 잔</b>
        ${cupSvg()}
        <p>종이컵 1개 = 180ml. 계량컵 1컵 = 200ml. 소주잔 1개 = 50ml. 물 400ml는 종이컵 2개(360ml)에 소주잔 0.8잔(40ml)을 더해요.</p>
      </div>
      <div class="card"><b>손가락·한 줌</b>
        ${fingerSvg()}
        <p>검지 한 마디 ≈ 2cm. 새끼손가락 굵기 ≈ 1cm. 엄지 한 마디 ≈ 2cm. 고기 한 줌(성인 남자 주먹) ≈ 100g. 콩나물·부추 한 줌 ≈ 50g. 김치 한 줌 ≈ 100g.</p>
        <p class="note">저울이 있으면 g이 우선이에요. 숟가락 환산은 어림이고, 간은 레시피의 g·ml을 따라요.</p>
      </div>
      <div class="card"><b>자주 쓰는 1큰술 무게</b>
        <p>계량스푼 15ml 기준 어림. 설탕 12g, 정제소금 15g(굵은소금은 더 가벼움), 간장 18g, 고춧가루 8g, 다진 마늘 15g, 올리고당 18g, 식용유·참기름 13g, 고추장·된장 18g, 케찹 15g.</p>
        <p>특란 1개 껍질 포함 약 60g, 가식부 약 50g. 중간 양파 1개 약 200g. 대파 1대 약 70g. 공기밥 210g. 두부 1모 약 300g.</p>
      </div>`;
    bindSeg(measureView);
  }
  function spoonSvg() {
    return `<svg class="finger" viewBox="0 0 320 120" role="img" aria-label="계량스푼 15밀리리터와 밥숟가락 10에서 12밀리리터">
      <rect width="320" height="120" rx="12" fill="#fffdfb"/>
      <ellipse cx="70" cy="48" rx="28" ry="16" fill="#f4efe8" stroke="#1c1612" stroke-width="2"/>
      <rect x="96" y="44" width="70" height="8" rx="3" fill="#c4b09a"/>
      <text x="70" y="92" text-anchor="middle" font-size="13" font-weight="700" fill="#1c1612">계량스푼 15ml</text>
      <ellipse cx="210" cy="52" rx="22" ry="12" fill="#f4efe8" stroke="#1c1612" stroke-width="2"/>
      <rect x="230" y="48" width="58" height="8" rx="3" fill="#c4b09a"/>
      <text x="220" y="92" text-anchor="middle" font-size="13" font-weight="700" fill="#1c1612">밥숟가락 10–12ml</text>
    </svg>`;
  }
  function cupSvg() {
    return `<svg class="finger" viewBox="0 0 320 130" role="img" aria-label="종이컵 180밀리리터와 소주잔 50밀리리터">
      <rect width="320" height="130" rx="12" fill="#fffdfb"/>
      <path d="M40 30 h70 l-8 70 h-54 z" fill="#f6ead8" stroke="#1c1612" stroke-width="2"/>
      <text x="75" y="118" text-anchor="middle" font-size="13" font-weight="700">종이컵 180ml</text>
      <path d="M150 36 h56 l-6 64 h-44 z" fill="#fff" stroke="#245c78" stroke-width="2"/>
      <text x="178" y="118" text-anchor="middle" font-size="13" font-weight="700">계량컵 200ml</text>
      <path d="M250 58 h36 l-4 42 h-28 z" fill="#e7f2f8" stroke="#245c78" stroke-width="2"/>
      <text x="268" y="118" text-anchor="middle" font-size="13" font-weight="700">소주잔 50ml</text>
    </svg>`;
  }
  function fingerSvg() {
    return `<svg class="finger" viewBox="0 0 320 110" role="img" aria-label="검지 한 마디 약 2센티미터">
      <rect width="320" height="110" rx="12" fill="#fffdfb"/>
      <rect x="40" y="28" width="36" height="48" rx="16" fill="#f0d2c4" stroke="#1c1612" stroke-width="2"/>
      <line x1="86" y1="28" x2="86" y2="76" stroke="#245c78" stroke-width="1.4"/>
      <line x1="86" y1="28" x2="130" y2="28" stroke="#245c78"/>
      <line x1="86" y1="76" x2="130" y2="76" stroke="#245c78"/>
      <text x="136" y="56" font-size="13" font-weight="700" fill="#245c78">약 2cm</text>
      <text x="40" y="98" font-size="12" fill="#6f655c">검지 한 마디</text>
    </svg>`;
  }

  function emptyDraft() {
    return {
      title: "", cat: "한식", blurb: "", servings: "1끼분", serves: 1, basis: "1인분", time: "약 20분",
      kcal: "약 0kcal", protein: "약 0g", riceNote: "", budget: "", tools: "",
      fridge: "", freezer: "", reheat: "", tip: "",
      ingredients: [{ name: "", amount: "", qty: "", unit: "g", note: "", cut: "", main: true, optional: false }],
      steps: [{ heat: "중불", time: "5분", text: "" }]
    };
  }
  function draftFrom(r) {
    return {
      title: r.title || "", cat: CATS.includes(r.cat) ? r.cat : "한식", blurb: r.blurb || "",
      servings: r.servings || "", serves: recipeServes(r), basis: r.basis || "", time: r.time || "",
      kcal: r.kcal || "", protein: r.protein || "", riceNote: r.riceNote || "",
      budget: r.budget || "", tools: (r.tools || []).join(", "),
      fridge: (r.storage && r.storage.fridge) || "", freezer: (r.storage && r.storage.freezer) || "",
      reheat: (r.storage && r.storage.reheat) || "", tip: r.tip || "",
      ingredients: (r.ingredients || []).map(i => ({ name: i.name, amount: i.amount, qty: i.qty ?? "", unit: i.unit || "g", note: i.note || "", cut: i.cut || "", main: !!i.main, optional: !!i.optional, water: !!i.water })),
      steps: (r.steps || []).map(s => ({ heat: s.heat, time: s.time, text: s.text }))
    };
  }
  function formView(existing) {
    setTitle(existing ? "레시피 수정" : "레시피 추가");
    backBtn.hidden = false;
    tabOn("");
    let draft = existing ? draftFrom(existing) : emptyDraft();
    const cuts = [""].concat(Kit.CUTS.map(c => c.name));
    const units = Kit.UNITS;
    const paint = () => {
      view.innerHTML = `<form id="rf">
        <div class="field"><label>이름</label><input name="title" required value="${esc(draft.title)}" maxlength="40"></div>
        <div class="field"><label>분류</label><select name="cat">${CATS.map(c => `<option${c === draft.cat ? " selected" : ""}>${c}</option>`).join("")}</select></div>
        <div class="field"><label>한 줄 설명</label><input name="blurb" value="${esc(draft.blurb)}" maxlength="80"></div>
        <div class="row">
          <div class="field"><label>인분 표시</label><input name="servings" required value="${esc(draft.servings)}"></div>
          <div class="field"><label>인분 숫자</label><input name="serves" required inputmode="numeric" value="${esc(draft.serves)}"></div>
        </div>
        <div class="field"><label>예상 시간</label><input name="time" required value="${esc(draft.time)}"></div>
        <div class="field"><label>영양 기준</label><input name="basis" required value="${esc(draft.basis)}" placeholder="1인분"></div>
        <div class="row">
          <div class="field"><label>칼로리</label><input name="kcal" required value="${esc(draft.kcal)}" placeholder="약 400kcal"></div>
          <div class="field"><label>단백질</label><input name="protein" required value="${esc(draft.protein)}" placeholder="약 30g"></div>
        </div>
        <p class="note">저장하면 화면에 ‘추정치’가 붙어요. 수량과 단위를 적어야 요리 완료 때 냉장고에서 빠져요.</p>
        <div class="field"><label>밥·곁들임 메모 (선택)</label><input name="riceNote" value="${esc(draft.riceNote)}"></div>
        <h3 class="section">재료</h3>
        ${draft.ingredients.map((ing, i) => `<div class="mini-row" data-i="${i}">
          <div class="field"><label>이름</label><input data-k="name" value="${esc(ing.name)}" placeholder="닭가슴살"></div>
          <div class="field"><label>표시 문구</label><input data-k="amount" value="${esc(ing.amount)}" placeholder="200g"></div>
          <div class="row">
            <div class="field"><label>수량</label><input data-k="qty" inputmode="decimal" value="${esc(ing.qty)}" placeholder="200"></div>
            <div class="field"><label>단위</label><select data-k="unit">${units.map(u => `<option${u === ing.unit ? " selected" : ""}>${u}</option>`).join("")}</select></div>
          </div>
          <div class="field"><label>썰기</label><select data-k="cut">${cuts.map(c => `<option value="${esc(c)}"${c === ing.cut ? " selected" : ""}>${c ? esc(c) : "없음"}</option>`).join("")}</select></div>
          <div class="field"><label>메모</label><input data-k="note" value="${esc(ing.note)}" placeholder="두께 1.5cm"></div>
          <label class="check"><input type="checkbox" data-k="main"${ing.main ? " checked" : ""}> 주요 재료</label>
          <label class="check"><input type="checkbox" data-k="optional"${ing.optional ? " checked" : ""}> 없어도 됨</label>
          <label class="check"><input type="checkbox" data-k="water"${ing.water ? " checked" : ""}> 물 (비교에서 빼기)</label>
          <button class="x" type="button" data-rm="${i}">이 재료 빼기</button>
        </div>`).join("")}
        <button class="btn block" type="button" id="addIng">재료 줄 추가</button>
        <h3 class="section">단계</h3>
        ${draft.steps.map((s, i) => `<div class="mini-row" data-s="${i}">
          <div class="row">
            <div class="field"><label>불</label><input data-k="heat" value="${esc(s.heat)}" placeholder="중불" list="heats"></div>
            <div class="field"><label>시간</label><input data-k="time" value="${esc(s.time)}" placeholder="4분"></div>
          </div>
          <div class="field"><label>하는 일</label><textarea data-k="text">${esc(s.text)}</textarea></div>
          <button class="x" type="button" data-rms="${i}">이 단계 빼기</button>
        </div>`).join("")}
        <datalist id="heats">${Kit.HEAT_ORDER.map(h => `<option value="${h}">`).join("")}<option value="불 없음"><option value="불 끄기"><option value="에어프라이어 180°C"><option value="오븐 200°C"><option value="전자레인지"><option value="전기밥솥 취사"></datalist>
        <button class="btn block" type="button" id="addStep">단계 추가</button>
        <h3 class="section">보관</h3>
        <div class="field"><label>냉장</label><input name="fridge" value="${esc(draft.fridge)}" placeholder="냉장 3일"></div>
        <div class="field"><label>냉동</label><input name="freezer" value="${esc(draft.freezer)}"></div>
        <div class="field"><label>데우기</label><input name="reheat" value="${esc(draft.reheat)}" placeholder="전자레인지 2분"></div>
        <div class="field"><label>메모</label><textarea name="tip">${esc(draft.tip)}</textarea></div>
        <button class="btn primary block" type="submit" style="margin-top:8px">저장</button>
      </form>`;
      const read = () => {
        const fd = new FormData($("#rf"));
        draft = {
          ...draft,
          title: fd.get("title"), cat: fd.get("cat"), blurb: fd.get("blurb"),
          servings: fd.get("servings"), serves: fd.get("serves"), time: fd.get("time"), basis: fd.get("basis"),
          kcal: fd.get("kcal"), protein: fd.get("protein"), riceNote: fd.get("riceNote"),
          fridge: fd.get("fridge"), freezer: fd.get("freezer"), reheat: fd.get("reheat"), tip: fd.get("tip"),
          ingredients: [...view.querySelectorAll("[data-i]")].map(box => ({
            name: box.querySelector('[data-k="name"]').value.trim(),
            amount: box.querySelector('[data-k="amount"]').value.trim(),
            qty: box.querySelector('[data-k="qty"]').value.trim(),
            unit: box.querySelector('[data-k="unit"]').value,
            cut: box.querySelector('[data-k="cut"]').value,
            note: box.querySelector('[data-k="note"]').value.trim(),
            main: box.querySelector('[data-k="main"]').checked,
            optional: box.querySelector('[data-k="optional"]').checked,
            water: box.querySelector('[data-k="water"]').checked
          })),
          steps: [...view.querySelectorAll("[data-s]")].map(box => ({
            heat: box.querySelector('[data-k="heat"]').value.trim(),
            time: box.querySelector('[data-k="time"]').value.trim(),
            text: box.querySelector('[data-k="text"]').value.trim()
          }))
        };
      };
      $("#addIng").onclick = () => { read(); draft.ingredients.push({ name: "", amount: "", qty: "", unit: "g", note: "", cut: "", main: false, optional: false }); paint(); };
      $("#addStep").onclick = () => { read(); draft.steps.push({ heat: "중불", time: "", text: "" }); paint(); };
      view.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => { read(); draft.ingredients.splice(Number(b.dataset.rm), 1); if (!draft.ingredients.length) draft.ingredients.push({ name: "", amount: "", qty: "", unit: "g", note: "", cut: "", main: true }); paint(); });
      view.querySelectorAll("[data-rms]").forEach(b => b.onclick = () => { read(); draft.steps.splice(Number(b.dataset.rms), 1); if (!draft.steps.length) draft.steps.push({ heat: "중불", time: "", text: "" }); paint(); });
      $("#rf").onsubmit = e => {
        e.preventDefault();
        read();
        const ingredients = draft.ingredients.filter(i => i.name && (i.amount || i.qty)).map(i => {
          const qty = i.qty === "" ? null : Number(String(i.qty).replace(",", "."));
          const cut = i.cut && i.cut !== "없음" ? i.cut : "";
          return {
            key: i.name, name: i.name, amount: i.amount || `${i.qty}${i.unit}`,
            qty: Number.isFinite(qty) ? qty : null, unit: i.unit, note: i.note, cut,
            main: i.main && !i.water && !i.optional, optional: i.optional, water: i.water
          };
        });
        const steps = draft.steps.filter(s => s.text).map(s => ({ heat: s.heat || "중불", time: s.time || "—", text: s.text }));
        if (!String(draft.title).trim() || !ingredients.length || !steps.length) { toast("이름, 재료, 단계를 적어 주세요"); return; }
        const serves = Math.max(1, Number(draft.serves) || 1);
        const rec = {
          id: existing ? existing.id : "custom-" + uid(),
          custom: true,
          title: String(draft.title).trim(),
          cat: draft.cat,
          servings: String(draft.servings).trim() || `${serves}끼분`,
          serves,
          basis: String(draft.basis).trim() || "1인분",
          time: String(draft.time).trim() || "시간 미정",
          kcal: String(draft.kcal).trim() || "미입력",
          protein: String(draft.protein).trim() || "미입력",
          riceNote: String(draft.riceNote || "").trim(),
          blurb: String(draft.blurb || "").trim(),
          tools: String(draft.tools || "").split(/,|·/).map(s => s.trim()).filter(Boolean),
          ingredients, steps,
          storage: {
            fridge: String(draft.fridge || "").trim() || "적지 않음",
            freezer: String(draft.freezer || "").trim() || "적지 않음",
            reheat: String(draft.reheat || "").trim() || "적지 않음"
          },
          tip: String(draft.tip || "").trim()
        };
        const list = loadCustom().filter(x => x.id !== rec.id);
        list.push(rec);
        saveCustom(list);
        toast("저장했어요");
        go("#/r/" + rec.id);
      };
    };
    paint();
  }

  function route() {
    const h = location.hash || "#/";
    const parts = h.replace(/^#\/?/, "").split("/").filter(Boolean);
    const head = parts[0] || "";
    if (head === "now") return nowView();
    if (head === "fridge") return fridgeView();
    if (head === "guide") return guideView();
    if (head === "cuts") return parts[1] ? cutDetail(decodeURIComponent(parts[1])) : cutsView();
    if (head === "heat") return heatView();
    if (head === "measure") return measureView();
    if (head === "new") return formView(null);
    if (head === "edit" && parts[1]) {
      const r = findRecipe(decodeURIComponent(parts[1]));
      if (!r || !r.custom) { toast("수정은 내가 추가한 레시피만 돼요"); return go("#/"); }
      return formView(r);
    }
    if (head === "r" && parts[1]) return detailView(decodeURIComponent(parts[1]));
    return listView();
  }

  backBtn.onclick = () => { if (history.length > 1) history.back(); else go("#/"); };
  document.querySelectorAll(".nav button").forEach(b => b.onclick = () => go(b.dataset.hash));
  window.addEventListener("hashchange", route);
  route();

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  }
})();
