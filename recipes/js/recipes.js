/* 집밥 레시피. 1큰술=15ml, 1작은술=5ml.
   간장·맛술은 상우님 계량(1큰술=15ml)을 따름.
   칼로리·단백질은 추정치. 평소 메뉴 4개는 상우님이 적던 값을 그대로 둠.
   나머지 요리는 농진청 국가표준식품성분표 수준의 100g당 값과
   표준 큰술 무게(설탕 12g, 간장 18g, 다진마늘 15g, 고춧가루 8g, 올리고당 18g, 식용유 13g)로 어림. */
globalThis.RECIPES = [
  {
    id: "kimchi-samgyeop-jjageuli",
    title: "김치 삼겹 짜글이",
    cat: "한식",
    own: true,
    servings: "3끼분",
    basis: "1/3인분",
    time: "약 35분",
    kcal: "약 770kcal",
    protein: "약 32g",
    riceNote: "밥은 따로예요. 위 값은 짜글이만 1/3 담은 추정치예요.",
    budget: "삼겹 500g으로 3끼. 한 끼 재료비 약 4,000~6,000원.",
    tools: ["냄비", "가스·인덕션"],
    blurb: "국물이 고기 절반만 잠기는 집밥 짜글이. 평소 레시피에 다진 마늘 1큰술을 김치와 같이 볶아요.",
    keywords: ["평소", "삼겹", "도시락", "벤치업"],
    ingredients: [
      { key: "삼겹살", name: "삼겹살", amount: "500g", note: "2cm 두께", main: true },
      { key: "김치", name: "김치", amount: "400g", note: "한입 크기", main: true },
      { key: "양파", name: "양파", amount: "1/2개 (100g)", note: "1cm 채", main: true },
      { key: "파", name: "파", amount: "1대", note: "어슷하게", main: true },
      { key: "다진 마늘", name: "다진 마늘", amount: "1큰술", note: "김치·고춧가루와 같이", main: true },
      { key: "고춧가루", name: "고춧가루", amount: "2큰술", main: true },
      { key: "간장", name: "간장", amount: "2큰술 (30ml)", main: true },
      { key: "맛술", name: "맛술", amount: "2큰술 (30ml)", main: true },
      { key: "설탕", name: "설탕", amount: "1큰술", main: true },
      { key: "물", name: "물", amount: "뚜껑 있으면 400ml / 없으면 600ml", water: true },
      { key: "소금", name: "소금", amount: "싱거우면 1/4작은술씩", optional: true }
    ],
    steps: [
      { heat: "중강불", time: "예열 1분 + 볶기 6~7분", text: "냄비를 중강불로 1분 달군 뒤, 삼겹살을 기름 없이 넣고 6~7분 볶아요. 겉이 노릇해지고 기름이 나오면 돼요." },
      { heat: "불 끄기", time: "1분", text: "기름은 2큰술만 남기고 나머지는 따라 버려요. 키친타월로 닦지 말고, 숟가락으로 떠내요." },
      { heat: "중불", time: "4분", text: "김치, 고춧가루, 다진 마늘 1큰술을 넣고 중불에서 4분 볶아요. 김치 가장자리가 살짝 투명해지면 돼요." },
      { heat: "강불 → 중불", time: "뚜껑 12분 / 없으면 15분", text: "물(뚜껑 있으면 400ml, 없으면 600ml), 간장 2큰술(30ml), 맛술 2큰술(30ml), 설탕 1큰술을 넣어요. 강불로 올려 끓으면 중불로 줄여요. 뚜껑을 덮고 12분, 뚜껑이 없으면 15분 동안 5분마다 저어 줘요." },
      { heat: "중불", time: "3~5분", text: "양파와 파를 넣고 뚜껑을 연 채로 중불 3~5분 더 끓여요. 국물이 고기 절반이 잠길 정도에서 멈춰요." },
      { heat: "중불", time: "맛본 뒤 1분", text: "간을 봐요. 싱거우면 소금 1/4작은술씩 넣고 30초만 더 끓여요." }
    ],
    storage: {
      fridge: "냉장 3일. 식힌 뒤 국물째 통에 담아요.",
      freezer: "냉동은 김치가 물러져서 권하지 않아요.",
      reheat: "전자레인지 2분, 한 번 저은 뒤 1분. 국물이 졸았으면 물 2큰술을 넣어요."
    },
    tip: "다진 마늘은 3번 단계, 김치·고춧가루와 같이 4분 볶아야 매운 향이 죽어요. 설탕을 스테비아로 바꾸면 단맛은 나지만 윤기는 덜해요. 평소 메뉴는 설탕 1큰술 그대로가 맞아요."
  },
  {
    id: "ganjang-samgyeop-jorim",
    title: "간장 삼겹 조림",
    cat: "한식",
    own: true,
    servings: "3끼분",
    basis: "한 끼 (요리 1/3 + 밥 210g + 계란 2개)",
    time: "약 30분",
    kcal: "약 1,000kcal",
    protein: "약 45g",
    riceNote: "한 끼 추정치에는 밥 210g과 계란 2개가 포함돼 있어요. 조림만 먹으면 그보다 낮아요.",
    budget: "삼겹 500g으로 3끼. 밥·계란 포함 한 끼 약 5,000~7,000원.",
    tools: ["깊은 팬", "가스·인덕션"],
    blurb: "뚜껑 있으면 물 150ml. 다진 마늘 1큰술은 양념에 넣어 같이 졸여요.",
    keywords: ["평소", "삼겹", "도시락", "계란"],
    ingredients: [
      { key: "삼겹살", name: "삼겹살", amount: "500g", note: "2cm 두께", main: true },
      { key: "양파", name: "양파", amount: "1/2개 (약 100g)", note: "굵게 채", main: true },
      { key: "파", name: "파", amount: "1대", note: "흰 부분", main: true },
      { key: "다진 마늘", name: "다진 마늘", amount: "1큰술", note: "양념(소스)에", main: true },
      { key: "간장", name: "간장", amount: "4큰술 (60ml)", main: true },
      { key: "맛술", name: "맛술", amount: "3큰술 (45ml)", main: true },
      { key: "설탕", name: "설탕", amount: "1큰술", main: true },
      { key: "올리고당", name: "올리고당", amount: "1큰술", main: true },
      { key: "물", name: "물", amount: "150ml (뚜껑 없으면 200ml)", water: true },
      { key: "후추", name: "후추", amount: "조금 (약 0.2g)", main: true },
      { key: "밥", name: "밥", amount: "한 끼 210g", note: "영양 추정치에 포함. 같이 졸이지 않음", optional: true },
      { key: "계란", name: "계란", amount: "한 끼 2개 (특란)", note: "영양 추정치에 포함. 삶거나 후라이", optional: true }
    ],
    steps: [
      { heat: "중강불", time: "6~7분", text: "깊은 팬을 중강불로 달군 뒤 삼겹살을 기름 없이 6~7분 볶아요. 겉면이 익고 기름이 나와요." },
      { heat: "불 끄기", time: "1분", text: "기름은 1큰술만 남기고 버려요." },
      { heat: "중불", time: "2분", text: "양파와 파 흰 부분을 넣고 중불에서 2분 볶아요." },
      { heat: "중약불", time: "뚜껑 10분 / 없으면 12~14분", text: "양념을 넣어요. 간장 4큰술(60ml), 맛술 3큰술(45ml), 설탕 1큰술, 올리고당 1큰술, 다진 마늘 1큰술, 물 150ml(뚜껑 없으면 200ml), 후추. 뚜껑을 덮고 중약불 10분, 뚜껑이 없으면 12~14분 졸여요. 중간에 한 번 뒤집어 국물을 끼얹어요." },
      { heat: "중불", time: "3~4분", text: "뚜껑을 열고 중불에서 3~4분 더 졸여요. 국물이 걸쭉하게 고기를 코팅하면 꺼내요." }
    ],
    storage: {
      fridge: "냉장 3일.",
      freezer: "냉동 3주. 국물째 1끼분씩 얼려요.",
      reheat: "전자레인지 2분, 뒤집어 40초. 계란은 따로 데워요."
    },
    tip: "한 끼를 맞출 때는 조림 1/3에 밥 210g, 계란 2개를 곁들여요. 그 조합이 약 1,000kcal · 단백질 약 45g 추정치예요."
  },
  {
    id: "dak-ganjang-jangjorim",
    title: "닭가슴살 간장 장조림",
    cat: "한식",
    servings: "4끼분",
    basis: "1인분 (요리만, 생 닭 150g 기준)",
    time: "약 25분",
    kcal: "약 220kcal",
    protein: "약 36g",
    riceNote: "밥 1공기(210g)를 더하면 약 530kcal, 단백질 약 42g 추정치.",
    budget: "닭가슴살 600g으로 4끼. 한 끼 약 2,000~3,000원.",
    tools: ["냄비", "가스·인덕션"],
    blurb: "퇴근 후 한 냄비. 밥 위에 얹으면 도시락이 돼요.",
    keywords: ["닭가슴살", "도시락", "단백질"],
    ingredients: [
      { key: "닭가슴살", name: "닭가슴살", amount: "600g", note: "2cm 깍둑", main: true },
      { key: "다진 마늘", name: "다진 마늘", amount: "1큰술 (15g)" },
      { key: "간장", name: "간장", amount: "4큰술 (60ml)" },
      { key: "맛술", name: "맛술", amount: "3큰술 (45ml)" },
      { key: "설탕", name: "설탕", amount: "1큰술 (12g)" },
      { key: "올리고당", name: "올리고당", amount: "1큰술 (18g)" },
      { key: "파", name: "파", amount: "1/2대 (약 35g)", note: "흰 부분", main: true },
      { key: "후추", name: "후추", amount: "조금" },
      { key: "물", name: "물", amount: "200ml", water: true }
    ],
    steps: [
      { heat: "불 없음", time: "5분", text: "닭가슴살 물기를 키친타월로 닦고 2cm로 썰어요. 후추를 뿌려요." },
      { heat: "중강불", time: "앞 2분 + 뒤 2분", text: "냄비에 기름 없이 닭을 중강불로 앞뒤 2분씩 표면만 익혀 접시에 빼요." },
      { heat: "중불", time: "30초", text: "같은 냄비에 다진 마늘과 파 흰 부분을 중불 30초 볶아요. 색이 나면 바로 다음으로 넘어가요." },
      { heat: "강불 → 중약불", time: "12~15분", text: "간장 4큰술, 맛술 3큰술, 설탕 1큰술, 올리고당 1큰술, 물 200ml를 넣고 강불로 끓여요. 끓으면 닭을 넣고 뚜껑을 연 채 중약불 12~15분. 중간에 한 번 뒤집어요. 국물이 1/3만 남고 속까지 하얘지면 끝이에요. 더 끓이면 퍼석해져요." }
    ],
    storage: {
      fridge: "냉장 3일. 국물에 잠기게 담아요.",
      freezer: "냉동 3주.",
      reheat: "전자레인지 1분 30초, 한 번 뒤집어 40초."
    },
    tip: "한 끼는 익힌 닭 약 120g이 나와요. 밥 210g을 꼭 같이 담아야 벤치업 한 끼 칼로리가 맞아요."
  },
  {
    id: "dak-kimchi-jjim",
    title: "닭가슴살 김치찜",
    cat: "한식",
    servings: "4끼분",
    basis: "1인분 (요리만)",
    time: "약 30분",
    kcal: "약 230kcal",
    protein: "약 38g",
    riceNote: "밥 1공기(210g)를 더하면 약 540kcal, 단백질 약 44g 추정치.",
    budget: "닭 600g·김치 400g으로 4끼. 한 끼 약 2,500~3,500원.",
    tools: ["냄비", "가스·인덕션"],
    blurb: "찌개보다 국물이 적어요. 닭가슴살은 10분을 넘기지 않아요.",
    keywords: ["닭가슴살", "김치", "도시락"],
    ingredients: [
      { key: "닭가슴살", name: "닭가슴살", amount: "600g", note: "1.5cm 두께", main: true },
      { key: "김치", name: "김치", amount: "400g", main: true },
      { key: "양파", name: "양파", amount: "1/2개 (100g)", main: true },
      { key: "파", name: "파", amount: "1/2대 (약 35g)", main: true },
      { key: "다진 마늘", name: "다진 마늘", amount: "1큰술" },
      { key: "고춧가루", name: "고춧가루", amount: "1큰술 (8g)" },
      { key: "간장", name: "간장", amount: "1큰술 (15ml)" },
      { key: "맛술", name: "맛술", amount: "1큰술 (15ml)" },
      { key: "설탕", name: "설탕", amount: "1작은술 (4g)" },
      { key: "소금", name: "소금", amount: "1/4작은술", note: "밑간" },
      { key: "후추", name: "후추", amount: "조금" },
      { key: "물", name: "물", amount: "150ml", water: true },
      { key: "식용유", name: "식용유", amount: "1작은술 (4g)", note: "없으면 생략", optional: true }
    ],
    steps: [
      { heat: "불 없음", time: "10분", text: "닭에 맛술 1큰술, 소금 1/4작은술, 후추를 넣고 10분 두어요." },
      { heat: "중불", time: "30초", text: "냄비에 식용유 1작은술(없으면 생략)과 다진 마늘을 중불 30초 볶아요." },
      { heat: "중불", time: "3분", text: "김치와 고춧가루를 넣고 중불 3분 볶아요." },
      { heat: "강불 → 중불", time: "10분", text: "닭, 간장 1큰술, 설탕 1작은술, 물 150ml를 넣어요. 강불로 끓으면 뚜껑을 덮고 중불 10분. 10분이 지나면 한 점을 잘라 속이 하얘졌는지 보고 꺼요." },
      { heat: "중불", time: "3분", text: "양파와 파를 넣고 뚜껑을 연 채 중불 3분. 국물이 자작하면 끝이에요." }
    ],
    storage: {
      fridge: "냉장 3일.",
      freezer: "냉동 3주.",
      reheat: "전자레인지 1분 30초 + 40초."
    },
    tip: "닭가슴살을 15분 넘게 끓이면 퍼석해져요. 타이머를 10분에 맞추세요."
  },
  {
    id: "jeyuk-bokkeum",
    title: "제육볶음",
    cat: "한식",
    servings: "2끼분",
    basis: "1인분 (요리만, 생고기 200g 기준)",
    time: "약 25분",
    kcal: "약 500kcal",
    protein: "약 43g",
    riceNote: "밥 1공기(210g)를 더하면 약 810kcal, 단백질 약 49g 추정치.",
    budget: "앞다리 400g이면 2끼. 한 끼 약 4,000~6,000원.",
    tools: ["팬", "가스·인덕션"],
    blurb: "고추장 베이스. 뚜껑을 덮지 않아야 볶음이 돼요.",
    keywords: ["돼지", "고추장"],
    ingredients: [
      { key: "돼지 앞다리살", name: "돼지 앞다리살", amount: "400g", note: "1cm 두께. 목살로 바꿔도 돼요", main: true },
      { key: "양파", name: "양파", amount: "1/2개 (100g)", main: true },
      { key: "파", name: "파", amount: "1/2대 (약 35g)", main: true },
      { key: "고추장", name: "고추장", amount: "1.5큰술 (27g)", main: true },
      { key: "다진 마늘", name: "다진 마늘", amount: "1큰술" },
      { key: "고춧가루", name: "고춧가루", amount: "1큰술 (8g)" },
      { key: "간장", name: "간장", amount: "1큰술 (15ml)" },
      { key: "설탕", name: "설탕", amount: "1큰술 (12g)" },
      { key: "올리고당", name: "올리고당", amount: "1/2큰술 (9g)" },
      { key: "맛술", name: "맛술", amount: "1큰술 (15ml)" },
      { key: "후추", name: "후추", amount: "조금" },
      { key: "식용유", name: "식용유", amount: "1큰술 (13g)", main: true }
    ],
    steps: [
      { heat: "불 없음", time: "5분", text: "고기에 맛술 1큰술과 후추를 넣고 5분 두어요." },
      { heat: "불 없음", time: "2분", text: "볼에 고추장 1.5큰술, 고춧가루 1큰술, 간장 1큰술, 설탕 1큰술, 올리고당 1/2큰술, 다진 마늘 1큰술을 섞어 양념을 만들어요." },
      { heat: "강불 → 중강불", time: "예열 1분 + 볶기 4분", text: "팬을 강불로 1분 달구고 식용유 1큰술을 둘러요. 고기를 중강불에서 4분 볶아요. 물이 나오면 1분만 더 날려요." },
      { heat: "중불", time: "2분", text: "양파를 넣고 중불 2분 볶아요." },
      { heat: "중불", time: "3분 + 파 1분", text: "양념을 넣고 중불 3분 볶아요. 윤기가 나면 파를 넣고 1분 더. 뚜껑은 덮지 않아요." }
    ],
    storage: {
      fridge: "냉장 3일.",
      freezer: "냉동 3주.",
      reheat: "팬에 물 1큰술, 중불 2분. 전자레인지는 1분 30초 후 한 번 섞어 40초."
    },
    tip: "삼겹으로 하면 지방이 많아 단백질 비율이 떨어져요. 벤치업 한 끼에는 앞다리나 목살이 맞아요."
  },
  {
    id: "chamchi-kimchi-jjigae",
    title: "참치 김치찌개",
    cat: "한식",
    servings: "2끼분",
    basis: "1인분 (요리만)",
    time: "약 25분",
    kcal: "약 340kcal",
    protein: "약 31g",
    riceNote: "밥 1공기(210g)를 더하면 약 650kcal, 단백질 약 37g 추정치.",
    budget: "참치 캔 2개와 두부 반 모. 한 끼 약 3,000~4,500원.",
    tools: ["냄비", "가스·인덕션"],
    blurb: "기름은 1큰술만 남기고 따라 버려야 칼로리가 안정돼요.",
    keywords: ["참치", "김치", "두부"],
    ingredients: [
      { key: "참치캔", name: "참치캔 (기름 참치)", amount: "2캔 (각 100g)", note: "기름은 1큰술만 남기고 따르기. 건더기 약 140g", main: true },
      { key: "김치", name: "김치", amount: "250g", main: true },
      { key: "두부", name: "두부 (부침용)", amount: "200g (약 2/3모)", note: "2cm", main: true },
      { key: "양파", name: "양파", amount: "1/4개 (50g)", main: true },
      { key: "파", name: "파", amount: "1/2대 (약 35g)" },
      { key: "다진 마늘", name: "다진 마늘", amount: "1/2큰술 (8g)" },
      { key: "고춧가루", name: "고춧가루", amount: "1큰술 (8g)" },
      { key: "간장", name: "간장", amount: "1작은술 (5ml)" },
      { key: "물", name: "물", amount: "400ml", water: true }
    ],
    steps: [
      { heat: "중불", time: "2분", text: "냄비에 참치 기름 1큰술과 건더기, 다진 마늘을 넣고 중불 2분 볶아요. 나머지 기름은 버려요." },
      { heat: "중불", time: "2분", text: "김치와 고춧가루를 넣고 중불 2분 볶아요." },
      { heat: "강불 → 중불", time: "8분", text: "물 400ml, 양파, 간장 1작은술을 넣고 강불로 끓여요. 끓으면 중불로 줄여 8분." },
      { heat: "중불", time: "3분", text: "두부를 올리고 중불 3분. 파를 넣고 한소끔만 더 올려요. 두부를 세게 젓지 않아요." }
    ],
    storage: {
      fridge: "냉장 2일. 두부는 쉽게 상해요.",
      freezer: "두부가 스펀지처럼 되어서 냉동은 권하지 않아요.",
      reheat: "전자레인지 2분, 저어서 1분."
    },
    tip: "캔 기름을 전부 넣으면 1큰술(약 120kcal)이 더 들어가요. 1큰술만 남기는 게 이 레시피의 기준이에요."
  },
  {
    id: "godeungeo-mu-jorim",
    title: "고등어 무조림",
    cat: "한식",
    servings: "2끼분",
    basis: "1인분 (고등어 1토막 + 무)",
    time: "약 35분",
    kcal: "약 380kcal",
    protein: "약 34g",
    riceNote: "밥 1공기(210g)를 더하면 약 690kcal, 단백질 약 40g 추정치.",
    budget: "고등어 한 마리(2토막)면 2끼. 한 끼 약 4,000~6,000원.",
    tools: ["넓은 냄비", "가스·인덕션"],
    blurb: "고등어는 뒤집지 않아요. 국물을 끼얹어야 살이 안 부서져요.",
    keywords: ["고등어", "생선"],
    ingredients: [
      { key: "고등어", name: "고등어", amount: "2토막 (손질 후 300g)", main: true },
      { key: "무", name: "무", amount: "200g", note: "1cm 반달", main: true },
      { key: "양파", name: "양파", amount: "1/2개 (100g)", main: true },
      { key: "파", name: "파", amount: "1/2대 (약 35g)" },
      { key: "다진 마늘", name: "다진 마늘", amount: "1큰술" },
      { key: "고춧가루", name: "고춧가루", amount: "1.5큰술 (12g)" },
      { key: "간장", name: "간장", amount: "2큰술 (30ml)" },
      { key: "맛술", name: "맛술", amount: "2큰술 (30ml)" },
      { key: "설탕", name: "설탕", amount: "1작은술 (4g)" },
      { key: "소금", name: "소금", amount: "밑간 약간", note: "토막당 꼬집" },
      { key: "물", name: "물", amount: "300ml", water: true },
      { key: "생강", name: "생강", amount: "1쪽 (5g)", note: "비린내", optional: true }
    ],
    steps: [
      { heat: "불 없음", time: "5분", text: "고등어에 소금을 살짝 뿌려 5분 뒀다가 물기를 닦아요. 칼집은 1cm 간격으로 2번." },
      { heat: "중불", time: "2분", text: "냄비 바닥에 무를 깔고 중불 2분, 가장자리가 투명해지기 시작할 때 멈춰요." },
      { heat: "불 없음", time: "1분", text: "고춧가루 1.5큰술, 간장 2큰술, 맛술 2큰술, 설탕 1작은술, 다진 마늘 1큰술, 물 300ml를 무 위에 부어요." },
      { heat: "강불 → 중불", time: "15분", text: "고등어를 올리고 강불로 끓여요. 끓으면 뚜껑을 덮고 중불 15분. 중간 한 번, 뒤집지 말고 국물만 끼얹어요." },
      { heat: "중불", time: "5분", text: "양파와 파를 올리고 뚜껑을 연 채 중불 5분. 국물이 반 정도 남으면 끝이에요." }
    ],
    storage: {
      fridge: "냉장 2일. 생선은 더 짧게 먹어요.",
      freezer: "살이 푸석해져서 냉동은 권하지 않아요.",
      reheat: "냄비에 중불 3분, 또는 전자레인지 2분."
    },
    tip: "15분 전에 뒤집으면 토막이 부서져요. 젓가락으로 뼈 근처가 쉽게 빠지면 익은 거예요."
  },
  {
    id: "gyeran-kimchi-bokkeumbap",
    title: "계란 김치볶음밥",
    cat: "한식",
    servings: "1끼분",
    basis: "1인분 (밥 포함)",
    time: "약 12분",
    kcal: "약 680kcal",
    protein: "약 29g",
    riceNote: "멸치볶음 20g을 마지막에 얹으면 약 +70kcal, 단백질 약 +6g 추정치.",
    budget: "찬밥과 계란. 한 끼 약 1,500~2,500원.",
    tools: ["팬", "가스·인덕션"],
    blurb: "퇴근하고 바로 하는 한 팬. 계란 3개라 단백질이 밥보다 앞서요.",
    keywords: ["볶음밥", "계란", "김치", "멸치"],
    ingredients: [
      { key: "밥", name: "찬밥", amount: "210g (1공기)", main: true },
      { key: "김치", name: "김치", amount: "100g", note: "잘게", main: true },
      { key: "계란", name: "계란", amount: "3개 (특란, 껍질 제외 약 150g)", main: true },
      { key: "다진 마늘", name: "다진 마늘", amount: "1작은술 (5g)" },
      { key: "고춧가루", name: "고춧가루", amount: "1작은술 (3g)" },
      { key: "간장", name: "간장", amount: "1작은술 (5ml)" },
      { key: "파", name: "파", amount: "10g", note: "송송" },
      { key: "식용유", name: "식용유", amount: "1/2큰술 (7g)", main: true },
      { key: "참기름", name: "참기름", amount: "1작은술 (4g)" },
      { key: "멸치볶음", name: "멸치볶음", amount: "20g", note: "마지막에 얹기. 더 볶지 않음", optional: true }
    ],
    steps: [
      { heat: "중강불", time: "20초", text: "팬에 식용유 1/2큰술과 다진 마늘을 중강불 20초 볶아요. 갈색이 나면 꺼내요. 탄 마늘은 버려요." },
      { heat: "중불", time: "2분", text: "김치를 넣고 중불 2분 볶아요." },
      { heat: "중강불", time: "3분", text: "찬밥, 간장 1작은술, 고춧가루 1작은술을 넣고 중강불 3분. 눌렀다가 떼며 볶아요." },
      { heat: "중불", time: "1분", text: "밥을 한쪽으로 밀고 빈자리에 계란 3개를 풀어 중불 1분 스크램블한 뒤 밥과 섞어요." },
      { heat: "중불", time: "30초", text: "파와 참기름 1작은술을 넣고 30초만 볶아요. 멸치볶음을 올린다면 불을 끄고 20g을 섞어요." }
    ],
    storage: {
      fridge: "바로 먹는 게 좋아요. 남으면 냉장 1일.",
      freezer: "냉동하면 밥알이 딱딱해져요.",
      reheat: "전자레인지에 물 1작은술을 뿌리고 1분 30초."
    },
    tip: "따뜻하고 갓 한 밥은 떡져요. 냉장 찬밥이나 즉석밥을 그대로 넣어요."
  },
  {
    id: "hwangtae-gyeran-guk",
    title: "황태채 계란국",
    cat: "한식",
    servings: "1끼분",
    basis: "국 1그릇 (밥 제외)",
    time: "약 10분",
    kcal: "약 210kcal",
    protein: "약 21g",
    riceNote: "밥 1공기(210g)를 더하면 약 520kcal, 단백질 약 27g 추정치.",
    budget: "황태채볶음과 계란. 한 끼 약 1,000~2,000원.",
    tools: ["냄비", "가스·인덕션"],
    blurb: "황태채볶음은 이미 간이 있어서 소금은 마지막에만 봐요.",
    keywords: ["황태", "계란", "국"],
    ingredients: [
      { key: "황태채볶음", name: "황태채볶음", amount: "15g", main: true },
      { key: "계란", name: "계란", amount: "2개 (특란)", main: true },
      { key: "파", name: "파", amount: "10g" },
      { key: "다진 마늘", name: "다진 마늘", amount: "1/2작은술 (3g)" },
      { key: "물", name: "물", amount: "400ml", water: true },
      { key: "소금", name: "소금", amount: "싱거우면 1/4작은술", optional: true }
    ],
    steps: [
      { heat: "강불", time: "끓을 때까지 약 3분", text: "물 400ml에 다진 마늘 1/2작은술을 넣고 강불로 끓여요." },
      { heat: "중불", time: "2분", text: "황태채볶음 15g을 넣고 중불 2분. 이미 볶은 반찬이라 오래 끓이지 않아요." },
      { heat: "중약불", time: "30초", text: "계란 2개를 풀어 가장자리를 따라 두르고 중약불 30초. 젓가락으로 한 번만 저어요. 팔팔 끓이면 계란이 질겨져요." },
      { heat: "불 끄기", time: "바로", text: "파를 넣고 불을 꺼요. 간을 봐서 싱거우면 소금 1/4작은술만 넣어요." }
    ],
    storage: {
      fridge: "냉장 1일. 계란국은 바로 먹는 게 좋아요.",
      freezer: "냉동하지 않아요.",
      reheat: "냄비 중불 2분. 전자레인지는 1분 30초."
    },
    tip: "황태채볶음을 30g으로 늘리면 짜고, 단백질은 약 7g 더 올라가요. 15g이 국 한 그릇 기준이에요."
  },
  {
    id: "chili-dak",
    title: "매콤 칠리 닭가슴살",
    cat: "양식",
    own: true,
    servings: "6~7개 (1kg)",
    basis: "1개 약 150g",
    time: "약 50분 (재우기 20~30분 포함, 두 판이면 굽기 두 번)",
    kcal: "약 230~260kcal",
    protein: "약 33g",
    riceNote: "150g은 소스 묻힌 한 덩이 기준이에요. 데리야끼와 같은 추정치를 써요. 밥 210g을 더하면 약 540~570kcal, 단백질 약 39g 추정치.",
    budget: "닭 1kg으로 6~7끼. 한 끼 약 1,500~2,500원.",
    tools: ["에어프라이어", "팬", "가스·인덕션"],
    blurb: "데리야끼와 같은 굽기. 소스만 칠리·케찹·고춧가루이고, 다진 마늘 1.5큰술은 재울 때 넣어요.",
    keywords: ["평소", "에어프라이어", "닭가슴살", "도시락", "칠리"],
    ingredients: [
      { key: "닭가슴살", name: "닭가슴살", amount: "1kg", note: "1.5cm × 3cm", main: true },
      { key: "맛술", name: "맛술", amount: "밑간 2큰술 (30ml) + 소스 2큰술 (30ml)", main: true },
      { key: "소금", name: "소금", amount: "1/2작은술", note: "밑간" },
      { key: "후추", name: "후추", amount: "조금", note: "밑간" },
      { key: "칠리소스", name: "칠리소스", amount: "6큰술", main: true },
      { key: "케찹", name: "케찹", amount: "2큰술", main: true },
      { key: "고춧가루", name: "고춧가루", amount: "2큰술", main: true },
      { key: "간장", name: "간장", amount: "2큰술 (30ml)", main: true },
      { key: "올리고당", name: "올리고당", amount: "2큰술", main: true },
      { key: "다진 마늘", name: "다진 마늘", amount: "1.5큰술", note: "재우는 소스 절반에", main: true }
    ],
    steps: [
      { heat: "불 없음", time: "10분", text: "닭가슴살 물기를 닦고 1.5cm × 3cm로 썰어요. 맛술 2큰술(30ml), 소금 1/2작은술, 후추로 10분 밑간해요." },
      { heat: "불 없음", time: "3분", text: "소스 볼에 칠리소스 6큰술, 케찹 2큰술, 고춧가루 2큰술, 간장 2큰술(30ml), 올리고당 2큰술, 맛술 2큰술(30ml)을 섞어요." },
      { heat: "냉장", time: "20~30분", text: "소스의 절반에 다진 마늘 1.5큰술을 넣고 고기와 버무려 냉장 20~30분 재워요. 나머지 소스는 뚜껑을 덮어 따로 둬요." },
      { heat: "에어프라이어 180°C", time: "8분 + 뒤집어서 6분", text: "한 겹이 되게 담아요. 1kg은 보통 두 번으로 나뉘어요. 180°C 8분, 뒤집어서 6분. 겹쳐 구우면 속이 덜 익어요. 자른 속이 하얘야 해요." },
      { heat: "중불", time: "소스 1분 + 버무리기 30초~1분", text: "남은 소스를 팬에서 중불로 1분 끓여요. 고기를 넣고 30초~1분만 버무려요. 2분을 넘기지 마세요. 너무 되직하면 그때만 물 1큰술을 넣어요." }
    ],
    storage: {
      fridge: "냉장 3일.",
      freezer: "냉동 3~4주. 150g씩 나눠 얼려요.",
      reheat: "냉장 것은 전자레인지 2분, 뒤집어 1분. 냉동은 냉장에서 반나절 녹이거나 해동한 뒤 같은 시간."
    },
    tip: "고춧가루 2큰술은 꽤 맵어요. 매운맛을 낮출 때만 1큰술로 줄이세요. 기본 레시피는 2큰술이에요."
  },
  {
    id: "ketchup-dak-gui",
    title: "케찹 닭가슴살 구이",
    cat: "양식",
    servings: "2끼분",
    basis: "1인분 (생 닭 200g 기준)",
    time: "약 25분",
    kcal: "약 310kcal",
    protein: "약 47g",
    riceNote: "밥 1공기(210g)를 더하면 약 620kcal, 단백질 약 53g 추정치.",
    budget: "닭 400g으로 2끼. 한 끼 약 2,000~3,000원.",
    tools: ["에어프라이어 또는 팬"],
    blurb: "칠리 없이 케찹·간장·마늘. 소스는 마지막 2분만 입혀 안 타게 해요.",
    keywords: ["케찹", "에어프라이어", "닭가슴살"],
    ingredients: [
      { key: "닭가슴살", name: "닭가슴살", amount: "400g", note: "두께 2cm 안 넘게 포 뜨기", main: true },
      { key: "케찹", name: "케찹", amount: "3큰술 (45g)", main: true },
      { key: "간장", name: "간장", amount: "1큰술 (15ml)" },
      { key: "올리고당", name: "올리고당", amount: "1큰술 (18g)" },
      { key: "다진 마늘", name: "다진 마늘", amount: "1큰술" },
      { key: "소금", name: "소금", amount: "1/4작은술" },
      { key: "후추", name: "후추", amount: "조금" },
      { key: "식용유", name: "식용유", amount: "1작은술 (4g)", note: "팬일 때만", optional: true }
    ],
    steps: [
      { heat: "불 없음", time: "5분", text: "닭에 소금 1/4작은술과 후추를 뿌려 5분 두어요. 두께가 2.5cm를 넘으면 반으로 포 떠요." },
      { heat: "불 없음", time: "1분", text: "케찹 3큰술, 간장 1큰술, 올리고당 1큰술, 다진 마늘 1큰술을 섞어 소스를 만들어요." },
      { heat: "에어프라이어 180°C", time: "8분 + 6분", text: "닭만 먼저 180°C 8분, 뒤집어서 6분. 팬이면 중불에서 한 면 4분, 뒤집어 4분. 기름은 팬일 때 1작은술." },
      { heat: "에어프라이어 180°C 또는 중불", time: "2분", text: "소스를 양면에 바르고 180°C 2분, 또는 팬 중불 1분만 더. 설탕이 타기 전에 꺼내요. 속이 하얘야 해요." }
    ],
    storage: {
      fridge: "냉장 3일.",
      freezer: "냉동 3주.",
      reheat: "전자레인지 1분 30초 + 30초. 에어프라이어면 180°C 3분."
    },
    tip: "소스를 처음부터 바르면 케찹이 검게 타요. 속 익힌 뒤에 2분만 입히세요."
  },
  {
    id: "donkatsu-dak-steak",
    title: "돈까스 소스 닭가슴 스테이크",
    cat: "양식",
    servings: "1끼분",
    basis: "1인분",
    time: "약 15분",
    kcal: "약 320kcal",
    protein: "약 46g",
    riceNote: "밥 1공기(210g)를 더하면 약 630kcal, 단백질 약 52g 추정치.",
    budget: "닭 200g과 소스. 한 끼 약 2,000~3,500원.",
    tools: ["팬", "가스·인덕션"],
    blurb: "빵가루 없이 굽고, 돈까스 소스를 따로 1분 끓여 끼얹어요.",
    keywords: ["돈까스 소스", "스테이크", "닭가슴살"],
    ingredients: [
      { key: "닭가슴살", name: "닭가슴살", amount: "200g", note: "두께 1.5cm로 맞추기", main: true },
      { key: "돈까스 소스", name: "돈까스 소스", amount: "2큰술 (36g)", main: true },
      { key: "케찹", name: "케찹", amount: "1큰술 (15g)" },
      { key: "다진 마늘", name: "다진 마늘", amount: "1작은술 (5g)" },
      { key: "맛술", name: "맛술", amount: "1작은술 (5ml)" },
      { key: "소금", name: "소금", amount: "1/4작은술" },
      { key: "후추", name: "후추", amount: "조금" },
      { key: "식용유", name: "식용유", amount: "1작은술 (4g)", main: true },
      { key: "물", name: "물", amount: "2큰술 (30ml)", water: true }
    ],
    steps: [
      { heat: "불 없음", time: "5분", text: "닭에 맛술 1작은술, 소금 1/4작은술, 후추를 바르고 5분 두어요." },
      { heat: "중강불 → 중불", time: "한 면 4분 + 3분", text: "팬을 중강불로 1분 달구고 식용유 1작은술을 둘러요. 중불로 낮춰 한 면 4분, 뒤집어서 3분. 누르지 않아요. 접시에 빼 1분 두어요." },
      { heat: "중불", time: "1분", text: "같은 팬에 돈까스 소스 2큰술, 케찹 1큰술, 다진 마늘 1작은술, 물 2큰술을 넣고 중불 1분 끓여요. 걸쭉해지면 닭 위에 끼얹어요." }
    ],
    storage: {
      fridge: "냉장 2일.",
      freezer: "소스 없이 냉동 3주. 소스는 데울 때 새로 1분.",
      reheat: "전자레인지 1분 30초. 팬이면 중불 1분씩 양면."
    },
    tip: "닭을 소스에 넣고 2분 이상 끓이면 퍼석해져요. 소스는 끼얹기만 해요."
  },
  {
    id: "hambak-steak",
    title: "함박스테이크",
    cat: "양식",
    servings: "2끼분",
    basis: "1인분 (고기 150g 기준, 밥 제외)",
    time: "약 30분",
    kcal: "약 470kcal",
    protein: "약 34g",
    riceNote: "밥 1공기(210g)를 더하면 약 780kcal, 단백질 약 40g 추정치.",
    budget: "살코기 다짐 300g으로 2끼. 한 끼 약 5,000~7,000원.",
    tools: ["팬", "가스·인덕션", "전자레인지"],
    blurb: "양파를 숨 죽인 뒤 섞어야 패티가 안 갈라져요.",
    keywords: ["소고기", "함박", "케찹"],
    ingredients: [
      { key: "다진 소고기", name: "다진 소고기", amount: "300g", note: "살코기, 지방 10~15%", main: true },
      { key: "양파", name: "양파", amount: "80g", note: "잘게", main: true },
      { key: "계란", name: "계란", amount: "1개 (특란)", main: true },
      { key: "빵가루", name: "빵가루", amount: "3큰술 (15g)", main: true },
      { key: "소금", name: "소금", amount: "1/2작은술 (2.5g)" },
      { key: "후추", name: "후추", amount: "조금" },
      { key: "식용유", name: "식용유", amount: "1큰술 (13g)", main: true },
      { key: "케찹", name: "케찹", amount: "2큰술 (30g)", note: "소스" },
      { key: "돈까스 소스", name: "돈까스 소스", amount: "2큰술 (36g)", note: "소스" },
      { key: "설탕", name: "설탕", amount: "1작은술 (4g)", note: "소스" },
      { key: "물", name: "물", amount: "4큰술 (60ml)", note: "소스", water: true }
    ],
    steps: [
      { heat: "전자레인지 또는 중불", time: "전자레인지 1분, 또는 팬 2분", text: "양파를 잘게 썰어 전자레인지 1분, 또는 마른 팬 중불 2분으로 숨만 죽여 식혀요." },
      { heat: "불 없음", time: "3분", text: "고기, 식힌 양파, 계란 1개, 빵가루 3큰술, 소금 1/2작은술, 후추를 한 방향으로 20번만 섞어요. 많이 치면 질겨져요." },
      { heat: "불 없음", time: "2분", text: "2등분해서 두께 2cm 타원으로 만들어요. 가운데를 엄지로 살짝 오목하게 눌러요." },
      { heat: "중불 → 약불", time: "한 면 4분 + 3분 + 뚜껑 3분", text: "식용유 1큰술을 두르고 중불에서 한 면 4분, 뒤집어서 3분. 뚜껑을 덮고 약불 3분. 자른 속이 갈색이면 끝, 분홍이면 약불 1분 더." },
      { heat: "중불", time: "2분", text: "고기를 빼 둔 팬에 케찹 2큰술, 돈까스 소스 2큰술, 설탕 1작은술, 물 4큰술을 넣고 중불 2분. 걸쭉하면 끼얹어요." }
    ],
    storage: {
      fridge: "냉장 2일.",
      freezer: "소스 바르기 전에 냉동 3주.",
      reheat: "뚜껑 덮고 약불 4분, 또는 전자레인지 2분."
    },
    tip: "빵가루가 없으면 두부가 아니라 찬밥 2큰술(30g)로 대체할 수 있어요. 그때는 추정치에서 빵가루 분(약 25kcal)을 빼요."
  },
  {
    id: "tomato-tuna-pasta",
    title: "토마토 참치 파스타",
    cat: "양식",
    servings: "1끼분",
    basis: "1인분 (건면 90g)",
    time: "약 20분",
    kcal: "약 670kcal",
    protein: "약 31g",
    riceNote: "면이 밥 자리예요. 밥을 더하지 않아요.",
    budget: "면·참치 캔·토마토. 한 끼 약 3,000~4,500원.",
    tools: ["냄비", "팬", "가스·인덕션"],
    blurb: "마늘을 먼저 볶고, 면은 포장 시간보다 1분 짧게.",
    keywords: ["파스타", "참치", "토마토"],
    ingredients: [
      { key: "스파게티면", name: "스파게티면", amount: "건면 90g", main: true },
      { key: "참치캔", name: "참치캔", amount: "1캔 (100g)", note: "기름 1작은술만 남기고 건더기 약 70g", main: true },
      { key: "토마토", name: "토마토", amount: "150g", note: "방울토마토면 10개", main: true },
      { key: "양파", name: "양파", amount: "50g", main: true },
      { key: "다진 마늘", name: "다진 마늘", amount: "1큰술", main: true },
      { key: "케찹", name: "케찹", amount: "1큰술 (15g)", note: "토마토가 밍밍할 때 색" },
      { key: "식용유", name: "식용유", amount: "1큰술 (13g)", main: true },
      { key: "소금", name: "소금", amount: "면수 1L에 1작은술 (5g) + 소스 한 꼬집" },
      { key: "후추", name: "후추", amount: "조금" },
      { key: "물", name: "물", amount: "면 삶기 1L + 면수 50ml", water: true }
    ],
    steps: [
      { heat: "강불 → 중불", time: "포장 시간보다 1분 짧게 (보통 7~8분)", text: "물 1L에 소금 1작은술을 넣고 강불로 끓여요. 면을 넣고 포장 시간보다 1분 짧게 삶아 건져요. 면수 50ml는 남겨요." },
      { heat: "중불", time: "40초", text: "팬에 식용유 1큰술과 다진 마늘을 중불 40초. 가장자리가 노릇해지면 바로 다음." },
      { heat: "중불", time: "1분 + 3분", text: "양파를 1분 볶고 토마토를 넣어 중불 3분 으깨요. 물이 많으면 1분 더." },
      { heat: "중불", time: "2분", text: "참치 건더기, 남긴 기름 1작은술, 케찹 1큰술, 후추를 넣고 중불 2분." },
      { heat: "중불", time: "1분", text: "면과 면수 50ml를 넣고 중불 1분 버무려요. 간이 싱거우면 소금 한 꼬집." }
    ],
    storage: {
      fridge: "냉장 1일. 면이 불어요.",
      freezer: "냉동하지 않아요.",
      reheat: "팬에 물 1큰술, 중불 2분."
    },
    tip: "면을 다 익혀 건지면 소스에서 1분 더 불어 퍼져요. 1분 덜 삶는 이유가 그거예요."
  },
  {
    id: "oven-dakdari",
    title: "오븐 마늘 닭다리구이",
    cat: "양식",
    servings: "2끼분",
    basis: "1인분 (생 다리살 200g)",
    time: "약 35분",
    kcal: "약 450kcal",
    protein: "약 38g",
    riceNote: "밥 1공기(210g)를 더하면 약 760kcal, 단백질 약 44g 추정치.",
    budget: "뼈 없는 다리살 400g. 한 끼 약 3,000~4,500원.",
    tools: ["오븐 또는 에어프라이어"],
    blurb: "다리살이라 가슴살보다 덜 말라요. 200°C 22분이 기본이에요.",
    keywords: ["오븐", "닭다리", "마늘"],
    ingredients: [
      { key: "닭다리살", name: "닭다리살 (뼈 없는 것)", amount: "400g", main: true },
      { key: "다진 마늘", name: "다진 마늘", amount: "1큰술", main: true },
      { key: "식용유", name: "식용유", amount: "1큰술 (13g)", main: true },
      { key: "소금", name: "소금", amount: "1/2작은술 (2.5g)" },
      { key: "후추", name: "후추", amount: "조금" },
      { key: "양파", name: "양파", amount: "1/4개 (50g)", note: "같이 구워 먹음", optional: true }
    ],
    steps: [
      { heat: "오븐 200°C", time: "예열 8분", text: "오븐을 200°C로 8분 예열해요. 에어프라이어면 예열 없이 아래 시간으로 가도 돼요." },
      { heat: "불 없음", time: "5분", text: "다리살에 다진 마늘 1큰술, 식용유 1큰술, 소금 1/2작은술, 후추를 바르고 5분 두어요." },
      { heat: "오븐 200°C", time: "12분 + 뒤집어서 10분", text: "한 겹으로 올리고 200°C 12분, 뒤집어서 10분. 에어프라이어면 180°C 10분, 뒤집어서 8분. 자르면 육즙이 맑아야 해요. 분홍이면 3분 더." }
    ],
    storage: {
      fridge: "냉장 3일.",
      freezer: "냉동 3주.",
      reheat: "에어프라이어 180°C 4분. 전자레인지는 1분 30초지만 겉이 눅어요."
    },
    tip: "가슴살로 바꾸면 같은 시간에 마를 수 있어요. 가슴살이면 오븐 200°C 기준 한 면 8분, 뒤집어 6분으로 줄이세요."
  },
  {
    id: "tomato-meatball",
    title: "토마토 미트볼",
    cat: "양식",
    servings: "3끼분",
    basis: "1인분 (고기 약 130g)",
    time: "약 35분",
    kcal: "약 400kcal",
    protein: "약 32g",
    riceNote: "밥 1공기(210g)를 더하면 약 710kcal, 단백질 약 38g 추정치.",
    budget: "다짐육 400g으로 3끼. 한 끼 약 4,000~6,000원.",
    tools: ["팬", "가스·인덕션"],
    blurb: "미트볼을 먼저 굴려 익히고, 토마토 소스에 8분만 끓여요.",
    keywords: ["미트볼", "소고기", "토마토"],
    ingredients: [
      { key: "다진 소고기", name: "다진 소고기", amount: "400g", note: "살코기, 지방 10~15%", main: true },
      { key: "양파", name: "양파", amount: "80g", note: "잘게", main: true },
      { key: "다진 마늘", name: "다진 마늘", amount: "1큰술", main: true },
      { key: "계란", name: "계란", amount: "1개", main: true },
      { key: "빵가루", name: "빵가루", amount: "4큰술 (20g)", main: true },
      { key: "토마토", name: "토마토", amount: "2개 (400g)", main: true },
      { key: "케찹", name: "케찹", amount: "2큰술 (30g)" },
      { key: "간장", name: "간장", amount: "1큰술 (15ml)" },
      { key: "설탕", name: "설탕", amount: "1작은술 (4g)" },
      { key: "소금", name: "소금", amount: "1/2작은술" },
      { key: "후추", name: "후추", amount: "조금" },
      { key: "식용유", name: "식용유", amount: "1큰술 (13g)", main: true },
      { key: "물", name: "물", amount: "150ml", water: true }
    ],
    steps: [
      { heat: "불 없음", time: "5분", text: "고기, 양파, 다진 마늘, 계란, 빵가루, 소금 1/2작은술, 후추를 20번만 섞어요. 3cm 볼로 12개 만들어요." },
      { heat: "중불", time: "8분", text: "식용유 1큰술을 두르고 중불에서 굴려 가며 8분. 겉이 갈색이고 눌러도 탄력이 있으면 빼요." },
      { heat: "중불", time: "4분", text: "같은 팬에 토마토를 으깨 넣고 마늘이 남아 있으면 같이, 중불 4분 볶아요." },
      { heat: "중약불", time: "8분", text: "케찹 2큰술, 간장 1큰술, 설탕 1작은술, 물 150ml와 미트볼을 넣고 뚜껑을 덮어 중약불 8분. 가운데를 갈랐을 때 분홍이 없으면 끝. 있으면 2분 더." }
    ],
    storage: {
      fridge: "냉장 3일.",
      freezer: "냉동 3주. 소스째 1끼분씩.",
      reheat: "뚜껑 덮고 중약불 4분, 또는 전자레인지 2분."
    },
    tip: "볼을 4cm보다 크게 만들면 8분+8분으로 속이 안 익어요. 3cm를 지키세요."
  },
  {
    id: "oven-gamja-dak",
    title: "오븐 감자 닭가슴살",
    cat: "양식",
    servings: "2끼분",
    basis: "1인분 (감자 포함, 밥 없음)",
    time: "약 40분",
    kcal: "약 360kcal",
    protein: "약 38g",
    riceNote: "감자가 탄수화물이에요. 밥을 더하면 한 끼가 커지니 벤치업 날이 아니면 밥은 빼요.",
    budget: "닭 300g·감자 2개. 한 끼 약 2,500~4,000원.",
    tools: ["오븐"],
    blurb: "감자를 15분 먼저 구운 뒤 닭을 올려 18분.",
    keywords: ["오븐", "감자", "닭가슴살"],
    ingredients: [
      { key: "닭가슴살", name: "닭가슴살", amount: "300g", note: "1.5cm", main: true },
      { key: "감자", name: "감자", amount: "300g", note: "1cm 쐐기", main: true },
      { key: "양파", name: "양파", amount: "80g", main: true },
      { key: "다진 마늘", name: "다진 마늘", amount: "1큰술" },
      { key: "식용유", name: "식용유", amount: "1큰술 (13g)", main: true },
      { key: "소금", name: "소금", amount: "1/2작은술" },
      { key: "후추", name: "후추", amount: "조금" },
      { key: "케찹", name: "케찹", amount: "1큰술", note: "닭에만, 마지막", optional: true }
    ],
    steps: [
      { heat: "오븐 200°C", time: "예열 8분", text: "오븐을 200°C로 예열해요." },
      { heat: "불 없음", time: "5분", text: "감자 쐐기와 양파에 식용유 2/3, 소금의 반을 버무려요. 닭에는 나머지 기름, 소금, 후추, 다진 마늘을 발라요." },
      { heat: "오븐 200°C", time: "감자 15분", text: "감자와 양파만 먼저 200°C 15분." },
      { heat: "오븐 200°C", time: "18분", text: "닭을 감자 위에 올리고 200°C 18분. 중간에 한 번 뒤집어요. 닭 속이 하얗고 감자 포크가 들어가면 끝. 닭이 마르면 케찹 1큰술을 마지막 2분에만 발라요." }
    ],
    storage: {
      fridge: "냉장 3일.",
      freezer: "냉동 3주. 감자는 식감이 조금 푸석해져요.",
      reheat: "오븐 200°C 8분, 또는 전자레인지 2분."
    },
    tip: "감자를 1.5cm보다 두껍게 썰면 18분 뒤에도 안 익어요. 1cm를 지키세요."
  },
  {
    id: "teriyaki-dak",
    title: "닭가슴살 데리야끼 도시락",
    cat: "일식",
    own: true,
    servings: "6~7개 (1kg)",
    basis: "1개 약 150g",
    time: "약 50분 (재우기 20~30분 포함)",
    kcal: "약 230~260kcal",
    protein: "약 33g",
    riceNote: "150g 한 덩이 기준 추정치예요. 밥 210g을 더하면 약 540~570kcal, 단백질 약 39g 추정치.",
    budget: "닭 1kg으로 6~7끼. 한 끼 약 1,500~2,500원.",
    tools: ["에어프라이어", "팬"],
    blurb: "평소 도시락. 다진 마늘 1.5큰술은 재우는 소스 절반에만 넣어요.",
    keywords: ["평소", "데리야끼", "에어프라이어", "도시락", "닭가슴살"],
    ingredients: [
      { key: "닭가슴살", name: "닭가슴살", amount: "1kg", note: "1.5cm × 3cm", main: true },
      { key: "맛술", name: "맛술", amount: "밑간 2큰술 (30ml) + 소스 2큰술 (30ml)", main: true },
      { key: "소금", name: "소금", amount: "1/2작은술", note: "밑간" },
      { key: "후추", name: "후추", amount: "조금", note: "밑간" },
      { key: "간장", name: "간장", amount: "6큰술 (90ml)", main: true },
      { key: "올리고당", name: "올리고당", amount: "4큰술", main: true },
      { key: "설탕", name: "설탕", amount: "1큰술", main: true },
      { key: "굴소스", name: "굴소스", amount: "1큰술", main: true },
      { key: "다진 마늘", name: "다진 마늘", amount: "1.5큰술", note: "재우는 소스 절반에", main: true },
      { key: "물", name: "물", amount: "6큰술 (90ml)", note: "소스", water: true }
    ],
    steps: [
      { heat: "불 없음", time: "10분", text: "닭가슴살 물기를 닦고 1.5cm × 3cm로 썰어요. 맛술 2큰술(30ml), 소금 1/2작은술, 후추로 10분 밑간해요." },
      { heat: "불 없음", time: "3분", text: "소스: 간장 6큰술(90ml), 맛술 2큰술(30ml), 올리고당 4큰술, 설탕 1큰술, 굴소스 1큰술, 물 6큰술(90ml)을 섞어요." },
      { heat: "냉장", time: "20~30분", text: "소스의 절반에 다진 마늘 1.5큰술을 넣고 고기를 버무려 냉장 20~30분 재워요. 남은 소스는 따로 둬요." },
      { heat: "에어프라이어 180°C", time: "8분 + 뒤집어서 6분", text: "한 겹으로 담아요. 1kg은 보통 두 판이에요. 180°C 8분, 뒤집어서 6분. 속이 하얄 때까지, 겹치면 같은 시간으로 한 번 더." },
      { heat: "중불", time: "소스 1분 + 버무리기 30초~1분", text: "남은 소스를 팬에서 중불로 1분 끓여요. 고기를 넣고 30초~1분 버무려요. 2분을 넘기지 마세요." }
    ],
    storage: {
      fridge: "냉장 3일.",
      freezer: "냉동 3~4주. 150g씩.",
      reheat: "냉장 것은 전자레인지 2분, 뒤집어 1분. 냉동은 해동 후 같은 시간."
    },
    tip: "마늘을 남은 소스(끓이는 쪽)에 넣지 않아요. 1.5큰술 전부 재울 때 들어가야 구우면서 익어요."
  },
  {
    id: "oyakodon",
    title: "오야코동",
    cat: "일식",
    servings: "2끼분",
    basis: "1인분 (밥 210g 포함)",
    time: "약 25분",
    kcal: "약 640kcal",
    protein: "약 47g",
    riceNote: "밥이 이미 포함돼 있어요.",
    budget: "닭 250g·계란 3개·밥. 한 끼 약 3,000~4,500원.",
    tools: ["작은 냄비", "가스·인덕션", "밥솥"],
    blurb: "계란은 두 번에 나눠 붓고, 완전히 익히지 않아요.",
    keywords: ["덮밥", "계란", "닭가슴살"],
    ingredients: [
      { key: "닭가슴살", name: "닭가슴살", amount: "250g", note: "1cm 조각", main: true },
      { key: "양파", name: "양파", amount: "1/2개 (100g)", note: "0.5cm", main: true },
      { key: "계란", name: "계란", amount: "3개", main: true },
      { key: "밥", name: "밥", amount: "420g (1공기×2)", main: true },
      { key: "간장", name: "간장", amount: "3큰술 (45ml)" },
      { key: "맛술", name: "맛술", amount: "3큰술 (45ml)" },
      { key: "설탕", name: "설탕", amount: "1큰술 (12g)" },
      { key: "다진 마늘", name: "다진 마늘", amount: "1작은술 (5g)" },
      { key: "파", name: "파", amount: "10g" },
      { key: "물", name: "물", amount: "200ml", note: "육수 대신", water: true }
    ],
    steps: [
      { heat: "중불", time: "끓을 때까지 약 2분", text: "냄비에 물 200ml, 간장 3큰술, 맛술 3큰술, 설탕 1큰술, 다진 마늘 1작은술을 넣고 중불로 끓여요." },
      { heat: "중불", time: "양파 2분 + 닭 4분", text: "양파를 넣고 중불 2분. 닭을 한 층으로 올리고 뚜껑을 덮어 중불 4분. 속이 하얘지면 더 끓이지 않아요." },
      { heat: "중약불", time: "30초 + 뚜껑 30초", text: "계란 3개를 풀어 2/3만 국물 위에 두르고 중약불 30초. 나머지 1/3을 올리고 뚜껑 30초. 젓지 않아요. 노른자가 조금 덜 익은 상태에서 꺼내요." },
      { heat: "불 끄기", time: "바로", text: "밥 210g씩 담은 그릇에 올리고 파를 뿌려요. 국물은 2~3큰술만 끼얹어요. 전부 부으면 밥이 질어요." }
    ],
    storage: {
      fridge: "계란이 들어간 덮밥은 바로 먹어요. 닭만 남기면 냉장 2일.",
      freezer: "냉동하지 않아요.",
      reheat: "닭만 전자레인지 1분 30초 한 뒤 계란은 새로 올려요."
    },
    tip: "계란을 1분 넘게 끓이면 지단처럼 단단해져요. 30초+30초를 지키세요."
  },
  {
    id: "gyudon",
    title: "규동",
    cat: "일식",
    servings: "2끼분",
    basis: "1인분 (밥 210g 포함)",
    time: "약 20분",
    kcal: "약 640kcal",
    protein: "약 38g",
    riceNote: "밥이 이미 포함돼 있어요. 소고기는 수입 우둔·설도 기준이에요.",
    budget: "소고기 250g으로 2끼. 한 끼 약 6,000~8,000원.",
    tools: ["냄비", "가스·인덕션"],
    blurb: "얇은 고기는 센 불에 먼저 굽지 않아요. 양파 국물에 3분이면 익어요.",
    keywords: ["소고기", "덮밥", "규동"],
    ingredients: [
      { key: "소고기", name: "소고기 (우둔 또는 설도)", amount: "250g", note: "불고기용으로 얇게. 한우는 예산이 넘기 쉬워요", main: true },
      { key: "양파", name: "양파", amount: "150g", note: "0.5cm", main: true },
      { key: "밥", name: "밥", amount: "420g (1공기×2)", main: true },
      { key: "간장", name: "간장", amount: "3큰술 (45ml)" },
      { key: "맛술", name: "맛술", amount: "3큰술 (45ml)" },
      { key: "설탕", name: "설탕", amount: "1큰술 (12g)" },
      { key: "올리고당", name: "올리고당", amount: "1큰술 (18g)" },
      { key: "다진 마늘", name: "다진 마늘", amount: "1큰술" },
      { key: "물", name: "물", amount: "100ml", water: true },
      { key: "계란", name: "계란 노른자 또는 온천란", amount: "1개", optional: true }
    ],
    steps: [
      { heat: "중불", time: "2분", text: "냄비에 물 100ml, 간장 3큰술, 맛술 3큰술, 설탕 1큰술, 올리고당 1큰술, 다진 마늘 1큰술을 넣고 중불로 끓여요." },
      { heat: "중불", time: "4분", text: "양파를 넣고 중불 4분. 가장자리가 투명해질 때까지." },
      { heat: "중불", time: "3분", text: "소고기를 켜켜이 올리고 중불 3분. 뒤집지 말고 국물을 끼얹어요. 회색으로 변하면 바로 꺼내요. 5분을 넘기면 질겨져요." },
      { heat: "불 끄기", time: "바로", text: "밥 210g 위에 고기와 양파, 국물 2큰술을 올려요." }
    ],
    storage: {
      fridge: "고기만 냉장 2일. 밥과 섞어 두지 않아요.",
      freezer: "고기·양파만 냉동 3주.",
      reheat: "냄비 중불 2분 후 새 밥 위에."
    },
    tip: "등심이나 갈비살은 같은 양이어도 지방이 많아 예산과 칼로리가 같이 올라가요. 우둔·설도로 맞춘 추정치예요."
  },
  {
    id: "shogayaki",
    title: "돼지 생강구이",
    cat: "일식",
    servings: "2끼분",
    basis: "1인분 (요리만, 생고기 180g)",
    time: "약 25분 (재우기 15분 포함)",
    kcal: "약 380kcal",
    protein: "약 39g",
    riceNote: "밥 1공기(210g)를 더하면 약 690kcal, 단백질 약 45g 추정치.",
    budget: "앞다리 360g. 한 끼 약 4,000~6,000원.",
    tools: ["팬", "가스·인덕션"],
    blurb: "0.5cm 고기는 한 면 2분을 넘기지 않아요.",
    keywords: ["생강", "돼지", "일식"],
    ingredients: [
      { key: "돼지 앞다리살", name: "돼지 앞다리살", amount: "360g", note: "0.5cm. 목살도 가능", main: true },
      { key: "생강", name: "생강", amount: "1큰술 (15g)", note: "곱게 다진 것", main: true },
      { key: "간장", name: "간장", amount: "2.5큰술 (38ml)" },
      { key: "맛술", name: "맛술", amount: "2큰술 (30ml)" },
      { key: "설탕", name: "설탕", amount: "1큰술 (12g)" },
      { key: "다진 마늘", name: "다진 마늘", amount: "1작은술 (5g)" },
      { key: "파", name: "파", amount: "10g" },
      { key: "식용유", name: "식용유", amount: "1작은술 (4g)", main: true }
    ],
    steps: [
      { heat: "냉장 또는 실온", time: "15분", text: "고기를 0.5cm로 썰어 간장, 맛술, 설탕, 생강 1큰술, 다진 마늘 1작은술에 15분 재워요." },
      { heat: "중강불", time: "한 면 2분 + 2분", text: "양념 물기를 가볍게 털어요. 팬을 중강불로 달구고 식용유 1작은술을 둘러 한 면 2분, 뒤집어서 2분. 진한 갈색이 나면 바로 꺼내요. 한 면을 3분 넘기지 않아요." },
      { heat: "불 끄기", time: "바로", text: "파를 뿌려요. 팬에 남은 양념이 타기 시작하면 물을 1큰술 넣어 5초만 녹여 고기에 끼얹어요." }
    ],
    storage: {
      fridge: "냉장 3일.",
      freezer: "냉동 3주.",
      reheat: "팬 중강불 한 면 40초씩. 전자레인지 1분 30초."
    },
    tip: "생강가루 1/2작은술은 생강 1큰술과 향이 달라요. 가능하면 생강을 다져 쓰세요. 없으면 생강가루 1/2작은술로만 대체해요."
  },
  {
    id: "karaage",
    title: "치킨 가라아게",
    cat: "일식",
    servings: "2끼분",
    basis: "1인분",
    time: "약 35분 (재우기 15분 포함)",
    kcal: "약 550kcal",
    protein: "약 39g",
    riceNote: "밥 1공기(210g)를 더하면 약 860kcal, 단백질 약 45g 추정치. 튀김옷이 있어 다른 닭 요리보다 칼로리가 높아요.",
    budget: "다리살 400g·감자전분. 한 끼 약 3,500~5,000원.",
    tools: ["에어프라이어"],
    blurb: "튀기지 않고 에어프라이어. 전분은 얇게, 기름은 1큰술만.",
    keywords: ["에어프라이어", "가라아게", "닭다리"],
    ingredients: [
      { key: "닭다리살", name: "닭다리살 (뼈 없는 것)", amount: "400g", note: "3cm", main: true },
      { key: "감자전분", name: "감자전분", amount: "5큰술 (45g)", main: true },
      { key: "간장", name: "간장", amount: "1.5큰술 (23ml)" },
      { key: "맛술", name: "맛술", amount: "1큰술 (15ml)" },
      { key: "다진 마늘", name: "다진 마늘", amount: "1큰술" },
      { key: "생강", name: "생강", amount: "1작은술 (5g)", optional: true },
      { key: "후추", name: "후추", amount: "조금" },
      { key: "식용유", name: "식용유", amount: "1큰술 (13g)", note: "옷 위에", main: true }
    ],
    steps: [
      { heat: "냉장", time: "15분", text: "닭 3cm에 간장 1.5큰술, 맛술 1큰술, 다진 마늘, 생강 1작은술, 후추를 버무려 15분 재워요." },
      { heat: "불 없음", time: "2분", text: "감자전분 5큰술을 얇게 묻혀 여분을 털어요. 식용유 1큰술을 옷 위에 고르게 발라요." },
      { heat: "에어프라이어 180°C", time: "8분 + 7분", text: "한 겹으로 180°C 8분, 뒤집어서 7분. 자르면 육즙이 맑아야 해요. 분홍이면 2분 더." },
      { heat: "불 없음", time: "1분", text: "꺼내서 1분 두었다가 먹어요. 바로 뚜껑을 덮으면 눅눅해져요." }
    ],
    storage: {
      fridge: "냉장 2일.",
      freezer: "냉동 3주.",
      reheat: "에어프라이어 180°C 4분. 전자레인지는 눅눅해져서 권하지 않아요."
    },
    tip: "가슴살로 바꾸면 단백질은 오르고 육즙은 줄어요. 가슴살이면 180°C 7분 + 5분으로 줄이세요."
  },
  {
    id: "chicken-katsu",
    title: "치킨 가츠",
    cat: "일식",
    servings: "2끼분",
    basis: "1인분 (소스 1큰술 포함, 밥 제외)",
    time: "약 25분",
    kcal: "약 430kcal",
    protein: "약 42g",
    riceNote: "밥 1공기(210g)와 양배추를 더하면 한 끼 약 750kcal, 단백질 약 48g 전후 추정치.",
    budget: "닭 2쪽·빵가루·돈까스 소스. 한 끼 약 3,000~4,500원.",
    tools: ["에어프라이어"],
    blurb: "두께를 1cm로 맞춰야 7분+6분에 속이 익어요.",
    keywords: ["돈가스", "가츠", "에어프라이어", "돈까스 소스"],
    ingredients: [
      { key: "닭가슴살", name: "닭가슴살", amount: "300g (2쪽)", note: "두드려 두께 1cm", main: true },
      { key: "밀가루", name: "밀가루", amount: "3큰술 (24g)", main: true },
      { key: "계란", name: "계란", amount: "1개", main: true },
      { key: "빵가루", name: "빵가루", amount: "40g", main: true },
      { key: "식용유", name: "식용유", amount: "1.5큰술 (20g)", note: "빵가루 위에", main: true },
      { key: "돈까스 소스", name: "돈까스 소스", amount: "2큰술", note: "1인분당 1큰술" },
      { key: "소금", name: "소금", amount: "1/4작은술" },
      { key: "후추", name: "후추", amount: "조금" }
    ],
    steps: [
      { heat: "불 없음", time: "5분", text: "닭을 두드려 두께 1cm로 맞추고 소금·후추를 뿌려요. 가장자리가 2cm로 두꺼우면 시간이 안 맞아요." },
      { heat: "불 없음", time: "3분", text: "밀가루 → 풀어 둔 계란 → 빵가루 순서. 빵가루 위에 식용유 1.5큰술을 손가락으로 흩뿌려요." },
      { heat: "에어프라이어 180°C", time: "7분 + 6분", text: "180°C 7분, 뒤집어서 6분. 한 점을 잘라 속이 하얘야 해요. 두꺼우면 2분 더." },
      { heat: "불 없음", time: "1분", text: "1분 둔 뒤 썰고 돈까스 소스 1큰술을 곁들여요." }
    ],
    storage: {
      fridge: "냉장 2일.",
      freezer: "냉동 3주.",
      reheat: "에어프라이어 180°C 4분. 전자레인지는 빵가루가 눅어요."
    },
    tip: "기름을 안 바르면 빵가루가 밀가루 맛으로 남아요. 1.5큰술이 에어프라이어 기준이에요."
  },
  {
    id: "soboro-don",
    title: "닭가슴살 소보로 덮밥",
    cat: "일식",
    servings: "2끼분",
    basis: "1인분 (밥 210g 포함)",
    time: "약 20분",
    kcal: "약 600kcal",
    protein: "약 48g",
    riceNote: "밥이 이미 포함돼 있어요.",
    budget: "닭 300g·계란·밥. 한 끼 약 2,500~3,500원.",
    tools: ["팬", "가스·인덕션"],
    blurb: "다진 닭을 국물 없이 볶아야 밥이 안 질어요.",
    keywords: ["덮밥", "닭가슴살", "계란", "도시락"],
    ingredients: [
      { key: "닭가슴살", name: "닭가슴살", amount: "300g", note: "칼로 잘게. 갈면 더 고슬", main: true },
      { key: "계란", name: "계란", amount: "2개", main: true },
      { key: "밥", name: "밥", amount: "420g (1공기×2)", main: true },
      { key: "간장", name: "간장", amount: "2큰술 (30ml)" },
      { key: "맛술", name: "맛술", amount: "2큰술 (30ml)" },
      { key: "설탕", name: "설탕", amount: "1큰술 (12g)" },
      { key: "다진 마늘", name: "다진 마늘", amount: "1작은술 (5g)" },
      { key: "파", name: "파", amount: "10g" }
    ],
    steps: [
      { heat: "중불", time: "4~5분", text: "팬에 기름 없이 다진 닭을 중불 4~5분 볶아요. 젓가락으로 부슬부슬 풀어 물기가 거의 없을 때까지." },
      { heat: "중불", time: "2분", text: "간장 2큰술, 맛술 2큰술, 설탕 1큰술, 다진 마늘 1작은술을 넣고 중불 2분. 팬 바닥에 윤기만 남고 국물이 없어야 해요. 국물이 남으면 1분 더." },
      { heat: "중불", time: "30초", text: "다른 곳(또는 닦은 팬)에 계란 2개를 풀어 중불 30초 스크램블해요. 완전히 마르기 전에 꺼내요." },
      { heat: "불 끄기", time: "바로", text: "밥 210g 위에 닭, 계란, 파를 올려요." }
    ],
    storage: {
      fridge: "닭·계란만 냉장 2일. 밥은 따로.",
      freezer: "닭 소보로만 냉동 3주.",
      reheat: "팬 중불 1분, 또는 전자레인지 1분."
    },
    tip: "설탕을 빼면 색이 안 나요. 단맛을 줄이고 싶으면 1/2큰술(6g)까지는 괜찮고, 그때 칼로리는 한 끼당 약 10kcal 줄어요."
  },
  {
    id: "tamagoyaki",
    title: "계란말이",
    cat: "일식",
    servings: "1끼분",
    basis: "계란 4개 (밥 제외)",
    time: "약 10분",
    kcal: "약 350kcal",
    protein: "약 27g",
    riceNote: "밥 1공기(210g)를 더하면 약 660kcal, 단백질 약 33g 추정치.",
    budget: "계란 4개. 한 끼 약 1,500~2,500원.",
    tools: ["작은 팬", "가스·인덕션"],
    blurb: "사각 팬이 없어도 돼요. 약불, 3번 나눠 말아요.",
    keywords: ["계란", "도시락", "약불"],
    ingredients: [
      { key: "계란", name: "계란", amount: "4개 (특란)", main: true },
      { key: "맛술", name: "맛술", amount: "1작은술 (5ml)" },
      { key: "설탕", name: "설탕", amount: "1/2작은술 (2g)" },
      { key: "소금", name: "소금", amount: "1/4작은술" },
      { key: "식용유", name: "식용유", amount: "1작은술 (4g)", note: "층마다 조금씩", main: true },
      { key: "파", name: "파", amount: "10g", optional: true }
    ],
    steps: [
      { heat: "불 없음", time: "2분", text: "계란 4개, 맛술 1작은술, 설탕 1/2작은술, 소금 1/4작은술, 파를 거품이 과하지 않게 풀어요. 3등분으로 나눠 담아요." },
      { heat: "약불", time: "첫 층 40초", text: "작은 팬을 약불로 달구고 식용유를 키친타월로 얇게 발라요. 계란 1/3을 붓고 40초, 바닥이 익고 윗면이 아직 촉촉할 때 안쪽으로 말아요." },
      { heat: "약불", time: "둘째 층 30초", text: "빈자리에 기름을 다시 얇게 바르고 계란 1/3을 부어 30초. 말은 계란 밑으로 액체가 흐르게 한 뒤 다시 말아요." },
      { heat: "약불", time: "셋째 층 30초 + 식히기 1분", text: "나머지도 같이 30초 익혀 말아요. 접시에 옮겨 1분 식힌 뒤 1.5cm로 썰어요. 약불이 아니면 겉만 타고 속이 물져요." }
    ],
    storage: {
      fridge: "냉장 2일.",
      freezer: "냉동하면 수분이 빠져요. 권하지 않아요.",
      reheat: "실온에 10분 두거나 전자레인지 20초. 오래 돌리면 고무처럼 돼요."
    },
    tip: "중불로 올리면 첫 층이 20초 안에 탑니다. 불이 약하다는 느낌이 드는 게 맞아요."
  },
  {
    id: "mapo-tofu",
    title: "마파두부",
    cat: "중식",
    servings: "2끼분",
    basis: "1인분 (밥 제외)",
    time: "약 20분",
    kcal: "약 340kcal",
    protein: "약 27g",
    riceNote: "밥 1공기(210g)를 더하면 약 650kcal, 단백질 약 33g 추정치.",
    budget: "두부 1모·다짐육 100g·두반장. 한 끼 약 2,500~4,000원.",
    tools: ["팬 또는 냄비", "가스·인덕션"],
    blurb: "두반장은 중불 1분만. 강불이면 바로 타요.",
    keywords: ["두부", "두반장", "마파"],
    ingredients: [
      { key: "두부", name: "두부", amount: "1모 (300g)", note: "2cm", main: true },
      { key: "돼지 다짐육", name: "돼지 다짐육 (앞다리)", amount: "100g", main: true },
      { key: "두반장", name: "두반장", amount: "1큰술 (18g)", main: true },
      { key: "다진 마늘", name: "다진 마늘", amount: "1큰술", main: true },
      { key: "고춧가루", name: "고춧가루", amount: "1큰술 (8g)" },
      { key: "간장", name: "간장", amount: "1큰술 (15ml)" },
      { key: "굴소스", name: "굴소스", amount: "1작은술 (6g)" },
      { key: "파", name: "파", amount: "1/2대 (약 35g)" },
      { key: "설탕", name: "설탕", amount: "1/2작은술 (2g)" },
      { key: "전분", name: "전분", amount: "1작은술 (3g)", note: "물 2큰술에 풀기" },
      { key: "식용유", name: "식용유", amount: "1큰술 (13g)", main: true },
      { key: "물", name: "물", amount: "150ml", water: true }
    ],
    steps: [
      { heat: "강불", time: "1분", text: "두부 2cm를 끓는 물에 1분 데친 뒤 건져요. 부서짐이 덜해요." },
      { heat: "중불", time: "2분", text: "팬에 식용유 1큰술과 다짐육을 중불 2분, 덩어리를 풀어 익혀요." },
      { heat: "중불", time: "1분", text: "다진 마늘, 두반장 1큰술, 고춧가루 1큰술을 넣고 중불 1분 볶아요. 연기가 나며 타면 버리고 다시 시작해요." },
      { heat: "중불", time: "4분", text: "물 150ml, 간장 1큰술, 굴소스 1작은술, 설탕 1/2작은술, 두부를 넣고 중불 4분. 숟가락으로 밀듯 살살 옮겨요." },
      { heat: "중불", time: "30초", text: "전분물을 넣고 30초만 저어 걸쭉하게 한 뒤 파를 올려요." }
    ],
    storage: {
      fridge: "냉장 2일.",
      freezer: "두부가 구멍이 많아져서 냉동은 권하지 않아요.",
      reheat: "팬에 물 1큰술, 중불 2분. 전자레인지 2분."
    },
    tip: "두반장이 없으면 고추장 1큰술로 맛은 내지만 마파 향은 아니에요. 그 경우 칼로리는 거의 같아요."
  },
  {
    id: "tomato-egg",
    title: "닭가슴살 토마토 계란볶음",
    cat: "중식",
    servings: "2끼분",
    basis: "1인분 (밥 제외)",
    time: "약 20분",
    kcal: "약 370kcal",
    protein: "약 38g",
    riceNote: "밥 1공기(210g)를 더하면 약 680kcal, 단백질 약 44g 추정치.",
    budget: "닭 200g·계란·토마토. 한 끼 약 3,000~4,500원.",
    tools: ["팬", "가스·인덕션"],
    blurb: "계란은 80%만 익혀 빼 두고, 마지막에 다시 넣어요.",
    keywords: ["토마토", "계란", "닭가슴살"],
    ingredients: [
      { key: "닭가슴살", name: "닭가슴살", amount: "200g", note: "1cm", main: true },
      { key: "계란", name: "계란", amount: "4개", main: true },
      { key: "토마토", name: "토마토", amount: "300g", note: "쐐기", main: true },
      { key: "다진 마늘", name: "다진 마늘", amount: "1작은술 (5g)" },
      { key: "설탕", name: "설탕", amount: "2작은술 (8g)" },
      { key: "케찹", name: "케찹", amount: "1큰술 (15g)", note: "토마토가 덜 달 때" },
      { key: "맛술", name: "맛술", amount: "1작은술 (5ml)" },
      { key: "소금", name: "소금", amount: "1/4작은술" },
      { key: "식용유", name: "식용유", amount: "1큰술 (13g)", main: true },
      { key: "파", name: "파", amount: "10g" }
    ],
    steps: [
      { heat: "불 없음", time: "5분", text: "닭에 맛술 1작은술과 소금 반 꼬집을 넣고 5분 두어요." },
      { heat: "중강불 → 중불", time: "3분", text: "식용유 반(0.5큰술)을 두르고 닭을 중불 3분 볶아 접시에 빼요. 완전히 마를 때까지 굽지 않아요." },
      { heat: "중불", time: "30초", text: "계란 4개를 풀어 중불 30초, 80%만 익혀 빼요. 표면이 아직 촉촉해야 해요." },
      { heat: "중불", time: "10초 + 2분", text: "남은 기름에 마늘 10초, 토마토를 중불 2분 볶아 국물이 나오게 해요." },
      { heat: "중불", time: "1분", text: "설탕 2작은술, 케찹 1큰술, 남은 소금을 넣고 닭과 계란을 돌려 중불 1분. 계란을 더 볶지 않아요. 파를 올리고 꺼내요." }
    ],
    storage: {
      fridge: "냉장 2일.",
      freezer: "계란이 퍼져서 냉동은 권하지 않아요.",
      reheat: "팬 중불 1분. 전자레인지 1분 30초."
    },
    tip: "토마토를 5분 넘게 볶으면 계란을 넣을 자리가 죽처럼 돼요. 2분이 기준이에요."
  },
  {
    id: "kungpao",
    title: "궁보계정 (닭가슴살)",
    cat: "중식",
    servings: "2끼분",
    basis: "1인분 (밥 제외)",
    time: "약 25분 (재우기 10분 포함)",
    kcal: "약 380kcal",
    protein: "약 41g",
    riceNote: "밥 1공기(210g)를 더하면 약 690kcal, 단백질 약 47g 추정치.",
    budget: "닭 300g·땅콩. 한 끼 약 3,000~4,500원.",
    tools: ["팬", "가스·인덕션"],
    blurb: "닭은 먼저 70%만 익히고, 소스는 마지막 1분 30초.",
    keywords: ["궁보", "땅콩", "닭가슴살"],
    ingredients: [
      { key: "닭가슴살", name: "닭가슴살", amount: "300g", note: "2cm", main: true },
      { key: "땅콩", name: "땅콩", amount: "30g", note: "무염, 반으로", main: true },
      { key: "건고추", name: "건고추", amount: "6개", note: "없으면 고춧가루 1큰술", main: true },
      { key: "파", name: "파", amount: "흰 부분 30g", note: "3cm" },
      { key: "다진 마늘", name: "다진 마늘", amount: "1큰술" },
      { key: "간장", name: "간장", amount: "1.5큰술 (23ml)", note: "재울 때 1작은술, 소스에 나머지" },
      { key: "맛술", name: "맛술", amount: "1큰술 (15ml)" },
      { key: "올리고당", name: "올리고당", amount: "1큰술 (18g)" },
      { key: "식초", name: "식초", amount: "1큰술 (15ml)", main: true },
      { key: "전분", name: "전분", amount: "1큰술 (9g)", note: "재우기" },
      { key: "식용유", name: "식용유", amount: "1큰술 (13g)", main: true },
      { key: "후추", name: "후추", amount: "조금" },
      { key: "물", name: "물", amount: "2큰술 (30ml)", note: "소스", water: true }
    ],
    steps: [
      { heat: "냉장 또는 실온", time: "10분", text: "닭에 간장 1작은술, 맛술 1큰술, 전분 1큰술, 후추를 묻혀 10분 재워요." },
      { heat: "불 없음", time: "1분", text: "소스 볼: 남은 간장, 올리고당 1큰술, 식초 1큰술, 물 2큰술." },
      { heat: "중강불", time: "2분 30초", text: "식용유를 두르고 닭을 중강불 2분 30초 볶아 빼요. 속까지 완전히 익히지 않아요." },
      { heat: "중불", time: "40초", text: "건고추, 마늘, 파 흰 부분을 중불 40초. 고추가 검게 타면 그 재료는 버리고 새로 40초. 탄 고추는 쓴맛이 배요." },
      { heat: "중강불", time: "1분 30초", text: "닭, 땅콩, 소스를 넣고 중강불 1분 30초. 2분을 넘기지 않아요. 윤기가 돌면 꺼내요." }
    ],
    storage: {
      fridge: "냉장 3일.",
      freezer: "냉동 3주. 땅콩은 해동 후 넣어도 돼요.",
      reheat: "팬 중강불 1분. 전자레인지 1분 30초."
    },
    tip: "건고추 대신 고춧가루 1큰술(8g)을 쓸 때는 마늘과 같이 20초만 볶아요. 1분이면 탑니다."
  },
  {
    id: "pepper-japchae",
    title: "고추잡채",
    cat: "중식",
    servings: "2끼분",
    basis: "1인분 (당면 포함)",
    time: "약 30분",
    kcal: "약 460kcal",
    protein: "약 30g",
    riceNote: "당면이 밥 자리예요. 밥을 더하면 탄수화물이 겹쳐요.",
    budget: "돼지고기 250g·당면·파프리카. 한 끼 약 4,000~6,000원.",
    tools: ["팬", "냄비", "가스·인덕션"],
    blurb: "채소는 중강불 2분. 아삭해야 잡채예요.",
    keywords: ["당면", "잡채", "파프리카"],
    ingredients: [
      { key: "돼지 앞다리살", name: "돼지 앞다리살", amount: "250g", note: "0.3cm", main: true },
      { key: "파프리카", name: "파프리카", amount: "150g", note: "채. 피망도 돼요", main: true },
      { key: "양파", name: "양파", amount: "1/2개 (100g)", main: true },
      { key: "당근", name: "당근", amount: "50g", note: "채" },
      { key: "표고버섯", name: "표고버섯", amount: "2개 (40g)", main: true },
      { key: "당면", name: "당면", amount: "건면 40g", main: true },
      { key: "간장", name: "간장", amount: "2큰술 (30ml)" },
      { key: "굴소스", name: "굴소스", amount: "1큰술" },
      { key: "맛술", name: "맛술", amount: "1큰술 (15ml)" },
      { key: "설탕", name: "설탕", amount: "1작은술 (4g)" },
      { key: "다진 마늘", name: "다진 마늘", amount: "1큰술" },
      { key: "전분", name: "전분", amount: "1작은술", note: "고기에. 물 1작은술" },
      { key: "후추", name: "후추", amount: "조금" },
      { key: "식용유", name: "식용유", amount: "1.5큰술 (20g)", main: true },
      { key: "물", name: "물", amount: "500ml (뜨거운 물, 면이 잠기게)", water: true }
    ],
    steps: [
      { heat: "불 없음", time: "8분", text: "당면을 뜨거운 물에 8분 불려 건지고 찬물에 헹궈 가위로 10cm로 잘라요. 심이 하얘 딱딱하면 2분 더." },
      { heat: "불 없음", time: "10분", text: "고기에 간장 1작은술, 맛술 1큰술, 전분 1작은술을 넣고 10분 재워요." },
      { heat: "중불", time: "2분", text: "식용유 반을 두르고 고기를 중불 2분 볶아 빼요." },
      { heat: "중강불", time: "2분", text: "남은 기름에 당근, 파프리카, 양파, 표고를 중강불 2분. 숨이 죽되 아삭해야 해요." },
      { heat: "중불", time: "2분", text: "당면, 고기, 남은 간장, 굴소스 1큰술, 설탕 1작은술, 다진 마늘, 후추를 넣고 중불 2분 버무려요." }
    ],
    storage: {
      fridge: "냉장 2일. 당면이 불어 있어요.",
      freezer: "냉동하지 않아요.",
      reheat: "팬 중불 2분, 물 1큰술."
    },
    tip: "당면 건면 40g은 불리기 전 무게예요. 불린 뒤를 40g으로 재면 양이 절반으로 줄어요."
  },
  {
    id: "yuringi",
    title: "유린기",
    cat: "중식",
    servings: "2끼분",
    basis: "1인분 (밥 제외)",
    time: "약 30분",
    kcal: "약 350kcal",
    protein: "약 39g",
    riceNote: "밥 1공기(210g)를 더하면 약 660kcal, 단백질 약 45g 추정치.",
    budget: "닭 300g. 한 끼 약 2,500~3,500원.",
    tools: ["에어프라이어", "팬"],
    blurb: "소스는 닭과 섞어 두지 않아요. 뿌리기만 해야 옷이 산해요.",
    keywords: ["유린기", "에어프라이어", "닭가슴살"],
    ingredients: [
      { key: "닭가슴살", name: "닭가슴살", amount: "300g", note: "1cm 넓은 조각", main: true },
      { key: "전분", name: "전분", amount: "2큰술 (18g)", main: true },
      { key: "계란 흰자", name: "계란 흰자", amount: "1개분 (약 33g)", main: true },
      { key: "간장", name: "간장", amount: "재우기 1큰술 + 소스 2큰술 (합 45ml)" },
      { key: "맛술", name: "맛술", amount: "1큰술 (15ml)" },
      { key: "식초", name: "식초", amount: "2큰술 (30ml)", main: true },
      { key: "설탕", name: "설탕", amount: "1큰술 (12g)" },
      { key: "다진 마늘", name: "다진 마늘", amount: "1큰술" },
      { key: "고춧가루", name: "고춧가루", amount: "1작은술 (3g)", note: "소스" },
      { key: "참기름", name: "참기름", amount: "1작은술 (4g)" },
      { key: "파", name: "파", amount: "30g", note: "파채" },
      { key: "후추", name: "후추", amount: "조금" },
      { key: "식용유", name: "식용유", amount: "1큰술 (13g)", note: "옷 위", main: true },
      { key: "물", name: "물", amount: "3큰술 (45ml)", note: "소스", water: true }
    ],
    steps: [
      { heat: "냉장", time: "10분", text: "닭에 간장 1큰술, 맛술 1큰술, 후추를 넣고 10분 재워요." },
      { heat: "불 없음", time: "2분", text: "전분 2큰술과 계란 흰자를 얇게 입히고 식용유 1큰술을 발라요." },
      { heat: "에어프라이어 180°C", time: "8분 + 6분", text: "180°C 8분, 뒤집어서 6분. 속이 하얘야 해요." },
      { heat: "중불", time: "1분 30초", text: "팬에 간장 2큰술, 식초 2큰술, 설탕 1큰술, 다진 마늘, 고춧가루 1작은술, 물 3큰술, 참기름 1작은술을 넣고 중불 1분 30초 끓여요." },
      { heat: "불 끄기", time: "바로", text: "닭을 접시에 두고 소스를 위에 끼얹은 뒤 파채를 올려요. 버무리지 않아요." }
    ],
    storage: {
      fridge: "닭과 소스를 따로, 냉장 2일.",
      freezer: "닭만 냉동 3주. 소스는 먹을 때 새로 1분 30초.",
      reheat: "닭은 에어프라이어 180°C 4분 후 소스."
    },
    tip: "식초를 1큰술로 줄이면 단맛만 남아요. 2큰술이 유린기 비율이에요."
  },
  {
    id: "buchu-pork",
    title: "부추 돼지고기 볶음",
    cat: "중식",
    servings: "2끼분",
    basis: "1인분 (밥 제외)",
    time: "약 15분",
    kcal: "약 330kcal",
    protein: "약 29g",
    riceNote: "밥 1공기(210g)를 더하면 약 640kcal, 단백질 약 35g 추정치.",
    budget: "앞다리 250g·부추 한 줌. 한 끼 약 3,500~5,000원.",
    tools: ["팬", "가스·인덕션"],
    blurb: "부추는 1분 30초. 더 볶으면 물이 나와요.",
    keywords: ["부추", "돼지"],
    ingredients: [
      { key: "돼지 앞다리살", name: "돼지 앞다리살", amount: "250g", note: "0.3cm", main: true },
      { key: "부추", name: "부추", amount: "150g", note: "4cm", main: true },
      { key: "다진 마늘", name: "다진 마늘", amount: "1큰술", main: true },
      { key: "간장", name: "간장", amount: "1.5큰술 (23ml)" },
      { key: "굴소스", name: "굴소스", amount: "1큰술" },
      { key: "맛술", name: "맛술", amount: "1큰술 (15ml)" },
      { key: "고춧가루", name: "고춧가루", amount: "1작은술 (3g)" },
      { key: "후추", name: "후추", amount: "조금" },
      { key: "식용유", name: "식용유", amount: "1큰술 (13g)", main: true }
    ],
    steps: [
      { heat: "불 없음", time: "5분", text: "고기에 간장 1작은술, 맛술 1큰술, 후추를 넣고 5분 재워요." },
      { heat: "중강불 → 중불", time: "2분", text: "식용유와 다진 마늘, 고기를 중불 2분 볶아요." },
      { heat: "중강불", time: "1분 30초", text: "부추, 남은 간장, 굴소스 1큰술, 고춧가루 1작은술을 넣고 중강불 1분 30초. 부추가 숨만 죽으면 바로 꺼내요." }
    ],
    storage: {
      fridge: "냉장 2일. 부추는 다음 날 눅어요.",
      freezer: "냉동하지 않아요.",
      reheat: "팬 중강불 1분."
    },
    tip: "부추 대신 대파만 넣으면 양이 부족해요. 150g은 한 줌이 아니라 슈퍼 작은 단 반 개 정도예요."
  },
  {
    id: "egg-fried-rice",
    title: "계란 볶음밥",
    cat: "중식",
    servings: "1끼분",
    basis: "1인분 (밥·닭 포함)",
    time: "약 15분",
    kcal: "약 680kcal",
    protein: "약 38g",
    riceNote: "밥 210g과 닭 80g이 이미 들어 있어요.",
    budget: "찬밥·계란·닭 조금. 한 끼 약 2,000~3,000원.",
    tools: ["팬", "가스·인덕션"],
    blurb: "계란을 먼저 80% 익혀 빼고, 밥은 중강불 2분.",
    keywords: ["볶음밥", "계란", "굴소스"],
    ingredients: [
      { key: "밥", name: "찬밥", amount: "210g", main: true },
      { key: "계란", name: "계란", amount: "2개", main: true },
      { key: "닭가슴살", name: "닭가슴살", amount: "80g", note: "잘게", main: true },
      { key: "당근", name: "당근", amount: "20g", optional: true },
      { key: "파", name: "파", amount: "20g" },
      { key: "다진 마늘", name: "다진 마늘", amount: "1작은술 (5g)" },
      { key: "간장", name: "간장", amount: "1작은술 (5ml)" },
      { key: "굴소스", name: "굴소스", amount: "1작은술 (6g)" },
      { key: "식용유", name: "식용유", amount: "1큰술 (13g)", main: true },
      { key: "후추", name: "후추", amount: "조금" }
    ],
    steps: [
      { heat: "중불", time: "2분", text: "닭을 잘게 썰어 기름 없이 중불 2분 먼저 익혀 빼요." },
      { heat: "중강불", time: "15초", text: "식용유 반을 두르고 풀어 둔 계란을 중강불 15초, 80%만 익혀 빼요." },
      { heat: "중강불", time: "30초 + 2분", text: "남은 기름에 마늘과 당근을 30초, 찬밥을 넣어 중강불 2분 눌러 볶아요." },
      { heat: "중강불", time: "1분", text: "닭을 다시 넣고 1분." },
      { heat: "중불", time: "30초", text: "계란, 간장 1작은술, 굴소스 1작은술, 파, 후추를 넣고 30초만 섞어요." }
    ],
    storage: {
      fridge: "냉장 1일.",
      freezer: "1끼분 냉동 2주.",
      reheat: "팬 중불 2분, 또는 전자레인지에 물 1작은술 뿌리고 1분 30초."
    },
    tip: "갓 한 밥은 뭉쳐요. 냉장에서 식힌 밥이나 즉석밥이 이 시간의 기준이에요."
  },
  {
    id: "tangsuyuk",
    title: "에어프라이어 탕수육",
    cat: "중식",
    servings: "2끼분",
    basis: "1인분 (소스 포함, 밥 제외)",
    time: "약 30분",
    kcal: "약 430kcal",
    protein: "약 32g",
    riceNote: "밥 1공기(210g)를 더하면 약 740kcal, 단백질 약 38g 추정치.",
    budget: "돼지 안심 250g. 한 끼 약 4,000~6,000원.",
    tools: ["에어프라이어", "팬"],
    blurb: "고기를 소스에 10초만 적셔요. 더 두면 전분 옷이 풀려요.",
    keywords: ["탕수육", "에어프라이어", "안심"],
    ingredients: [
      { key: "돼지 안심", name: "돼지 안심", amount: "250g", note: "2cm. 등심 살코기도 돼요", main: true },
      { key: "전분", name: "전분", amount: "옷 4큰술 (36g) + 소스 1큰술 (9g)", main: true },
      { key: "계란", name: "계란", amount: "1개", main: true },
      { key: "맛술", name: "맛술", amount: "1작은술 (5ml)" },
      { key: "소금", name: "소금", amount: "1/4작은술" },
      { key: "후추", name: "후추", amount: "조금" },
      { key: "식용유", name: "식용유", amount: "1큰술 (13g)", note: "옷 위", main: true },
      { key: "설탕", name: "설탕", amount: "3큰술 (36g)", note: "소스" },
      { key: "식초", name: "식초", amount: "2큰술 (30ml)", note: "소스", main: true },
      { key: "간장", name: "간장", amount: "1큰술 (15ml)", note: "소스" },
      { key: "케찹", name: "케찹", amount: "2큰술 (30g)", note: "소스" },
      { key: "물", name: "물", amount: "150ml", note: "소스", water: true }
    ],
    steps: [
      { heat: "불 없음", time: "10분", text: "고기 2cm에 맛술 1작은술, 소금, 후추를 10분 재워요." },
      { heat: "불 없음", time: "3분", text: "계란과 전분 4큰술을 입히고 식용유 1큰술을 발라요." },
      { heat: "에어프라이어 180°C", time: "8분 + 6분", text: "180°C 8분, 흔든 뒤 6분. 자른 속이 하얘야 해요." },
      { heat: "중불", time: "끓인 뒤 30초", text: "팬에 물 150ml, 설탕 3큰술, 식초 2큰술, 간장 1큰술, 케찹 2큰술을 중불로 끓여요. 전분 1큰술을 물 2큰술에 풀어 넣고 30초 저어 걸쭉하게 해요." },
      { heat: "불 끄기", time: "10초", text: "불을 끄고 고기를 소스에 10초만 굴려요. 더 두면 옷이 눅어요." }
    ],
    storage: {
      fridge: "고기와 소스를 따로 냉장 2일.",
      freezer: "고기만 냉동 3주.",
      reheat: "고기 에어프라이어 180°C 4분, 소스는 중불 1분."
    },
    tip: "설탕 3큰술·식초 2큰술이 한국식 탕수 단맛이에요. 덜 달게 하려면 설탕만 2큰술로 줄이세요. 한 끼당 약 20kcal 줄어요."
  },
  {
    id: "jjamppong-ramyeon",
    title: "닭가슴 짬뽕라면",
    cat: "중식",
    servings: "1끼분",
    basis: "1인분 (면 포함)",
    time: "약 15분",
    kcal: "약 750kcal",
    protein: "약 40g",
    riceNote: "면이 밥 자리예요. 스프는 반만 써서 간이 맞아요. 국물을 남기면 나트륨은 줄고, 칼로리는 면이라 거의 같아요.",
    budget: "라면 1개·닭 120g. 한 끼 약 2,000~3,000원.",
    tools: ["냄비", "가스·인덕션"],
    blurb: "봉지라면으로 만드는 집 짬뽕. 스프는 반 봉지.",
    keywords: ["라면", "짬뽕", "닭가슴살"],
    ingredients: [
      { key: "라면", name: "라면", amount: "1봉지 (면+스프 약 120g)", note: "스프는 반만", main: true },
      { key: "닭가슴살", name: "닭가슴살", amount: "120g", note: "0.5cm", main: true },
      { key: "김치", name: "김치", amount: "80g", main: true },
      { key: "양파", name: "양파", amount: "50g", main: true },
      { key: "파", name: "파", amount: "10g" },
      { key: "다진 마늘", name: "다진 마늘", amount: "1큰술" },
      { key: "고춧가루", name: "고춧가루", amount: "1큰술 (8g)" },
      { key: "간장", name: "간장", amount: "1작은술 (5ml)" },
      { key: "식용유", name: "식용유", amount: "1작은술 (4g)", optional: true },
      { key: "물", name: "물", amount: "500ml", water: true }
    ],
    steps: [
      { heat: "중불", time: "2분", text: "닭을 0.5cm로 썰어 냄비에 기름 없이(붙으면 식용유 1작은술) 중불 2분 볶아요." },
      { heat: "중불", time: "30초", text: "다진 마늘과 고춧가루를 넣고 중불 30초. 타기 전에 물을 부어요." },
      { heat: "강불 → 중불", time: "3분", text: "물 500ml, 양파, 김치, 간장 1작은술을 넣고 강불로 끓인 뒤 중불 3분." },
      { heat: "중불", time: "포장 시간보다 30초 짧게", text: "면과 스프 반 봉지를 넣고 중불로 포장 시간보다 30초 짧게 끓여요. 불을 끈 뒤 파를 올려요. 잔열에 면이 더 익어요." }
    ],
    storage: {
      fridge: "바로 먹어요. 남겨 냉장하면 면이 불어요.",
      freezer: "냉동하지 않아요.",
      reheat: "남겼다면 물 50ml를 넣고 중불 2분."
    },
    tip: "스프를 전부 넣으면 간장·고춧가루와 겹쳐 짜요. 반 봉지가 이 레시피의 간이에요."
  }
];
