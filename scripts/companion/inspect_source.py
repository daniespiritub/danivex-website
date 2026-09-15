"""Run with Blender --background --disable-autoexec source.blend --python this_file."""
import bpy
import json
import pathlib
import sys

args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
out = pathlib.Path(args[0] if args else '.qa/companion-source/inspection')
out.mkdir(parents=True, exist_ok=True)

def vec(value):
    return [round(float(v), 5) for v in value]

report = {
    'file': bpy.data.filepath,
    'objects': [],
    'materials': [],
    'actions': [],
    'images': [],
    'texts': [],
    'collections': [{ 'name': c.name, 'hide_render': c.hide_render } for c in bpy.data.collections],
}
for obj in bpy.data.objects:
    entry = {'name': obj.name, 'type': obj.type, 'hidden': obj.hide_render,
             'location': vec(obj.location), 'dimensions': vec(obj.dimensions),
             'parent': obj.parent.name if obj.parent else None}
    if obj.type == 'MESH':
        entry.update(vertices=len(obj.data.vertices), polygons=len(obj.data.polygons),
                     materials=[m.name if m else None for m in obj.data.materials],
                     modifiers=[{'name': m.name, 'type': m.type, 'visible': m.show_viewport,
                                 'render': m.show_render} for m in obj.modifiers],
                     shapes=[k.name for k in obj.data.shape_keys.key_blocks] if obj.data.shape_keys else [])
    elif obj.type == 'ARMATURE':
        entry['bones'] = [{'name': b.name, 'parent': b.parent.name if b.parent else None,
                           'deform': b.use_deform, 'head': vec(b.head_local),
                           'tail': vec(b.tail_local)} for b in obj.data.bones]
        entry['controls'] = [{'name': b.name, 'properties': dict(b.items())}
                             for b in obj.pose.bones if len(b.keys())]
    report['objects'].append(entry)
for mat in bpy.data.materials:
    nodes = []
    if mat.use_nodes:
        for n in mat.node_tree.nodes:
            nodes.append({'name': n.name, 'type': n.type,
                          'image': n.image.name if n.type == 'TEX_IMAGE' and n.image else None,
                          'group': n.node_tree.name if n.type == 'GROUP' and n.node_tree else None})
    report['materials'].append({'name': mat.name, 'nodes': nodes})
for action in bpy.data.actions:
    report['actions'].append({'name': action.name, 'frames': vec(action.frame_range)})
for im in bpy.data.images:
    report['images'].append({'name': im.name, 'file': im.filepath, 'size': list(im.size),
                             'packed': bool(im.packed_file)})
for i, block in enumerate(bpy.data.texts):
    target = out / f'embedded-{i}.txt'
    target.write_text(block.as_string(), encoding='utf-8')
    report['texts'].append({'name': block.name, 'file': str(target), 'module': block.use_module})
(out / 'source.json').write_text(json.dumps(report, indent=2, default=str), encoding='utf-8')
print('SOURCE_INSPECTED', str(out / 'source.json'))
