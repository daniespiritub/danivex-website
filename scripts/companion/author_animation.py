"""Author restrained Companion gestures on the licensed controls, bake deform bones."""
import bpy
import math
import sys
from pathlib import Path
from mathutils import Matrix, Vector, Euler, Quaternion

sys.path.insert(0, str(Path(__file__).parent))
from art_direction import neutral_pose, apply_pose

OUT = Path('.qa/companion-source/web').resolve()
source = bpy.data.objects['RIG-Snow']
rig = bpy.data.objects['DaniVexRig']
collection = bpy.data.collections['DaniVex-Web']
FPS = 24
CLIPS = {'Idle': 4, 'Wave': 2.4, 'Look': 3, 'PointLeft': 2.8, 'PointRight': 2.8,
         'Happy': 2.5, 'Celebrate': 2.6, 'Thinking': 3, 'Surprised': 1.8,
         'Walk': 1.2, 'Hop': 1.4, 'Bored': 4, 'Sleepy': 4, 'Return': 2}

def smooth(v):
    v = min(1, max(0, v))
    return v * v * (3 - 2 * v)

def offset_world(bones, name, offset):
    matrix = bones[name].matrix.copy()
    matrix.translation += Vector(offset)
    bones[name].matrix = matrix

def hand_target(bones, side, point, blend, rotation=None):
    start = bones[f'FK-Wrist.{side}'].matrix.copy()
    target = (rotation or Euler((math.pi / 2, 0, 0)).to_quaternion()).to_matrix().to_4x4()
    target.translation = point
    bones['Properties']['ik_' + ('left' if side == 'L' else 'right') + '_upperarm'] = 1.0
    bones[f'IK-Wrist.{side}'].matrix = start.lerp(target, blend)
    pole = bones[f'POLE-UpperArm.{side}'].matrix.copy()
    pole.translation = Vector((.42 if side == 'L' else -.42, -.18, 1.05))
    bones[f'POLE-UpperArm.{side}'].matrix = pole

