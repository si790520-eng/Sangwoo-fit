/* 헬스장 브랜드 기구 — 짐80(gym80) · 파나타(Panatta)
   모델명·모델 번호는 제조사 카탈로그/공식 사이트/공식 판매처 목록에 있는 것만 썼어요 (출처: README '브랜드 기구 출처').
   동작 방법·근육·자세 그림은 같은 동작의 기본 운동(base)을 그대로 써요. */
(() => {
const SRC = {
  gym80: 'gym80 종합 브로슈어 2025 (gym80.ch) · gym80.de 제품 페이지',
  hp: 'Panatta Freeweight HP 카탈로그 · panattafitness.com(파나타 공식 판매처) 목록',
  fws: 'panattasport.com Freeweight Special · panattafitness.com 목록',
  fe: 'panattafitness.com Fit Evo 목록 (파나타 공식 판매처)',
};
const SERIES = {
  pk: { brand: 'gym80', bk: '짐80', sk: '퓨어크라프트', se: 'Pure Kraft', plate: true, src: SRC.gym80, aka: '짐80 짐팔공 gym80 퓨어크라프트 퓨어크래프트 퓨크 purekraft' },
  sy: { brand: 'gym80', bk: '짐80', sk: '시그넘', se: 'Sygnum', plate: false, src: SRC.gym80, aka: '짐80 짐팔공 gym80 시그넘 sygnum' },
  hp: { brand: 'panatta', bk: '파나타', sk: '프리웨이트 HP', se: 'Freeweight HP', plate: true, src: SRC.hp, aka: '파나타 panatta 프리웨이트 HP freeweight' },
  fs: { brand: 'panatta', bk: '파나타', sk: '프리웨이트 스페셜', se: 'Freeweight Special', plate: true, src: SRC.fws, aka: '파나타 panatta 프리웨이트 스페셜 freeweight special' },
  fe: { brand: 'panatta', bk: '파나타', sk: '핏에보', se: 'Fit Evo', plate: false, src: SRC.fe, aka: '파나타 panatta 핏에보 핏이보 fitevo' },
};
// [시리즈, 모델 번호, 영어 모델명(제조사 표기), 기본 운동 id, 한글 이름, 상위% 표 사용(1/0), 확인된 기구 특징]
const N = {
  ind: '양쪽 팔이 따로 움직여요(독립 암) — 한 팔씩도 할 수 있어요.',
};
const R = [
  // ── 짐80 퓨어크라프트 (플레이트)
  ['pk', '4328', 'Seated Chest Press Dual', 'machine_bench', '시티드 체스트프레스', 0],
  ['pk', '4329N', 'Incline Chest Press Dual', 'incline_machine_press', '인클라인 체스트프레스', 0],
  ['pk', '4346', 'Decline Chest Press Dual', 'decline_machine_press', '디클라인 체스트프레스', 0],
  ['pk', '4341', 'Butterfly Dual', 'pec_deck', '버터플라이 (펙덱)', 0],
  ['pk', '4344', 'Butterfly Reverse Dual', 'rear_delt', '리버스 버터플라이 (리어델트)', 0],
  ['pk', '4311', 'Lat Pulldown Dual', 'iso_lat_pulldown', '랫풀다운', 0, '양쪽 팔이 따로 움직여요(독립 암) · 좁은/넓은 그립 모두 가능 · 허벅지 고정 패드 · 의자 높이 무단 조절 (제조사 설명).'],
  ['pk', '4319', 'Low Row Dual', 'low_row', '로우 로우', 0],
  ['pk', '4340', 'High Row Dual', 'high_row', '하이 로우', 0],
  ['pk', '4322', 'Seated Row Dual', 'hs_seated_row', '시티드 로우', 0],
  ['pk', '4018', 'T-Bar Row', 'tbar_row', '티바 로우', 1],
  ['pk', '4350N', 'Pullover', 'pullover_machine', '풀오버', 0],
  ['pk', '4320', 'Shoulder Press Dual', 'hs_shoulder_press', '숄더프레스', 0],
  ['pk', '4325', 'Shoulder Lateral Raise', 'machine_lateral', '레터럴 레이즈', 0],
  ['pk', '4159N', 'Hacksquat', 'hack_squat', '핵스쿼트', 1, '발판 기울기 3단계 조절 · 두꺼운 어깨 패드 · 아래 구간 저항을 줄여 주는 밴드 핀 (제조사 설명).'],
  ['pk', '4353N', 'Pendulum Squat', 'pendulum_squat', '펜듈럼 스쿼트', 0],
  ['pk', '4023', '45 Degrees Linear Leg Press', 'leg_press', '45도 레그프레스', 1],
  ['pk', '4360', 'Belt Squat', 'belt_squat', '벨트 스쿼트', 0],
  ['pk', '4336N', 'Leg Extension', 'leg_ext', '레그익스텐션', 0],
  ['pk', '4337N', 'Lying Leg Curl', 'lying_leg_curl', '라잉 레그컬', 0],
  ['pk', '4026', 'Seated Calf Raise', 'seated_calf', '시티드 카프레이즈', 1],
  ['pk', '4338N', 'Bizeps Curl', 'machine_preacher', '바이셉 컬', 0],
  ['pk', '4339N', 'Triceps Extension', 'tri_ext_machine', '트라이셉 익스텐션', 0],
  ['pk', '4335', 'Triceps Dip Dual', 'machine_dip', '딥스 머신', 0],
  // ── 짐80 시그넘 (핀/웨이트 스택)
  ['sy', '3016', 'Seated Chest Press', 'chest_press', '체스트프레스', 1],
  ['sy', '3023N', 'Incline Chest Press', 'incline_machine_press', '인클라인 체스트프레스', 0],
  ['sy', '3022', 'Butterfly', 'pec_deck', '버터플라이 (펙덱)', 1],
  ['sy', '3025', 'Butterfly Reverse', 'rear_delt', '리버스 버터플라이 (리어델트)', 1],
  ['sy', '3020', 'Lat Pulldown Machine', 'lat_pulldown', '랫풀다운', 1],
  ['sy', '3040', 'Seated Row Machine', 'machine_row', '시티드 로우', 1],
  ['sy', '3032', 'Shoulder Press', 'machine_shoulder_press', '숄더프레스', 1],
  ['sy', '3050', 'Shoulder Lateral Raise With Grips', 'machine_lateral', '레터럴 레이즈', 1],
  ['sy', '3001', 'Leg Extension', 'leg_ext', '레그익스텐션', 1],
  ['sy', '3002', 'Lying Leg Curl', 'lying_leg_curl', '라잉 레그컬', 1],
  ['sy', '3003', 'Seated Leg Curl', 'seated_leg_curl', '시티드 레그컬', 1],
  ['sy', '3030', 'Seated Leg Press', 'horizontal_leg_press', '시티드 레그프레스', 1],
  ['sy', '3028', 'Abduction Machine', 'abductor', '어브덕션 (아웃타이)', 1],
  ['sy', '3029', 'Adduction Machine', 'adductor', '어덕션 (이너타이)', 1],
  ['sy', '3010', 'Biceps Machine', 'machine_preacher', '바이셉 머신', 1],
  ['sy', '3011', 'Triceps Extension', 'tri_ext_machine', '트라이셉 익스텐션', 1],
  ['sy', '3012N', 'Pull Over Machine', 'pullover_machine', '풀오버 머신', 0],
  ['sy', '3008', 'Abdominal Crunch', 'ab_crunch_machine', '앱 크런치', 0],
  // ── 파나타 프리웨이트 HP (플레이트)
  ['hp', '1HP536', 'Super Vertical Chest Press', 'machine_bench', '슈퍼 버티컬 체스트프레스', 0],
  ['hp', '1HP535', 'Super Inclined Chest Press', 'incline_machine_press', '슈퍼 인클라인 체스트프레스', 0],
  ['hp', '1HP541', 'Super Declined Chest Press', 'decline_machine_press', '슈퍼 디클라인 체스트프레스', 0],
  ['hp', '1HP501', 'Lat Pulldown Machine Convergent', 'iso_lat_pulldown', '컨버전트 랫풀다운', 0],
  ['hp', '1HP502A', 'Super Low Row', 'low_row', '슈퍼 로우 로우', 0],
  ['hp', '1HP503', 'High Row', 'high_row', '하이 로우', 0, '양쪽 레버가 따로 움직여 한 팔씩도 가능 · 여러 가지 그립 · 의자·가슴 패드 높이 조절 (판매처 제품 설명).'],
  ['hp', '1HP525', 'Super Deltoid Press', 'hs_shoulder_press', '슈퍼 델토이드 프레스 (숄더프레스)', 0],
  ['hp', '1HP587', 'Hack Squat', 'hack_squat', '핵스쿼트', 1],
  ['hp', '1HP586', 'Leg Press 45°', 'leg_press', '45도 레그프레스', 1],
  ['hp', '1HP581', 'Leg Extension', 'leg_ext', '레그익스텐션', 0],
  ['hp', '1HP588', 'Seated Calf', 'seated_calf', '시티드 카프', 1],
  ['hp', '1HP540', 'Dips Press Dual System', 'machine_dip', '딥스 프레스', 0],
  // ── 파나타 프리웨이트 스페셜 (플레이트)
  ['fs', '1FW036', 'Super Vertical Chest Press', 'machine_bench', '슈퍼 버티컬 체스트프레스', 0],
  ['fs', '1FW035', 'Super Inclined Chest Press', 'incline_machine_press', '슈퍼 인클라인 체스트프레스', 0],
  ['fs', '1FW041', 'Super Decline Chest Press', 'decline_machine_press', '슈퍼 디클라인 체스트프레스', 0],
  ['fs', '1FW001', 'Super Lat Machine Convergent', 'iso_lat_pulldown', '슈퍼 랫머신 컨버전트 (랫풀다운)', 0],
  ['fs', '1FW002', 'Super Low Row', 'low_row', '슈퍼 로우 로우', 0],
  ['fs', '1FW003', 'Super High Row', 'high_row', '슈퍼 하이 로우', 0, '양쪽 레버가 따로 움직여요(독립 레버) · 손잡이 위치 3가지 (제조사 설명).'],
  ['fs', '1FW025', 'Super Deltoid Press', 'hs_shoulder_press', '슈퍼 델토이드 프레스 (숄더프레스)', 0],
  ['fs', '1FW027', 'Lateral Deltoids', 'machine_lateral', '레터럴 델토이드 (사레레)', 0],
  ['fs', '1FW087', 'Super Hack Squat', 'hack_squat', '슈퍼 핵스쿼트', 1],
  ['fs', '1FW080', 'Super Pendulum Squat', 'pendulum_squat', '슈퍼 펜듈럼 스쿼트', 0, '어깨(미는) 패드 5단계 조절 · 발판 각도 35°/40° · 스프링 균형 장치. 제조사 표기 기구 자체 시작 하중 약 30kg — 기록은 꽂은 원판 무게만 적는 걸 추천해요.'],
  ['fs', '1FW086', 'Super Leg Press 45°', 'leg_press', '슈퍼 45도 레그프레스', 1],
  ['fs', '1FW095', 'Belt Squat', 'belt_squat', '벨트 스쿼트', 0],
  ['fs', '1FW097', 'Hip Thrust', 'hip_thrust_machine', '힙쓰러스트', 0],
  ['fs', '1FW181', 'Leg Extension', 'leg_ext', '레그익스텐션', 0],
  ['fs', '1FW183', 'Seated Leg Curling', 'seated_leg_curl', '시티드 레그컬', 0],
  ['fs', '1FW088', 'Super Seated Calf', 'seated_calf', '슈퍼 시티드 카프', 1],
  // ── 파나타 핏에보 (핀/웨이트 스택)
  ['fe', '1FE036', 'Vertical Chest Press', 'chest_press', '버티컬 체스트프레스', 1],
  ['fe', '1FE037', 'Inclined Chest Press', 'incline_machine_press', '인클라인 체스트프레스', 0],
  ['fe', '1FE035', 'Pectoral Machine', 'pec_deck', '펙토럴 머신 (펙덱)', 1],
  ['fe', '1FE001', 'Lat Pulldown', 'lat_pulldown', '랫풀다운', 1],
  ['fe', '1FE003', 'Pulley Row', 'seated_row', '풀리 로우 (시티드 케이블로우)', 1],
  ['fe', '1FE025', 'Deltoid Press', 'machine_shoulder_press', '델토이드 프레스 (숄더프레스)', 1],
  ['fe', '1FE026', 'Lateral Deltoids', 'machine_lateral', '레터럴 델토이드 (사레레)', 1],
  ['fe', '1FE081', 'Leg Extension', 'leg_ext', '레그익스텐션', 1],
  ['fe', '1FE083', 'Seated Leg Curling', 'seated_leg_curl', '시티드 레그컬', 1],
  ['fe', '1FE085', 'Horizontal Leg Press', 'horizontal_leg_press', '호리존탈 레그프레스', 1],
  ['fe', '1FE093', 'Adductor/Abductor Machine', 'abductor', '어브덕터 (아웃타이)', 1],
  ['fe', '1FE093', 'Adductor/Abductor Machine', 'adductor', '어덕터 (이너타이)', 1],
  ['fe', '1FE097', 'Hip Thrust', 'hip_thrust_machine', '힙쓰러스트', 0],
  ['fe', '1FE088', 'Gluteus Machine', 'glute_kickback_machine', '글루트 머신', 0],
  ['fe', '1FE051', 'Curling Machine', 'machine_preacher', '컬링 머신 (이두)', 1],
  ['fe', '1FE053', 'Triceps Machine', 'tri_ext_machine', '트라이셉 머신', 1],
  ['fe', '1FE039', 'Pullover Machine', 'pullover_machine', '풀오버 머신', 0],
  ['fe', '1FE089', 'Calf Machine', 'calf_raise', '카프 머신', 1],
  ['fe', '1FE065', 'Upper Abdominal', 'ab_crunch_machine', '어퍼 앱도미널 (크런치)', 0],
];
const base = id => window.EXERCISES.find(e => e.id === id);
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const out = [];
for (const [sk, code, model, bid, ko, pct, feat] of R) {
  const b = base(bid), S = SERIES[sk];
  if (!b) { console.warn('brands: base 없음', bid); continue; }
  const id = `${S.brand === 'gym80' ? 'g80' : 'pan'}_${sk}_${slug(code)}${bid === 'adductor' && code === '1FE093' ? '_add' : bid === 'abductor' && code === '1FE093' ? '_abd' : ''}`;
  const load = S.plate ? 'plate' : 'machine';
  const generic = S.plate
    ? '플레이트 장착식이에요. 꽂은 원판 무게만 적어 주세요 — 레버 무게·지렛대 비율이 기구마다 달라서, 다른 브랜드 기구와 무게를 그대로 비교하긴 어려워요.'
    : '핀(웨이트 스택) 방식이에요. 같은 핀 숫자라도 기구마다 실제 저항이 달라서, 같은 기구 기록끼리만 비교하는 게 정확해요.';
  out.push({
    ...b, id, base: bid, brand: S.brand, series: S.se, seriesKo: S.sk, code, model,
    name: `${S.bk} ${S.sk} ${ko}`, en: `${S.brand === 'gym80' ? 'gym80' : 'Panatta'} ${S.se} ${model} (${code})`,
    equip: S.plate ? '플레이트 머신' : '머신', load, inc: S.plate ? 5 : (b.load === 'machine' && b.inc > 0 ? b.inc : 5),
    aka: `${S.aka} ${ko.replace(/\s*\(.*\)/, '').replace(/\s+/g, '')} ${model.replace(/\s+/g, '')} ${code} ${b.name.replace(/\s+/g, '')} ${b.aka || ''}`.trim(),
    pct: !!pct, note: feat || '', generic, src: S.src, steps: b.steps.slice(), mistakes: b.mistakes.slice(), rec: { ...b.rec },
  });
}
window.BRAND_EX = out;
window.BRANDS = { gym80: '짐80', panatta: '파나타' };
window.brandOf = e => (e && e.brand) || '';
window.EXERCISES.push(...out);
})();
