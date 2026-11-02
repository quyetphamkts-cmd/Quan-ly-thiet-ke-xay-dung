#!/usr/bin/env python3
"""Nâng số phiên bản Sổ Công Trường, thêm ghi chú phát hành vào nhatky.js và update/version.json.
Quy tắc: x.y.z-beta.N, beta chạy 1 → 99; sau beta 99 tăng số cuối và quay về beta 1
(1.0.1-beta.99 → 1.0.2-beta.1); số cuối vượt 99 thì lên số giữa (1.0.99 → 1.1.0-beta.1).
Không quay về beta 1 của cùng số vì app sẽ coi là bản cũ hơn.
Dùng:  python3 tools/bump.py "mục 1" "mục 2" ...          (sửa giao diện: app tự cập nhật)
       python3 tools/bump.py --apk "mục 1" ...           (kèm nâng số bản cài Android; nhớ build APK,
                                                         chép vào update/SoCongTruong.apk)
"""
import json, re, sys, datetime, pathlib
R = pathlib.Path(__file__).resolve().parent.parent
def nxt(v):
    m = re.match(r'^(\d+)\.(\d+)\.(\d+)(?:-beta\.(\d+))?$', v)
    a, b, c, n = int(m[1]), int(m[2]), int(m[3]), int(m[4] or 0)
    if m[4] is None or n >= 99: c, n = c + 1, 0
    n += 1
    if c > 99: b, c = b + 1, 0
    return f'{a}.{b}.{c}-beta.{n}'
args = sys.argv[1:]; apk = '--apk' in args; items = [x for x in args if x != '--apk']
if not items: sys.exit('Cần ít nhất một dòng ghi chú.')
p = R / 'nhatky.js'; s = p.read_text(encoding='utf-8')
old = re.search(r"var APP_VER='([^']+)';", s)[1]; new = nxt(old)
d = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=7))).strftime('%d/%m/%Y')
e = "{v:%s,d:%s,items:[\n  %s]},\n" % (json.dumps(new), json.dumps(d), ',\n  '.join(json.dumps(i, ensure_ascii=False) for i in items))
s = s.replace(f"var APP_VER='{old}';", f"var APP_VER='{new}';", 1)
s = s.replace('var CHANGELOG=[\n', 'var CHANGELOG=[\n ' + e, 1)
p.write_text(s, encoding='utf-8')
vf = R / 'update/version.json'; v = json.loads(vf.read_text(encoding='utf-8'))
v['ver'] = new; v['notes'] = items[0]; v['date'] = d
if apk:
    v['apk']['versionCode'] += 1; v['apk']['versionName'] = nxt(v['apk']['versionName'])
vf.write_text(json.dumps(v, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
sw = R / 'sw.js'; t = sw.read_text(encoding='utf-8')
t = re.sub(r"so-cong-truong-v(\d+)", lambda m: 'so-cong-truong-v%d' % (int(m[1]) + 1), t, count=1)
sw.write_text(t, encoding='utf-8')
print(old, '→', new, ('· APK ' + v['apk']['versionName'] + ' (' + str(v['apk']['versionCode']) + ')') if apk else '')
