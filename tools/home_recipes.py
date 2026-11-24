# 상우님이 실제로 만든 집밥만 넣어요.
# 새 요리는 RECIPES 목록에 재료(생것 중량)를 추가한 뒤
#   python3 tools/build_home_recipes.py
# 를 실행하면 home_recipes.js 가 갱신돼요.
# 영양값은 쿡코치 추정치가 아니라 농진청·식약처 공식 DB 원재료 합산이에요.
# 유제품은 넣지 않아요.

# 핏로그 food_spec.py 와 같은 큰술 중량(공공 DB에 큰술 g이 없는 항목은 주석으로 표시)
SPOON_G = {
    'liquid': 15,        # 간장, 맛술 — food_spec 간장 1큰술=15g
    'sugar': 12,         # food_spec 설탕 1큰술=12g
    'oil': 13,           # food_spec 참기름·올리브유 1큰술=13g (돼지기름도 동일 관례)
    'chili_powder': 6,   # 가정용 계량. 공공 DB에 고춧가루 1큰술 중량은 없음
    'minced_garlic': 10, # 가정용 계량(다진마늘 1큰술≈10g). 공공 DB에 큰술 중량 없음
    'syrup': 20,         # 점성 시럽. food_spec 꿀 1큰술=20g 과 같은 관례
    'paste': 18,         # 장류. food_spec 고추장·된장 1큰술=18g
}

# 후추 양은 레시피에 없어 '약간' = 0.3g 으로 가정 (약 1kcal, 영향 미미)
PEPPER_DASH_G = 0.3

RECIPES = [
    {
        'id': 'home:kimchi_samgyeop_jjageuli',
        'name': '김치 삼겹 짜글이',
        'aka': '짜글이 김치짜글이 삼겹짜글이 김치삼겹짜글이 김치 삼겹살 짜글이 jjageuli jagleui kimchi pork belly',
        'por': [['1인분', 1], ['0.5인분', 0.5], ['1.5인분', 1.5], ['2인분', 2]],
        'state': '1인분',
        'ingredients': [
            # 표시는 167g, 계산은 500g÷3인분. 기름 버림은 500g 한 팬 기준
            {'label': '삼겹살(생것)', 'g': 500 / 3, 'show_g': 167, 'db': 'RDA', 'key': '돼지고기, 삼겹살, 생것'},
            {'label': '배추김치', 'g': 133, 'db': 'RDA', 'key': '김치, 배추 김치'},
            {'label': '양파', 'g': 33, 'db': 'RDA', 'key': '양파, 생것'},
            {'label': '대파', 'g': 10, 'db': 'RDA', 'key': '파, 대파, 생것'},
            {'label': '고춧가루', 'g': (2 / 3) * SPOON_G['chili_powder'], 'tbsp': 2 / 3, 'db': 'RDA', 'key': '고춧가루'},
            {'label': '간장', 'g': (2 / 3) * SPOON_G['liquid'], 'tbsp': 2 / 3, 'db': 'RDA', 'key': '간장, 개량, 양조'},
            {'label': '맛술', 'g': (2 / 3) * SPOON_G['liquid'], 'tbsp': 2 / 3, 'db': 'RDA', 'key': '맛술'},
            {'label': '설탕', 'g': (1 / 3) * SPOON_G['sugar'], 'tbsp': 1 / 3, 'db': 'RDA', 'key': '설탕, 백설탕'},
            {'label': '다진마늘', 'g': (1 / 3) * SPOON_G['minced_garlic'], 'tbsp': 1 / 3, 'db': 'RDA', 'key': '마늘, 다진것'},
            # 물은 0kcal 이라 합산에 넣지 않음
        ],
        'fat_render': {
            # 삼겹살 500g을 한 팬에 굽고, 녹아 나온 기름을 따라 버리되 2큰술만 남김.
            # 녹아 나온 양: 농진청 삼겹살 생것 vs 구운것(팬)의 단백질이 보존된다고 보고
            # 익힌 무게를 역산한 뒤, 생것 지방 − 익힌 살코기에 남은 지방.
            'batch_g': 500,
            'servings': 3,
            'raw_key': '돼지고기, 삼겹살, 생것',
            'cooked_key': '돼지고기, 삼겹살, 구운것(팬)',
            'keep_tbsp': 2,
            'oil_g_per_tbsp': SPOON_G['oil'],
            'oil_key': '돼지기름',
        },
        'note': '삼겹살 500g을 3인분으로 나눠 1인분은 생것 167g이에요. 팬에서 나온 기름은 농진청 생것↔구운것(팬) 단백질 보존으로 추정한 뒤 2큰술(26g)만 남기고 버린 것으로 계산했어요. 물은 칼로리가 없어 넣지 않았어요.',
    },
    {
        'id': 'home:chicken_teriyaki',
        'name': '닭가슴살 데리야끼',
        'aka': '데리야끼 데리야키 닭가슴살 데리야끼 닭가슴살데리야끼 닭데리야끼 테리야끼 teriyaki chicken breast',
        'por': [['1인분(생 닭가슴살 150g)', 1], ['0.5인분', 0.5], ['1.5인분', 1.5], ['2인분', 2]],
        'state': '1인분(생 닭가슴살 150g)',
        'ingredients': [
            {'label': '닭가슴살(생것)', 'g': 150, 'db': 'RDA', 'key': '닭고기, 가슴, 생것'},
            {'label': '간장', 'g': 0.9 * SPOON_G['liquid'], 'tbsp': 0.9, 'db': 'RDA', 'key': '간장, 개량, 양조'},
            {'label': '올리고당', 'g': 0.6 * SPOON_G['syrup'], 'tbsp': 0.6, 'db': 'PROD_MEDIAN',
             'prod_pat': '올리고당', 'prod_excl': r'김치|잼|꿀|키토산|빼나|젠느',
             'prod_note': '식약처 가공식품DB에서 순수 올리고당·요리올리고당 시럽 제품(김치·잼·혼합 제외)의 100g당 중앙값'},
            {'label': '맛술', 'g': 0.6 * SPOON_G['liquid'], 'tbsp': 0.6, 'db': 'RDA', 'key': '맛술'},
            {'label': '설탕', 'g': 0.15 * SPOON_G['sugar'], 'tbsp': 0.15, 'db': 'RDA', 'key': '설탕, 백설탕'},
            {'label': '굴소스', 'g': 0.15 * SPOON_G['paste'], 'tbsp': 0.15, 'db': 'PROD_MEDIAN',
             'prod_pat': r'굴소스$', 'prod_excl': r'전복|풍미가|함유|소스의',
             'prod_note': '식약처 가공식품DB에서 이름 끝이 굴소스인 제품(전복 혼합 등 제외)의 100g당 중앙값'},
            {'label': '다진마늘', 'g': 0.2 * SPOON_G['minced_garlic'], 'tbsp': 0.2, 'db': 'RDA', 'key': '마늘, 다진것'},
            {'label': '소금', 'g': 0.4, 'db': 'RDA', 'key': '소금, 정제염'},
            {'label': '후추(약간, 가정)', 'g': PEPPER_DASH_G, 'db': 'RDA', 'key': '후추, 검은색, 가루',
             'assume': '레시피에 후추 중량이 없어 0.3g(약간)으로 가정'},
        ],
        'note': '1인분(생 닭가슴살 150g) 기준이에요. 익히면 무게는 줄어들지만, 영양은 생것 중량으로 합산했어요. 후추는 레시피에 양이 없어 0.3g(약간)으로 가정했어요.',
    },
]
