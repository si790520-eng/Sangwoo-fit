"""원자료 로더: 농촌진흥청 국가표준식품성분표 10개정판, 식약처 통합식품영양성분정보(음식), USDA FDC SR Legacy.
원자료는 저장소에 넣지 않아요 (용량). 받는 곳은 README 참고. 경로: 환경변수 FOODDATA (기본 /workspace/fooddata)."""
import csv, os
D = os.environ.get('FOODDATA', '/workspace/fooddata')
def _n(x):
    x = (x or '').replace(',', '').strip()
    try: return float(x)
    except ValueError: return 0.0
def load_rda():
    rows = list(csv.reader(open(f'{D}/rda_kfct10.csv', encoding='utf-8')))
    out = {}
    for r in rows[1:]:
        out[r[3]] = dict(db='RDA', name=r[3], group=r[2], origin=r[4], kcal=_n(r[5]), p=_n(r[7]), f=_n(r[8]), c=_n(r[10]), basis='100g')
    return out
def load_mfds():
    out = []
    for r in csv.DictReader(open(f'{D}/mfds_dish.csv', encoding='utf-8-sig')):
        out.append(dict(db='MFDS', code=r['식품코드'], name=r['식품명'], kind=r['식품기원명'], basis=r['영양성분함량기준량'], kcal=_n(r['에너지(kcal)']), p=_n(r['단백질(g)']), f=_n(r['지방(g)']), c=_n(r['탄수화물(g)']), weight=r['식품중량'], ref=r['1인(회)분량 참고량'], maker=r['업체명'], date=r['데이터생성일자']))
    return out
def load_usda():
    d = f'{D}/usda_sr'
    foods = {r['fdc_id']: r['description'] for r in csv.DictReader(open(f'{d}/food.csv', encoding='utf-8'))}
    want = {'1008': 'kcal', '1003': 'p', '1004': 'f', '1005': 'c'}
    nut = {}
    for r in csv.DictReader(open(f'{d}/food_nutrient.csv', encoding='utf-8')):
        k = want.get(r['nutrient_id'])
        if k: nut.setdefault(r['fdc_id'], {})[k] = _n(r['amount'])
    return {fid: dict(db='USDA', fdc=fid, name=foods[fid], basis='100g', **{k: nut.get(fid, {}).get(k, 0.0) for k in want.values()}) for fid in foods if fid in nut}
