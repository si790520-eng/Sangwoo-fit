#!/usr/bin/env python3
"""브랜드 공식 영양정보 → brand_foods.js

원자료는 각 브랜드 공식 페이지/API에서 받은 JSON·HTML (/tmp/foodsrc).
값을 계산해 채우지 않아요. 공식 표에 없는 탄수·총지방은 null로 둡니다.
"""
from __future__ import annotations

import html as HTML
import json
import re
from collections import Counter, OrderedDict
from pathlib import Path

SRC = Path("/tmp/foodsrc")
OUT = Path(__file__).resolve().parent.parent / "brand_foods.js"
REPORT = Path("/tmp/foodsrc/brand_report.json")
CHECKED = "2026-11-11"


def parse_num(s):
    if s is None:
        return None
    s = str(s).strip()
    if s in ("", "-", "–", "—", "N/A", "n/a"):
        return None
    if re.search(r"\d+\s*[-~～]\s*\d+", s):
        return "RANGE"
    if "미만" in s:
        return None
    s = s.replace(",", "")
    m = re.search(r"(-?\d+(?:\.\d+)?)", s)
    return float(m.group(1)) if m else None


def nkey(s):
    return re.sub(r"[\s·・.()\[\]{}®™*'\-_/]", "", str(s or "")).lower()


def parse_protein(s):
    return parse_num(s)


def aka(*parts):
    seen, out = set(), []
    for p in parts:
        if not p:
            continue
        for w in str(p).split():
            w = w.strip()
            k = w.lower()
            if w and k not in seen:
                seen.add(k)
                out.append(w)
    return " ".join(out)


def extra_aka(name):
    bits = []
    n = name
    if "몬스터와퍼" in n or "몬스터 와퍼" in n:
        bits += ["몬스터", "와퍼", "몬와", "monster", "whopper"]
    if "몬스터" in n:
        bits += ["몬스터"]
    if any(x in n for x in ("프렌치프라이", "후렌치", "포테이토", "양념감자")):
        bits += ["감튀", "감자튀김", "감자", "프라이", "fries"]
    if "너겟" in n:
        bits += ["너겟", "치킨너겟", "nugget"]
    if "어니언" in n:
        bits += ["양파링", "어니언링", "onion"]
    if "콜라" in n:
        bits += ["콜라", "코크", "coke", "cola"]
    if "와퍼" in n:
        bits += ["와퍼", "whopper"]
    if "빅맥" in n:
        bits += ["빅맥", "bigmac"]
    if "상하이" in n:
        bits += ["상하이"]
    if "아메리카노" in n:
        bits += ["아아", "아메리카노", "americano"]
    if "카페라떼" in n or "카페 라떼" in n:
        bits += ["라떼", "카페라떼", "latte"]
    if "프라푸치노" in n:
        bits += ["프라푸", "frappuccino"]
    return bits


def item_base(id_, name, cat, src, src_name, src_note, k, p, c, f, unit, por, aka_s,
              each=False, note="", state="1회 제공량"):
    rec = {
        "id": id_,
        "name": name,
        "cat": cat,
        "k": k,
        "p": p,
        "c": c,
        "f": f,
        "unit": unit,
        "src": src,
        "srcName": src_name,
        "srcNote": src_note,
        "state": state,
        "est": False,
        "note": note or "",
        "por": por,
        "aka": aka_s,
    }
    if each:
        rec["each"] = True
    return rec


def per100_from_serving(kcal, protein, carbs, fat, weight):
    if not weight or weight <= 0:
        return None
    def sc(v):
        return None if v is None else round(v * 100.0 / weight, 4)
    return sc(kcal), sc(protein), sc(carbs), sc(fat)


