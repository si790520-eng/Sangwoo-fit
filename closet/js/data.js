/* 이상우 옷장 — 카테고리, 시드, 코치 코디 */
(function (root) {
  const CATEGORIES = [
    { id: "outer", name: "아우터", subtypes: [
      ["coat", "코트"], ["balmacaan", "발마칸"], ["leather", "가죽자켓"],
      ["denimjacket", "데님자켓"], ["bomber", "항공점퍼"], ["puffer", "숏패딩"], ["padding", "패딩"]
    ]},
    { id: "top", name: "상의", subtypes: [
      ["tee", "반팔티"], ["longtee", "긴팔티"], ["crop", "크롭 긴팔"],
      ["thermal", "래글런 서멀"], ["polo", "반팔 카라 니트"]
    ]},
    { id: "knit", name: "니트/가디건", subtypes: [
      ["knit", "니트"], ["cardi", "가디건"], ["pullover", "풀오버"]
    ]},
    { id: "shirt", name: "셔츠", subtypes: [["shirt", "셔츠"]] },
    { id: "sweat", name: "맨투맨/후드", subtypes: [
      ["sweat", "맨투맨"], ["hoodie", "후드"], ["sweatshirt", "스웻셔츠"]
    ]},
    { id: "bottom", name: "하의", subtypes: [
      ["chino", "치노"], ["wide", "와이드데님"], ["straight", "스트레이트데님"],
      ["semi", "세미와이드데님"], ["curved", "커브드 와이드"]
    ]},
    { id: "shoes", name: "신발", subtypes: [
      ["sneaker", "스니커즈"], ["boot", "부츠"], ["derby", "로퍼/더비"], ["combat", "컴뱃부츠"]
    ]},
    { id: "acc", name: "액세서리", subtypes: [["belt", "벨트"]] }
  ];

  const PRESETS = [
    ["블랙", "#1A1A1A"], ["화이트", "#F6F6F4"], ["아이보리", "#F3EBDD"],
    ["베이지", "#E4D2B5"], ["카멜", "#C4A574"], ["브라운", "#8A4B24"],
    ["그레이", "#9A9A9A"], ["라이트 그레이", "#D5D5D2"], ["차콜", "#3C3F44"],
    ["네이비", "#1B2C4A"], ["인디고", "#2A3F66"], ["블루", "#4E74A8"],
    ["스카이", "#A9D0E0"], ["카키", "#3E4636"], ["오트밀", "#E3D5C3"],
    ["애쉬", "#B0ADA6"]
  ];

  const SEASONS = [
    ["spring", "봄"], ["summer", "여름"], ["fall", "가을"], ["winter", "겨울"]
  ];
  const OCCASIONS = [
    ["date", "데이트"], ["casual", "마실"]
  ];

  const ALL = ["spring", "summer", "fall", "winter"];
  const SFW = ["spring", "fall", "winter"];
  const FW = ["fall", "winter"];
  const SF = ["spring", "fall"];
  const SSF = ["spring", "summer", "fall"];
  const FWS = ["fall", "winter", "spring"];

  function it(o) { return Object.assign({ size: "", volume: "", photoId: "" }, o); }

  const SEED = [
    it({ id: "o-captain", brand: "캡틴선샤인", name: "코트", category: "outer", subtype: "coat", color: "#C4A574", seasons: ["fall", "winter", "spring"] }),
    it({ id: "o-bal", brand: "에잇세컨즈", name: "발마칸 코트", category: "outer", subtype: "balmacaan", color: "#3C3F44", seasons: FW }),
    it({ id: "o-leather", brand: "도프제이슨", name: "가죽자켓", category: "outer", subtype: "leather", color: "#1A1A1A", seasons: ["spring", "fall", "winter"] }),
    it({ id: "o-fc", brand: "풀카운트", name: "다트포드", category: "outer", subtype: "denimjacket", color: "#1A1C22", seasons: SF }),
    it({ id: "o-wuji", brand: "우지", name: "베이지 데님자켓", category: "outer", subtype: "denimjacket", color: "#C6B59A", seasons: SF }),
    it({ id: "o-zara", brand: "자라", name: "블랙 데님자켓", category: "outer", subtype: "denimjacket", color: "#202226", seasons: SF }),
    it({ id: "o-ma1", brand: "디스커버리", name: "항공점퍼", category: "outer", subtype: "bomber", color: "#3E4636", seasons: FWS }),
    it({ id: "o-lee", brand: "리", name: "숏 다운", category: "outer", subtype: "puffer", color: "#161616", seasons: ["fall", "winter"], volume: "big" }),

    it({ id: "k-navy", brand: "드루모어", name: "네이비 캐시미어 니트", category: "knit", subtype: "knit", color: "#1B2C4A", seasons: FWS }),
    it({ id: "k-beige", brand: "드루모어", name: "베이지 니트", category: "knit", subtype: "knit", color: "#D9C6A5", seasons: FWS }),
    it({ id: "k-cardi", brand: "제이리움", name: "블랙 가디건", category: "knit", subtype: "cardi", color: "#1A1A1A", seasons: FWS }),
    it({ id: "k-oat", brand: "러프사이드", name: "Grainy Pullover", category: "knit", subtype: "pullover", color: "#C8BBA8", seasons: FW, size: "2" }),

    it({ id: "s-white", brand: "랄프로렌", name: "화이트 셔츠", category: "shirt", subtype: "shirt", color: "#F4F1EA", seasons: ALL }),
    it({ id: "s-gray", brand: "포터리", name: "회색 셔츠", category: "shirt", subtype: "shirt", color: "#8D8D90", seasons: SFW }),

    it({ id: "h-rl", brand: "랄프로렌", name: "그레이 후드티", category: "sweat", subtype: "hoodie", color: "#8E8E90", seasons: FWS, volume: "big" }),
    it({ id: "h-croc", brand: "크로커다일", name: "네이비 후드티", category: "sweat", subtype: "hoodie", color: "#1A2744", seasons: FWS, volume: "big" }),
    it({ id: "h-char", brand: "러프사이드", name: "Oversized Sweat Shirt", category: "sweat", subtype: "sweat", color: "#4E5154", seasons: FWS, size: "2", volume: "big" }),
    it({ id: "h-clg", brand: "챔피온", name: "리버스위브 스웻셔츠 라이트 그레이", category: "sweat", subtype: "sweatshirt", color: "#D5D5D2", seasons: FWS, size: "L", volume: "big" }),
    it({ id: "h-coat", brand: "챔피온", name: "리버스위브 스웻셔츠 오트밀", category: "sweat", subtype: "sweatshirt", color: "#E3D5C3", seasons: FWS, size: "L", volume: "big" }),

    it({ id: "t-ivory", brand: "레이디화이트코", name: "아이보리 티", category: "top", subtype: "tee", color: "#F3EBDD", seasons: SSF }),
    it({ id: "t-thermal", brand: "레이디화이트코", name: "Raglan Thermal", category: "top", subtype: "thermal", color: "#D4C0A4", seasons: FWS }),
    it({ id: "t-crop", brand: "다이브인", name: "Uniform Crop Long Sleeve", category: "top", subtype: "crop", color: "#141414", seasons: FWS }),
    it({ id: "t-wlong", brand: "", name: "화이트 긴팔 티", category: "top", subtype: "longtee", color: "#F7F7F5", seasons: ALL }),
    it({ id: "t-wshort", brand: "", name: "화이트 반팔 티", category: "top", subtype: "tee", color: "#F6F6F4", seasons: SSF }),
    it({ id: "t-bshort", brand: "", name: "블랙 반팔 티", category: "top", subtype: "tee", color: "#1A1A1A", seasons: SSF }),
    it({ id: "t-brshort", brand: "", name: "갈색 반팔 티", category: "top", subtype: "tee", color: "#7A4E32", seasons: SSF }),
    it({ id: "t-polo-b", brand: "", name: "베이지 반팔 카라 니트", category: "top", subtype: "polo", color: "#E4D2B5", seasons: ["spring", "summer"] }),
    it({ id: "t-polo-s", brand: "", name: "하늘색 반팔 카라 니트", category: "top", subtype: "polo", color: "#A9D0E0", seasons: ["spring", "summer"] }),

    it({ id: "b-ash", brand: "인코텍스", name: "애쉬 치노", category: "bottom", subtype: "chino", color: "#B0ADA6", seasons: ALL }),
    it({ id: "b-beige", brand: "바스통", name: "베이지 치노", category: "bottom", subtype: "chino", color: "#CDB892", seasons: ALL }),
    it({ id: "b-wideind", brand: "오라리", name: "와이드 데님", category: "bottom", subtype: "wide", color: "#2A3F66", seasons: ALL, volume: "big" }),
    it({ id: "b-568", brand: "리바이스", name: "568", category: "bottom", subtype: "straight", color: "#4E74A8", seasons: ALL }),
    it({ id: "b-wideblk", brand: "아워데이즈", name: "웨이비 커브드 와이드 데님", category: "bottom", subtype: "curved", color: "#1A1A1A", seasons: ALL, size: "L", volume: "big" }),
    it({ id: "b-semi", brand: "워크온바디오프", name: "릴렉스 세미 와이드 데님", category: "bottom", subtype: "semi", color: "#222222", seasons: ALL, size: "M" }),

    it({ id: "f-991", brand: "뉴발란스", name: "991v2", category: "shoes", subtype: "sneaker", color: "#A7A7A4", seasons: ALL }),
    it({ id: "f-derby", brand: "포스트맨", name: "저널리스트", category: "shoes", subtype: "derby", color: "#1A1A1A", seasons: ALL }),
    it({ id: "f-xt6", brand: "살로몬", name: "XT-6", category: "shoes", subtype: "sneaker", color: "#1C1C1C", seasons: ALL }),
    it({ id: "f-combat", brand: "", name: "군화", category: "shoes", subtype: "combat", color: "#2A2A28", seasons: FWS }),
    it({ id: "f-rw", brand: "레드윙", name: "아이언 레인저 8111", category: "shoes", subtype: "boot", color: "#8A4B24", seasons: FWS, size: "280" }),

    it({ id: "a-belt", brand: "사피아노", name: "블랙 벨트", category: "acc", subtype: "belt", color: "#111111", seasons: ALL })
  ];

  function look(id, season, occasion, title, items, toggles, tips) {
    return {
      id, season, occasion, title, items, tips,
      tuck: !!toggles.tuck, outerOpen: !!toggles.outerOpen, hemRoll: !!toggles.hemRoll,
      source: "coach"
    };
  }

  const COACH = [
    look("c01", "spring", "date", "카멜 코트와 베이지", ["o-captain", "k-beige", "s-white", "b-beige", "f-rw", "a-belt"],
      { tuck: true, outerOpen: true, hemRoll: true }, [
        "롱코트는 위만 잠그고 베이지 니트가 보이게 열어 두세요.",
        "베이지끼리라 앰버 부츠가 대비를 만들어 줘요.",
        "부츠면 치노 밑단은 한 단만 접어 발목을 보여 주세요."
      ]),
    look("c02", "spring", "date", "가죽자켓과 애쉬 치노", ["o-leather", "s-white", "b-ash", "f-derby", "a-belt"],
      { tuck: true, outerOpen: true, hemRoll: true }, [
        "가죽자켓은 열어 셔츠 깃이 나오게 하세요.",
        "애쉬와 블랙 사이, 화이트 셔츠가 얼굴을 밝혀요.",
        "더비에는 치노를 한 번만 접어 코가 보이게."
      ]),
    look("c03", "spring", "date", "베이지 데님과 네이비 니트", ["o-wuji", "k-navy", "t-ivory", "b-wideind", "f-991"],
      { tuck: true, outerOpen: true, hemRoll: false }, [
        "베이지 데님과 인디고는 명도 차이가 커서 키가 정리돼요.",
        "네이비 니트는 앞자락만 넣어 허리를 잡아 주세요.",
        "와이드는 스니커즈 위를 살짝 덮게 두고 접지 마세요."
      ]),
    look("c04", "spring", "casual", "블랙 데님과 라이트 그레이", ["o-zara", "h-clg", "b-semi", "f-991"],
      { tuck: false, outerOpen: true, hemRoll: false }, [
        "블랙 재킷·블랙 세미와이드는 라이트 그레이가 끊어 줘요.",
        "루즈 스웻은 빼입. 재킷은 열어 어깨 선을 남기세요.",
        "세미와이드를 많이 접으면 다리가 짧아 보여요."
      ]),
    look("c05", "spring", "casual", "항공점퍼와 그레이 후드", ["o-ma1", "h-rl", "b-semi", "f-xt6"],
      { tuck: false, outerOpen: false, hemRoll: false }, [
        "MA-1은 후드 위에 짧게 잠가 레이어를 정돈하세요.",
        "후드 끈은 점퍼 안으로 넣어 목선을 깔끔히.",
        "세미와이드는 살로몬에 롤업 없이 떨어뜨리세요."
      ]),
    look("c06", "spring", "casual", "가죽과 아이보리 티", ["o-leather", "t-ivory", "b-beige", "f-991"],
      { tuck: true, outerOpen: true, hemRoll: false }, [
        "가죽과 아이보리는 대비가 분명해서 어깨가 단정해 보여요.",
        "티는 앞만 넣어 허리 비율을 나눠 주세요.",
        "베이지 치노는 그레이 스니커즈와 톤을 이어 주세요."
      ]),
    look("c07", "spring", "casual", "풀카운트와 568", ["o-fc", "s-gray", "b-568", "f-xt6"],
      { tuck: true, outerOpen: true, hemRoll: true }, [
        "블랙 데님 재킷은 열어 회색 셔츠가 보이게.",
        "셔츠는 한 단만 넣으세요.",
        "루즈 스트레이트는 한 번 접어야 살로몬이 보여요."
      ]),

    look("c08", "summer", "date", "하늘 카라 니트", ["t-polo-s", "b-ash", "f-derby", "a-belt"],
      { tuck: true, outerOpen: true, hemRoll: true }, [
        "카라 니트는 단추 하나만 열고 넣어 목선과 허리를 살리세요.",
        "애쉬 치노는 더비에 맞춰 밑단을 한 단만.",
        "벨트는 버클만 포인트로, 나머지는 안으로."
      ]),
    look("c09", "summer", "date", "베이지 카라 니트", ["t-polo-b", "b-beige", "f-derby", "a-belt"],
      { tuck: true, outerOpen: true, hemRoll: true }, [
        "베이지끼리라 블랙 더비가 대비를 만들어야 해요.",
        "넣어 입어야 179 상체 비율이 나뉩니다.",
        "치노가 길면 한 단만 접어 구두코를 보이세요."
      ]),
    look("c10", "summer", "date", "화이트 티와 인디고", ["t-wshort", "b-wideind", "f-xt6", "a-belt"],
      { tuck: true, outerOpen: true, hemRoll: false }, [
        "화이트는 앞단만 넣어 와이드와 어깨 균형을 맞추세요.",
        "인디고 와이드는 접지 않고 살로몬을 살짝 덮게.",
        "벨트는 티 안으로 넣어 허리만 잡으세요."
      ]),
    look("c11", "summer", "casual", "브라운 티와 베이지 치노", ["t-brshort", "b-beige", "f-991"],
      { tuck: false, outerOpen: true, hemRoll: false }, [
        "브라운·베이지는 따뜻한 축이라 그레이 스니커즈가 식혀 줘요.",
        "반팔은 빼입으로 어깨 라인을 그대로 두세요.",
        "치노는 접지 않고 스니커즈 위에 떨어뜨리세요."
      ]),
    look("c12", "summer", "casual", "블랙 티와 블랙 와이드", ["t-bshort", "b-wideblk", "f-991"],
      { tuck: false, outerOpen: true, hemRoll: false }, [
        "블랙 온톤이라 그레이 991이 없으면 한 덩어리로 보여요.",
        "티는 빼입. 밑단이 허벅지를 너무 덮지 않게.",
        "와이드를 접으면 비율이 짧아지니 생략하세요."
      ]),
    look("c13", "summer", "casual", "화이트와 568", ["t-wshort", "b-568", "f-xt6"],
      { tuck: false, outerOpen: true, hemRoll: true }, [
        "미디엄 블루와 화이트는 여름에 가장 가벼워요.",
        "루즈 스트레이트는 한 번 접어 신발 라인을 보여 주세요.",
        "티는 빼입해도 넓은 어깨가 정돈돼 보여요."
      ]),
    look("c14", "summer", "casual", "아이보리와 애쉬", ["t-ivory", "b-ash", "f-991"],
      { tuck: true, outerOpen: true, hemRoll: false }, [
        "아이보리·애쉬·그레이는 저채도라 여름 볕에 편안해요.",
        "티는 앞만 살짝 넣어도 좋아요.",
        "치노는 스니커즈 위에 깔끔히 두세요."
      ]),
    look("c15", "summer", "casual", "하늘 카라와 와이드", ["t-polo-s", "b-wideind", "f-xt6"],
      { tuck: false, outerOpen: true, hemRoll: false }, [
        "하늘색과 인디고는 같은 한색이라 블랙 슈즈로 무게를 주세요.",
        "카라 니트는 빼입해야 와이드와 편해 보여요.",
        "소매가 넓으면 한 번만 접으세요."
      ]),

    look("c16", "fall", "date", "카멜 코트와 네이비", ["o-captain", "k-navy", "s-white", "b-ash", "f-derby", "a-belt"],
      { tuck: true, outerOpen: true, hemRoll: true }, [
        "코트는 열고 네이비 니트와 셔츠 깃을 같이 보여 주세요.",
        "카멜·네이비·애쉬, 세 색 안에서 끝내면 정돈돼요.",
        "더비에는 치노를 한 단 접으세요."
      ]),
    look("c17", "fall", "date", "차콜 발마칸", ["o-bal", "k-beige", "b-beige", "f-rw", "a-belt"],
      { tuck: true, outerOpen: false, hemRoll: true }, [
        "발마칸은 잠그면 세로선이 길어 키가 더 정돈돼요.",
        "베이지 니트는 앞만 넣어 코트 안을 정리하세요.",
        "부츠라 치노 밑단은 접어 앰버가 보이게."
      ]),
    look("c18", "fall", "date", "가죽, 가디건, 부츠", ["o-leather", "k-cardi", "t-wshort", "b-568", "f-rw"],
      { tuck: false, outerOpen: true, hemRoll: true }, [
        "가죽은 열고 가디건 단추는 중간만 채우세요.",
        "화이트 티가 블랙 레이어의 숨통이에요.",
        "부츠면 데님 밑단을 한 번 접어 브라운이 나오게."
      ]),
    look("c19", "fall", "date", "베이지 데님과 셔츠", ["o-wuji", "s-white", "b-beige", "f-derby", "a-belt"],
      { tuck: true, outerOpen: true, hemRoll: true }, [
        "베이지 데님 재킷은 셔츠 위에 열어 두세요.",
        "셔츠 소매는 재킷보다 조금만 나오게.",
        "재킷과 치노 톤이 비슷하니 블랙 더비가 선을 그어 줘요."
      ]),
    look("c20", "fall", "casual", "풀카운트와 오트밀 스웻", ["o-fc", "h-coat", "b-semi", "f-991"],
      { tuck: false, outerOpen: true, hemRoll: false }, [
        "블랙 데님과 오트밀은 대비가 좋아 얼굴이 환해요.",
        "루즈 스웻은 빼입하세요.",
        "세미와이드는 스니커즈에만 맞추고 많이 접지 마세요."
      ]),
    look("c21", "fall", "casual", "항공점퍼와 차콜 스웻", ["o-ma1", "h-char", "b-568", "f-xt6"],
      { tuck: false, outerOpen: false, hemRoll: true }, [
        "항공점퍼는 스웻 위에 짧게 잠그세요.",
        "차콜과 카키는 붙어 보이니 미디엄 블루가 색을 열어요.",
        "스트레이트는 한 단만 접어 살로몬을 보여 주세요."
      ]),
    look("c22", "fall", "casual", "네이비 후드와 군화", ["o-zara", "h-croc", "b-semi", "f-combat"],
      { tuck: false, outerOpen: true, hemRoll: true }, [
        "후드는 재킷 안으로, 모자만 칼라처럼 꺼내세요.",
        "군화는 밑단을 한 단 접어야 샤프트가 살아요.",
        "네이비가 블랙끼리 붙은 코디를 나눠 줘요."
      ]),
    look("c23", "fall", "casual", "가죽과 그레이 후드", ["o-leather", "h-rl", "b-beige", "f-991"],
      { tuck: false, outerOpen: true, hemRoll: false }, [
        "후드 끈은 자켓 안으로 넣으세요.",
        "베이지 치노가 블랙 가죽과 그레이 사이의 밝기예요.",
        "스니커즈라 치노는 접지 마세요."
      ]),

    look("c24", "winter", "date", "코트, 가디건, 셔츠", ["o-captain", "k-cardi", "s-gray", "b-beige", "f-rw", "a-belt"],
      { tuck: true, outerOpen: false, hemRoll: true }, [
        "코트는 위만 잠그고 가디건은 단추를 채워 레이어를 정리하세요.",
        "회색 셔츠 깃은 가디건 위로 조금만.",
        "부츠라 치노 밑단은 접어 두세요."
      ]),
    look("c25", "winter", "date", "발마칸과 캐시미어", ["o-bal", "k-navy", "s-white", "b-ash", "f-derby", "a-belt"],
      { tuck: true, outerOpen: false, hemRoll: true }, [
        "발마칸은 잠가 세로선을 길게 타세요.",
        "네이비 니트는 셔츠 위에 앞만 살짝 넣기.",
        "애쉬와 차콜 사이 화이트 깃이 얼굴을 밝혀요."
      ]),
    look("c26", "winter", "date", "숏패딩과 오트밀 니트", ["o-lee", "k-oat", "t-wlong", "b-568", "f-combat"],
      { tuck: false, outerOpen: false, hemRoll: true }, [
        "숏패딩 밑으로 니트가 한 뼘 안되게 나오게 기장 차이를 두세요.",
        "오트밀이 블랙 패딩의 포인트예요.",
        "군화면 데님은 한 단 롤업."
      ]),
    look("c27", "winter", "date", "가죽과 베이지 니트", ["o-leather", "k-beige", "b-ash", "f-rw", "a-belt"],
      { tuck: true, outerOpen: true, hemRoll: true }, [
        "니트는 가죽 안으로 넣어 어깨 부피를 줄이세요.",
        "베이지·애쉬는 앰버 부츠와 한 계열이에요.",
        "가죽은 열어 두는 편이 어깨에 편해요."
      ]),
    look("c28", "winter", "casual", "숏패딩과 라이트 그레이", ["o-lee", "h-clg", "b-semi", "f-xt6"],
      { tuck: false, outerOpen: false, hemRoll: false }, [
        "루즈 스웻이 패딩 밖으로 나오면 힙이 부해 보여요.",
        "스웻 밑단은 패딩 안에 두세요.",
        "세미와이드는 살로몬 위에 두고 롤업은 생략."
      ]),
    look("c29", "winter", "casual", "항공점퍼, 후드, 군화", ["o-ma1", "h-rl", "b-semi", "f-combat"],
      { tuck: false, outerOpen: false, hemRoll: true }, [
        "후드 모자는 점퍼 밖으로 칼라처럼만.",
        "군화는 세미와이드 밑단을 한 번 접어야 해요.",
        "그레이 후드가 어두운 레이어를 나눠 줘요."
      ]),
    look("c30", "winter", "casual", "데님 재킷과 오트밀 니트", ["o-zara", "k-oat", "t-wlong", "b-wideind", "f-991"],
      { tuck: false, outerOpen: true, hemRoll: false }, [
        "데님 재킷은 열고 니트는 빼입.",
        "오트밀·인디고·그레이면 색은 충분해요.",
        "와이드는 스니커즈에 맞추고 접지 마세요."
      ]),
    look("c31", "winter", "casual", "발마칸과 오트밀 스웻", ["o-bal", "h-coat", "b-beige", "f-rw"],
      { tuck: false, outerOpen: false, hemRoll: true }, [
        "스웻 밑단이 코트 밖으로 많이 나오면 안으로 넣거나 코트를 잠그세요.",
        "차콜과 오트밀은 대비가 부드러워요.",
        "부츠면 치노는 한 단 롤업."
      ]),
    look("c32", "winter", "casual", "롱코트와 그레이 후드", ["o-captain", "h-rl", "b-ash", "f-991"],
      { tuck: false, outerOpen: true, hemRoll: false }, [
        "롱코트 안에 후드는 모자만 칼라로 꺼내세요.",
        "그레이·애쉬·카멜은 저채도라 색을 더하지 마세요.",
        "스니커즈라 치노는 접지 않는 게 맞아요."
      ])
  ];

  function subtypeName(id) {
    for (const c of CATEGORIES) {
      const f = c.subtypes.find((s) => s[0] === id);
      if (f) return f[1];
    }
    return id || "";
  }
  function categoryName(id) {
    const c = CATEGORIES.find((x) => x.id === id);
    return c ? c.name : "";
  }
  function seasonName(id) {
    const s = SEASONS.find((x) => x[0] === id);
    return s ? s[1] : "";
  }
  function occasionName(id) {
    const s = OCCASIONS.find((x) => x[0] === id);
    return s ? s[1] : "";
  }
  function label(item) {
    if (!item) return "";
    return [item.brand, item.name].filter(Boolean).join(" ");
  }

  root.ClosetData = {
    CATEGORIES, PRESETS, SEASONS, OCCASIONS, SEED, COACH,
    subtypeName, categoryName, seasonName, occasionName, label
  };
})(typeof window !== "undefined" ? window : globalThis);
