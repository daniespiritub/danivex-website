"""Bake Blender/UDIM garment and skin shading into portable glTF PBR textures."""
import bpy
from pathlib import Path

OUT = Path('.qa/companion-source/web').resolve()
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 4
scene.render.bake.use_pass_direct = False
scene.render.bake.use_pass_indirect = False
scene.render.bake.use_pass_color = True
scene.render.bake.margin = 10
objects = [o for o in bpy.data.collections['DaniVex-Web'].objects if o.type == 'MESH']
bpy.ops.object.select_all(action='DESELECT')

def pin_uv(tree, uv_name):
    for node in list(tree.nodes):
        if node.type == 'GROUP' and node.node_tree:
            node.node_tree = node.node_tree.copy()
            pin_uv(node.node_tree, uv_name)
        if node.type == 'TEX_IMAGE' and not node.inputs['Vector'].is_linked:
            uv = tree.nodes.new('ShaderNodeUVMap')
            uv.uv_map = uv_name
            tree.links.new(uv.outputs[0], node.inputs['Vector'])
        if node.type == 'TEX_COORD':
            for link in list(node.outputs['UV'].links):
                uv = tree.nodes.new('ShaderNodeUVMap')
                uv.uv_map = uv_name
                tree.links.new(uv.outputs[0], link.to_socket)

def garment_colors(material, part):
    if part not in ('shirt', 'shoes_base'): return
    tree = material.node_tree
    shader = next(n for n in tree.nodes if n.type == 'BSDF_PRINCIPLED')
    coordinates = tree.nodes.new('ShaderNodeTexCoord')
    separate = tree.nodes.new('ShaderNodeSeparateXYZ')
    tree.links.new(coordinates.outputs['Object'], separate.inputs[0])
    threshold = tree.nodes.new('ShaderNodeMath')
    color = tree.nodes.new('ShaderNodeMixRGB')
    color.blend_type = 'MIX'
    if part == 'shirt':
        absolute = tree.nodes.new('ShaderNodeMath')
        absolute.operation = 'ABSOLUTE'
        tree.links.new(separate.outputs['X'], absolute.inputs[0])
        threshold.operation = 'GREATER_THAN'
        tree.links.new(absolute.outputs[0], threshold.inputs[0])
        threshold.inputs[1].default_value = .263
        base = shader.inputs['Base Color']
        if base.links: tree.links.new(base.links[0].from_socket, color.inputs[1])
        else: color.inputs[1].default_value = base.default_value
        color.inputs[2].default_value = (.24, .009, .019, 1)
    else:
        threshold.operation = 'LESS_THAN'
        tree.links.new(separate.outputs['Z'], threshold.inputs[0])
        threshold.inputs[1].default_value = .027
        color.inputs[1].default_value = (.22, .017, .029, 1)
        color.inputs[2].default_value = (.68, .68, .65, 1)
    tree.links.new(threshold.outputs[0], color.inputs[0])
    tree.links.new(color.outputs[0], shader.inputs['Base Color'])

for obj in objects:
    part = obj.name.removeprefix('DaniVex-')
    if part in ('teeth_lower', 'teeth_upper', 'gums_lower', 'gums_upper', 'tongue'):
        continue
    obj.hide_set(False)
    obj.hide_render = False
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    # Preserve original UV lookup before creating an atlas for glTF's one tile.
    old_uv = next((u.name for u in obj.data.uv_layers if u.active_render), obj.data.uv_layers.active.name)
    originals = []
    for slot in obj.material_slots:
        mat = slot.material.copy()
        slot.material = mat
        originals.append(mat)
        pin_uv(mat.node_tree, old_uv)
        garment_colors(mat, part)
        if part == 'hair_base':
            for shader in [n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED']:
                base = shader.inputs['Base Color']
                link = base.links[0] if base.links else None
                tint = mat.node_tree.nodes.new('ShaderNodeMixRGB')
                tint.blend_type = 'MULTIPLY'
                tint.inputs[0].default_value = 1
                tint.inputs[2].default_value = (.8, .6, .4, 1)
                if link: mat.node_tree.links.new(link.from_socket, tint.inputs[1])
                else: tint.inputs[1].default_value = base.default_value
                mat.node_tree.links.new(tint.outputs[0], base)
        if part == 'eyes':
            shader = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
            for link in list(shader.inputs['Metallic'].links):
                mat.node_tree.links.remove(link)
            shader.inputs['Metallic'].default_value = 0
    layer = obj.data.uv_layers.new(name='DV_Atlas')
    obj.data.uv_layers.active = layer
    layer.active_render = True
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=.9, island_margin=.025)
    bpy.ops.object.mode_set(mode='OBJECT')
    size = 1024 if part in ('head', 'body', 'shirt', 'pants', 'hair_base') else 512
    baked = {}
    for kind in ('DIFFUSE', 'NORMAL'):
        image = bpy.data.images.new('DV_' + part + '_' + kind, width=size, height=size, alpha=False)
        image.colorspace_settings.name = 'sRGB' if kind == 'DIFFUSE' else 'Non-Color'
        for mat in originals:
            node = mat.node_tree.nodes.new('ShaderNodeTexImage')
            node.image = image
            mat.node_tree.nodes.active = node
        bpy.ops.object.bake(type=kind)
        image.filepath_raw = str(OUT / (image.name + '.png'))
        image.file_format = 'PNG'
        image.save()
        baked[kind] = image
    material = bpy.data.materials.new('DaniVex.' + part)
    material.use_nodes = True
    shader = material.node_tree.nodes.get('Principled BSDF')
    color = material.node_tree.nodes.new('ShaderNodeTexImage')
    color.image = baked['DIFFUSE']
    material.node_tree.links.new(color.outputs['Color'], shader.inputs['Base Color'])
    texture = material.node_tree.nodes.new('ShaderNodeTexImage')
    texture.image = baked['NORMAL']
    normal = material.node_tree.nodes.new('ShaderNodeNormalMap')
    material.node_tree.links.new(texture.outputs['Color'], normal.inputs['Color'])
    material.node_tree.links.new(normal.outputs['Normal'], shader.inputs['Normal'])
    roughness = .82 if part in ('shirt', 'pants') else .65 if 'shoes' in part else .63 if part in ('head', 'body') else .62 if part == 'hair_base' else .26
    shader.inputs['Roughness'].default_value = roughness
    if part in ('head', 'body'):
        shader.inputs['Subsurface Weight'].default_value = .08
    if part == 'eyes':
        shader.inputs['Coat Weight'].default_value = 1
        shader.inputs['Coat Roughness'].default_value = .08
    if part == 'hair_base':
        shader.inputs['Roughness'].default_value = .72
        shader.inputs['Specular IOR Level'].default_value = .2
    obj.data.materials.clear()
    obj.data.materials.append(material)
    for polygon in obj.data.polygons: polygon.material_index = 0
    # Only the atlas is used by final materials; do not export authoring UVs.
    for name in [u.name for u in obj.data.uv_layers if u.name != 'DV_Atlas']:
        obj.data.uv_layers.remove(obj.data.uv_layers[name])
    obj.select_set(False)
    print('BAKED', part, size, flush=True)

bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'materials.blend'))
