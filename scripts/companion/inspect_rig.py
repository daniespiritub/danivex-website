import bpy
import json
from pathlib import Path

rig = bpy.data.objects['RIG-Snow']
report = {
    'bendy': [{'name': b.name, 'segments': b.bbone_segments} for b in rig.data.bones if b.use_deform and b.bbone_segments > 1],
    'controls': [{'name': b.name, 'rotation': list(b.rotation_euler),
                  'mode': b.rotation_mode, 'location': list(b.location),
                  'matrix': [list(row) for row in b.bone.matrix_local],
                  'props': dict(b.items())}
                 for b in rig.pose.bones if b.name in ['FK-Head', 'FK-Neck', 'FK-Spine', 'FK-UpperArm.L', 'FK-UpperArm.R', 'FK-Forearm.L', 'FK-Forearm.R', 'IK-Wrist.L', 'IK-Wrist.R', 'MSTR-Eyelid_Upper.L', 'MSTR-Eyelid_Lower.L', 'MSTR-Mouth', 'MSTR-Eyebrow.L']],
    'poses': [],
}
for a in bpy.data.actions:
    if a.name in ['Bodyposes', 'Faceposes', 'Hand Relaxed', 'Hand Spread', 'Hand Point', 'Mouth Teethsmile']:
        report['poses'].append({'name': a.name, 'markers': [[m.name, m.frame] for m in a.pose_markers],
                                'curves': [{'path': f.data_path, 'index': f.array_index,
                                            'keys': [list(p.co) for p in f.keyframe_points]}
                                           for f in a.fcurves]})
Path('.qa/companion-source/inspection/rig-details.json').write_text(json.dumps(report, indent=2, default=str))
print('DETAILS', len(report['bendy']), 'bendy bones')
