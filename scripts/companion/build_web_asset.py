"""Reproducible Snow CC BY adaptation. Run from repo with Blender 4.5 LTS.

Source stays untouched. Build intermediates go to ignored .qa/companion-source.
The facial rig is sampled into named morphs; an independent deform rig carries
the body. Browser code never receives CloudRig scripts or Blender constraints.
"""
import bpy
import json
import math
import sys
from pathlib import Path
from mathutils import Matrix, Vector

sys.path.insert(0, str(Path(__file__).parent))
from art_direction import neutral_pose, apply_pose, direction_materials

OUT = Path('.qa/companion-source/web').resolve()
OUT.mkdir(parents=True, exist_ok=True)
source = bpy.data.objects['RIG-Snow']
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 8
scene.render.bake.use_pass_direct = False
scene.render.bake.use_pass_indirect = False
scene.render.bake.use_pass_color = True
scene.render.bake.margin = 12

BODY = ['DEF-Hips', 'DEF-Hip_Center', 'DEF-Spine', 'DEF-RibCage', 'DEF-Chest', 'DEF-Neck', 'DEF-Head', 'DEF-Ponytail1']
for side in ['L', 'R']:
    BODY += [f'DEF-{part}.{side}' for part in ['Shoulder', 'UpperArm_1', 'UpperArm_2', 'Forearm_1', 'Forearm_2', 'Wrist', 'Thigh_1', 'Thigh_2', 'Knee_1', 'Knee_2', 'Foot', 'Toes', 'Eye']]
    for finger in ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky']:
        BODY += [f'DEF-Finger_{finger}{j}.{side}' for j in [1, 2, 3]]
        carpal = f'DEF-Finger_{finger}_Carpal.{side}'
        if carpal in source.data.bones:
            BODY.append(carpal)
BODY = [n for n in BODY if n in source.data.bones]
FACIAL = ['head', 'eyebrows', 'eyes', 'gums_lower', 'gums_upper', 'teeth_lower', 'teeth_upper', 'tongue']
PARTS = ['body', 'head', 'eyebrows', 'hair_base', 'eyes', 'shirt', 'pants', 'shoes_base', 'shoes_bottom', 'shoes_parts', 'teeth_lower', 'teeth_upper', 'gums_lower', 'gums_upper', 'tongue']

def reset_source():
    neutral_pose(source, resting=False)
    source.pose.bones['FK-Head'].scale = (1, 1, 1)
    # Base mesh already carries the friendly smile; all morphs are relative to it.
    bpy.context.view_layer.update()

def parent_name(name):
    if name == 'DEF-Hips': return 'Root'
    if name == 'DEF-Hip_Center': return 'DEF-Hips'
    chain = ['DEF-Hips', 'DEF-Spine', 'DEF-RibCage', 'DEF-Chest', 'DEF-Neck', 'DEF-Head', 'DEF-Ponytail1']
    if name in chain: return chain[chain.index(name) - 1]
    side = name[-2:]
    arm = ['Shoulder', 'UpperArm_1', 'UpperArm_2', 'Forearm_1', 'Forearm_2', 'Wrist']
    leg = ['Thigh_1', 'Thigh_2', 'Knee_1', 'Knee_2', 'Foot', 'Toes']
    part = name[4:-2]
    if part in arm: return 'DEF-Chest' if part == arm[0] else 'DEF-' + arm[arm.index(part) - 1] + side
    if part in leg: return 'DEF-Hips' if part == leg[0] else 'DEF-' + leg[leg.index(part) - 1] + side
    if part == 'Eye': return 'DEF-Head'
    if 'Carpal' in part or part.endswith('1'): return 'DEF-Wrist' + side
    return name[:-3] + str(int(name[-3]) - 1) + side

reset_source()
direction_materials()
collection = bpy.data.collections.new('DaniVex-Web')
scene.collection.children.link(collection)
data = bpy.data.armatures.new('DaniVexSkeleton')
rig = bpy.data.objects.new('DaniVexRig', data)
collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig
rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
root = data.edit_bones.new('Root')
root.head, root.tail = (0, 0, 0), (0, 0, .1)
for name in BODY:
    original = source.data.bones[name]
    bone = data.edit_bones.new(name)
    bone.head = original.head_local
    bone.tail = original.tail_local
    bone.length = max(original.length, .01)
    bone.matrix = original.matrix_local.copy()
for name in BODY:
    data.edit_bones[name].parent = data.edit_bones[parent_name(name)]
bpy.ops.object.mode_set(mode='OBJECT')
rig.select_set(False)

