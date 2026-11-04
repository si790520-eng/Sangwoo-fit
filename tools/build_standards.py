"""standards.js 생성 스크립트.
입력: tools/strengthlevel_snapshot.json (strengthlevel.com 표준표 스냅샷, 2026-03 데이터 기준)
      tools/exrx_untrained.json (exrx.net 성인 비훈련자 기준표, 18~39세)
실행: python3 tools/build_standards.py  → standards.js 덮어쓰기
"""
import json, re, html, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
std = json.load(open(os.path.join(HERE, 'strengthlevel_snapshot.json')))
MAP = {
 'bench':'bench-press','incline_bench':'incline-bench-press','decline_bench':'decline-bench-press','close_grip_bench':'close-grip-bench-press',
 'db_bench':'dumbbell-bench-press','incline_db':'incline-dumbbell-bench-press','smith_bench':'smith-machine-bench-press',
 'chest_press':'chest-press','machine_bench':'chest-press','pec_deck':'machine-chest-fly','db_fly':'dumbbell-fly','cable_fly':'cable-fly',
 'dips':'dips','pushup':'push-ups','deadlift':'deadlift','sumo_dl':'sumo-deadlift','trap_bar_dl':'hex-bar-deadlift','rack_pull':'rack-pull','rdl':'romanian-deadlift',
 'lat_pulldown':'lat-pulldown','pullup':'pull-ups','chinup':'chin-ups','barbell_row':'bent-over-row','pendlay_row':'pendlay-row','tbar_row':'t-bar-row',
 'seated_row':'seated-cable-row','machine_row':'machine-row','db_row':'dumbbell-row','chest_supported_row':'chest-supported-dumbbell-row','face_pull':'face-pull',
 'shrug':'barbell-shrug','db_shrug':'dumbbell-shrug',
 'squat':'squat','front_squat':'front-squat','goblet_squat':'goblet-squat','smith_squat':'smith-machine-squat','hack_squat':'hack-squat',
 'leg_press':'sled-leg-press','horizontal_leg_press':'horizontal-leg-press','leg_ext':'leg-extension','leg_curl':'seated-leg-curl','seated_leg_curl':'seated-leg-curl','lying_leg_curl':'lying-leg-curl',
 'bss':'dumbbell-bulgarian-split-squat','hip_thrust':'hip-thrust','calf_raise':'machine-calf-raise','seated_calf':'seated-calf-raise',
 'adductor':'hip-adduction','abductor':'hip-abduction',
 'ohp':'shoulder-press','db_shoulder':'dumbbell-shoulder-press','machine_shoulder_press':'machine-shoulder-press',
 'lateral_raise':'dumbbell-lateral-raise','cable_lateral':'cable-lateral-raise','machine_lateral':'machine-lateral-raise','rear_delt':'machine-reverse-fly',
 'biceps_curl':'dumbbell-curl','hammer_curl':'hammer-curl','ez_curl':'ez-bar-curl','preacher_curl':'preacher-curl','machine_preacher':'machine-bicep-curl',
 'triceps_pushdown':'tricep-pushdown','skull_crusher':'lying-tricep-extension','tri_ext_machine':'machine-tricep-extension','cable_crunch':'cable-crunch',
}
miss = [k for k, v in MAP.items() if v not in std]
if miss: sys.exit('no data: %s' % miss)
used = sorted(set(MAP.values()))
def slim(t):
    return {'bw': [[int(r[0]) if r[0] == int(r[0]) else r[0]] + [round(x) for x in r[1:]] for r in t['bw']],
            'age': [[int(r[0])] + [round(x) for x in r[1:]] for r in t['age']]}
SL = {k: {'n': std[k]['name'], 'r': 1 if std[k].get('reps') else 0, 'lifts': std[k].get('lifts'), 'm': slim(std[k]['m']), 'f': slim(std[k]['f'])} for k in used}
cut = std['bench-press'].get('cut', '')
# ExRx 비훈련자(Untrained) — 18~39세, kg (exrx_untrained.json: ExRx 표 페이지에서 Untrained 열만 추출)
EX = json.load(open(os.path.join(HERE, 'exrx_untrained.json')))['tables']
EXMAP = {'bench': 'bench', 'squat': 'squat', 'deadlift': 'deadlift', 'ohp': 'press'}
js = '/* 자동 생성: tools/build_standards.py — 직접 고치지 마세요 */\n'
js += 'window.STANDARDS = ' + json.dumps({'cut': cut, 'map': MAP, 'sl': SL, 'exrx': EX, 'exmap': EXMAP}, ensure_ascii=False, separators=(',', ':')) + ';\n'
js += open(os.path.join(HERE, 'standards_fn.js'), encoding='utf-8').read()
open(os.path.join(ROOT, 'standards.js'), 'w', encoding='utf-8').write(js)
print('ok', len(MAP), 'exercises,', len(used), 'tables, exrx', {k: [len(v['m']), len(v['f'])] for k, v in EX.items()})
