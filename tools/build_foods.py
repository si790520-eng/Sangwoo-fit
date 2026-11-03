"""foods.js 생성기. 모든 영양값은 원자료(공공DB)에서 읽어 100g(또는 100ml)당 값으로 저장해요.
사용: python3 tools/build_foods.py  (원자료 위치: 환경변수 FOODDATA, 받는 곳은 README '음식 데이터 출처' 참고)
출처 코드
  RDA  = 농촌진흥청 국가표준식품성분표 10개정판 (data.go.kr 15137343). 원출처(농진청/수산과학원/USDA/JAPAN 등)도 함께 기록
  MFDS = 식품의약품안전처 통합식품영양성분정보(음식) (data.go.kr 15100070)
  PROD = 식품의약품안전처 통합식품영양성분정보(가공식품) (data.go.kr 15100066) — 시판 제품 여러 개의 중앙값
  USDA = USDA FoodData Central, SR Legacy (2018-04)
"""
import csv, json, re, statistics, sys, os
sys.path.insert(0, os.path.dirname(__file__))
import fooddb
R = fooddb.load_rda(); M = fooddb.load_mfds(); U = fooddb.load_usda()
PROD = []
for r in csv.DictReader(open(f'{fooddb.D}/mfds_processed.csv', encoding='utf-8-sig')):
    if r['영양성분함량기준량'] in ('100g', '100ml'):
        PROD.append((r['식품명'], fooddb._n(r['에너지(kcal)']), fooddb._n(r['단백질(g)']), fooddb._n(r['탄수화물(g)']), fooddb._n(r['지방(g)']), r['식품중량']))

def Rr(name): return ('R', name)
def Uu(fid): return ('U', str(fid))
def Dd(name, kind=None): return ('D', name, kind)
def Pp(pat, excl=None): return ('P', pat, excl)

ORIGIN = {'농진청': '농진청 분석', '수': '국립수산과학원', 'USDA': 'USDA 인용', 'JAPAN': '일본식품성분표 인용', '식약': '식약처', '국': '국립보건원', '축산연': '축산과학원', '대푯값': '대푯값'}
DPRI = ['외식(분석함량)', '외식(재료량 기반 산출함량)', '가정식(분석 함량)', '산업체급식(재료량 기반 산출 함량)']

def resolve(ref):
    kind = ref[0]
    if kind == 'R':
        f = R.get(ref[1]); assert f, ('RDA 없음', ref[1])
        o = f['origin']; m = re.match(r"([^(']+)\('?(\d+)\)", o)
        od = (ORIGIN.get(m.group(1), m.group(1)) + " '" + m.group(2)) if m else o
        return dict(k=f['kcal'], p=f['p'], c=f['c'], f=f['f'], src='농진청', srcName=f['name'], srcNote=f'국가표준식품성분표 10개정판 ({od})', unit='g')
    if kind == 'U':
        f = U[ref[1]]
        return dict(k=f['kcal'], p=f['p'], c=f['c'], f=f['f'], src='USDA', srcName=f['name'], srcNote=f'USDA FoodData Central SR Legacy #{ref[1]}', unit='g')
    if kind == 'D':
        name, want = ref[1], ref[2]
        c = [f for f in M if f['name'] == name and f['kind'] in DPRI and (want is None or f['kind'].startswith(want))]
        assert c, ('MFDS 없음', name)
        c.sort(key=lambda f: DPRI.index(f['kind']))
        f = c[0]
        # 1인분 중량: 같은 이름의 행들 중 기준량(100)과 다른 '식품중량' 값들의 중앙값
        ws = []
        for g in [f] + [x for x in M if x['name'] == name and x['kind'] in DPRI]:
            m = re.match(r'([\d.]+)', g['weight'] or '')
            if m and float(m.group(1)) not in (0.0, 100.0): ws.append(float(m.group(1)))
        serve = round(statistics.median(ws)) if ws else None
        unit = 'ml' if f['basis'].endswith('ml') else 'g'
        return dict(k=f['kcal'], p=f['p'], c=f['c'], f=f['f'], src='식약처', srcName=f"{f['name']} ({f['kind']})", srcNote=f"식약처 식품영양성분DB 음식 {f['code']}", unit=unit, serveG=serve)
    if kind == 'P':
        pat, excl = re.compile(ref[1]), re.compile(ref[2]) if ref[2] else None
        rows = [r for r in PROD if pat.search(r[0]) and not (excl and excl.search(r[0])) and r[1] > 0]
        assert len(rows) >= 3, ('제품 부족', ref[1], len(rows))
        med = lambda i: statistics.median(r[i] for r in rows)
        return dict(k=med(1), p=med(2), c=med(3), f=med(4), src='식약처 제품', srcName=f'시판 제품 {len(rows)}개 중앙값', srcNote=f'식약처 통합식품영양성분DB(가공식품) 제품 {len(rows)}개의 100g당 중앙값', unit='g')
    raise ValueError(ref)

