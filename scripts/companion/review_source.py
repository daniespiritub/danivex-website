"""Render the licensed candidate without changing the source file."""
import bpy
import json
import math
import sys
from pathlib import Path
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).parent))
from art_direction import prepare_art

out = Path('.qa/companion-source/review').resolve()
out.mkdir(parents=True, exist_ok=True)
scene = bpy.context.scene
if '--adapt' in sys.argv:
    prepare_art()
if '--web' in sys.argv:
    if '--brand' in sys.argv:
        from brand_asset import brand_asset
        brand_asset()
    from author_animation import gesture, prepare_rig, CLIPS
    prepare_rig()
    clip_name = sys.argv[sys.argv.index('--web') + 1]
    gesture(clip_name, min(1.1, CLIPS[clip_name] * .45), CLIPS[clip_name])
    if '--morph' in sys.argv:
        morph = sys.argv[sys.argv.index('--morph') + 1]
        for obj in bpy.data.collections['DaniVex-Web'].objects:
            if obj.type == 'MESH' and obj.data.shape_keys and morph in obj.data.shape_keys.key_blocks:
                obj.data.shape_keys.key_blocks[morph].value = 1
        clip_name += '-' + morph
scene.render.engine = 'CYCLES'
scene.cycles.samples = 20
scene.cycles.use_denoising = True
scene.render.resolution_x = 768
scene.render.resolution_y = 960
scene.render.resolution_percentage = 100
scene.render.film_transparent = False
scene.view_settings.view_transform = 'AgX'
scene.world.use_nodes = True
scene.world.node_tree.nodes.get('Background').inputs[0].default_value = (0.065, 0.073, 0.095, 1)
scene.world.node_tree.nodes.get('Background').inputs[1].default_value = 0.5
for obj in bpy.data.objects:
    if obj.type == 'LIGHT':
        obj.hide_render = True
rig = bpy.data.objects['RIG-Snow']
pose_info = {
    'frame': scene.frame_current,
    'current_action': rig.animation_data.action.name if rig.animation_data and rig.animation_data.action else None,
    'props': {b.name: dict(b.items()) for b in rig.pose.bones if b.name == 'Properties'},
    'geo': {o.name: [s.material.name if s.material else None for s in o.material_slots]
            for o in bpy.data.objects if o.name.startswith('GEO-snow')},
    'controls': [b.name for b in rig.pose.bones if not b.name.startswith(('STR-', 'DEF-', 'ORG-', 'MCH-', 'GEO-', 'ACT-', 'COR-', 'IK-M-', 'IK-STR-', 'IK2-', 'FK-HNG-', 'P-', 'DSP-'))],
}
(out / 'rig.json').write_text(json.dumps(pose_info, indent=2, default=str))
for name, position, power, size, color in [
    ('ReviewKey', (-2.4, -3.6, 4), 380, 3, (1, .86, .75)),
    ('ReviewFill', (2, -2, 2.4), 170, 2.5, (.74, .83, 1)),
    ('ReviewRim', (1.5, 1.8, 3), 330, 2, (.8, .85, 1)),
]:
    light = bpy.data.lights.new(name, 'AREA')
    light.energy, light.shape, light.size = power, 'DISK', size
    light.color = color
    obj = bpy.data.objects.new(name, light)
    scene.collection.objects.link(obj)
    obj.location = position
    obj.rotation_euler = (Vector((0, 0, 1)) - obj.location).to_track_quat('-Z', 'Y').to_euler()
cam = scene.camera
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 2.2
cam.location = (2.5, -6, 1.25)
cam.rotation_euler = (Vector((0, 0, 1)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
view = sys.argv[sys.argv.index('--view') + 1] if '--view' in sys.argv else 'three-quarter'
if view in ('front', 'side', 'back'):
    cam.location = {'front': (0, -6, 1.15), 'side': (6, 0, 1.15), 'back': (0, 6, 1.15)}[view]
    cam.rotation_euler = (Vector((0, 0, 1)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
elif view == 'face':
    cam.data.ortho_scale = .57
    cam.location = (.4, -3, 1.75)
    cam.rotation_euler = (Vector((0, -.02, 1.72)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
scene.render.filepath = str(out / 'candidate.png')
if '--adapt' in sys.argv:
    scene.render.filepath = str(out / 'adaptation.png')
if '--web' in sys.argv:
    scene.render.filepath = str(out / ('web-' + clip_name + '-' + view + '.png'))
bpy.ops.render.render(write_still=True)
if '--batch' in sys.argv:
    for clip, angle, position, target, scale in [
        ('Idle', 'front', (0, -6, 1.15), (0, 0, 1), 2.2),
        ('Idle', 'side', (6, 0, 1.15), (0, 0, 1), 2.2),
        ('Idle', 'back', (0, 6, 1.15), (0, 0, 1), 2.2),
        ('Idle', 'face', (.4, -3, 1.75), (0, -.02, 1.72), .57),
        ('Wave', 'hand', (1.6, -4, 1.7), (.55, 0, 1.65), .6),
        ('Idle', 'shoes', (.6, -2, .5), (0, -.08, .12), .5),
        ('PointLeft', 'pose', (0, -6, 1.15), (0, 0, 1), 2.2),
        ('PointRight', 'pose', (0, -6, 1.15), (0, 0, 1), 2.2),
        ('Thinking', 'pose', (0, -6, 1.15), (0, 0, 1), 2.2),
        ('Happy', 'pose', (0, -6, 1.15), (0, 0, 1), 2.2),
        ('Walk', 'side', (6, 0, 1.15), (0, 0, 1), 2.2),
    ]:
        gesture(clip, CLIPS[clip] * .4, CLIPS[clip])
        cam.location = position
        cam.rotation_euler = (Vector(target) - cam.location).to_track_quat('-Z', 'Y').to_euler()
        cam.data.ortho_scale = scale
        scene.render.filepath = str(out / ('web-' + clip + '-' + angle + '.png'))
        bpy.ops.render.render(write_still=True)