# ───────── Burger King ─────────
def load_bk():
    items = json.loads((SRC / "bk_items.json").read_text())
    cals = json.loads((SRC / "bk_cals.json").read_text())
    nutri_raw = json.loads((SRC / "bk_nutri.json").read_text())
    rows = nutri_raw["body"]["allNutrientList"]
    by_name = {}
    for r in rows:
        k = nkey(r.get("menuNm"))
        by_name.setdefault(k, []).append(r)

    def pick_nutri(name):
        cand = by_name.get(nkey(name), [])
        usable = []
        for r in cand:
            kcal = parse_num(r.get("calory"))
            w = parse_num(r.get("weight"))
            if kcal == "RANGE" or w == "RANGE":
                continue
            if not w or w <= 0 or kcal is None:
                continue
            usable.append((kcal, w, parse_protein(r.get("protein")), r))
        if not usable:
            return None
        uniq = {(a, b, c) for a, b, c, _ in usable}
        if len(uniq) > 1:
            return None  # 같은 이름에 값이 여러 개면 추측하지 않음
        return usable[0]

    out, skipped = [], []
    seen_name = set()
    for it in items:
        nm = (it.get("menuNm") or "").strip()
        cd = str(it.get("menuCd"))
        if not nm or not cd:
            continue
        nk = nkey(nm)
        if nk in seen_name:
            skipped.append(("dup_name", nm, cd))
            continue
        seen_name.add(nk)
        calinfo = cals.get(cd) or {}
        menu_kcal = parse_num(calinfo.get("menuCalorie"))
        components = (calinfo.get("menuComponents") or it.get("menuComponents") or "") or ""
        catnm = it.get("menuCategoryNm") or ""
        nut = pick_nutri(nm)

        brand = "버거킹"
        display = f"{brand} {nm}"
        extras = extra_aka(nm) + ["버거킹", "버킹", "bk", "burgerking"]
        cat = "음료" if "음료" in catnm and "디저트" not in nm else (
            "간식" if any(x in nm for x in ("선데", "아이스크림", "파이", "킹퓨전", "아포가토")) else "외식·패스트푸드"
        )
        if "음료&디저트" in catnm and any(x in nm for x in ("콜라", "사이다", "환타", "제로", "아메리카노", "라떼", "주스", "에이드", "아이스티", "미닛메이드")):
            cat = "음료"

        if "라지세트" in nm.replace(" ", ""):
            por_lbl = "라지세트 1개"
        elif "세트" in nm:
            por_lbl = "세트 1개"
        elif nkey(nm) in ("프렌치프라이r", "프렌치프라이(r)".replace("(", "").replace(")", "")) or "프렌치프라이(r)" in nkey(nm) or nm.replace(" ", "") == "프렌치프라이(R)":
            por_lbl = "감자튀김 R 1개"
        elif nm.replace(" ", "") == "프렌치프라이(L)":
            por_lbl = "감자튀김 L 1개"
        elif "조각" in nm:
            por_lbl = nm.split()[-1] if nm.split()[-1].endswith("조각") or "조각" in nm else "1개"
            # keep e.g. "4조각"
            m = re.search(r"(\d+\s*조각)", nm)
            por_lbl = m.group(1).replace(" ", "") + "" if m else "1개"
            if m:
                por_lbl = m.group(1).replace(" ", "")
        elif any(x in nm for x in ("콜라", "사이다", "환타", "제로", "아메리카노", "라떼", "주스", "에이드")):
            por_lbl = "1잔"
        elif "시즈닝" in nm or "소스" in nm:
            por_lbl = "1개"
        else:
            por_lbl = "단품 1개" if any(x in catnm for x in ("와퍼", "프리미엄", "오리지널", "치킨", "추천", "모닝")) and "세트" not in nm else "1개"

        note = f"구성: {components}" if components else ""
        src_common = f"버거킹 공식 영양정보(burgerking.co.kr, {CHECKED} 확인)."

        if nut:
            kcal, w, prot, _r = nut
            pk = per100_from_serving(kcal, prot, None, None, w)
            src_note = (
                f"{src_common} 1개 {gfmt(w)}g · {gfmt(kcal)}kcal"
                + (f" · 단백질 {gfmt(prot)}g" if prot is not None else "")
                + ". 총 탄수화물·총 지방은 공식 표에 없어요."
            )
            out.append(item_base(
                f"br:bk:{cd}", display, cat, "버거킹", nm, src_note,
                pk[0], pk[1], None, None, "g",
                [[por_lbl, round(w, 1) if w != int(w) else int(w)]],
                aka(brand, nm, *extras),
                each=False, note=note,
            ))
        elif menu_kcal is not None and menu_kcal != "RANGE":
            src_note = (
                f"{src_common} 공식 메뉴 열량 {gfmt(menu_kcal)}kcal."
                + (f" 구성 {components}." if components else "")
                + " 중량·단백질·총 탄수화물·총 지방은 현재 공식 표에 없어요."
            )
            # 제로 음료 열량 0은 공식 값
            out.append(item_base(
                f"br:bk:{cd}", display, cat, "버거킹", nm, src_note,
                menu_kcal, None, None, None, "개",
                [[por_lbl, 1]],
                aka(brand, nm, *extras),
                each=True, note=note,
            ))
        else:
            skipped.append(("no_kcal", nm, cd))
    return out, skipped


