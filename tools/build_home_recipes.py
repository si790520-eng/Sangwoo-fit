"""home_recipes.js 생성기.

상우님이 실제로 만든 집밥의 1인분 영양을 농진청 국가표준식품성분표 10개정판
및 식약처 통합식품영양성분정보(가공식품) 원재료에서 합산해요.
사용: python3 tools/build_home_recipes.py
원자료 위치: 환경변수 FOODDATA (기본 /workspace/fooddata)
"""
import csv, json, os, re, statistics, sys

sys.path.insert(0, os.path.dirname(__file__))
import fooddb
from home_recipes import RECIPES, SPOON_G

R = fooddb.load_rda()

PROD = []
for r in csv.DictReader(open(f'{fooddb.D}/mfds_processed.csv', encoding='utf-8-sig')):
    if r['영양성분함량기준량'] in ('100g', '100ml'):
        PROD.append({
            'name': r['식품명'],
            'k': fooddb._n(r['에너지(kcal)']),
            'p': fooddb._n(r['단백질(g)']),
            'c': fooddb._n(r['탄수화물(g)']),
            'f': fooddb._n(r['지방(g)']),
        })


def rda(name):
    f = R.get(name)
    assert f, ('RDA 없음', name)
    return dict(k=f['kcal'], p=f['p'], c=f['c'], f=f['f'],
                src='농진청', srcName=f['name'],
                srcNote=f"국가표준식품성분표 10개정판 ({f['origin']})",
                unit='g')


def prod_median(pat, excl, note):
    rx, ex = re.compile(pat), re.compile(excl) if excl else None
    rows = [r for r in PROD if rx.search(r['name']) and not (ex and ex.search(r['name'])) and r['k'] > 0]
    assert len(rows) >= 3, ('제품 부족', pat, len(rows))
    med = lambda key: statistics.median(r[key] for r in rows)
    ks = [r['k'] for r in rows]
    return dict(k=med('k'), p=med('p'), c=med('c'), f=med('f'),
                src='식약처 제품', srcName=f'시판 제품 {len(rows)}개 중앙값',
                srcNote=f"{note}. {len(rows)}개, 100g당 에너지 {min(ks):.0f}–{max(ks):.0f}kcal",
                unit='g', n=len(rows))


def lookup(ing):
    if ing['db'] == 'RDA':
        return rda(ing['key'])
    if ing['db'] == 'PROD_MEDIAN':
        return prod_median(ing['prod_pat'], ing.get('prod_excl'), ing.get('prod_note') or '식약처 가공식품DB 중앙값')
    raise ValueError(ing)


def scale(per100, g):
    f = g / 100.0
    return dict(k=per100['k'] * f, p=per100['p'] * f, c=per100['c'] * f, f=per100['f'] * f)


def fat_adjustment(spec):
    raw, cooked, oil = rda(spec['raw_key']), rda(spec['cooked_key']), rda(spec['oil_key'])
    batch = spec['batch_g']
    protein_batch = raw['p'] * batch / 100.0
    assert cooked['p'] > raw['p'] > 0
    cooked_wt = protein_batch / cooked['p'] * 100.0
    fat_in_meat = cooked['f'] * cooked_wt / 100.0
    fat_raw = raw['f'] * batch / 100.0
    rendered = fat_raw - fat_in_meat
    keep = spec['keep_tbsp'] * spec['oil_g_per_tbsp']
    discarded = rendered - keep
    assert discarded > 0, ('렌더링 지방이 남긴 2큰술보다 적어요', rendered, keep)
    disc = scale(oil, discarded)
    per = spec['servings']
    return {
        'rendered_g': rendered,
        'keep_g': keep,
        'discarded_g': discarded,
        'cooked_wt_g': cooked_wt,
        'per_serving': {k: disc[k] / per for k in ('k', 'p', 'c', 'f')},
        'oil': oil,
        'raw': raw,
        'cooked': cooked,
        'note': (f"삼겹살 생것 {batch:g}g 단백질 {protein_batch:.2f}g이 "
                 f"구운것(팬) 100g당 단백질 {cooked['p']}g 과 같다고 보면 익힌 무게 {cooked_wt:.1f}g, "
                 f"살에 남은 지방 {fat_in_meat:.2f}g, 녹아 나온 기름 {rendered:.2f}g. "
                 f"2큰술({keep:g}g, 핏로그 기름 1큰술={spec['oil_g_per_tbsp']}g)을 남기고 "
                 f"{discarded:.2f}g의 돼지기름을 버린 것으로 계산(3인분 나눔)."),
    }


