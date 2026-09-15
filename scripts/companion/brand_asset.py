"""DaniVex garment accents and an understated raised chest monogram."""
import bpy
import bmesh
import math
from mathutils import Vector
from mathutils.bvhtree import BVHTree

def brand_asset():
    collection = bpy.data.collections['DaniVex-Web']
    rig = bpy.data.objects['DaniVexRig']
    # Keep the dark pupil readable under the browser's environment lighting.
    eyes = bpy.data.materials['DaniVex.eyes'].node_tree.nodes.get('Principled BSDF')
    eyes.inputs['Specular IOR Level'].default_value = .025
    eyes.inputs['Roughness'].default_value = .24
    eyes.inputs['Coat Weight'].default_value = 0
    eyes.inputs['Coat Roughness'].default_value = .2
    brows = bpy.data.materials['DaniVex.eyebrows'].node_tree.nodes.get('Principled BSDF')
    brows.inputs['Roughness'].default_value = .66
    brows.inputs['Specular IOR Level'].default_value = .2
    for part, color in [('teeth_lower', (.82, .79, .71, 1)), ('teeth_upper', (.82, .79, .71, 1)),
                        ('gums_lower', (.2, .042, .035, 1)), ('gums_upper', (.2, .042, .035, 1)),
                        ('tongue', (.3, .06, .06, 1))]:
        obj = bpy.data.objects['DaniVex-' + part]
        mat = bpy.data.materials.new('DaniVex.' + part)
        mat.use_nodes = True
        shader = mat.node_tree.nodes.get('Principled BSDF')
        shader.inputs['Base Color'].default_value = color
        shader.inputs['Roughness'].default_value = .42
        obj.data.materials.clear()
        obj.data.materials.append(mat)
    shirt = bpy.data.objects['DaniVex-shirt']
    # Split the shoe along the foxing edge; a real shared edge avoids atlas bleed.
    shoe = bpy.data.objects['DaniVex-shoes_base']
    if shoe.data.shape_keys:
        if len(shoe.data.shape_keys.key_blocks) != 1: raise RuntimeError('Shoe unexpectedly has animated morphs')
        shoe.shape_key_clear()
    mesh = bmesh.new()
    mesh.from_mesh(shoe.data)
    bmesh.ops.bisect_plane(mesh, geom=list(mesh.verts) + list(mesh.edges) + list(mesh.faces),
        plane_co=(0, 0, .027), plane_no=(0, 0, 1), dist=.000001,
        clear_inner=False, clear_outer=False)
    mesh.normal_update()
    mesh.to_mesh(shoe.data)
    mesh.free()
    shoe.data.update()
    suede = shoe.data.materials[0].copy()
    suede.name = 'DaniVex.red-suede'
    shader = suede.node_tree.nodes.get('Principled BSDF')
    for link in list(shader.inputs['Base Color'].links): suede.node_tree.links.remove(link)
    shader.inputs['Base Color'].default_value = (.22, .017, .029, 1)
    shader.inputs['Roughness'].default_value = .76
    rubber = bpy.data.materials.new('DaniVex.rubber')
    rubber.use_nodes = True
    shader = rubber.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (.68, .68, .65, 1)
    shader.inputs['Roughness'].default_value = .87
    shoe.data.materials.clear()
    shoe.data.materials.append(suede)
    shoe.data.materials.append(rubber)
    for polygon in shoe.data.polygons: polygon.material_index = int(polygon.center.z < .027)

    curve = bpy.data.curves.new('DaniVexMonogram', 'FONT')
    curve.body = 'DV'
    curve.size = .037
    curve.extrude = .0008
    curve.bevel_depth = .0003
    curve.bevel_resolution = 2
    obj = bpy.data.objects.new('DaniVex-monogram', curve)
    collection.objects.link(obj)
    obj.location = (.067, -.2, 1.276)
    obj.rotation_euler.x = math.pi / 2
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.convert(target='MESH')
    obj = bpy.context.object
    bvh = BVHTree.FromPolygons([v.co for v in shirt.data.vertices], [p.vertices[:] for p in shirt.data.polygons])
    matrix = obj.matrix_world.copy()
    for vertex in obj.data.vertices:
        world = matrix @ vertex.co
        hit = bvh.ray_cast(Vector((world.x, -1, world.z)), Vector((0, 1, 0)))[0]
        if hit is not None:
            world.y = hit.y - .0015 - vertex.co.z
        vertex.co = world
    obj.matrix_world.identity()
    gold = bpy.data.materials.new('DaniVex.warm-thread')
    gold.use_nodes = True
    shader = gold.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (.65, .37, .065, 1)
    shader.inputs['Roughness'].default_value = .67
    obj.data.materials.append(gold)
    group = obj.vertex_groups.new(name='DEF-Chest')
    group.add(list(range(len(obj.data.vertices))), 1, 'REPLACE')
    modifier = obj.modifiers.new('DaniVexSkin', 'ARMATURE')
    modifier.object = rig
    obj.parent = rig

if __name__ == '__main__':
    brand_asset()
