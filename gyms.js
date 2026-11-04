/* 내 헬스장 — 노비스짐 교동점 (강릉)
   공개된 글·사진에서 확인한 것만 적었어요. 모델 이름까지 확인된 기구는 아직 없어요.
   conf: 'ok' = 글에 적혀 있거나 사진에 분명히 보임 · 'likely' = 그럴 가능성이 높지만 확실하지 않음 */
(() => {
const DG = 'https://www.daangn.com/kr/local-profile/%EB%85%B8%EB%B9%84%EC%8A%A4%EC%A7%90-%EA%B5%90%EB%8F%99%EC%A0%90-pp5sv4nj2otr/';
const S = {
  dgIntro: { t: '당근 노비스짐 교동점 프로필 소개', u: DG },
  dgPost: { t: '당근 교동점 소식 "교동점 소개" (2025-12-11)', u: DG },
  dgImg10: { t: '당근 교동점 사진 — 지점 안내 이미지 (2026-02-04 업로드)', u: 'https://img.kr.gcp-karroter.net/business-profile/business-profile/36297882/1770205766316/RklMRV9LSVRfMzY5NjY5NzIzMzE4NjY4OQ==.jpeg' },
  dgImg05: { t: '당근 교동점 사진 — 머신 구역·짐80 Official 네온 (2026-01-09 업로드)', u: 'https://img.kr.gcp-karroter.net/business-profile/bizPlatform/profile/36297882/1767961025615/RklMRV9LSVRfNTAwOTc0NTA0MjkzMTQ3Nw==.jpeg' },
  dgImg06: { t: '당근 교동점 사진 — 프리웨이트존 (2026-01-09 업로드)', u: 'https://img.kr.gcp-karroter.net/business-profile/bizPlatform/profile/36297882/1767961025683/RklMRV9LSVRfNTYxNzY2NTM2ODE3NTg0Mw==.jpeg' },
  dgImg07: { t: '당근 교동점 사진 — 유산소 구역 (2026-01-09 업로드)', u: 'https://img.kr.gcp-karroter.net/business-profile/bizPlatform/profile/36297882/1767961025684/RklMRV9LSVRfODY5MTYwMTc0MDMyMzMzOQ==.jpeg' },
  dgFo: { t: '당근 교동점 소식 "파나타 신형 FO 라인 입고 완료 (1차 7대)" (2026-08~09, 지점 표시 없음)', u: DG },
  g80: { t: '짐80코리아 공식 오피셜센터 목록', u: 'https://gym80.co.kr/bbs/search.php?stx=%EB%85%B8%EB%B9%84%EC%8A%A4%EC%A7%90' },
  fo: { t: '파나타 판매처 Freeweight One 목록', u: 'https://panattafitness.com/product-category/freeweight-one/' },
  lic: { t: '체육시설 신고 정보 (교동점, 2025-12-10)', u: 'https://ijabaro.com/place/4201000-cdfh3301062025000010' },
};
const EQ = [
  { name: '짐80(gym80) 머신', conf: 'ok', what: '짐80 오피셜 센터예요. 어떤 모델이 몇 대 있는지는 공개된 자료로 확인 못 했어요.', app: '짐80 퓨어크라프트·시그넘 기구', src: [S.g80, S.dgIntro, S.dgPost, S.dgImg10] },
  { name: '부티빌더(Booty Builder) 힙 머신', conf: 'ok', what: '부티빌더 오피셜 센터, "강릉 내 최다 보유"라고 소개돼요. 모델은 확인 못 했어요.', app: '힙쓰러스트 머신 · 아웃타이', src: [S.dgPost, S.dgImg10] },
  { name: '테르주 · 너틸러스 · 온힘 기구', conf: 'ok', what: '"보유"라고 적혀 있어요. 어떤 기구인지는 확인 못 했어요.', app: '—', src: [S.dgImg10] },
  { name: '프리웨이트존 — 파워랙·하프랙 여러 대, 바벨, 원판', conf: 'ok', what: '"교동 최대 프리웨이트존"이라고 소개되고, 사진에 랙이 줄지어 있어요.', app: '스쿼트 · 벤치프레스 · 루마니안 데드리프트 · 바벨 힙쓰러스트', src: [S.dgPost, S.dgImg06] },
  { name: '덤벨 · 조절식 벤치', conf: 'ok', what: '사진에 덤벨 랙과 각도 조절 벤치가 보여요.', app: '인클라인 덤벨프레스 · 원암 덤벨로우 · 덤벨 숄더프레스 · 사레레 · 불가리안 스플릿 스쿼트', src: [S.dgImg06] },
  { name: '유산소 — 러닝머신 · 실내 자전거', conf: 'ok', what: '사진에 보여요.', app: '경사 걷기', src: [S.dgImg07] },
  { name: '스미스머신', conf: 'likely', what: '프리웨이트존 사진 앞쪽에 레일에 걸린 바가 보여요. 사진만으로는 확실하지 않아요.', app: '스미스 인클라인 프레스 · 스미스 스쿼트 · 스미스 카프레이즈', src: [S.dgImg06] },
  { name: '케이블 머신 (케이블 타워)', conf: 'likely', what: '머신 구역 사진 왼쪽에 손잡이가 걸린 케이블 기둥이 보여요.', app: '랫풀다운 · 케이블 로우 · 푸시다운 · 케이블 사레레 · 페이스풀', src: [S.dgImg05] },
  { name: '파나타 신형 Freeweight One(FO) 라인', conf: 'likely', what: '교동점 안내에 "파나타 신형 강릉 유일 입고 예정", 이후 "신형 FO 라인 1차 7대 입고 완료"라는 글이 있어요. 어느 지점에 어떤 7대인지는 안 나와 있어요.', app: '파나타 프리웨이트 원 기구 13종', src: [S.dgImg10, S.dgFo, S.fo] },
  { name: '플레이트·핀 머신 여러 대 (모델 모름)', conf: 'likely', what: '짐80 Official 네온 아래 머신들이 보여요. 사진으로는 브랜드·모델을 알아볼 수 없었어요.', app: '—', src: [S.dgImg05] },
];
// 목록·바꾸기 우선순위: 짐80 → 파나타 FO → 확인된 프리웨이트/케이블 → 일반 머신 → 다른 파나타 라인
const FREE = ['바벨', '덤벨', '케이블', '스미스', '맨몸'];
window.GYMS = {
  novis: {
    id: 'novis', name: '노비스짐 교동점', short: '노비스짐', area: '강원 강릉시 솔올로5번길 40-1, 4·5층',
    info: '2025년 12월 오픈 · 평일 24시간 · 입암·포남·유천점과 회원권 연동(추가 비용 없음)',
    infoSrc: [S.dgIntro, S.lic], eq: EQ,
    rank: e => e.brand === 'gym80' ? 0 : e.series === 'Freeweight One' ? 1 : e.brand ? 4 : FREE.includes(window.equipCat ? window.equipCat(e) : '') ? 2 : 3,
    rankKo: ['짐80', '파나타 FO', '프리웨이트·케이블', '일반 머신', '다른 파나타 라인'],
    note: '같은 회원권으로 쓸 수 있는 다른 지점(입암·포남·유천) 기구는 교동점 목록에 넣지 않았어요.',
  },
};
})();