originals = {p: bpy.data.objects['GEO-snow-' + p] for p in PARTS}
for obj in originals.values():
    if obj.animation_data:
        for driver in list(obj.animation_data.drivers):
            if 'modifiers[' in driver.data_path and 'Subdivision' in driver.data_path:
                obj.driver_remove(driver.data_path, driver.array_index)
    for mod in obj.modifiers:
        if mod.type == 'SUBSURF':
            mod.levels = mod.render_levels = 1 if not any(k in obj.name for k in ['teeth', 'gums', 'tongue']) else 0
            mod.show_viewport = mod.show_render = True
        # Equal evaluated topology is required across every facial morph sample.
        if mod.type == 'LATTICE':
            mod.show_viewport = mod.show_render = True

def evaluated_mesh(obj):
    bpy.context.view_layer.update()
    graph = bpy.context.evaluated_depsgraph_get()
    return bpy.data.meshes.new_from_object(obj.evaluated_get(graph), preserve_all_data_layers=True, depsgraph=graph)

meshes = {}
for part, original in originals.items():
    mesh = evaluated_mesh(original)
    obj = bpy.data.objects.new('DaniVex-' + part, mesh)
    collection.objects.link(obj)
    meshes[part] = obj
    obj.matrix_world = original.matrix_world.copy()
    # Material assignments may be object-linked in the licensed authoring file.
    for i, slot in enumerate(original.material_slots):
        if i < len(mesh.materials): mesh.materials[i] = slot.material
    mapping = {}
    for group in original.vertex_groups:
        if group.name in BODY:
            mapping[group.index] = group.name
        elif group.name.startswith('DEF-'):
            mapping[group.index] = 'DEF-Head' if part in FACIAL + ['hair_base'] else 'DEF-Chest'
    for name in BODY:
        obj.vertex_groups.new(name=name)
    weights = []
    for vertex in mesh.vertices:
        combined = {}
        for group in vertex.groups:
            name = mapping.get(group.group)
            if name:
                combined[name] = combined.get(name, 0) + group.weight
        if not combined:
            combined['DEF-Head' if part in FACIAL + ['hair_base'] else 'DEF-Foot.L' if part.startswith('shoes') else 'DEF-Hips'] = 1
        best = sorted(combined.items(), key=lambda w: -w[1])[:4]
        total = sum(w for _, w in best)
        weights.append([(n, w / total) for n, w in best])
    # Remove copied deform data, whose indices referred to source vertex groups.
    for group in obj.vertex_groups:
        group.remove(list(range(len(mesh.vertices))))
    for i, row in enumerate(weights):
        for name, value in row: obj.vertex_groups[name].add([i], value, 'REPLACE')
    for poly in mesh.polygons: poly.use_smooth = True
    obj.shape_key_add(name='Basis')

print('BASE_MESHES', sum(len(o.data.vertices) for o in meshes.values()), flush=True)

for expression in ['Blink', 'Smile', 'Surprised', 'Curious', 'Sleepy', 'Relaxed']:
    reset_source()
    if expression == 'Blink':
        apply_pose(source, 'Eyemask Closed', 1)
    elif expression == 'Smile':
        apply_pose(source, 'Mouth Opensmile', .65)
        for side in ('L', 'R'): source.pose.bones[f'MSTR-Eyebrow.{side}'].location.y = .005
    elif expression == 'Surprised':
        apply_pose(source, 'Mouth Oo', .7)
        apply_pose(source, 'Eyemask Scared', .6)
    elif expression == 'Curious':
        source.pose.bones['MSTR-Eyebrow.L'].location.y = .009
    elif expression == 'Sleepy':
        apply_pose(source, 'Eyemask Closed', .8)
        apply_pose(source, 'Mouth Default', 1)
    elif expression == 'Relaxed':
        apply_pose(source, 'Mouth Default', 1)
    for part in FACIAL:
        obj = meshes[part]
        sample = evaluated_mesh(originals[part])
        if len(sample.vertices) != len(obj.data.vertices):
            raise RuntimeError('Morph topology changed: ' + part)
        key = obj.shape_key_add(name=expression)
        for i, vertex in enumerate(sample.vertices):
            # Scared's iris-shrink controls distort the corneal surface in glTF.
            # Surprise comes from eyelids/brows/mouth, never reshaping the eyeball.
            key.data[i].co = obj.data.vertices[i].co if part == 'eyes' and expression == 'Surprised' else vertex.co
        bpy.data.meshes.remove(sample)
reset_source()

# Save an auditable intermediate before texture conversion/animation authoring.
for obj in meshes.values():
    arm = obj.modifiers.new('DaniVexSkin', 'ARMATURE')
    arm.object = rig
    obj.parent = rig
for obj in list(bpy.data.objects):
    if obj.name not in collection.objects:
        obj.hide_render = True
        obj.hide_set(True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'geometry.blend'))
report = {'meshes': {p: len(o.data.vertices) for p, o in meshes.items()}, 'bones': BODY,
          'license': 'CC-BY-4.0', 'attribution': 'Snow Rig (CC) Blender Foundation | studio.blender.org'}
(OUT / 'geometry.json').write_text(json.dumps(report, indent=2))
print('GEOMETRY_READY', str(OUT / 'geometry.blend'), flush=True)
