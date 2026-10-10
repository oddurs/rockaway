import json
import sys

D = __file__.rsplit('/', 1)[0] + '/'
files = sys.argv[1:] or ['out-chromium-1.jsonl', 'out-firefox-1.jsonl', 'out-webkit-1.jsonl', 'out-chromium-2.jsonl']
for f in files:
    print('==', f)
    print('font dens  n  scale   rowsH  cT    cB    base  want    inkTop inkBel text   box      after    in cov')
    for line in open(D + f):
        r = json.loads(line)
        print(f"{r['font']:4} {r['density'][:5]:5} {r['n']} {r['scale']:6} {r['rowsH']:6} {r['contentTop']:5} {r['contentBottom']:5} "
              f"{r['baseline']:6} {r['baselineWant']:7} {r['inkTop']:6} {r['inkBelow']:6} {r['textCells']:7} {r['boxCells']:8} "
              f"{r['afterCells']:8} {r['cellsIn']:3} {r['cellsCovering']:3}")