def build_recipe(rec):
    ings = []
    tot = dict(k=0.0, p=0.0, c=0.0, f=0.0)
    missing = []
    for ing in rec['ingredients']:
        try:
            per = lookup(ing)
        except AssertionError as e:
            missing.append((ing['label'], e.args[0]))
            continue
        g = ing['g']
        mac = scale(per, g)
        for k in tot:
            tot[k] += mac[k]
        ings.append({
            'label': ing['label'],
            'g': round(g, 4),
            'show_g': ing.get('show_g'),
            'tbsp': ing.get('tbsp'),
            'assume': ing.get('assume'),
            'per100': {k: per[k] for k in ('k', 'p', 'c', 'f')},
            'src': per['src'],
            'srcName': per['srcName'],
            'srcNote': per['srcNote'],
            'contrib': {k: round(mac[k], 4) for k in ('k', 'p', 'c', 'f')},
        })
    if missing:
        raise SystemExit(f"재료 조회 실패 {rec['name']}: {missing}")

    adj = None
    if rec.get('fat_render'):
        adj = fat_adjustment(rec['fat_render'])
        # 버린 기름의 영양을 1인분에서 빼기. 탄수가 아주 작게 음수가 되면 0으로.
        for k in tot:
            tot[k] -= adj['per_serving'][k]
        if tot['c'] < 0:
            tot['c'] = 0.0
        if tot['f'] < 0 or tot['p'] < 0:
            raise SystemExit('기름 버림 후 영양이 음수')

    food = dict(
        id=rec['id'], name=rec['name'], cat='내 요리',
        k=round(tot['k'], 1), p=round(tot['p'], 2), c=round(tot['c'], 2), f=round(tot['f'], 2),
        unit='인분', src='내 요리', srcName=f"{rec['name']} 1인분 (재료 합산)",
        srcNote='농촌진흥청 국가표준식품성분표 10개정판·식품의약품안전처 가공식품DB의 원재료 값을 생것 중량으로 합산했어요. 실험 분석값이 아니라 재료 합산값이에요.',
        state=rec['state'], est=True, note=rec['note'], por=rec['por'], aka=rec['aka'], each=True,
    )
    return food, ings, tot, adj


def main():
    foods, recipes_out = [], []
    print('=== 내 요리 1인분 합산 ===')
    for rec in RECIPES:
        food, ings, tot, adj = build_recipe(rec)
        foods.append(food)
        out = dict(id=rec['id'], name=rec['name'], note=rec['note'],
                   ingredients=ings, totals_raw=tot, food=food)
        if adj:
            out['fat_render'] = {
                'rendered_g': round(adj['rendered_g'], 3),
                'keep_g': adj['keep_g'],
                'discarded_g': round(adj['discarded_g'], 3),
                'cooked_wt_g': round(adj['cooked_wt_g'], 2),
                'per_serving_discard': {k: round(adj['per_serving'][k], 3) for k in ('k', 'p', 'c', 'f')},
                'note': adj['note'],
            }
        recipes_out.append(out)
        print(f"\n{food['name']}")
        for ing in ings:
            g = ing['show_g'] if ing['show_g'] else ing['g']
            print(f"  {ing['label']:16s} {g:7.2f}g  →  {ing['contrib']['k']:7.2f}kcal  "
                  f"P{ing['contrib']['p']:.2f} C{ing['contrib']['c']:.2f} F{ing['contrib']['f']:.2f}  "
                  f"[{ing['src']} {ing['srcName']} {ing['per100']}]")
        if adj:
            d = adj['per_serving']
            print(f"  {'(버린 돼지기름)':16s} {-adj['discarded_g']/3:7.2f}g  →  {-d['k']:7.2f}kcal  "
                  f"P{-d['p']:.2f} C{-d['c']:.2f} F{-d['f']:.2f}")
            print('  ', adj['note'])
        print(f"  {'합계':16s}          →  {food['k']:7.1f}kcal  P{food['p']:.2f} C{food['c']:.2f} F{food['f']:.2f}")

    header = (
        "/* 자동 생성 파일 — tools/build_home_recipes.py 로 만들어요.\n"
        "   상우님이 실제로 만든 집밥만 넣어요. 새 요리는 tools/home_recipes.py 에 재료를 추가하고 이 스크립트를 다시 실행하세요.\n"
        "   영양값은 쿡코치 추정치가 아니라 농진청 국가표준식품성분표 10개정판·식약처 가공식품DB 원재료 합산이에요. 유제품 없음. */\n"
    )
    js = header
    js += 'window.HOME_RECIPES = ' + json.dumps(recipes_out, ensure_ascii=False, indent=2) + ';\n'
    js += 'window.HOME_FOODS = ' + json.dumps(foods, ensure_ascii=False, separators=(',', ':')) + ';\n'
    js += (
        "(function () {\n"
        "  if (!window.FOOD_CATS) window.FOOD_CATS = [];\n"
        "  if (!window.FOOD_CATS.includes('내 요리')) window.FOOD_CATS.unshift('내 요리');\n"
        "  window.FOODS = (window.FOODS || []).concat(window.HOME_FOODS);\n"
        "})();\n"
    )
    out = os.path.join(os.path.dirname(__file__), '..', 'home_recipes.js')
    open(out, 'w', encoding='utf-8').write(js)
    print(f"\nwrote {out} ({len(foods)} foods, {len(js)} bytes)")


if __name__ == '__main__':
    main()