def gfmt(n):
    if n is None:
        return ""
    if abs(n - round(n)) < 1e-9:
        return f"{int(round(n)):,}"
    return f"{n:g}"


# ───────── McDonald's ─────────
def parse_nf(s):
    if not s or s == "-":
        return {}
    out = {}
    for part in s.split(","):
        if ";" not in part:
            continue
        k, v = part.split(";", 1)
        out[k.strip()] = v.strip()
    return out


def load_mcd():
    data = json.loads((SRC / "mcd_nut.json").read_text())
    lst = data["resultObject"]["list"]
    out, skipped = [], []
    seen = set()
    for x in lst:
        nm = (x.get("menuName") or "").strip()
        seq = x.get("seq")
        if not nm or seq is None:
            continue
        nk = nkey(nm)
        if nk in seen:
            skipped.append(("dup", nm, seq))
            continue
        seen.add(nk)
        group = x.get("menuGroup") or ""
        nf = parse_nf(x.get("nutritionFacts"))
        raw_cal = x.get("calorie")
        kcal = parse_num(nf.get("열량")) if nf.get("열량") else parse_num(raw_cal)
        if kcal == "RANGE":
            skipped.append(("range", nm, raw_cal))
            continue
        w_s = nf.get("중량") or ""
        w = parse_num(w_s)
        unit = "ml" if w_s and re.search(r"ml", w_s, re.I) else "g"
        prot = parse_protein(nf.get("단백질"))
        cat = "음료" if group == "음료" else (
            "간식" if group in ("디저트",) else "외식·패스트푸드"
        )
        extras = extra_aka(nm) + ["맥도날드", "맥날", "맥도", "mcdonalds", "맥도널드"]
        display = f"맥도날드 {nm}"
        src_common = f"맥도날드 공식 영양분석표(mcdonalds.co.kr, 표 수정일 2026.11.11, {CHECKED} 확인)."

        if "라지" in group and "세트" in group:
            por_lbl = "라지세트 1개"
        elif "세트" in group or nm.endswith("세트"):
            por_lbl = "세트 1개"
        elif "후라이" in nm or "후렌치" in nm:
            por_lbl = "감자튀김 1개"
        elif "조각" in nm:
            m = re.search(r"(\d+\s*조각)", nm)
            por_lbl = m.group(1).replace(" ", "") if m else "1개"
        elif group == "음료":
            por_lbl = "1잔"
        elif group in ("버거", "단품"):
            por_lbl = "단품 1개"
        else:
            por_lbl = "1개"

        if nf and w and w > 0 and kcal is not None:
            pk = per100_from_serving(kcal, prot, None, None, w)
            src_note = (
                f"{src_common} 1개 {gfmt(w)}{unit} · {gfmt(kcal)}kcal"
                + (f" · 단백질 {gfmt(prot)}g" if prot is not None else "")
                + ". 총 탄수화물·총 지방은 공식 표에 없어요(포화지방·당·나트륨·카페인은 표기)."
            )
            ww = round(w, 1) if w != int(w) else int(w)
            out.append(item_base(
                f"br:mcd:{seq}", display, cat, "맥도날드", nm, src_note,
                pk[0], pk[1], None, None, unit,
                [[por_lbl, ww]], aka("맥도날드", nm, *extras),
            ))
        elif kcal is not None:
            src_note = (
                f"{src_common} 공식 열량 {gfmt(kcal)}kcal. 중량·단백질·총 탄수화물·총 지방은 이 항목의 공식 표에 없어요."
            )
            out.append(item_base(
                f"br:mcd:{seq}", display, cat, "맥도날드", nm, src_note,
                kcal, None, None, None, "개",
                [[por_lbl, 1]], aka("맥도날드", nm, *extras), each=True,
            ))
        else:
            skipped.append(("no_kcal", nm, raw_cal))
    return out, skipped


