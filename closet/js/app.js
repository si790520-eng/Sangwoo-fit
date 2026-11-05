/* 이상우 옷장 */
(function () {
  const Data = window.ClosetData;
  const DB = window.ClosetDB;
  const Color = window.ClosetColor;
  const Draw = window.ClosetDraw;
  const Reco = window.ClosetReco;

  const SLOT_ORDER = ["bottom", "inner", "shirt", "sweat", "knit", "outer", "shoes", "belt"];

  const state = {
    ready: false,
    tab: "closet",
    items: [],
    outfits: [],
    urls: {},
    cat: "all",
    q: "",
    season: currentSeason(),
    occasion: "all",
    look: emptyLook(),
    caption: null,
    today: null,
    todaySalt: 0,
    draft: null
  };

  function emptyLook() {
    return {
      slots: { bottom: null, inner: null, shirt: null, sweat: null, knit: null, outer: null, shoes: null, belt: null },
      toggles: { tuck: false, outerOpen: true, hemRoll: false }
    };
  }

  function currentSeason() {
    const m = new Date().getMonth() + 1;
    if (m >= 3 && m <= 5) return "spring";
    if (m >= 6 && m <= 8) return "summer";
    if (m >= 9 && m <= 11) return "fall";
    return "winter";
  }

  function uid(prefix) {
    return `${prefix || "u"}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function byId(id) {
    return state.items.find((it) => it.id === id) || null;
  }

  function wornMap() {
    const map = {};
    for (const key of SLOT_ORDER) map[key] = byId(state.look.slots[key]);
    return map;
  }

  function wornCount() {
    return SLOT_ORDER.filter((k) => state.look.slots[k]).length;
  }

  function dayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  async function init() {
    await DB.init();
    let items = DB.ok ? await DB.all("items") : [];
    let outfits = DB.ok ? await DB.all("outfits") : [];
    const mirror = DB.readMirror();
    if (!items.length && mirror && mirror.items && mirror.items.length) {
      items = mirror.items;
      outfits = mirror.outfits || [];
      if (DB.ok) {
        for (const it of items) await DB.put("items", it);
        for (const o of outfits) await DB.put("outfits", o);
      }
    }
    if (!items.length) {
      items = Data.SEED.map((it) => Object.assign({ createdAt: Date.now() }, it));
      if (DB.ok) {
        for (const it of items) await DB.put("items", it);
        await DB.put("meta", { id: "seeded", at: Date.now() }, "seeded");
      }
    }
    state.items = items;
    state.outfits = outfits.filter((o) => o.source !== "coach");
    if (mirror && mirror.look && mirror.look.slots) {
      state.look = {
        slots: Object.assign(emptyLook().slots, mirror.look.slots),
        toggles: Object.assign(emptyLook().toggles, mirror.look.toggles || {})
      };
    }
    await hydratePhotos();
    state.ready = true;
    render();
  }

  async function hydratePhotos() {
    for (const it of state.items) {
      if (!it.photoId || state.urls[it.photoId]) continue;
      const blob = await DB.getPhoto(it.photoId);
      if (blob) state.urls[it.photoId] = URL.createObjectURL(blob);
    }
  }

  function persistMirror() {
    DB.writeMirror({ items: state.items, outfits: state.outfits, look: state.look });
  }

  async function saveItem(item) {
    const idx = state.items.findIndex((it) => it.id === item.id);
    if (idx >= 0) state.items[idx] = item;
    else state.items.unshift(item);
    if (DB.ok) await DB.put("items", item);
    persistMirror();
  }

  async function removeItem(id) {
    const item = byId(id);
    if (!item) return;
    state.items = state.items.filter((it) => it.id !== id);
    if (item.photoId) {
      if (state.urls[item.photoId]) URL.revokeObjectURL(state.urls[item.photoId]);
      delete state.urls[item.photoId];
      await DB.deletePhoto(item.photoId);
    }
    for (const key of SLOT_ORDER) {
      if (state.look.slots[key] === id) state.look.slots[key] = null;
    }
    state.outfits.forEach((o) => {
      for (const key of SLOT_ORDER) if (o.slots && o.slots[key] === id) o.slots[key] = null;
    });
    if (DB.ok) {
      await DB.del("items", id);
      for (const o of state.outfits) await DB.put("outfits", o);
    }
    persistMirror();
  }

  function toast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { el.hidden = true; }, 2200);
  }

  function setTab(tab) {
    state.tab = tab;
    document.getElementById("view").scrollTop = 0;
    render();
  }

  function toggleWear(id) {
    const item = byId(id);
    if (!item) return;
    const slot = Reco.slotOf(item);
    if (!slot) return;
    if (state.look.slots[slot] === id) {
      state.look.slots[slot] = null;
      toast(`${Data.label(item)} 벗었어요`);
    } else {
      state.look.slots[slot] = id;
      toast(`${Data.label(item)} 입었어요`);
    }
    state.caption = null;
    persistMirror();
    render();
  }

  function applySlots(slots, toggles, caption) {
    const next = emptyLook();
    for (const key of SLOT_ORDER) {
      const id = slots[key];
      if (id && byId(id)) next.slots[key] = id;
    }
    next.toggles = Object.assign(next.toggles, toggles || {});
    state.look = next;
    state.caption = caption || null;
    state.tab = "fit";
    persistMirror();
    render();
  }

  function coachToSlots(coach) {
    const slots = emptyLook().slots;
    for (const id of coach.items) {
      const item = byId(id);
      if (!item) continue;
      const slot = Reco.slotOf(item);
      if (slot) slots[slot] = id;
    }
    return slots;
  }

  function filteredItems() {
    const q = state.q.trim().toLowerCase();
    return state.items.filter((it) => {
      if (state.cat !== "all" && it.category !== state.cat) return false;
      if (!q) return true;
      const blob = `${it.brand} ${it.name} ${Data.subtypeName(it.subtype)} ${Data.categoryName(it.category)}`.toLowerCase();
      return blob.includes(q);
    });
  }

  function render() {
    const view = document.getElementById("view");
    const qEl = document.getElementById("q");
    const keep = document.activeElement === qEl;
    const sel = keep ? [qEl.selectionStart, qEl.selectionEnd] : null;
    const scroll = view.scrollTop;
    const titles = { closet: "내 옷장", fit: "마네킹", reco: "추천" };
    document.getElementById("title").textContent = titles[state.tab] || "옷장";
    view.innerHTML = state.ready ? viewHTML() : `<p class="loading">옷장 여는 중…</p>`;
    view.scrollTop = scroll;
    if (keep) {
      const q = document.getElementById("q");
      if (q) {
        q.focus();
        q.setSelectionRange(sel[0], sel[1]);
      }
    }
    document.querySelectorAll(".tab").forEach((btn) => {
      btn.classList.toggle("on", btn.dataset.tab === state.tab);
    });
    const badge = document.getElementById("fitCount");
    const n = wornCount();
    badge.hidden = n === 0;
    badge.textContent = String(n);
    document.getElementById("fab").hidden = state.tab !== "closet";
  }

  function viewHTML() {
    if (state.tab === "closet") return closetHTML();
    if (state.tab === "fit") return fitHTML();
    return recoHTML();
  }

  function closetHTML() {
    const counts = {};
    for (const it of state.items) counts[it.category] = (counts[it.category] || 0) + 1;
    const chips = [`<button class="chip ${state.cat === "all" ? "on" : ""}" data-act="cat" data-cat="all">전체 <small>${state.items.length}</small></button>`]
      .concat(Data.CATEGORIES.map((c) => `<button class="chip ${state.cat === c.id ? "on" : ""}" data-act="cat" data-cat="${c.id}">${c.name} <small>${counts[c.id] || 0}</small></button>`))
      .join("");
    const list = filteredItems();
    const groups = state.cat === "all" ? Data.CATEGORIES : Data.CATEGORIES.filter((c) => c.id === state.cat);
    let body = "";
    if (!list.length) {
      body = `<p class="empty">이 조건에 옷이 없어요.<br>아래 버튼으로 직접 넣을 수 있어요.</p>`;
    } else {
      for (const g of groups) {
        const rows = list.filter((it) => it.category === g.id);
        if (!rows.length) continue;
        body += `<section class="group"><h2>${g.name}</h2>${rows.map(itemRow).join("")}</section>`;
      }
    }
    return `
      <input id="q" class="search" type="search" placeholder="이름, 브랜드, 종류" value="${esc(state.q)}" enterkeyhint="search" autocomplete="off">
      <div class="chips" id="catChips">${chips}</div>
      ${body}
    `;
  }

  function itemRow(it) {
    const on = Object.values(state.look.slots).includes(it.id);
    const url = it.photoId && state.urls[it.photoId];
    const letter = (Data.subtypeName(it.subtype) || "옷").slice(0, 1);
    const light = Color.luma(it.color) > 180;
    const thumb = url
      ? `<img src="${url}" alt="">`
      : `<span class="letter" style="color:${light ? "#3a342c" : "#fff"}">${esc(letter)}</span>`;
    const size = it.size ? ` · ${esc(it.size)}` : "";
    return `
      <article class="item ${on ? "on" : ""}">
        <button class="item-main" data-act="wear" data-id="${esc(it.id)}">
          <div class="thumb" style="background:${esc(it.color)}">${thumb}</div>
          <div class="meta">
            <strong>${esc(Data.label(it))}</strong>
            <span>${esc(Data.subtypeName(it.subtype))}${size}</span>
            ${on ? `<em class="worn-tag">입는 중</em>` : ""}
          </div>
        </button>
        <button class="icon-btn" data-act="edit" data-id="${esc(it.id)}" aria-label="수정">✎</button>
      </article>`;
  }

  function fitHTML() {
    const worn = wornMap();
    const photos = SLOT_ORDER.map((k) => worn[k]).filter((it) => it && it.photoId && state.urls[it.photoId]);
    const side = photos.map((it) => `<img src="${state.urls[it.photoId]}" alt="${esc(Data.label(it))}">`).join("");
    const svg = Draw.render(worn, state.look.toggles, "fit");
    const t = state.look.toggles;
    const chips = SLOT_ORDER.map((k) => worn[k]).filter(Boolean).map((it) => `
      <button class="pill" data-act="wear" data-id="${esc(it.id)}">
        <i class="dot" style="background:${esc(it.color)}"></i>${esc(Data.label(it))}
      </button>`).join("");
    const tips = state.caption ? `
      <div class="tips">
        <strong>${esc(state.caption.title)}</strong>
        <ul>${state.caption.tips.map((tip) => `<li>${esc(tip)}</li>`).join("")}</ul>
      </div>` : "";
    const saved = state.outfits.length ? state.outfits.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).map((o) => `
      <div class="saved-item">
        <button class="textbtn" data-act="load-outfit" data-id="${esc(o.id)}" style="text-align:left;padding:8px 0;color:var(--ink);font-weight:700">${esc(o.name)}</button>
        <button class="textbtn danger" data-act="del-outfit" data-id="${esc(o.id)}">삭제</button>
      </div>`).join("") : `<p class="hint">저장한 코디가 없어요. 마음에 드는 조합에 이름을 붙여 두세요.</p>`;
    return `
      <p class="fit-note">179cm · 어깨 있는 체형. 누르면 입고, 한 번 더 누르면 벗어요.</p>
      <div class="stage ${side ? "" : "solo"}">
        ${side ? `<div class="side-photos">${side}</div>` : ""}
        ${svg}
      </div>
      <div class="toggles">
        <div class="toggle">
          <p>상의</p>
          <div class="seg">
            <button data-act="tog" data-key="tuck" data-val="1" class="${t.tuck ? "on" : ""}">넣입</button>
            <button data-act="tog" data-key="tuck" data-val="0" class="${!t.tuck ? "on" : ""}">빼입</button>
          </div>
        </div>
        <div class="toggle">
          <p>아우터</p>
          <div class="seg">
            <button data-act="tog" data-key="outerOpen" data-val="1" class="${t.outerOpen ? "on" : ""}">열기</button>
            <button data-act="tog" data-key="outerOpen" data-val="0" class="${!t.outerOpen ? "on" : ""}">잠금</button>
          </div>
        </div>
        <div class="toggle">
          <p>밑단</p>
          <div class="seg">
            <button data-act="tog" data-key="hemRoll" data-val="1" class="${t.hemRoll ? "on" : ""}">롤업</button>
            <button data-act="tog" data-key="hemRoll" data-val="0" class="${!t.hemRoll ? "on" : ""}">일자</button>
          </div>
        </div>
      </div>
      ${tips}
      <div class="chips-worn">${chips || `<span class="hint">아직 아무것도 안 입었어요.</span>`}</div>
      <div class="row-actions">
        <button class="solid" data-act="save-look">이 코디 저장</button>
        <button class="ghost" data-act="clear-look">모두 벗기</button>
      </div>
      <h2 class="group" style="margin-top:8px">저장한 코디</h2>
      ${saved}
    `;
  }

  function recoHTML() {
    const seasonChips = [`<button class="chip ${state.season === "all" ? "on" : ""}" data-act="season" data-id="all">전체</button>`]
      .concat(Data.SEASONS.map(([id, name]) => `<button class="chip ${state.season === id ? "on" : ""}" data-act="season" data-id="${id}">${name}</button>`))
      .join("");
    const occChips = [["all", "전체"], ["date", "데이트"], ["casual", "마실"]].map(([id, name]) =>
      `<button class="chip ${state.occasion === id ? "on" : ""}" data-act="occ" data-id="${id}">${name}</button>`).join("");
    const list = Data.COACH.filter((c) => {
      if (state.season !== "all" && c.season !== state.season) return false;
      if (state.occasion !== "all" && c.occasion !== state.occasion) return false;
      return true;
    });
    const today = state.today ? todayCard(state.today) : `
      <div class="card">
        <h3>오늘의 추천</h3>
        <p class="hint">지금 옷장에 있는 옷으로, 계절이랑 자리만 보고 새로 짜요. 가격이나 쇼핑 링크는 없어요.</p>
        <button class="solid" data-act="today">오늘 뭐 입지?</button>
      </div>`;
    const cards = list.map(coachCard).join("") || `<p class="empty">이 조건의 코치 코디가 없어요. 필터를 바꿔 보세요.</p>`;
    return `
      <p class="hint" style="margin-top:0">회사는 유니폼이라, 데이트랑 마실만 골랐어요.</p>
      <div class="chips">${seasonChips}</div>
      <div class="chips">${occChips}</div>
      ${today}
      <h2 style="font-size:16px;margin:16px 0 4px">코치 코디 ${list.length}</h2>
      ${cards}
    `;
  }

  function colorDots(ids) {
    return ids.map((id) => {
      const it = byId(id);
      if (!it) return "";
      return `<i class="dot" style="background:${esc(it.color)}" title="${esc(Data.label(it))}"></i>`;
    }).join("");
  }

  function coachCard(c) {
    const names = c.items.map((id) => Data.label(byId(id))).filter(Boolean).join(" · ");
    const missing = c.items.filter((id) => !byId(id)).length;
    return `
      <article class="card">
        <div class="kicker">
          <span class="tag hot">${Data.seasonName(c.season)}</span>
          <span class="tag">${Data.occasionName(c.occasion)}</span>
          <span>${colorDots(c.items)}</span>
        </div>
        <h3>${esc(c.title)}</h3>
        <p class="names">${esc(names) || "옷장에 없는 옷이 있어요"}</p>
        <ul class="hint" style="padding-left:18px;margin:8px 0">${c.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
        <button class="soft" data-act="wear-coach" data-id="${esc(c.id)}">${missing ? "있는 옷만 입히기" : "마네킹에 입히기"}</button>
      </article>`;
  }

  function todayCard(result) {
    if (!result.ok) {
      return `<div class="card"><h3>오늘의 추천</h3><p>${esc(result.reason)}</p>
        <button class="solid" data-act="today">다시 짜기</button></div>`;
    }
    const names = result.items.map((it) => Data.label(it)).join(" · ");
    const dots = result.items.map((it) => `<i class="dot" style="background:${esc(it.color)}"></i>`).join("");
    return `
      <div class="card">
        <div class="kicker"><span class="tag hot">오늘</span><span>${dots}</span></div>
        <h3>오늘의 추천</h3>
        <p class="names">${esc(names)}</p>
        <p>${esc(result.reason)}</p>
        <div class="row-actions">
          <button class="solid" data-act="wear-today">마네킹에 입히기</button>
          <button class="ghost" data-act="today-next">다른 조합</button>
        </div>
      </div>`;
  }

  function runToday(next) {
    if (next) state.todaySalt += 1;
    const season = state.season === "all" ? currentSeason() : state.season;
    const occasion = state.occasion === "casual" ? "casual" : "date";
    state.today = Reco.generate(state.items, {
      season,
      occasion,
      salt: state.todaySalt,
      day: dayKey()
    });
    render();
  }

  function openSheet(html) {
    const sheet = document.getElementById("sheet");
    sheet.innerHTML = `<button class="sheet-back" data-act="close-sheet" aria-label="닫기"></button>
      <div class="sheet-panel"><div class="handle"></div>${html}</div>`;
    sheet.hidden = false;
  }

  function closeSheet() {
    document.getElementById("sheet").hidden = true;
    document.getElementById("sheet").innerHTML = "";
    state.draft = null;
  }

  function openEditor(id) {
    const existing = id ? byId(id) : null;
    const cat = existing ? existing.category : "top";
    state.draft = {
      id: existing ? existing.id : uid("u"),
      brand: existing ? existing.brand : "",
      name: existing ? existing.name : "",
      category: cat,
      subtype: existing ? existing.subtype : Data.CATEGORIES.find((c) => c.id === cat).subtypes[0][0],
      color: existing ? existing.color : "#1A1A1A",
      seasons: existing ? existing.seasons.slice() : ["spring", "summer", "fall", "winter"],
      size: existing ? (existing.size || "") : "",
      photoId: existing ? (existing.photoId || "") : "",
      photoBlob: null,
      removePhoto: false,
      fromPhoto: false,
      isNew: !existing
    };
    renderEditor();
  }

  function renderEditor() {
    const d = state.draft;
    const cat = Data.CATEGORIES.find((c) => c.id === d.category) || Data.CATEGORIES[0];
    const subs = cat.subtypes.map(([id, name]) => `<option value="${id}" ${id === d.subtype ? "selected" : ""}>${name}</option>`).join("");
    const cats = Data.CATEGORIES.map((c) => `<option value="${c.id}" ${c.id === d.category ? "selected" : ""}>${c.name}</option>`).join("");
    const preview = d.previewURL || (d.photoId && !d.removePhoto && state.urls[d.photoId]) || "";
    const presets = Data.PRESETS.map(([name, hex]) => {
      const on = hex.toLowerCase() === String(d.color).toLowerCase();
      return `<button class="sw ${on ? "on" : ""}" style="background:${hex}" data-act="preset" data-color="${hex}" aria-label="${name}"></button>`;
    }).join("");
    const seasons = Data.SEASONS.map(([id, name]) =>
      `<button type="button" class="check ${d.seasons.includes(id) ? "on" : ""}" data-act="season-tog" data-id="${id}">${name}</button>`).join("");
    const near = Color.nearestPreset(d.color);
    openSheet(`
      <h2>${d.isNew ? "옷 추가" : "옷 수정"}</h2>
      <div class="photo-box">
        ${preview ? `<img src="${preview}" alt="옷 사진">` : `<div class="photo-ph"></div>`}
        <div>
          <label class="soft filebtn" style="min-height:40px">카메라
            <input id="camInput" type="file" accept="image/*" capture="environment">
          </label>
          <label class="ghost filebtn" style="min-height:40px;margin-top:6px">앨범
            <input id="fileInput" type="file" accept="image/*">
          </label>
          ${preview ? `<button class="textbtn danger" data-act="rm-photo">사진 빼기</button>` : ""}
        </div>
      </div>
      ${d.fromPhoto ? `<p class="suggest">사진에서 ${esc(near || "이 색")}을 골랐어요. 다르면 바꿔 주세요.</p>` : ""}
      <label class="field"><span>이름</span><input id="f-name" type="text" value="${esc(d.name)}" placeholder="예: 베이지 니트" maxlength="40"></label>
      <label class="field"><span>브랜드</span><input id="f-brand" type="text" value="${esc(d.brand)}" placeholder="없으면 비워도 돼요" maxlength="40"></label>
      <label class="field"><span>카테고리</span><select id="f-cat">${cats}</select></label>
      <label class="field"><span>종류</span><select id="f-sub">${subs}</select></label>
      <div class="field">
        <span class="field-label">색</span>
        <div class="color-row">
          <input id="f-color" type="color" value="${esc(Color.safeHex(d.color))}">
          <span>${esc(near || d.color)}</span>
        </div>
        <div class="presets">${presets}</div>
      </div>
      <div class="field">
        <span class="field-label">계절 · 추천에 이 계절만 나와요</span>
        <div class="checks">${seasons}</div>
      </div>
      <label class="field"><span>사이즈 (선택)</span><input id="f-size" type="text" value="${esc(d.size)}" placeholder="2, L, 280" maxlength="16"></label>
      <div class="sheet-actions">
        ${d.isNew ? "" : `<button class="${d.confirmDelete ? "solid" : "ghost"} danger" data-act="delete-item">${d.confirmDelete ? "정말 빼기" : "삭제"}</button>`}
        <button class="ghost" data-act="close-sheet">취소</button>
        <button class="solid" data-act="save-item">저장</button>
      </div>
    `);
  }

  function readDraftFields() {
    const d = state.draft;
    if (!d) return;
    const name = document.getElementById("f-name");
    const brand = document.getElementById("f-brand");
    const size = document.getElementById("f-size");
    const color = document.getElementById("f-color");
    const cat = document.getElementById("f-cat");
    const sub = document.getElementById("f-sub");
    if (name) d.name = name.value.trim();
    if (brand) d.brand = brand.value.trim();
    if (size) d.size = size.value.trim();
    if (color) d.color = color.value;
    if (cat) d.category = cat.value;
    if (sub) d.subtype = sub.value;
  }

  async function onPhoto(file) {
    if (!file || !state.draft) return;
    try {
      const { blob, canvas } = await Color.compressImage(file, 960);
      if (state.draft.previewURL && state.draft.previewURL.startsWith("blob:")) {
        URL.revokeObjectURL(state.draft.previewURL);
      }
      state.draft.photoBlob = blob;
      state.draft.previewURL = URL.createObjectURL(blob);
      state.draft.removePhoto = false;
      state.draft.color = Color.dominantFromCanvas(canvas);
      state.draft.fromPhoto = true;
      readDraftFields();
      state.draft.color = Color.dominantFromCanvas(canvas);
      renderEditor();
      toast("사진을 줄여서 넣었어요");
    } catch (err) {
      toast("사진을 읽지 못했어요");
    }
  }

  async function commitItem() {
    readDraftFields();
    const d = state.draft;
    if (!d.name) {
      toast("이름을 적어 주세요");
      return;
    }
    let photoId = d.removePhoto ? "" : (d.photoId || "");
    if (d.photoBlob) {
      photoId = photoId || uid("ph");
      const saved = await DB.savePhoto(photoId, d.photoBlob);
      if (!saved) {
        toast("사진 저장소를 못 열었어요. 옷 정보만 저장해요.");
        photoId = d.photoId || "";
      } else {
        if (state.urls[photoId]) URL.revokeObjectURL(state.urls[photoId]);
        state.urls[photoId] = URL.createObjectURL(d.photoBlob);
      }
    } else if (d.removePhoto && d.photoId) {
      await DB.deletePhoto(d.photoId);
      if (state.urls[d.photoId]) URL.revokeObjectURL(state.urls[d.photoId]);
      delete state.urls[d.photoId];
      photoId = "";
    }
    const prev = byId(d.id);
    const item = {
      id: d.id,
      brand: d.brand,
      name: d.name,
      category: d.category,
      subtype: d.subtype,
      color: Color.safeHex(d.color),
      seasons: d.seasons.slice(),
      size: d.size,
      volume: prev ? prev.volume : "",
      photoId,
      createdAt: prev ? prev.createdAt : Date.now()
    };
    await saveItem(item);
    closeSheet();
    toast(prev ? "고쳤어요" : "옷장에 넣었어요");
    render();
  }

  function openBackup() {
    openSheet(`
      <h2>백업</h2>
      <p class="hint">옷이랑 사진은 이 폰 브라우저에만 있어요. 기기를 바꾸기 전에 파일을 보내 두세요.</p>
      <div class="sheet-actions" style="flex-direction:column">
        <button class="solid" data-act="export">백업 파일 저장</button>
        <label class="soft filebtn">백업 불러오기
          <input id="importFile" type="file" accept="application/json,.json">
        </label>
        <button class="ghost" data-act="reseed">기본 옷장에서 없는 것만 채우기</button>
        <button class="ghost" data-act="close-sheet">닫기</button>
      </div>
    `);
  }

  async function exportBackup() {
    const items = [];
    for (const it of state.items) {
      const copy = Object.assign({}, it);
      if (it.photoId) {
        const blob = await DB.getPhoto(it.photoId);
        if (blob) copy.photo = await Color.blobToDataURL(blob);
      }
      items.push(copy);
    }
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      items,
      outfits: state.outfits
    };
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    const a = document.createElement("a");
    const stamp = payload.exportedAt.slice(0, 10);
    a.href = URL.createObjectURL(blob);
    a.download = `closet-backup-${stamp}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    toast("백업 파일을 저장했어요");
  }

  async function importBackup(file) {
    let data;
    try {
      data = JSON.parse(await file.text());
    } catch (err) {
      toast("JSON 파일이 아니에요");
      return;
    }
    if (!data || !Array.isArray(data.items)) {
      toast("옷장 백업 형식이 아니에요");
      return;
    }
    let n = 0;
    for (const raw of data.items) {
      if (!raw || !raw.id || !raw.name) continue;
      const item = {
        id: String(raw.id),
        brand: String(raw.brand || ""),
        name: String(raw.name),
        category: raw.category || "top",
        subtype: raw.subtype || "tee",
        color: Color.safeHex(raw.color || "#888888"),
        seasons: Array.isArray(raw.seasons) ? raw.seasons : ["spring", "summer", "fall", "winter"],
        size: String(raw.size || ""),
        volume: raw.volume || "",
        photoId: raw.photoId || "",
        createdAt: raw.createdAt || Date.now()
      };
      if (raw.photo && String(raw.photo).startsWith("data:")) {
        try {
          const blob = Color.dataURLToBlob(raw.photo);
          const pid = item.photoId || uid("ph");
          const ok = await DB.savePhoto(pid, blob);
          if (ok) {
            item.photoId = pid;
            if (state.urls[pid]) URL.revokeObjectURL(state.urls[pid]);
            state.urls[pid] = URL.createObjectURL(blob);
          }
        } catch (err) { /* 사진만 건너뜀 */ }
      }
      await saveItem(item);
      n += 1;
    }
    if (Array.isArray(data.outfits)) {
      for (const o of data.outfits) {
        if (!o || !o.id || o.source === "coach") continue;
        const outfit = {
          id: String(o.id),
          name: String(o.name || "이름 없는 코디"),
          slots: Object.assign(emptyLook().slots, o.slots || {}),
          toggles: Object.assign(emptyLook().toggles, o.toggles || {}),
          createdAt: o.createdAt || Date.now(),
          source: "user"
        };
        const idx = state.outfits.findIndex((x) => x.id === outfit.id);
        if (idx >= 0) state.outfits[idx] = outfit;
        else state.outfits.push(outfit);
        if (DB.ok) await DB.put("outfits", outfit);
      }
    }
    persistMirror();
    closeSheet();
    toast(`${n}벌을 가져왔어요`);
    render();
  }

  async function reseed() {
    let added = 0;
    for (const seed of Data.SEED) {
      if (byId(seed.id)) continue;
      await saveItem(Object.assign({ createdAt: Date.now() }, seed));
      added += 1;
    }
    closeSheet();
    toast(added ? `${added}벌을 채웠어요` : "기본 옷은 이미 다 있어요");
    render();
  }

  function askName() {
    openSheet(`
      <h2>코디 이름</h2>
      <label class="field"><span>뭐라고 부를까요</span>
        <input id="outfitName" type="text" maxlength="30" placeholder="예: 금요일 마실">
      </label>
      <div class="sheet-actions">
        <button class="ghost" data-act="close-sheet">취소</button>
        <button class="solid" data-act="confirm-save">저장</button>
      </div>
    `);
    setTimeout(() => {
      const el = document.getElementById("outfitName");
      if (el) el.focus();
    }, 50);
  }

  async function confirmSaveOutfit() {
    const name = (document.getElementById("outfitName") || {}).value || "";
    const trimmed = name.trim();
    if (!trimmed) {
      toast("이름을 적어 주세요");
      return;
    }
    if (!wornCount()) {
      toast("먼저 옷을 입혀 주세요");
      return;
    }
    const outfit = {
      id: uid("o"),
      name: trimmed,
      slots: Object.assign({}, state.look.slots),
      toggles: Object.assign({}, state.look.toggles),
      createdAt: Date.now(),
      source: "user"
    };
    state.outfits.push(outfit);
    if (DB.ok) await DB.put("outfits", outfit);
    persistMirror();
    closeSheet();
    toast("코디를 저장했어요");
    render();
  }

  document.body.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === "tab") setTab(btn.dataset.tab);
    else if (act === "cat") { state.cat = btn.dataset.cat; render(); }
    else if (act === "wear") toggleWear(btn.dataset.id);
    else if (act === "edit") openEditor(btn.dataset.id);
    else if (act === "add") openEditor(null);
    else if (act === "close-sheet") closeSheet();
    else if (act === "tog") {
      state.look.toggles[btn.dataset.key] = btn.dataset.val === "1";
      persistMirror();
      render();
    } else if (act === "clear-look") {
      state.look = emptyLook();
      state.caption = null;
      persistMirror();
      render();
    } else if (act === "save-look") askName();
    else if (act === "confirm-save") confirmSaveOutfit();
    else if (act === "load-outfit") {
      const o = state.outfits.find((x) => x.id === btn.dataset.id);
      if (o) applySlots(o.slots, o.toggles, null);
    } else if (act === "del-outfit") {
      const id = btn.dataset.id;
      state.outfits = state.outfits.filter((o) => o.id !== id);
      if (DB.ok) DB.del("outfits", id);
      persistMirror();
      render();
      toast("코디를 지웠어요");
    } else if (act === "season") { state.season = btn.dataset.id; state.today = null; render(); }
    else if (act === "occ") { state.occasion = btn.dataset.id; state.today = null; render(); }
    else if (act === "today") runToday(false);
    else if (act === "today-next") runToday(true);
    else if (act === "wear-today" && state.today && state.today.ok) {
      applySlots(state.today.slots, state.today.toggles, { title: "오늘의 추천", tips: [state.today.reason] });
    } else if (act === "wear-coach") {
      const c = Data.COACH.find((x) => x.id === btn.dataset.id);
      if (!c) return;
      applySlots(coachToSlots(c), { tuck: c.tuck, outerOpen: c.outerOpen, hemRoll: c.hemRoll }, { title: c.title, tips: c.tips });
    } else if (act === "preset") {
      readDraftFields();
      state.draft.color = btn.dataset.color;
      state.draft.fromPhoto = false;
      renderEditor();
    } else if (act === "season-tog") {
      readDraftFields();
      const id = btn.dataset.id;
      const has = state.draft.seasons.includes(id);
      state.draft.seasons = has ? state.draft.seasons.filter((s) => s !== id) : state.draft.seasons.concat(id);
      renderEditor();
    } else if (act === "rm-photo") {
      readDraftFields();
      state.draft.removePhoto = true;
      state.draft.photoBlob = null;
      if (state.draft.previewURL && state.draft.previewURL.startsWith("blob:")) URL.revokeObjectURL(state.draft.previewURL);
      state.draft.previewURL = "";
      state.draft.fromPhoto = false;
      renderEditor();
    } else if (act === "save-item") commitItem();
    else if (act === "delete-item") {
      const id = state.draft && state.draft.id;
      if (!id) return;
      if (!state.draft.confirmDelete) {
        readDraftFields();
        state.draft.confirmDelete = true;
        renderEditor();
        return;
      }
      removeItem(id).then(() => {
        closeSheet();
        toast("옷장에서 뺐어요");
        render();
      });
    } else if (act === "backup") openBackup();
    else if (act === "export") exportBackup();
    else if (act === "reseed") reseed();
  });

  document.body.addEventListener("input", (e) => {
    if (e.target.id === "q") {
      state.q = e.target.value;
      render();
    } else if (e.target.id === "f-color" && state.draft) {
      state.draft.color = e.target.value;
      state.draft.fromPhoto = false;
      const label = e.target.parentElement && e.target.parentElement.querySelector("span:last-child");
      if (label) label.textContent = Color.nearestPreset(e.target.value) || e.target.value;
    }
  });

  document.body.addEventListener("change", (e) => {
    if (e.target.id === "camInput" || e.target.id === "fileInput") {
      const file = e.target.files && e.target.files[0];
      if (file) onPhoto(file);
    } else if (e.target.id === "f-cat" && state.draft) {
      readDraftFields();
      const cat = Data.CATEGORIES.find((c) => c.id === state.draft.category);
      if (cat && !cat.subtypes.some((s) => s[0] === state.draft.subtype)) {
        state.draft.subtype = cat.subtypes[0][0];
      }
      renderEditor();
    } else if (e.target.id === "f-sub") {
      readDraftFields();
    } else if (e.target.id === "importFile") {
      const file = e.target.files && e.target.files[0];
      if (file) importBackup(file);
    }
  });

  document.getElementById("fab").addEventListener("click", () => openEditor(null));
  document.getElementById("backupBtn").addEventListener("click", openBackup);

  init().catch((err) => {
    console.error(err);
    document.getElementById("view").innerHTML = `<p class="empty">옷장을 열지 못했어요. 브라우저를 한 번 새로고침해 주세요.</p>`;
  });
})();
