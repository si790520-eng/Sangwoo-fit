/* 규칙 기반 오늘의 추천. 쇼핑 링크 없음. */
(function (root) {
  const D = () => root.ClosetData;
  const C = () => root.ClosetColor;

  function volumeOf(item) {
    if (!item) return "regular";
    if (item.volume === "big") return "big";
    if (["puffer", "padding", "hoodie"].includes(item.subtype)) return "big";
    if (["wide", "curved"].includes(item.subtype)) return "big";
    const blob = `${item.name || ""} ${item.brand || ""}`;
    if (/루즈|오버|Oversized|oversized/i.test(blob)) return "big";
    return "regular";
  }

  function slotOf(item) {
    return {
      bottom: "bottom", shoes: "shoes", acc: "belt", outer: "outer",
      knit: "knit", shirt: "shirt", sweat: "sweat", top: "inner"
    }[item.category] || null;
  }

  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function choice(rng, arr) {
    if (!arr.length) return null;
    return arr[Math.floor(rng() * arr.length)];
  }

  function unique(arr) {
    return [...new Set(arr)];
  }

  function inSeason(item, season) {
    if (!item.seasons || !item.seasons.length) return true;
    return item.seasons.includes(season);
  }

  function group(items, season) {
    const g = { bottom: [], shoes: [], belt: [], outer: [], knit: [], shirt: [], sweat: [], inner: [] };
    for (const it of items) {
      if (!inSeason(it, season)) continue;
      const s = slotOf(it);
      if (s) g[s].push(it);
    }
    return g;
  }

  function colorNames(items) {
    const fams = unique(items.filter((i) => i && i.category !== "acc").map((i) => C().family(i.color)));
    return fams.map((f) => C().FAM_KO[f] || f);
  }

  function evaluate(pick, ctx) {
    const notes = [];
    const tops = [pick.inner, pick.shirt, pick.sweat, pick.knit, pick.outer].filter(Boolean);
    if (!pick.bottom || !pick.shoes || !tops.length) return { score: -999, notes, toggles: defaultToggles() };

    let score = 24;
    const date = ctx.occasion === "date";
    const boot = ["boot", "combat"].includes(pick.shoes.subtype);

    if (date) {
      if (pick.shirt || pick.knit || pick.inner && pick.inner.subtype === "polo") {
        score += 8;
        notes.push("셔츠·니트·카라로 단정하게 잡았어요");
      }
      if (pick.bottom.subtype === "chino") {
        score += 7;
        notes.push("치노라 실루엣이 정돈돼요");
      }
      if (pick.shoes.subtype === "derby" || pick.shoes.subtype === "boot") score += 6;
      if (pick.shoes.subtype === "combat") score -= 5;
      if (pick.outer && ["coat", "balmacaan"].includes(pick.outer.subtype)) score += 5;
      if (volumeOf(pick.bottom) === "big" && !pick.shirt && !pick.knit) score -= 4;
      if (pick.sweat && !pick.outer && !pick.knit) score -= 5;
    } else {
      if (pick.shoes.subtype === "sneaker") score += 6;
      if (["wide", "semi", "straight", "curved"].includes(pick.bottom.subtype)) score += 4;
      if (pick.sweat || (pick.inner && pick.inner.subtype === "tee")) score += 3;
      if (pick.outer && ["denimjacket", "bomber", "leather", "puffer"].includes(pick.outer.subtype)) score += 3;
      if (pick.shoes.subtype === "derby" && !pick.shirt && !(pick.inner && pick.inner.subtype === "polo")) score -= 3;
      if (pick.bottom.subtype === "chino" && pick.sweat) score += 1;
    }

    const colored = [pick.bottom, pick.shoes, pick.inner, pick.shirt, pick.sweat, pick.knit, pick.outer].filter(Boolean);
    const fams = unique(colored.filter((i) => i.category !== "acc").map((i) => C().family(i.color)));
    if (fams.length > 3) score -= 14 * (fams.length - 3);
    else score += 8;

    const lights = colored.map((i) => C().luma(i.color));
    const range = Math.max(...lights) - Math.min(...lights);
    const cloth = colored.filter((i) => i !== pick.shoes);
    const clothAvg = cloth.reduce((s, i) => s + C().luma(i.color), 0) / (cloth.length || 1);
    const shoeL = C().luma(pick.shoes.color);
    const toneOnTone = fams.length <= 2 && range < 78;
    if (toneOnTone) {
      if (Math.abs(shoeL - clothAvg) >= 42) {
        score += 12;
        notes.push("톤이 비슷해서 신발로 대비를 줬어요");
      } else score -= 20;
    }

    const bigTop = tops.some((i) => volumeOf(i) === "big");
    const bigBot = volumeOf(pick.bottom) === "big";
    if (bigTop && bigBot) score -= 30;
    else if (bigBot) {
      score += 6;
      notes.push("와이드 하의라 상의는 부피가 덜한 쪽으로 골랐어요");
    }

    if (pick.sweat && pick.knit) score -= 7;
    if (ctx.season === "summer" && pick.outer) score -= 10;
    if ((ctx.season === "winter" || ctx.season === "fall") && pick.outer && (pick.knit || pick.sweat || pick.shirt)) score += 4;
    if (ctx.season === "summer" && !pick.outer) score += 3;

    const warm = fams.some((f) => f === "camel" || f === "brown" || f === "khaki");
    const cool = fams.some((f) => f === "navy" || f === "blue" || f === "sky");
    if (warm && cool) score += 4;
    if (fams.includes("black") && (fams.includes("white") || fams.includes("lightgray"))) score += 3;

    const toggles = {
      hemRoll: !!boot || (pick.bottom.subtype === "straight" && pick.shoes.subtype !== "boot" && pick.shoes.subtype !== "combat" && ctx.rng() < 0.55 && !bigBot),
      tuck: false,
      outerOpen: true
    };
    if (boot) {
      toggles.hemRoll = true;
      score += 5;
      notes.push("부츠라 밑단은 접어 두는 조합이에요");
    } else if (bigBot) {
      toggles.hemRoll = false;
    }
    const canTuck = !pick.sweat && pick.bottom.subtype === "chino" && (pick.shirt || pick.knit || pick.inner);
    if (date && canTuck) {
      toggles.tuck = true;
      notes.push("허리가 보이게 넣어 입는 쪽이에요");
    } else if (!date && bigBot) {
      toggles.tuck = false;
    } else if (canTuck && pick.shirt) {
      toggles.tuck = date;
    }

    if (pick.outer) {
      const zipUp = ["balmacaan", "puffer", "bomber"].includes(pick.outer.subtype);
      toggles.outerOpen = zipUp ? false : true;
      if (!date && pick.outer.subtype === "coat") toggles.outerOpen = true;
      if (date && pick.outer.subtype === "coat" && ctx.rng() < 0.45) toggles.outerOpen = false;
    }

    if (fams.length <= 3) {
      const names = colorNames(colored);
      notes.push(`색은 ${names.join("·")} ${names.length}가지예요`);
    }

    score += ctx.rng() * 2.5;
    return { score, notes, toggles };
  }

  function defaultToggles() {
    return { tuck: false, outerOpen: true, hemRoll: false };
  }

  function reasonText(season, occasion, notes) {
    const sName = D().seasonName(season);
    const oName = occasion === "date" ? "데이트" : "마실";
    const body = unique(notes).slice(0, 3).join(". ");
    return `${sName} ${oName}에 맞춰 지금 옷장에서 골랐어요. ${body}.`.replace(/\.\./g, ".").replace(/예요\./g, "예요.");
  }

  function generate(items, opts) {
    const season = opts.season;
    const occasion = opts.occasion === "date" ? "date" : "casual";
    const salt = opts.salt || 0;
    const day = opts.day || "";
    const g = group(items, season);
    if (!g.bottom.length || !g.shoes.length || !(g.inner.length || g.shirt.length || g.sweat.length || g.knit.length)) {
      return {
        ok: false,
        reason: "이 계절에 하의·신발·상의가 부족해요. 계절 체크를 늘리거나 옷을 더 넣어 주세요."
      };
    }
    const rng = mulberry32(hashStr(`${day}|${season}|${occasion}|${salt}|${items.length}`));
    let best = null;
    for (let n = 0; n < 280; n++) {
      const pick = {
        bottom: choice(rng, g.bottom),
        shoes: choice(rng, g.shoes),
        inner: null, shirt: null, sweat: null, knit: null, outer: null, belt: null
      };
      const formalTop = occasion === "date";
      if (g.shirt.length && rng() < (formalTop ? 0.72 : 0.28)) pick.shirt = choice(rng, g.shirt);
      if (g.inner.length && (rng() < (pick.shirt ? 0.55 : 0.86))) pick.inner = choice(rng, g.inner);
      if (!pick.inner && !pick.shirt && g.sweat.length) pick.sweat = choice(rng, g.sweat);
      else if (!formalTop && g.sweat.length && rng() < 0.48 && !pick.shirt) pick.sweat = choice(rng, g.sweat);
      if (g.knit.length && season !== "summer" && rng() < (formalTop ? 0.62 : 0.34) && !pick.sweat) {
        pick.knit = choice(rng, g.knit);
      }
      const outerP = { summer: 0.04, spring: 0.62, fall: 0.84, winter: 0.94 }[season] || 0.5;
      if (g.outer.length && rng() < outerP) pick.outer = choice(rng, g.outer);
      if (formalTop && g.belt.length && pick.bottom && pick.bottom.subtype === "chino" && rng() < 0.75) {
        pick.belt = choice(rng, g.belt);
      }
      const ctx = { season, occasion, rng };
      const ev = evaluate(pick, ctx);
      if (!best || ev.score > best.ev.score) best = { pick, ev };
    }
    if (!best || best.ev.score < 10) {
      return { ok: false, reason: "조건에 맞는 조합이 잘 안 나와요. 계절이나 자리를 바꿔 보세요." };
    }
    const itemsPicked = ["bottom", "inner", "shirt", "sweat", "knit", "outer", "shoes", "belt"]
      .map((k) => best.pick[k]).filter(Boolean);
    return {
      ok: true,
      slots: {
        bottom: best.pick.bottom && best.pick.bottom.id,
        inner: best.pick.inner && best.pick.inner.id,
        shirt: best.pick.shirt && best.pick.shirt.id,
        sweat: best.pick.sweat && best.pick.sweat.id,
        knit: best.pick.knit && best.pick.knit.id,
        outer: best.pick.outer && best.pick.outer.id,
        shoes: best.pick.shoes && best.pick.shoes.id,
        belt: best.pick.belt && best.pick.belt.id
      },
      items: itemsPicked,
      toggles: best.ev.toggles,
      reason: reasonText(season, occasion, best.ev.notes),
      score: Math.round(best.ev.score)
    };
  }

  root.ClosetReco = { generate, volumeOf, slotOf };
})(typeof window !== "undefined" ? window : globalThis);