# ───────── Lotteria ─────────
def load_lotte():
    raw = (SRC / "lotte.html").read_text(encoding="utf-8", errors="ignore")
    rows = re.findall(r"<tr[^>]*>(.*?)</tr>", raw, re.S | re.I)
    out, skipped = [], []
    section = ""
    seen = set()
    for r in rows[1:]:
        cells = re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", r, re.S | re.I)
        cells = [" ".join(re.sub("<[^>]+>", "", HTML.unescape(c)).split()) for c in cells]
        if not cells:
            continue
        # header-like
        if cells[0] == "구분":
            continue
        # detect section label when first cell is a category with rowspan
        if len(cells) >= 11:
            section, name = cells[0], cells[1]
            weight, kcal, prot = cells[3], cells[4], cells[5]
        elif len(cells) == 10:
            name = cells[0]
            weight, kcal, prot = cells[2], cells[3], cells[4]
        elif len(cells) == 9:
            name = cells[0]
            weight, kcal, prot = cells[2], cells[3], cells[4]
        else:
            skipped.append(("short_or_range", cells[0] if cells else "", " ".join(cells)))
            continue
        w = parse_num(weight)
        k = parse_num(kcal)
        p = parse_protein(prot)
        if w == "RANGE" or k == "RANGE":
            skipped.append(("range", name, weight or kcal))
            continue
        if not name or w is None or w <= 0 or k is None:
            skipped.append(("unparseable", name, f"{weight}/{kcal}"))
            continue
        nk = nkey(name)
        if nk in seen:
            skipped.append(("dup", name, ""))
            continue
        seen.add(nk)
        if "드링크" in section or any(x in name for x in ("아메리카노", "라떼", "콜라", "사이다", "에이드", "아이스티", "티")):
            cat, unit, por_lbl = "음료", "ml", "1잔"
        elif "디저트" in section or any(x in name for x in ("토네이도", "빙수")):
            cat, unit, por_lbl = "간식", "g", "1개"
        else:
            cat, unit, por_lbl = "외식·패스트푸드", "g", "1개"
        if "포테이토" in name:
            por_lbl = "감자튀김 L 1개" if "(L)" in name else "감자튀김 1개"
            extras_f = extra_aka(name)
        else:
            extras_f = extra_aka(name)
        extras_f += ["롯데리아", "리아", "lotteria"]
        display = f"롯데리아 {name}"
        pk = per100_from_serving(k, p, None, None, w)
        src_note = (
            f"롯데리아 공식 영양성분표(lotteeatz.com/upload/etc/ria/items.html, 게시 2026.10.29, {CHECKED} 확인). "
            f"1개 {gfmt(w)}{unit} · {gfmt(k)}kcal"
            + (f" · 단백질 {gfmt(p)}g" if p is not None else "")
            + ". 총 탄수화물·총 지방은 공식 표에 없어요."
        )
        ww = round(w, 1) if w != int(w) else int(w)
        out.append(item_base(
            f"br:lt:{nk[:40]}", display, cat, "롯데리아", name, src_note,
            pk[0], pk[1], None, None, unit,
            [[por_lbl, ww]], aka("롯데리아", name, *extras_f),
        ))
    return out, skipped


