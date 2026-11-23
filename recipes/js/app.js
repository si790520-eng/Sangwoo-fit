(function () {
  const FRIDGE_KEY = "recipes.fridge.v1";
  const CUSTOM_KEY = "recipes.custom.v1";
  const INTRO_KEY = "recipes.intro.v1";
  const CATS = ["한식", "양식", "중식", "일식"];
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
    "다진 마늘": ["마늘", "다진마늘"],
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
    "소고기": ["우둔", "설도"],
    "닭다리살": ["닭다리", "봉"],
    "스파게티면": ["파스타", "스파게티"],
    "감자전분": ["감자전분", "전분"],
    "전분": ["감자전분", "옥수수전분"],
    "두부": ["부침두부"],
    "돼지 안심": ["안심"]
  };

  const view = document.getElementById("view");
  const titleEl = document.getElementById("title");
  const backBtn = document.getElementById("back");
  const toastEl = document.getElementById("toast");
  let toastT = 0;
  let cat = sessionStorage.getItem("recipes.cat") || "한식";
  let q = "";

  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const uid = () => Math.random().toString(36).slice(2, 10);
  const norm = s => String(s || "").trim().toLowerCase().replace(/\s+/g, "");

  function loadFridge() {
    const raw = localStorage.getItem(FRIDGE_KEY);
    if (raw == null) {
      const seeded = SEED.map(([name, cat]) => ({ id: uid(), name, qty: "", unit: "", cat }));
      localStorage.setItem(FRIDGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    try { const d = JSON.parse(raw); return Array.isArray(d) ? d : []; }
    catch { return []; }
  }
  function saveFridge(list) { localStorage.setItem(FRIDGE_KEY, JSON.stringify(list)); }
  function loadCustom() {
    try { const d = JSON.parse(localStorage.getItem(CUSTOM_KEY) || "[]"); return Array.isArray(d) ? d : []; }
    catch { return []; }
  }
  function saveCustom(list) { localStorage.setItem(CUSTOM_KEY, JSON.stringify(list)); }
  function allRecipes() { return [...(globalThis.RECIPES || []), ...loadCustom()]; }
  function findRecipe(id) { return allRecipes().find(r => r.id === id); }

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
  function hasIng(fridge, ing) {
    const key = ing.key || ing.name;
    return fridge.some(item => namesMatch(item.name, key) || namesMatch(item.name, ing.name));
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

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(() => { toastEl.hidden = true; }, 2200);
  }
  function setTitle(t) { titleEl.textContent = t; }
  function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }

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
    document.querySelectorAll(".nav button").forEach(b => b.classList.toggle("on", b.dataset.tab === "list"));
    const fridge = loadFridge();
    const counts = Object.fromEntries(CATS.map(c => [c, allRecipes().filter(r => r.cat === c).length]));
    const intro = localStorage.getItem(INTRO_KEY) ? "" : `<div class="card" id="intro">
      <p style="margin:0 0 8px"><b>상우님 퇴근 후 집밥</b></p>
      <p class="note" style="margin:0 0 10px">179cm · 73kg · 벤치업. 한 끼 재료비는 대략 5,000~8,000원 안으로 잡았어요. 1큰술 15ml, 1작은술 5ml. 칼로리·단백질은 전부 추정치예요. 짜글이·조림·데리야끼·칠리는 평소 양 그대로이고, 다진 마늘만 더했어요.</p>
      <button class="btn" type="button" id="hideIntro">안내 닫기</button>
    </div>`;
    view.innerHTML = `
      <input class="search" id="q" placeholder="${esc(cat)}에서 검색" value="${esc(q)}" enterkeyhint="search" autocomplete="off">
      <div class="tabs" role="tablist">${CATS.map(c => `<button class="tab${c === cat ? " on" : ""}" type="button" data-cat="${esc(c)}" role="tab" aria-selected="${c === cat}">${esc(c)}<small>${counts[c]}</small></button>`).join("")}</div>
      ${intro}
      <div id="results">${listHtml(filteredRecipes(), fridge)}</div>
      <button class="btn block" type="button" id="addBtn" style="margin-top:6px">+ 내 레시피 추가</button>
      <p class="note" style="text-align:center;margin-top:12px">기록은 이 폰에만 저장돼요.</p>`;
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
    document.querySelectorAll(".nav button").forEach(b => b.classList.remove("on"));
    const fridge = loadFridge();
    const t = tally(r, fridge);
    const ings = (r.ingredients || []).map(i => {
      if (i.water) return `<div class="ing"><span class="dot"></span><div><div class="nm">${esc(i.name)} <span class="chip">물 · 비교 안 함</span></div><div class="amt">${esc(i.amount)}</div>${i.note ? `<div class="sub">${esc(i.note)}</div>` : ""}</div></div>`;
      const owned = hasIng(fridge, i);
      const cls = i.optional ? "opt" : owned ? "have" : "lack";
      const tag = i.optional ? (owned ? "선택 · 있음" : "선택 · 없음") : owned ? "있음" : "없음";
      const chip = owned ? "good" : i.optional ? "info" : "miss";
      return `<div class="ing"><span class="dot ${cls}"></span><div><div class="nm">${esc(i.name)} <span class="chip ${chip}">${tag}</span>${i.main ? ` <span class="chip">주요</span>` : ""}</div><div class="amt">${esc(i.amount)}</div>${i.note ? `<div class="sub">${esc(i.note)}</div>` : ""}</div></div>`;
    }).join("");
    const steps = (r.steps || []).map((s, i) => `<div class="step"><div class="num">${i + 1}</div><div>
      <div class="pills"><span class="pill">${esc(s.heat)}</span><span class="pill time">${esc(s.time)}</span></div>
      <div>${esc(s.text)}</div>
    </div></div>`).join("");
    const st = r.storage || {};
    view.innerHTML = `
      <div class="kicker"><span class="chip">${esc(r.cat)}</span>${r.own ? `<span class="chip own">평소 메뉴</span>` : ""}${r.custom ? `<span class="chip info">내가 추가</span>` : ""}</div>
      <p class="meta" style="margin:0 0 8px">${esc(r.blurb || "")}</p>
      <p class="meta">인분 ${esc(r.servings)} · ${esc(r.time)} · 기준 ${esc(r.basis)}</p>
      ${macroBox(r)}
      ${r.riceNote ? `<p class="note" style="margin:8px 0 0">${esc(r.riceNote)}</p>` : ""}
      ${t.missing.length ? `<p class="miss-line">없는 재료: ${esc(t.missing.map(i => i.name).join(", "))}</p>` : `<p class="miss-line" style="color:var(--good)">냉장고 재료로 바로 만들 수 있어요</p>`}
      ${r.budget ? `<p class="note">${esc(r.budget)}</p>` : ""}
      ${r.tools ? `<p class="note">도구 · ${esc(r.tools.join(" · "))}</p>` : ""}
      <h3 class="section">재료</h3>
      <div class="card" style="padding-top:4px;padding-bottom:4px">${ings}</div>
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
      <p class="note" style="margin-top:14px">칼로리·단백질 숫자는 추정치예요. 고기 지방을 얼마나 걷어 내는지, 국물을 남기는지에 따라 달라요.</p>`;
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

  function nowView() {
    setTitle("지금 만들기");
    backBtn.hidden = true;
    document.querySelectorAll(".nav button").forEach(b => b.classList.toggle("on", b.dataset.tab === "now"));
    const rows = ranked();
    const ready = rows.filter(x => x.missing.length === 0).length;
    view.innerHTML = `
      <div class="card"><p style="margin:0"><b>지금 만들 수 있는 요리</b></p>
        <p class="note" style="margin:6px 0 0">주요 재료가 냉장고에 얼마나 있는지 보고, 없는 재료를 같이 보여 줘요. 물은 세지 않아요. 바로 가능한 요리가 ${ready}개예요.</p></div>
      ${rows.map(x => {
        const miss = x.missing.length ? `<p class="miss-line">없는 재료 · ${esc(x.missing.map(i => i.name).join(", "))}</p>` : `<p class="miss-line" style="color:var(--good)">없는 재료 없음</p>`;
        const main = `<p class="meta">주요 재료 ${x.ownedMain}/${x.mains.length || 0}</p>`;
        return card(x.r, main + miss);
      }).join("")}`;
    view.querySelectorAll("[data-id]").forEach(b => b.onclick = () => go("#/r/" + b.dataset.id));
  }

  function fridgeView() {
    setTitle("내 냉장고");
    backBtn.hidden = true;
    document.querySelectorAll(".nav button").forEach(b => b.classList.toggle("on", b.dataset.tab === "fridge"));
    const list = loadFridge();
    const groups = FCATS.map(c => {
      const items = list.filter(i => i.cat === c);
      if (!items.length) return "";
      return `<h3 class="group-h">${esc(c)}</h3>` + items.map(i => `<button class="card fr-item" type="button" data-fid="${esc(i.id)}"><span><b>${esc(i.name)}</b></span><span class="qty">${esc([i.qty, i.unit].filter(Boolean).join("")) || "양 없음"}</span></button>`).join("");
    }).join("");
    view.innerHTML = `
      <div class="card"><p style="margin:0 0 8px"><b>재료 추가</b></p>
        <form id="addF">
          <div class="field"><label for="fn">이름</label><input id="fn" name="name" required placeholder="예: 고추장" maxlength="40"></div>
          <div class="row">
            <div class="field"><label for="fq">양 (선택)</label><input id="fq" name="qty" inputmode="decimal" placeholder="예: 200"></div>
            <div class="field"><label for="fu">단위</label><input id="fu" name="unit" placeholder="g, ml, 개"></div>
          </div>
          <div class="field"><label for="fc">분류</label><select id="fc" name="cat">${FCATS.map(c => `<option>${esc(c)}</option>`).join("")}</select></div>
          <button class="btn primary block" type="submit">냉장고에 넣기</button>
        </form>
      </div>
      <div class="tip" style="margin-bottom:12px">스테비아는 설탕 대신 단맛만 낼 때 써요. 설탕 1큰술의 단맛은 제품마다 달라서 포장 환산을 보고, 보통 부피로는 적게 써요. 윤기·색은 설탕이나 올리고당이 더 좋아요. 평소 메뉴 4개는 적힌 설탕 그대로가 맞아요.</div>
      ${groups || `<div class="empty">냉장고가 비었어요.</div>`}
      <button class="btn block" type="button" id="reseed" style="margin-top:8px">기본 재료 다시 채우기</button>
      <p class="note" style="text-align:center">없는 항목만 추가해요. 지금 적은 양은 그대로예요.</p>`;
    $("#addF").onsubmit = e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const name = String(fd.get("name") || "").trim();
      if (!name) return;
      const list = loadFridge();
      if (list.some(i => norm(i.name) === norm(name))) { toast("이미 있어요"); return; }
      list.push({ id: uid(), name, qty: String(fd.get("qty") || "").trim(), unit: String(fd.get("unit") || "").trim(), cat: fd.get("cat") || "기타" });
      saveFridge(list);
      toast("넣었어요");
      fridgeView();
    };
    view.querySelectorAll("[data-fid]").forEach(b => b.onclick = () => openFridgeSheet(b.dataset.fid));
    $("#reseed").onclick = () => {
      const list = loadFridge();
      let n = 0;
      for (const [name, cat] of SEED) {
        if (!list.some(i => norm(i.name) === norm(name))) { list.push({ id: uid(), name, qty: "", unit: "", cat }); n++; }
      }
      saveFridge(list);
      toast(n ? `${n}개를 채웠어요` : "기본 재료가 이미 있어요");
      fridgeView();
    };
  }

  function openFridgeSheet(id) {
    const list = loadFridge();
    const item = list.find(i => i.id === id);
    if (!item) return;
    const sheet = document.createElement("div");
    sheet.className = "sheet";
    sheet.innerHTML = `<div class="panel" role="dialog" aria-modal="true">
      <h2 class="page-h">재료 수정</h2>
      <form id="ef">
        <div class="field"><label>이름</label><input name="name" required value="${esc(item.name)}" maxlength="40"></div>
        <div class="row">
          <div class="field"><label>양</label><input name="qty" inputmode="decimal" value="${esc(item.qty)}"></div>
          <div class="field"><label>단위</label><input name="unit" value="${esc(item.unit)}"></div>
        </div>
        <div class="field"><label>분류</label><select name="cat">${FCATS.map(c => `<option${c === item.cat ? " selected" : ""}>${esc(c)}</option>`).join("")}</select></div>
        <button class="btn primary block" type="submit">저장</button>
      </form>
      <button class="danger block" type="button" id="rm" style="margin-top:8px">냉장고에서 빼기</button>
      <button class="btn block" type="button" id="close" style="margin-top:8px">닫기</button>
    </div>`;
    document.body.appendChild(sheet);
    const close = () => sheet.remove();
    sheet.addEventListener("click", e => { if (e.target === sheet) close(); });
    $("#close", sheet).onclick = close;
    $("#ef", sheet).onsubmit = e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      item.name = String(fd.get("name") || "").trim() || item.name;
      item.qty = String(fd.get("qty") || "").trim();
      item.unit = String(fd.get("unit") || "").trim();
      item.cat = fd.get("cat") || item.cat;
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

  function emptyDraft() {
    return {
      title: "", cat: "한식", blurb: "", servings: "1끼분", basis: "1인분", time: "약 20분",
      kcal: "약 0kcal", protein: "약 0g", riceNote: "", budget: "", tools: "",
      fridge: "", freezer: "", reheat: "", tip: "",
      ingredients: [{ name: "", amount: "", note: "", main: true, optional: false }],
      steps: [{ heat: "중불", time: "5분", text: "" }]
    };
  }
  function draftFrom(r) {
    return {
      title: r.title || "", cat: CATS.includes(r.cat) ? r.cat : "한식", blurb: r.blurb || "",
      servings: r.servings || "", basis: r.basis || "", time: r.time || "",
      kcal: r.kcal || "", protein: r.protein || "", riceNote: r.riceNote || "",
      budget: r.budget || "", tools: (r.tools || []).join(", "),
      fridge: (r.storage && r.storage.fridge) || "", freezer: (r.storage && r.storage.freezer) || "",
      reheat: (r.storage && r.storage.reheat) || "", tip: r.tip || "",
      ingredients: (r.ingredients || []).map(i => ({ name: i.name, amount: i.amount, note: i.note || "", main: !!i.main, optional: !!i.optional, water: !!i.water })),
      steps: (r.steps || []).map(s => ({ heat: s.heat, time: s.time, text: s.text }))
    };
  }
  function formView(existing) {
    setTitle(existing ? "레시피 수정" : "레시피 추가");
    backBtn.hidden = false;
    document.querySelectorAll(".nav button").forEach(b => b.classList.remove("on"));
    let draft = existing ? draftFrom(existing) : emptyDraft();
    const paint = () => {
      view.innerHTML = `<form id="rf">
        <div class="field"><label>이름</label><input name="title" required value="${esc(draft.title)}" maxlength="40"></div>
        <div class="field"><label>분류</label><select name="cat">${CATS.map(c => `<option${c === draft.cat ? " selected" : ""}>${c}</option>`).join("")}</select></div>
        <div class="field"><label>한 줄 설명</label><input name="blurb" value="${esc(draft.blurb)}" maxlength="80"></div>
        <div class="row">
          <div class="field"><label>인분</label><input name="servings" required value="${esc(draft.servings)}"></div>
          <div class="field"><label>예상 시간</label><input name="time" required value="${esc(draft.time)}"></div>
        </div>
        <div class="field"><label>영양 기준</label><input name="basis" required value="${esc(draft.basis)}" placeholder="1인분"></div>
        <div class="row">
          <div class="field"><label>칼로리</label><input name="kcal" required value="${esc(draft.kcal)}" placeholder="약 400kcal"></div>
          <div class="field"><label>단백질</label><input name="protein" required value="${esc(draft.protein)}" placeholder="약 30g"></div>
        </div>
        <p class="note">저장하면 화면에 자동으로 ‘추정치’가 붙어요.</p>
        <div class="field"><label>밥·곁들임 메모 (선택)</label><input name="riceNote" value="${esc(draft.riceNote)}"></div>
        <h3 class="section">재료</h3>
        ${draft.ingredients.map((ing, i) => `<div class="mini-row" data-i="${i}">
          <div class="field"><label>이름</label><input data-k="name" value="${esc(ing.name)}" placeholder="닭가슴살"></div>
          <div class="field"><label>양</label><input data-k="amount" value="${esc(ing.amount)}" placeholder="200g 또는 1큰술"></div>
          <div class="field"><label>메모</label><input data-k="note" value="${esc(ing.note)}" placeholder="1.5cm"></div>
          <label class="check"><input type="checkbox" data-k="main"${ing.main ? " checked" : ""}> 주요 재료</label>
          <label class="check"><input type="checkbox" data-k="optional"${ing.optional ? " checked" : ""}> 없어도 됨</label>
          <label class="check"><input type="checkbox" data-k="water"${ing.water ? " checked" : ""}> 물 (비교에서 빼기)</label>
          <button class="x" type="button" data-rm="${i}">이 재료 빼기</button>
        </div>`).join("")}
        <button class="btn block" type="button" id="addIng">재료 줄 추가</button>
        <h3 class="section">단계</h3>
        ${draft.steps.map((s, i) => `<div class="mini-row" data-s="${i}">
          <div class="row">
            <div class="field"><label>불</label><input data-k="heat" value="${esc(s.heat)}" placeholder="중불"></div>
            <div class="field"><label>시간</label><input data-k="time" value="${esc(s.time)}" placeholder="4분"></div>
          </div>
          <div class="field"><label>하는 일</label><textarea data-k="text">${esc(s.text)}</textarea></div>
          <button class="x" type="button" data-rms="${i}">이 단계 빼기</button>
        </div>`).join("")}
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
          servings: fd.get("servings"), time: fd.get("time"), basis: fd.get("basis"),
          kcal: fd.get("kcal"), protein: fd.get("protein"), riceNote: fd.get("riceNote"),
          fridge: fd.get("fridge"), freezer: fd.get("freezer"), reheat: fd.get("reheat"), tip: fd.get("tip"),
          ingredients: [...view.querySelectorAll("[data-i]")].map(box => ({
            name: box.querySelector('[data-k="name"]').value.trim(),
            amount: box.querySelector('[data-k="amount"]').value.trim(),
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
      $("#addIng").onclick = () => { read(); draft.ingredients.push({ name: "", amount: "", note: "", main: false, optional: false }); paint(); };
      $("#addStep").onclick = () => { read(); draft.steps.push({ heat: "중불", time: "", text: "" }); paint(); };
      view.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => { read(); draft.ingredients.splice(Number(b.dataset.rm), 1); if (!draft.ingredients.length) draft.ingredients.push({ name: "", amount: "", note: "", main: true }); paint(); });
      view.querySelectorAll("[data-rms]").forEach(b => b.onclick = () => { read(); draft.steps.splice(Number(b.dataset.rms), 1); if (!draft.steps.length) draft.steps.push({ heat: "중불", time: "", text: "" }); paint(); });
      $("#rf").onsubmit = e => {
        e.preventDefault();
        read();
        const ingredients = draft.ingredients.filter(i => i.name && i.amount).map(i => ({
          key: i.name, name: i.name, amount: i.amount, note: i.note, main: i.main && !i.water && !i.optional, optional: i.optional, water: i.water
        }));
        const steps = draft.steps.filter(s => s.text).map(s => ({ heat: s.heat || "중불", time: s.time || "—", text: s.text }));
        if (!String(draft.title).trim() || !ingredients.length || !steps.length) { toast("이름, 재료, 단계를 적어 주세요"); return; }
        const rec = {
          id: existing ? existing.id : "custom-" + uid(),
          custom: true,
          title: String(draft.title).trim(),
          cat: draft.cat,
          servings: String(draft.servings).trim() || "1끼분",
          basis: String(draft.basis).trim() || "1인분",
          time: String(draft.time).trim() || "시간 미정",
          kcal: String(draft.kcal).trim() || "미입력",
          protein: String(draft.protein).trim() || "미입력",
          riceNote: String(draft.riceNote || "").trim(),
          blurb: String(draft.blurb || "").trim(),
          tools: String(draft.tools || "").split(",").map(s => s.trim()).filter(Boolean),
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