C = {}
ERR = []
def F(name, cat, ref, portions=(), state='', note='', est=False, aka=''):
    try: v = resolve(ref)
    except AssertionError as e:
        ERR.append(e.args[0]); return
    por = [list(p) for p in portions]
    if v.get('serveG') and not any(p[0].startswith('1인분') for p in por):
        por.insert(0, [f"1인분({v['serveG']:g}{v['unit']})", v['serveG']])
    assert name not in C, ('중복', name)
    C[name] = dict(id='v2:' + name, name=name, cat=cat, k=round(v['k'], 1), p=round(v['p'], 2), c=round(v['c'], 2), f=round(v['f'], 2), unit=v['unit'],
                   src=v['src'], srcName=v['srcName'], srcNote=v['srcNote'], state=state, est=est or v['src'] == '식약처',
                   note=note, por=por, aka=aka)

DISH_CATS = {'국·찌개', '한식 요리', '분식', '외식·패스트푸드'}
exec(open(os.path.join(os.path.dirname(__file__), 'food_spec.py'), encoding='utf-8').read())

if ERR:
    for e in ERR:
        print('ERR', e)
        if e[0] == 'RDA 없음':
            ks = [k for k in re.split(r'[ ,()]+', e[1]) if k]
            sc = sorted(R, key=lambda n: -sum(k in n for k in ks))
            print('   후보:', sc[:8])
        if e[0] == 'MFDS 없음':
            print('   후보:', sorted({f['name'] for f in M if f['name'].startswith(e[1].split('_')[0]) and f['kind'] in DPRI})[:12])
    sys.exit(1)
out = list(C.values())
ORDER = ['닭·오리', '계란', '고기', '생선·해산물', '건어물·해조류', '콩·두부', '유제품', '밥·곡류', '빵·떡·면', '채소', '과일', '견과·씨앗', '보충제',
         '국·찌개', '한식 요리', '반찬', '분식', '외식·패스트푸드', '편의점·가공', '간식', '음료', '주류', '기름·양념']
assert {f['cat'] for f in out} <= set(ORDER), {f['cat'] for f in out} - set(ORDER)
cats = [c for c in ORDER if any(f['cat'] == c for f in out)]
js = ('/* 자동 생성 파일 — tools/build_foods.py 로 만들어요. 직접 고치지 마세요.\n'
      '   값은 100g(음료는 100ml)당. src: 농진청=국가표준식품성분표 10개정판, 식약처=식품영양성분DB(음식), 식약처 제품=가공식품DB 제품 중앙값, USDA=FoodData Central SR Legacy */\n'
      f'window.FOOD_CATS = {json.dumps(cats, ensure_ascii=False)};\n'
      f'window.FOODS = {json.dumps(out, ensure_ascii=False, separators=(",", ":"))};\n')
open(os.path.join(os.path.dirname(__file__), '..', 'foods.js'), 'w', encoding='utf-8').write(js)
print(len(out), 'foods,', len(cats), 'cats')
from collections import Counter
print(Counter(f['src'] for f in out))