# ───────── Starbucks ─────────
def load_sb(path, kind):
    lst = json.loads(Path(path).read_text())
    out, skipped = [], []
    seen = set()
    for x in lst:
        nm = (x.get("product_NM") or "").strip()
        cd = str(x.get("product_CD") or "").strip()
        if not nm or not cd:
            continue
        if cd in seen:
            skipped.append(("dup", nm, cd))
            continue
        seen.add(cd)
        kcal = parse_num(x.get("kcal"))
        prot = parse_num(x.get("protein"))
        carbs = parse_num(x.get("chabo"))
        fat = parse_num(x.get("fat"))
        if kcal == "RANGE" or prot == "RANGE":
            skipped.append(("range", nm, cd))
            continue
        cate = x.get("_cate") or x.get("cate_NAME") or kind
        if kcal is None:
            skipped.append(("no_kcal", nm, cd))
            continue
        # 푸드인데 열량·단백·탄수·지방이 모두 0이면 미입력 자리로 보고 건너뜀
        if kind == "food" and kcal == 0 and (prot or 0) == 0 and (carbs or 0) == 0 and (fat or 0) == 0:
            skipped.append(("placeholder0", nm, cd))
            continue
        if kind == "drink":
            cat = "음료"
            if re.search(r"\d+\s*ml", nm, re.I):
                por_lbl = "1병"
            else:
                por_lbl = "Tall 1잔"
            note = "공식 표기: Tall 사이즈 기준" if por_lbl == "Tall 1잔" else ""
        else:
            if cate in ("bakery", "cake", "snack", "icecream", "fruit_yogurt"):
                cat = "간식"
            else:
                cat = "외식·패스트푸드"
            por_lbl = "1개"
            note = ""
        extras = extra_aka(nm) + ["스타벅스", "스벅", "starbucks", "sbux"]
        display = f"스타벅스 {nm}"
        src_note = (
            f"스타벅스 공식 영양정보(starbucks.co.kr 메뉴 productListAjax, {CHECKED} 확인). "
            f"{'음료는 Tall 사이즈 기준. ' if kind == 'drink' and por_lbl == 'Tall 1잔' else ''}"
            f"1회 {gfmt(kcal)}kcal"
            + (f" · 단백질 {gfmt(prot)}g" if prot is not None else "")
            + (f" · 탄수 {gfmt(carbs)}g" if carbs is not None else "")
            + (f" · 지방 {gfmt(fat)}g" if fat is not None else "")
            + "."
        )
        out.append(item_base(
            f"br:sb:{cd}", display, cat, "스타벅스", nm, src_note,
            kcal, prot, carbs, fat, "개",
            [[por_lbl, 1]], aka("스타벅스", nm, *extras),
            each=True, note=note,
        ))
    return out, skipped


