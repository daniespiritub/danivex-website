import bpy
import json
from pathlib import Path

rig = bpy.data.objects['RIG-Snow']
names = ['GEO-snow-head', 'GEO-snow-body', 'GEO-snow-pants', 'GEO-snow-shirt', 'GEO-snow-shoes_base', 'GEO-snow-hair_base', 'GEO-snow-eyes']
report = {}
for name in names:
    obj = bpy.data.objects[name]
    used = set(g.group for v in obj.data.vertices for g in v.groups if g.weight > .01)
    uv = obj.data.uv_layers.active
    groups = [g.name for g in obj.vertex_groups if g.index in used and g.name in rig.data.bones and rig.data.bones[g.name].use_deform]
    report[name] = {'groups': groups, 'uvMin': [min(p.uv[i] for p in uv.data) for i in (0, 1)],
                    'uvMax': [max(p.uv[i] for p in uv.data) for i in (0, 1)]}
Path('.qa/companion-source/inspection/export.json').write_text(json.dumps(report, indent=2))
print(json.dumps(report))
