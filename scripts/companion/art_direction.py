"""DaniVex art/pose adjustments on the licensed Snow rig, never the old mascot."""
import bpy
import math
import re

def apply_pose(rig, name, influence=1.0, side=None):
    action = bpy.data.actions[name]
    frame = action.frame_range[0]
    mirror = side == 'R' and not any('.R"' in c.data_path for c in action.fcurves)
    for curve in action.fcurves:
        match = re.fullmatch(r'pose.bones\["(.+)"\]\.([a-z_]+)', curve.data_path)
        if not match:
            continue
        wanted = 'L' if mirror else side
        if side and not match[1].endswith('.' + wanted):
            continue
        bone_name = match[1][:-2] + '.R' if mirror else match[1]
        bone = rig.pose.bones.get(bone_name)
        if not bone:
            continue
        value = getattr(bone, match[2])
        target = curve.evaluate(frame)
        if mirror and ((match[2] == 'rotation_euler' and curve.array_index in (1, 2))
                       or (match[2] == 'location' and curve.array_index == 0)):
            target = -target
        if hasattr(value, '__len__'):
            i = curve.array_index
            value[i] += (target - value[i]) * influence
        else:
            setattr(bone, match[2], value + (target - value) * influence)

def neutral_pose(rig, resting=True):
    for bone in rig.pose.bones:
        bone.location = (0, 0, 0)
        bone.rotation_euler = (0, 0, 0)
        bone.rotation_quaternion = (1, 0, 0, 0)
        bone.scale = (1, 1, 1)
    props = rig.pose.bones['Properties']
    props['ik_left_upperarm'] = props['ik_right_upperarm'] = 0.0
    if resting:
        # The local Z axis lowers the authored T-pose shoulders naturally.
        rig.pose.bones['FK-UpperArm.L'].rotation_euler.z = math.radians(-74)
        rig.pose.bones['FK-UpperArm.R'].rotation_euler.z = math.radians(74)
        rig.pose.bones['FK-Forearm.L'].rotation_euler.x = math.radians(-10)
        rig.pose.bones['FK-Forearm.R'].rotation_euler.x = math.radians(-10)
        apply_pose(rig, 'Hand Relaxed', .7, side='L')
        apply_pose(rig, 'Hand Relaxed', .7, side='R')
    apply_pose(rig, 'Mouth Teethsmile', .8)
    rig.pose.bones['FK-Head'].scale = (1, 1, 1)
    for side in ('L', 'R'):
        rig.pose.bones[f'MSTR-Eyelid_Upper.{side}'].location.y = -.0015
        rig.pose.bones[f'MSTR-Eyebrow.{side}'].location.y = .002
    bpy.context.view_layer.update()

def direction_materials():
    # Preserve authored fabric/skin detail; recolor only garment base color.
    for name, color in [('snow.shirt', (.055, .062, .078, 1)),
                        ('snow.pants', (.17, .065, .3, 1))]:
        mat = bpy.data.materials[name]
        shader = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
        base = shader.inputs['Base Color']
        link = base.links[0] if base.links else None
        mix = mat.node_tree.nodes.new('ShaderNodeMixRGB')
        mix.blend_type = 'MULTIPLY'
        mix.inputs[0].default_value = 1
        mix.inputs[2].default_value = color
        if link:
            mat.node_tree.links.new(link.from_socket, mix.inputs[1])
        mat.node_tree.links.new(mix.outputs[0], base)
        shader.inputs['Roughness'].default_value = .82

def prepare_art():
    rig = bpy.data.objects['RIG-Snow']
    neutral_pose(rig)
    direction_materials()
    return rig