def main():
    all_items = []
    report = {"checked": CHECKED, "sources": [], "skipped": {}, "counts": {}, "missing_cf": []}

    bk, sk = load_bk()
    all_items.extend(bk)
    report["skipped"]["버거킹"] = sk
    report["counts"]["버거킹"] = len(bk)
    report["sources"].append({
        "name": "버거킹 공식 영양정보",
        "url": "https://www.burgerking.co.kr/",
        "detail": "BKR0632 현재 메뉴, BKR0634 메뉴 열량, BKR0347 영양성분(중량·열량·단백질·당류·포화지방·나트륨·카페인). 총 탄수화물·총 지방 없음.",
    })

    mcd, sk = load_mcd()
    all_items.extend(mcd)
    report["skipped"]["맥도날드"] = sk
    report["counts"]["맥도날드"] = len(mcd)
    report["sources"].append({
        "name": "맥도날드 공식 영양분석표",
        "url": "https://www.mcdonalds.co.kr/kor/menu/information/nutrition",
        "api": "https://www.mcdonalds.co.kr/api/v1/kor/product/nutrition",
        "detail": "표 수정일 2026.11.11. 컬럼: 중량, 열량, 포화지방, 당, 단백질, 나트륨, 카페인. 세트 열량 범위(예: 980-1173)는 값을 고르지 않고 제외.",
    })

    lt, sk = load_lotte()
    all_items.extend(lt)
    report["skipped"]["롯데리아"] = sk
    report["counts"]["롯데리아"] = len(lt)
    report["sources"].append({
        "name": "롯데리아 공식 영양성분표",
        "url": "https://www.lotteeatz.com/upload/etc/ria/items.html",
        "detail": "게시 2026.10.29. 중량·열량·단백질·나트륨·당류·포화지방·카페인. 세트 열량 범위는 제외.",
    })

    sb_d, sk1 = load_sb(SRC / "sb_drinks.json", "drink")
    sb_f, sk2 = load_sb(SRC / "sb_foods.json", "food")
    all_items.extend(sb_d)
    all_items.extend(sb_f)
    report["skipped"]["스타벅스음료"] = sk1
    report["skipped"]["스타벅스푸드"] = sk2
    report["counts"]["스타벅스 음료"] = len(sb_d)
    report["counts"]["스타벅스 푸드"] = len(sb_f)
    report["sources"].append({
        "name": "스타벅스 공식 메뉴 영양정보",
        "url": "https://www.starbucks.co.kr/menu/drink_list.do",
        "api": "https://www.starbucks.co.kr/menu/productListAjax.do",
        "detail": "음료는 페이지에 Tall 사이즈 기준이라고 적혀 있어요. API 필드 kcal/protein/chabo(탄수)/fat(지방).",
    })

    # 카테고리별
    report["by_cat"] = dict(Counter(i["cat"] for i in all_items))
    report["total"] = len(all_items)
    miss = [i["name"] for i in all_items if i["c"] is None or i["f"] is None]
    report["missing_cf_count"] = len(miss)
    report["missing_protein_count"] = sum(1 for i in all_items if i["p"] is None)
    report["each_count"] = sum(1 for i in all_items if i.get("each"))

    # 몬스터와퍼 확인
    mw = [i for i in all_items if "몬스터와퍼" in i["name"]]
    report["monster"] = [{
        "name": i["name"], "k": i["k"], "p": i["p"], "c": i["c"], "f": i["f"],
        "each": i.get("each", False), "por": i["por"], "note": i.get("note"),
        "srcNote": i["srcNote"],
    } for i in mw]

    header = f"""/* 브랜드 공식 영양정보 — tools/build_brand_foods.py 가 만들어요. 직접 고치지 마세요.
   확인일 {CHECKED}. 공식 출처만 썼고, 표에 없는 탄수·총지방은 null 이에요.
   each:true 항목은 k/p/c/f 가 1회 제공량당(100g당이 아님)이에요. */
(function () {{
  var extra = """

    body = json.dumps(all_items, ensure_ascii=False, separators=(",", ":"))
    footer = """;
  window.FOODS = (window.FOODS || []).concat(extra);
})();
"""
    OUT.write_text(header + body + footer, encoding="utf-8")
    # skipped tuples may not be json-friendly already are
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2, default=str), encoding="utf-8")
    print("wrote", OUT, "items", len(all_items), "bytes", OUT.stat().st_size)
    print("counts", report["counts"])
    print("by_cat", report["by_cat"])
    print("missing_cf", report["missing_cf_count"], "missing_p", report["missing_protein_count"], "each", report["each_count"])
    print("monster:")
    for i in mw:
        print(" ", i["name"], "k", i["k"], "p", i["p"], "each", i.get("each"), "por", i["por"])


if __name__ == "__main__":
    main()
