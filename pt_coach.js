/* 핏로그 PT 코치 — 오늘/주간 부위별 세트와 움직임 패턴을 보고
   무리 없이 근성장하는 범위로 안내해요.
   주간 범위: 대근육 10~18세트, 소근육 8~14세트 (Schoenfeld et al. 2017 주 10세트+ 용량-반응 + 일반적인 코칭 상한).
   세션 범위: 부위당 4~10세트. 의학적 진단이 아니에요. */
(function (w) {
  let api = {};
  function attach(a) { api = a || {}; }
  const dbOf = () => api.db;
  const exById = (id) => api.exById(id);
  const metrics = (ex, sets) => api.metrics(ex, sets);
  const allEx = () => api.allEx();
  const brandRank = e => (typeof api.brandRank === 'function' ? api.brandRank(e) : 0);
  const addDays = (s, n) => api.addDays(s, n);
  const esc = s => api.esc ? api.esc(s) : String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const r1 = n => api.r1 ? api.r1(n) : Math.round(Number(n) * 10) / 10;
  const fmt = n => api.fmt ? api.fmt(n) : r1(n);
  const $q = (s, el = document) => el.querySelector(s);

  const GROUPS = [
    { id: 'chest', name: '가슴', keys: ['chest', 'chestU', 'chestL'], week: [10, 18], session: [4, 10], size: 'large' },
    { id: 'back', name: '등', keys: ['lats', 'rhomboids'], week: [10, 18], session: [4, 10], size: 'large' },
    { id: 'legs', name: '하체', keys: ['quads', 'hams', 'glutes', 'gluteMed', 'calves'], week: [10, 18], session: [4, 10], size: 'large' },
    { id: 'shoulders', name: '어깨', keys: ['frontDelt', 'sideDelt', 'rearDelt'], week: [8, 14], session: [4, 10], size: 'small' },
    { id: 'biceps', name: '이두', keys: ['biceps'], week: [8, 14], session: [4, 10], size: 'small' },
    { id: 'triceps', name: '삼두', keys: ['triceps'], week: [8, 14], session: [4, 10], size: 'small' },
    { id: 'core', name: '코어', keys: ['abs', 'obliques'], week: [8, 14], session: [4, 10], size: 'small' }
  ];

  const PAT = {
    back_v: { group: '등', label: '수직 당기기', ids: ['lat_pulldown', 'pullup', 'chinup', 'assisted_pullup', 'iso_lat_pulldown', 'close_pulldown', 'reverse_pulldown', 'one_arm_pulldown', 'straight_arm_pulldown'] },
    back_h: { group: '등', label: '수평 당기기', ids: ['circular_row', 'seated_row', 'barbell_row', 'db_row', 'tbar_row', 'pendlay_row', 'hs_seated_row', 'low_row', 'high_row', 'one_arm_cable_row', 'chest_supported_row', 'smith_row', 'inverted_row', 'machine_row', 'meadows_row'] },
    chest_flat: { group: '가슴', label: '플랫 프레스', ids: ['bench', 'db_bench', 'chest_press', 'machine_bench', 'pushup', 'smith_bench', 'cable_chest_press', 'dips', 'assisted_dips'] },
    chest_inc: { group: '가슴', label: '인클라인', ids: ['incline_db', 'incline_bench', 'incline_machine_press', 'smith_incline', 'incline_pushup'] },
    chest_fly: { group: '가슴', label: '플라이', ids: ['pec_deck', 'cable_fly', 'db_fly', 'incline_db_fly', 'cable_cross_high', 'cable_cross_low'] },
    leg_quad: { group: '하체', label: '대퇴사두', ids: ['squat', 'leg_press', 'leg_ext', 'hack_squat', 'pendulum_squat', 'v_squat', 'smith_squat', 'front_squat', 'goblet_squat', 'belt_squat', 'horizontal_leg_press', 'sissy_squat', 'bw_squat', 'box_squat'] },
    leg_post: { group: '하체', label: '햄스트링·둔근', ids: ['rdl', 'leg_curl', 'seated_leg_curl', 'lying_leg_curl', 'sldl', 'db_rdl', 'good_morning', 'sumo_dl', 'nordic_curl', 'standing_leg_curl', 'hip_thrust', 'glute_bridge', 'smith_hip_thrust', 'hip_thrust_machine', 'cable_kickback', 'glute_kickback_machine', 'single_leg_rdl', 'cable_pull_through'] },
    sh_front: { group: '어깨', label: '전면', ids: ['ohp', 'db_shoulder', 'machine_shoulder_press', 'hs_shoulder_press', 'smith_ohp', 'arnold_press', 'front_raise', 'landmine_press', 'cable_front_raise', 'pike_pushup'] },
    sh_side: { group: '어깨', label: '측면', ids: ['lateral_raise', 'cable_lateral', 'machine_lateral'] },
    sh_rear: { group: '어깨', label: '후면', ids: ['face_pull', 'rear_delt', 'bent_rear_raise', 'cable_rear_fly', 'y_raise'] }
  };
  const PAT_BAL = [
    { group: '등', a: 'back_v', b: 'back_h', need: 'back_h', msg: '오늘은 수직 당기기(랫풀다운·풀업) 위주예요. 수평 당기기(서큘러 로우·시티드 로우)를 3세트 더 하면 등 전체가 고르게 자극돼요.' },
    { group: '등', a: 'back_h', b: 'back_v', need: 'back_v', msg: '오늘은 로우 위주예요. 랫풀다운이나 풀업을 3세트 넣으면 광배 상부 균형이 좋아져요.' },
    { group: '가슴', a: 'chest_flat', b: 'chest_inc', need: 'chest_inc', msg: '플랫 프레스는 했어요. 인클라인 프레스를 3세트 더하면 윗가슴 균형이 좋아져요.' },
    { group: '가슴', a: 'chest_inc', b: 'chest_flat', need: 'chest_flat', msg: '인클라인 위주예요. 플랫 체스트프레스나 벤치를 3세트 더하면 좋아요.' },
    { group: '가슴', miss: 'chest_fly', need: 'chest_fly', require: ['chest_flat', 'chest_inc'], msg: '프레스는 했어요. 펙덱이나 케이블 플라이 2~3세트로 마무리하면 자극이 잘 남아요.' },
    { group: '하체', a: 'leg_quad', b: 'leg_post', need: 'leg_post', msg: '스쿼트·레그프레스 위주예요. 레그컬이나 힙쓰러스트·RDL을 3세트 넣어 햄스트링·둔근도 챙기세요.' },
    { group: '하체', a: 'leg_post', b: 'leg_quad', need: 'leg_quad', msg: '후면(햄스트링·둔근) 위주예요. 스쿼트나 레그익스텐션을 3세트 더하면 대퇴사두 균형이 맞아요.' },
    { group: '어깨', miss: 'sh_side', need: 'sh_side', require: ['sh_front'], msg: '프레스는 했어요. 사이드 레터럴 레이즈 2~3세트로 옆어깨를 보충하세요.' },
    { group: '어깨', miss: 'sh_rear', need: 'sh_rear', require: ['sh_front', 'sh_side'], msg: '앞·옆 어깨는 했어요. 페이스풀이나 리어델트 2~3세트로 후면도 챙겨 주세요.' }
  ];

  const recByPat = {
    back_v: ['lat_pulldown', 'pullup', 'iso_lat_pulldown'],
    back_h: ['circular_row', 'seated_row', 'hs_seated_row', 'machine_row', 'db_row'],
    chest_flat: ['chest_press', 'bench', 'machine_bench'],
    chest_inc: ['incline_machine_press', 'incline_db', 'smith_incline'],
    chest_fly: ['pec_deck', 'cable_fly', 'db_fly'],
    leg_quad: ['hack_squat', 'leg_press', 'squat', 'leg_ext'],
    leg_post: ['seated_leg_curl', 'rdl', 'hip_thrust', 'lying_leg_curl'],
    sh_front: ['machine_shoulder_press', 'db_shoulder', 'ohp'],
    sh_side: ['lateral_raise', 'cable_lateral', 'machine_lateral'],
    sh_rear: ['face_pull', 'rear_delt', 'cable_rear_fly']
  };
  const recByGroup = {
    '가슴': ['chest_press', 'incline_db', 'pec_deck', 'bench'],
    '등': ['lat_pulldown', 'circular_row', 'seated_row', 'db_row'],
    '하체': ['squat', 'leg_press', 'rdl', 'seated_leg_curl'],
    '어깨': ['db_shoulder', 'lateral_raise', 'face_pull'],
    '이두': ['biceps_curl', 'hammer_curl', 'cable_curl'],
    '삼두': ['triceps_pushdown', 'rope_pushdown', 'oh_triceps'],
    '코어': ['cable_crunch', 'hanging_leg_raise', 'plank', 'ab_crunch_machine']
  };

  function bid(ex) { return (ex && (ex.base || ex.id)) || ''; }
  function mus(ex) {
    if (w.FORMS && w.FORMS.musclesFor) return w.FORMS.musclesFor(ex);
    return { p: [], s: [] };
  }
  function setsOf(it) {
    const ex = exById(it.exId);
    if (!ex || ex.type === 'cardio') return 0;
    const m = metrics(ex, it.sets);
    return m ? m.sets : 0;
  }
  function addTo(map, ex, sets, mode) {
    if (!sets || ex.type === 'cardio') return;
    const { p, s } = mus(ex);
    for (const g of GROUPS) {
      const hitP = g.keys.some(k => p.includes(k));
      const hitS = !hitP && g.keys.some(k => s.includes(k));
      if (hitP) map[g.name].d += sets;
      else if (hitS) map[g.name].i += sets;
    }
  }
  function emptyMap() {
    return Object.fromEntries(GROUPS.map(g => [g.name, { d: 0, i: 0, t: 0 }]));
  }
  function finalize(map) {
    for (const g of GROUPS) map[g.name].t = r1(map[g.name].d + map[g.name].i / 2);
    return map;
  }
  function countToday(date) {
    const map = emptyMap();
    for (const it of (dbOf().workouts[date] || [])) addTo(map, exById(it.exId), setsOf(it));
    return finalize(map);
  }
  function countWeek(end) {
    const map = emptyMap();
    for (let i = 6; i >= 0; i--) {
      const date = addDays(end, -i);
      for (const it of (dbOf().workouts[date] || [])) addTo(map, exById(it.exId), setsOf(it));
    }
    return finalize(map);
  }
  function todayTotalSets(date) {
    return (dbOf().workouts[date] || []).reduce((a, it) => a + setsOf(it), 0);
  }
  function sessionStatus(sets) {
    if (sets <= 3) return { k: 'low', label: '부족', hint: '3세트 이하는 자극이 약한 편이에요.' };
    if (sets <= 10) return { k: 'ok', label: '최적', hint: '세션당 4~10세트가 근성장에 좋아요.' };
    return { k: 'high', label: '주의', hint: '11세트부터는 정크 볼륨·회복 부담이 커져요.' };
  }
  function weekStatus(g, sets) {
    const [lo, hi] = g.week;
    if (sets < lo) return { k: 'low', label: '부족', hint: `주 ${lo}~${hi}세트를 목표로 해요.` };
    if (sets <= hi) return { k: 'ok', label: '적정', hint: `주 ${lo}~${hi}세트 안에 있어요.` };
    return { k: 'high', label: '과부하 주의', hint: `주 ${hi}세트를 넘기면 회복을 더 챙기세요.` };
  }
  function patternsDone(date) {
    const done = {};
    for (const it of (dbOf().workouts[date] || [])) {
      if (setsOf(it) <= 0) continue;
      const id = bid(exById(it.exId));
      for (const [k, p] of Object.entries(PAT)) if (p.ids.includes(id)) done[k] = true;
    }
    return done;
  }
  function restDays(end, g) {
    for (let i = 1; i <= 3; i++) {
      const d = addDays(end, -i);
      const m = emptyMap();
      for (const it of (dbOf().workouts[d] || [])) addTo(m, exById(it.exId), setsOf(it));
      finalize(m);
      if (m[g.name].d > 0) return i - 1;
    }
    return 3;
  }
  function scoreEx(e) {
    let s = 0;
    if (typeof brandRank === 'function') s += brandRank(e);
    if (e.brand === 'gym80') s -= 40;
    else if (e.brand === 'panatta') s -= 36;
    if (e.load === 'cable') s -= 8;
    else if (e.load === 'dumbbell') s -= 6;
    else if (e.load === 'machine' || e.load === 'plate') s -= 10;
    return s;
  }
  const HIGH_EFF = [
    { id: 'incline_db', group: '가슴', pat: 'chest_inc', badge: '장근 길이', ref: 'wolf23', why: '벤치에 등을 고정한 채 윗가슴이 더 늘어난 위치에서 눌러, 장근 길이 구간 장력을 유지하기 좋아요.' },
    { id: 'cable_cross_low', group: '가슴', pat: 'chest_fly', badge: '고장력', ref: 'wolf23', why: '아래에서 위로 올리는 크로스오버는 시작부터 케이블 장력이 걸려, 가슴을 크게 늘린 채로 모을 수 있어요.' },
    { id: 'cable_cross_high', group: '가슴', pat: 'chest_fly', badge: '고장력', ref: 'wolf23', why: '위에서 아래로 모으는 크로스오버는 가슴 하부까지 장력이 유지되는 고립 동작이에요.' },
    { id: 'dips', group: '가슴', pat: 'chest_flat', badge: '장근 길이', ref: 'wolf23', why: '몸을 깊이 내려 가슴을 크게 늘린 상태에서 밀어 올리는 복합 동작이에요. 어깨가 아프면 깊이를 줄이거나 머신으로 바꾸세요.' },
    { id: 'chest_press', group: '가슴', pat: 'chest_flat', badge: '안정성', why: '궤도가 고정돼 실패 직전까지 안전하게 장력을 유지하기 좋아요. 프리웨이트보다 허리 부담이 적어요.' },
    { id: 'chest_supported_row', group: '등', pat: 'back_h', badge: '안정성', why: '가슴을 패드에 대고 당겨 허리 피로 없이 등 근육에만 집중할 수 있어요.' },
    { id: 'db_row', group: '등', pat: 'back_h', badge: '편측 집중', why: '한쪽씩 당겨 좌우 차이를 줄이고, 광배와 중부 승모를 깊게 수축하기 좋아요.' },
    { id: 'straight_arm_pulldown', group: '등', pat: 'back_v', badge: '광배 고립', why: '팔꿈치를 거의 펴고 내려 광배를 크게 늘렸다가 모으는 케이블 풀오버 패턴이에요. 이두 개입을 줄여요.' },
    { id: 'close_pulldown', group: '등', pat: 'back_v', badge: '광배 집중', why: '뉴트럴(클로즈) 그립 랫풀다운은 손목·어깨 부담을 줄이면서 광배 하부 자극을 주기 좋아요.' },
    { id: 'circular_row', group: '등', pat: 'back_h', badge: '호 궤도', why: '손이 큰 호를 그리며 당겨 허리 부담을 줄이고 광배·중부 승모에 장력을 유지하기 좋아요.' },
    { id: 'bss', group: '하체', pat: 'leg_quad', badge: '편측·안정', why: '한 다리로 깊게 내려가 대퇴사두·둔근을 길게 늘린 위치에서 밀어 올려요. 양발 스쿼트와 자극이 달라요.' },
    { id: 'rdl', group: '하체', pat: 'leg_post', badge: '장근 길이', ref: 'wolf23', why: '무릎을 조금만 굽힌 채 엉덩이를 뒤로 보내, 햄스트링과 둔근이 늘어난 구간에서 힘을 내요.' },
    { id: 'seated_leg_curl', group: '하체', pat: 'leg_post', badge: 'Maeo 2021', ref: 'maeo21', why: '앉은 자세에서 고관절이 굽혀져 햄스트링이 더 늘어난 상태로 수축해, 엎드린(라잉) 레그컬보다 근비대가 더 컸어요 (전체 햄스트링 +14% vs +9%).' },
    { id: 'leg_ext', group: '하체', pat: 'leg_quad', badge: '장근 길이', ref: 'wolf23', why: '무릎을 굽힌 시작 구간에서 대퇴사두가 길게 늘어난 채로 펴는 고립 동작이에요. 스쿼트와 자극 부위가 보완돼요.' },
    { id: 'hip_thrust', group: '하체', pat: 'leg_post', badge: '둔근 집중', why: '허리보다 엉덩이에 힘을 모으기 쉬운 자세라, 스쿼트만으로는 부족한 둔근 자극을 채우기 좋아요.' },
    { id: 'cable_lateral', group: '어깨', pat: 'sh_side', badge: '고장력', why: '케이블은 팔이 내린 시작 구간부터 장력이 걸려, 덤벨 레터럴보다 약한 지점이 적어요.' },
    { id: 'rear_delt', group: '어깨', pat: 'sh_rear', badge: '후면 고립', why: '리버스 펙덱은 궤도가 고정돼 허리 흔들림 없이 후면 삼각근만 고립하기 좋아요.' },
    { id: 'face_pull', group: '어깨', pat: 'sh_rear', badge: '후면·회전근', why: '얼굴 쪽으로 당기며 어깨를 외회전해, 후면 삼각근과 어깨 주변 안정근을 같이 자극해요.' },
    { id: 'db_shoulder', group: '어깨', pat: 'sh_front', badge: '안정성', why: '앉아서 하면 허리를 덜 쓰고, 덤벨이라 좌우를 고르게 밀 수 있어요.' },
    { id: 'incline_db_curl', group: '이두', pat: '', badge: '장근 길이', ref: 'wolf23', why: '몸을 뒤로 기대 팔을 몸 뒤로 보내, 이두 장두가 늘어난 위치에서 말아요.' },
    { id: 'preacher_curl', group: '이두', pat: '', badge: '고립', why: '팔을 패드에 고정해 반동을 줄이고, 이두 짧은 머리에 집중하기 좋아요.' },
    { id: 'oh_triceps', group: '삼두', pat: '', badge: 'Maeo 2023', ref: 'maeo23', why: '팔을 머리 위로 올려 삼두 장두를 최대로 늘린 상태라, 팔 내린 중립 위치 익스텐션보다 장두 근비대가 약 1.5배 컸어요.' },
    { id: 'triceps_pushdown', group: '삼두', pat: '', badge: '고립', why: '팔꿈치를 옆구리에 고정한 채 내려, 삼두 외측·내측두를 안정적으로 고립해요. 장두 자극은 오버헤드와 나눠 하면 좋아요.' },
    { id: 'cable_crunch', group: '코어', pat: '', badge: '과부하', why: '무게를 단계적으로 올릴 수 있어, 맨몸 크런치보다 점진적 과부하가 쉬워요.' },
    { id: 'hanging_leg_raise', group: '코어', pat: '', badge: '고난도', why: '골반을 말아 올리며 하복부를 깊게 수축해요. 허리보다 복근에 힘이 가게 골반부터 움직이세요.' },
    { id: 'ab_wheel', group: '코어', pat: '', badge: '항신장', why: '몸을 앞으로 밀 때 복근이 늘어나며 버티는 힘이 커져요. 허리가 꺾이면 무릎을 바닥에 두고 범위를 줄이세요.' }
  ];

  function pickOne(ids, used) {
    const cands = [];
    for (const id of ids) {
      const pool = allEx().filter(e => !used.has(e.id) && e.type !== 'cardio' && (e.id === id || e.base === id));
      cands.push(...pool);
    }
    cands.sort((a, b) => scoreEx(a) - scoreEx(b) || String(a.name).localeCompare(b.name, 'ko'));
    return cands[0] || null;
  }
  const REF_LBL = { maeo21: 'Maeo et al., 2021', maeo23: 'Maeo et al., 2023', wolf23: 'Wolf et al., 2023', robinson: 'Robinson et al., 2024', vol: 'Schoenfeld et al., 2017' };
  function recLine(ex, sets, meta) {
    const r = ex.rec || { sets: '3세트', reps: '8~12회', rest: '90초' };
    const m = meta || {};
    return {
      id: ex.id, name: ex.name, sets: sets || r.sets, reps: r.reps, rest: r.rest,
      group: m.group || ex.group, why: m.why || '', badge: m.badge || '', ref: m.ref || '',
      fresh: !!m.fresh, base: bid(ex)
    };
  }
  function dayDiff(a, b) {
    if (!a || !b) return 999;
    const pa = String(a).split('-').map(Number), pb = String(b).split('-').map(Number);
    return Math.round((Date.UTC(pa[0], pa[1] - 1, pa[2]) - Date.UTC(pb[0], pb[1] - 1, pb[2])) / 86400000);
  }
  function historyMap(end, days) {
    const map = {};
    const store = dbOf();
    if (!store || !store.workouts) return map;
    for (let i = 0; i < days; i++) {
      const date = addDays(end, -i);
      const seen = new Set();
      for (const it of (store.workouts[date] || [])) {
        const n = setsOf(it);
        if (!n) continue;
        const b = bid(exById(it.exId));
        if (!b) continue;
        map[b] = map[b] || { sets: 0, sessions: 0, last: null };
        map[b].sets += n;
        if (!seen.has(b)) { map[b].sessions += 1; seen.add(b); }
        if (!map[b].last || date > map[b].last) map[b].last = date;
      }
    }
    return map;
  }
  function todayBases(date) {
    const set = new Set();
    for (const it of ((dbOf().workouts || {})[date] || [])) {
      if (setsOf(it) > 0) set.add(bid(exById(it.exId)));
    }
    return set;
  }
  function metaFor(id) {
    return HIGH_EFF.find(x => x.id === id) || null;
  }
  function pickHighEff(date, opts) {
    const o = opts || {};
    const n = o.n || 4;
    const used = o.used || new Set();
    const preferGroups = o.preferGroups || [];
    const preferPats = o.preferPats || [];
    const hist = historyMap(date, 28);
    const todayB = todayBases(date);
    const week = countWeek(date);
    const gapGroups = GROUPS.filter(g => weekStatus(g, week[g.name].t).k === 'low').map(g => g.name);
    const groups = preferGroups.length ? preferGroups : (gapGroups.length ? gapGroups : GROUPS.map(g => g.name));
    const usedBases = new Set([...used].map(id => bid(exById(id))).concat([...todayB]));

    const scoreItem = (item, loose) => {
      if (usedBases.has(item.id) || used.has(item.id)) return null;
      const h = hist[item.id];
      const ago = h && h.last ? dayDiff(date, h.last) : 999;
      const freq = h ? h.sessions : 0;
      if (todayB.has(item.id)) return null;
      if (!loose) {
        if (ago <= 14) return null;
        if (freq >= 3) return null;
      } else {
        if (ago <= 0) return null;
        if (freq >= 6 && ago <= 14) return null;
      }
      const ex = pickOne([item.id], used);
      if (!ex) return null;
      if (usedBases.has(bid(ex))) return null;
      let s = 0;
      if (groups.includes(item.group)) s += 80;
      if (gapGroups.includes(item.group)) s += 40;
      if (item.pat && preferPats.includes(item.pat)) s += 90;
      if (!h) s += 55;
      else if (ago >= 28) s += 45;
      else if (ago > 14) s += 10;
      else s -= 70;
      if (freq >= 3) s -= 40;
      s -= (typeof scoreEx === 'function' ? scoreEx(ex) : 0);
      const fresh = !h || ago > 14;
      return { ex, item, s, fresh, ago };
    };

    const pickFrom = loose => {
      const ranked = HIGH_EFF.map(item => scoreItem(item, loose)).filter(Boolean)
        .sort((a, b) => b.s - a.s || String(a.ex.name).localeCompare(b.ex.name, 'ko'));
      const out = [];
      for (const row of ranked) {
        if (out.length >= n) break;
        const b = bid(row.ex);
        if (usedBases.has(b) || used.has(row.ex.id)) continue;
        used.add(row.ex.id);
        usedBases.add(b);
        out.push(recLine(row.ex, '3세트', { group: row.item.group, why: row.item.why, badge: row.item.badge, ref: row.item.ref, fresh: row.fresh }));
      }
      return out;
    };

    let out = pickFrom(false);
    if (out.length < Math.min(2, n)) {
      const more = pickFrom(true);
      for (const r of more) {
        if (out.some(x => x.base === r.base || x.id === r.id)) continue;
        out.push(r);
        if (out.length >= n) break;
      }
    }
    return out.slice(0, n);
  }
  function pickRecs(need, n, used, date) {
    const pat = recByPat[need] ? need : '';
    const group = recByGroup[need] ? need : (PAT[need] && PAT[need].group) || '';
    const date0 = date || (typeof todayStr === 'function' ? todayStr() : null);
    if (date0) {
      const out = pickHighEff(date0, { n, used, preferGroups: group ? [group] : [], preferPats: pat ? [pat] : [] });
      if (out.length) return out;
    }
    const ids = recByPat[need] || recByGroup[need] || [];
    const out = [];
    for (const id of ids) {
      const ex = pickOne([id], used);
      if (!ex) continue;
      used.add(ex.id);
      const meta = metaFor(id) || {};
      out.push(recLine(ex, '3세트', { group: meta.group || group, why: meta.why, badge: meta.badge, ref: meta.ref, fresh: true }));
      if (out.length >= n) break;
    }
    return out;
  }
  function diagnose(date) {
    const week = countWeek(date);
    const today = countToday(date);
    const low = GROUPS.filter(g => weekStatus(g, week[g.name].t).k === 'low')
      .map(g => ({ name: g.name, t: week[g.name].t, lo: g.week[0], hi: g.week[1], st: weekStatus(g, week[g.name].t) }));
    const tips = patternAdvice(date, today);
    const miss = tips.map(t => t.msg);
    const missShort = tips.map(t => `${t.group} · ${(PAT[t.need] || {}).label || t.need}`);
    let summary;
    if (low.length && missShort.length) {
      summary = `이번 주 볼륨이 부족한 부위는 ${low.map(g => `${g.name}(${fmt(g.t)}/${g.lo}–${g.hi}세트)`).join(', ')}예요. 오늘은 ${missShort.join(', ')} 패턴이 빠졌어요.`;
    } else if (low.length) {
      summary = `이번 주 볼륨이 부족한 부위는 ${low.map(g => `${g.name}(${fmt(g.t)}/${g.lo}–${g.hi}세트)`).join(', ')}예요. 평소 안 하던 고효율 종목으로 채워 보면 좋아요.`;
    } else if (missShort.length) {
      summary = `주간 세트는 비교적 채워졌어요. 다만 오늘은 ${missShort.join(', ')} 패턴이 빠졌어요.`;
    } else {
      summary = '이번 주 주요 부위 볼륨은 비교적 고른 편이에요. 그래도 최근에 안 해본 고효율 종목을 하나 넣으면 자극이 새로워져요.';
    }
    return { low, miss, missShort, summary, week, today };
  }
  function completeSection(date) {
    const diag = diagnose(date);
    const preferGroups = diag.low.length ? diag.low.map(g => g.name) : [];
    const preferPats = [];
    for (const t of (patternAdvice(date, diag.today) || [])) if (t.need) preferPats.push(t.need);
    const items = pickHighEff(date, { n: 4, preferGroups, preferPats });
    const cards = items.map(r => {
      const rec = `${esc(r.sets)} · ${esc(r.reps)} · 휴식 ${esc(r.rest)}`;
      const badge = r.fresh
        ? '<em class="he-badge">새로운 고효율 추천</em>'
        : (r.badge ? `<em class="he-badge dim">${esc(r.badge)}</em>` : '');
      const ev = r.ref && REF_LBL[r.ref] ? ` <a class="he-ref" href="#/evidence">${esc(REF_LBL[r.ref])}</a>` : '';
      return `<div class="he-card" data-ex="${esc(r.id)}">
        <div class="he-top"><div><b>${esc(r.name)}</b>${badge}<div class="muted small">${esc(r.group)} · ${rec}</div></div></div>
        <p class="small he-why">${esc(r.why)}${ev}</p>
        <div class="he-acts">
          <button type="button" class="btn sm primary he-add" data-ex="${esc(r.id)}">오늘 기록에 담기</button>
          <button type="button" class="btn sm ghost he-guide" data-ex="${esc(r.id)}">운동법 보기</button>
        </div>
      </div>`;
    }).join('') || '<p class="muted small">오늘은 고를 만한 새 종목이 많지 않아요. 회복을 우선해도 좋아요.</p>';
    const html = `<div id="heSec">
      <h4 class="he-h">부족한 부위 · 새로 해볼 만한 고효율 추천 종목</h4>
      <p>${esc(diag.summary)}</p>
      ${cards}
      <p class="muted small" style="margin-top:8px">최근 14일 안에 자주 한 종목은 빼 두고, 근비대 효율·안정성·장근 길이 자극이 좋은 동작을 골랐어요. 통증·찌릿함이 있으면 무리하지 마세요. <a href="#/evidence">근거</a></p>
    </div>`;
    return { html, items, diag };
  }
  function bindComplete(root, hooks) {
    const h = hooks || {};
    const el = root || document;
    el.querySelectorAll('.he-add[data-ex]').forEach(b => {
      b.onclick = ev => { ev.preventDefault(); ev.stopPropagation(); if (h.onAdd) h.onAdd(b.dataset.ex); };
    });
    el.querySelectorAll('.he-guide[data-ex]').forEach(b => {
      b.onclick = ev => { ev.preventDefault(); ev.stopPropagation(); if (h.onGuide) h.onGuide(b.dataset.ex); };
    });
  }
  function patternAdvice(date, today) {
    const done = patternsDone(date);
    const tips = [];
    for (const rule of PAT_BAL) {
      const td = today[rule.group];
      if (!td || td.d < 3 || td.d >= 8) continue;
      if (rule.a && rule.b) {
        if (done[rule.a] && !done[rule.b]) tips.push({ msg: rule.msg, need: rule.need, group: rule.group });
      } else if (rule.miss) {
        const ok = (rule.require || []).some(k => done[k]);
        if (ok && !done[rule.miss]) tips.push({ msg: rule.msg, need: rule.need, group: rule.group });
      }
    }
    return tips;
  }
  function buildAdvice(date) {
    const today = countToday(date);
    const week = countWeek(date);
    const items = dbOf().workouts[date] || [];
    const recorded = items.some(it => setsOf(it) > 0);
    const total = todayTotalSets(date);
    const recs = [];
    const flags = { finish: false, overload: false, empty: !recorded };
    const lines = [];
    const used = new Set(items.map(it => it.exId));

    if (total >= 20) {
      flags.overload = true;
      lines.push('오늘 벌써 20세트가 넘었어요. 중앙 피로가 쌓이면 자세가 무너지고 관절에도 부담이에요. 이제 세션을 마무리하고 밥·수면으로 회복하는 편이 좋아요.');
    }

    const finishing = GROUPS.filter(g => today[g.name].d >= 8);
    if (finishing.length && !flags.overload) {
      flags.finish = true;
      const names = finishing.map(g => g.name).join('·');
      lines.push(`${names}은 오늘 이미 8~10세트 구간에 들어섰어요. 근성장 자극은 충분해요! 여기서 더 하면 피로만 쌓이니 마무리하거나, 보조 부위 2~3세트만 가볍게 하세요.`);
    }

    if (recorded && !flags.overload) {
      for (const tip of patternAdvice(date, today)) {
        lines.push(tip.msg);
        recs.push(...pickRecs(tip.need, 1, used, date));
      }
    }

    if (!recorded) {
      const ranked = GROUPS.map(g => ({ g, week: week[g.name].t, rest: restDays(date, g), st: weekStatus(g, week[g.name].t) }))
        .filter(x => x.st.k === 'low' && x.rest >= 1)
        .sort((a, b) => (b.rest - a.rest) || (a.week - b.week) || (a.g.size === 'large' ? -1 : 1));
      const pick = ranked.length ? ranked : GROUPS.map(g => ({ g, week: week[g.name].t, rest: restDays(date, g), st: weekStatus(g, week[g.name].t) }))
        .sort((a, b) => (b.rest - a.rest) || (a.week - b.week));
      const top = pick.slice(0, 2);
      const gnames = top.map(x => x.g.name).join('·');
      lines.push(top.length
        ? `오늘은 최근 7일 볼륨이 적고 충분히 쉰 ${gnames}을 해보면 좋아요. 부위당 4~10세트, 매 세트 마지막에 1~2회 여유(RIR 1~2)를 남기고 멈추세요.`
        : '오늘은 컨디션 되는 대근육(가슴·등·하체) 하나와 보조 부위를 조합해 4~10세트로 시작해 보세요.');
      for (const x of top) recs.push(...pickRecs(x.g.name, 2, used, date));
    }

    if (!lines.length) {
      lines.push('오늘 구성이 알차요. 매 세트 한계까지 밀지 말고 RIR 1~2(마지막에 1~2개 더 할 수 있는 힘)를 남기면 관절 무리는 줄고 근성장 자극은 잘 남아요. 무게는 모든 세트 목표 횟수 상단을 채운 다음에만 한 단계 올리세요.');
    }

    return {
      title: recorded ? 'PT 코치 · 오늘 이어서' : 'PT 코치 · 오늘 추천',
      body: lines,
      recs: recs.slice(0, 4),
      flags,
      today,
      week,
      total
    };
  }
  function gaugeHtml(val, lo, hi, max) {
    const m = max || Math.max(hi + 6, 22);
    const pct = v => Math.min(100, v / m * 100);
    return `<div class="pt-bar"><i class="band" style="left:${pct(lo)}%;width:${pct(hi) - pct(lo)}%"></i><b style="width:${pct(val)}%"></b></div>`;
  }
  function cardHtml(date) {
    const a = buildAdvice(date);
    const rows = GROUPS.map(g => {
      const t = a.today[g.name], w = a.week[g.name];
      const ss = sessionStatus(t.d), ws = weekStatus(g, w.t);
      return `<div class="pt-row" data-g="${g.id}">
        <span class="pt-n">${g.name}</span>
        <div class="pt-gauges">
          <div><span class="muted small">오늘 ${fmt(t.d)}세트</span>${gaugeHtml(t.d, 4, 10, 16)}<em class="pt-st ${ss.k}">${ss.label}</em></div>
          <div><span class="muted small">주간 ${fmt(w.t)}/${g.week[0]}–${g.week[1]}</span>${gaugeHtml(w.t, g.week[0], g.week[1], 26)}<em class="pt-st ${ws.k}">${ws.label}</em></div>
        </div>
      </div>`;
    }).join('');
    const recHtml = a.recs.length
      ? `<div class="pt-recs">${a.recs.map(r => {
          const badge = r.fresh ? '<em class="he-badge">새로운 고효율 추천</em>' : (r.badge ? `<em class="he-badge dim">${esc(r.badge)}</em>` : '');
          const why = r.why ? `<span class="small he-why">${esc(r.why)}</span>` : '';
          return `<button type="button" class="pt-rec" data-ex="${r.id}"><span class="he-top"><b>${esc(r.name)}</b>${badge}</span><span class="muted small">${esc(r.group || '')} · ${esc(r.sets)} · ${esc(r.reps)} · 휴식 ${esc(r.rest)}</span>${why}</button>`;
        }).join('')}</div>`
      : '';
    const warn = a.flags.overload ? ' pt-over' : (a.flags.finish ? ' pt-ok' : '');
    return `<div class="card pt-card${warn}" id="ptCoach">
      <button type="button" class="pt-toggle" id="ptToggle" aria-expanded="true"><span>🧑‍🏫 ${esc(a.title)}</span><span class="muted small" id="ptChev">접기</span></button>
      <div id="ptBody">
        <p class="small" style="margin:8px 0 10px">${a.body.map(esc).join(' ')}</p>
        ${recHtml}
        <div class="pt-legend muted small">세션 적정 4~10세트 · 주간 대근육 10~18 · 소근육 8~14 (초록 띠). 보조 세트는 0.5로 세요.</div>
        <div class="pt-table">${rows}</div>
        <p class="muted small" style="margin:8px 0 0">매 세트 한계까지 밀지 말고 RIR 1~2(RPE 8~9, 마지막에 1~2개 더 할 수 있는 힘)를 남기세요. 더블 프로그레션으로 진행하세요. 모든 세트에서 목표 횟수 상단을 채우면 다음번에 무게를 한 단계만 올리면 돼요. 매번 올릴 필요는 없어요. 통증·찌릿함이 있으면 즉시 멈추고 전문가와 상담하세요. 의학적 진단이 아니에요. <a href="#/evidence">근거</a></p>
      </div>
    </div>`;
  }
  function intensityHtml(ex) {
    if (!ex || ex.type === 'cardio') {
      return `<div class="card pt-int" id="ptIntensity"><h3 style="margin-top:0">💪 강도 가이드</h3>
        <p class="small">대화가 조금 힘든 중강도로 시작해요. 통증·찌릿함이 있으면 즉시 멈추고 전문가와 상담하세요.</p></div>`;
    }
    const iso = /레이즈|플라이|컬|푸시다운|익스텐션|크런치|킥백/.test(ex.name + (ex.equip || ''));
    const rec = ex.rec || { sets: iso ? '3세트' : '3~4세트', reps: iso ? '10~15회' : '6~10회', rest: iso ? '60~90초' : '2~3분' };
    return `<div class="card pt-int" id="ptIntensity"><h3 style="margin-top:0">💪 무리 없이 근성장하는 강도</h3>
      <div class="rec"><div><span class="muted small">적정 세트</span><b>${esc(rec.sets)}</b></div><div><span class="muted small">횟수</span><b>${esc(rec.reps)}</b></div><div><span class="muted small">휴식</span><b>${esc(rec.rest)}</b></div></div>
      <ul class="small" style="margin:8px 0 0;padding-left:18px">
        <li><b>체감 강도(RIR 1~2 / RPE 8~9)</b>: 매 세트 한계까지 밀지 말고, 마지막에 1~2개 더 할 수 있는 힘을 남기고 멈추면 관절 무리는 줄이고 근성장 자극은 최대로 얻을 수 있어요.</li>
        <li><b>더블 프로그레션</b>: 매번 무게를 올릴 필요 없어요(유지도 정상!). 모든 세트에서 목표 횟수 상단을 깔끔하게 채우면 다음번에 무게를 한 단계만 올려 보세요.</li>
        <li><b>안전</b>: 날카롭거나 찌릿한 통증, 관절 통증, 저림이 있으면 즉시 멈추고 의사나 물리치료사 등 전문가와 상담하세요. 이 안내는 의학적 진단이 아니에요.</li>
      </ul></div>`;
  }
  function bindCard(root, onAdd) {
    const card = (root && root.querySelector ? root.querySelector('#ptCoach') : null) || $q('#ptCoach');
    if (!card) return;
    const body = $q('#ptBody', card), tog = $q('#ptToggle', card), chev = $q('#ptChev', card);
    const apply = open => {
      if (body) body.style.display = open ? '' : 'none';
      if (tog) tog.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (chev) chev.textContent = open ? '접기' : '펼치기';
    };
    apply(w.__ptOpen !== false);
    if (tog) tog.onclick = () => { w.__ptOpen = !(w.__ptOpen !== false); apply(w.__ptOpen); };
    card.querySelectorAll('.pt-rec[data-ex]').forEach(b => {
      b.onclick = () => { if (onAdd) onAdd(b.dataset.ex); };
    });
  }

  w.PT_COACH = {
    attach,
    GROUPS, PAT, HIGH_EFF, sessionStatus, weekStatus, countToday, countWeek, todayTotalSets,
    patternsDone, buildAdvice, cardHtml, intensityHtml, bindCard, pickRecs, recLine,
    pickHighEff, historyMap, diagnose, completeSection, bindComplete
  };
})(window);