def gesture(name, t, duration):
    neutral_pose(source)
    b = source.pose.bones
    breathing = math.sin(t * math.tau / 4)
    b['FK-Chest'].rotation_euler.x = .012 * breathing
    b['FK-Head'].rotation_euler.z = .025 * math.sin(t * math.tau / 4)
    b['FK-Ponytail1'].rotation_euler.x = .018 * math.sin(t * math.tau / 4 - .6)
    blend = smooth(t / .4) * smooth((duration - t) / .5)
    root_height = 0
    if name in ('Wave', 'Return'):
        apply_pose(source, 'Hand Spread', blend * .7, side='L')
        b['FK-UpperArm.L'].rotation_euler.z += math.radians(42) * blend
        b['FK-Forearm.L'].rotation_euler.z = math.radians(113) * blend
        b['FK-Forearm.L'].rotation_euler.y = math.radians(-80) * blend
        b['FK-Wrist.L'].rotation_euler.x = (.18 * math.sin(t * 12)) * blend
        b['FK-Head'].rotation_euler.z -= .09 * blend
    elif name.startswith('Point'):
        side, sign = ('R', -1) if name == 'PointLeft' else ('L', 1)
        apply_pose(source, 'Hand Point', blend, side=side)
        b[f'FK-UpperArm.{side}'].rotation_euler.z += sign * math.radians(12) * blend
        b[f'FK-Forearm.{side}'].rotation_euler.z = sign * math.radians(62) * blend
        b['FK-Head'].rotation_euler.y = sign * .2 * blend
        offset_world(b, 'TGT-Eyes', (sign * .35 * blend, 0, 0))
    elif name == 'Thinking':
        apply_pose(source, 'Hand Fist', blend * .65, side='R')
        finger = b['FK-Finger_Index1.R']
        finger.rotation_euler = tuple(angle * (1 - blend * .8) for angle in finger.rotation_euler)
        hand_target(b, 'R', Vector((-.075, -.20, 1.42)), blend, Euler((math.pi / 2, 0, math.pi / 2)).to_quaternion())
        b['FK-Head'].rotation_euler.z = .12 * blend
    elif name == 'Happy':
        apply_pose(source, 'Hand Fist', blend, side='L')
        for joint in (1, 2, 3): b[f'FK-Finger_Thumb{joint}.L'].rotation_euler = (0, 0, 0)
        bpy.context.view_layer.update()
        thumb = (b['DEF-Finger_Thumb3.L'].tail - b['DEF-Finger_Thumb1.L'].head).normalized()
        align = thumb.rotation_difference(Vector((0, 0, 1)))
        hand_rotation = align @ b['FK-Wrist.L'].matrix.to_quaternion()
        hand_target(b, 'L', Vector((.3, -.22, 1.28)), blend, hand_rotation)
    elif name in ('Celebrate', 'Hop'):
        anticipation = -.04 * math.sin(t / .3 * math.pi) if t < .3 else 0
        landing = -.022 * math.sin((t - 1.05) / .35 * math.pi) if 1.05 < t < 1.4 else 0
        hop = max(0, math.sin((t - .3) / .75 * math.pi)) * .07 if .3 < t < 1.05 else 0
        crouch = anticipation + landing
        root_height = crouch + hop
        # Translate the whole body; counter-offset planted feet during crouches.
        for side in ('L', 'R'): offset_world(b, f'IK-Foot.{side}', (0, 0, -crouch))
        b['FK-Chest'].rotation_euler.x += -crouch * 2
        b['FK-Head'].rotation_euler.x += crouch
        for side in ('L', 'R'):
            b[f'FK-UpperArm.{side}'].rotation_euler.x += crouch * 4 - hop * 2
            b[f'FK-Forearm.{side}'].rotation_euler.x -= hop * 2
        if name == 'Celebrate':
            for side, sign in [('L', 1), ('R', -1)]:
                b[f'FK-UpperArm.{side}'].rotation_euler.z += sign * 1.15 * blend
                b[f'FK-Forearm.{side}'].rotation_euler.z = sign * 1.1 * blend
    elif name == 'Walk':
        phase = t * math.tau / duration
        for side, sign in [('L', 1), ('R', -1)]:
            offset_world(b, f'IK-Foot.{side}', (0, sign * .095 * math.cos(phase), .035 * max(0, sign * math.sin(phase))))
            b[f'FK-UpperArm.{side}'].rotation_euler.x = sign * .22 * math.cos(phase)
        offset_world(b, 'Hips', (0, 0, -.016 + .01 * math.cos(phase * 2)))
    elif name == 'Surprised':
        b['FK-Head'].rotation_euler.x = -.1 * blend
        for side, sign in [('L', 1), ('R', -1)]:
            b[f'FK-UpperArm.{side}'].rotation_euler.z += sign * .2 * blend
    elif name in ('Bored', 'Sleepy'):
        b['FK-Head'].rotation_euler.x = (.15 if name == 'Sleepy' else .035) + .035 * breathing
        b['FK-Head'].rotation_euler.z = .1 if name == 'Sleepy' else .09 * breathing
        b['FK-Chest'].rotation_euler.x = .04 + .007 * breathing
    elif name == 'Look':
        b['FK-Head'].rotation_euler.y = .16 * math.sin(t * math.tau / duration)
    bpy.context.view_layer.update()
    matrices = {name: source.pose.bones[name].matrix.copy() for name in rig.pose.bones.keys() if name != 'Root'}
    for bone in rig.pose.bones:
        if bone.name == 'Root':
            rest = bone.bone.matrix_local
            bone.matrix_basis = rest.inverted() @ Matrix.Translation((0, 0, root_height)) @ rest
            continue
        parent = bone.parent
        parent_pose = matrices.get(parent.name, parent.bone.matrix_local)
        bone.matrix_basis = bone.bone.convert_local_to_pose(matrices[bone.name], bone.bone.matrix_local,
            parent_matrix=parent_pose, parent_matrix_local=parent.bone.matrix_local, invert=True)
    bpy.context.view_layer.update()

def prepare_rig():
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    for bone in rig.data.edit_bones:
        if bone.name == 'Root': continue
        original = source.data.bones[bone.name]
        bone.head, bone.tail = original.head_local, original.tail_local
        bone.matrix = original.matrix_local
    bpy.ops.object.mode_set(mode='OBJECT')

def author(selected=None):
    prepare_rig()
    bpy.context.scene.render.fps = FPS
    rig.animation_data_create()
    for name, duration in CLIPS.items():
        if selected and name not in selected: continue
        if name in bpy.data.actions: bpy.data.actions.remove(bpy.data.actions[name])
        action = bpy.data.actions.new(name)
        rig.animation_data.action = action
        for frame in range(round(duration * FPS) + 1):
            t = frame / FPS
            gesture(name, t, duration)
            for bone in rig.pose.bones:
                bone.rotation_mode = 'QUATERNION'
                bone.keyframe_insert('location', frame=frame)
                bone.keyframe_insert('rotation_quaternion', frame=frame)
                bone.keyframe_insert('scale', frame=frame)
        action.use_fake_user = True
        print('AUTHORED', name, flush=True)
    rig.animation_data.action = bpy.data.actions['Idle']
    bpy.context.scene.frame_set(0)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'animated.blend'))

if __name__ == '__main__':
    selected = sys.argv[sys.argv.index('--clips') + 1:] if '--clips' in sys.argv else None
    if selected and any(name not in CLIPS for name in selected): raise ValueError('Unknown animation clip')
    author(selected)
