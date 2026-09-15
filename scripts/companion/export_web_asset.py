"""Publish only approved web objects to a self-contained compressed GLB."""
import bpy
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from author_animation import CLIPS
from brand_asset import brand_asset

OUT = Path('.qa/companion-source/web').resolve()
brand_asset()
collection = bpy.data.collections['DaniVex-Web']
rig = bpy.data.objects['DaniVexRig']
rig['source'] = 'https://studio.blender.org/characters/snow/v4/'
rig['license'] = 'https://creativecommons.org/licenses/by/4.0/'
rig['modifications'] = 'DaniVex materials, clothing accents, monogram, web rig, facial morphs and Companion animation.'
bpy.ops.object.select_all(action='DESELECT')
for obj in collection.objects:
    obj.hide_set(False)
    obj.hide_render = False
    obj.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.context.scene.frame_set(0)
# Save editable art with its source dependencies before trimming export actions.
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'DaniVex-editable.blend'))
for action in list(bpy.data.actions):
    if action.name not in CLIPS:
        bpy.data.actions.remove(action)
target = OUT / 'DaniVexCharacter.glb'
bpy.ops.export_scene.gltf(
    filepath=str(target), export_format='GLB', use_selection=True,
    export_animations=True, export_animation_mode='ACTIONS',
    export_force_sampling=True, export_frame_range=False,
    export_optimize_animation_size=True, export_optimize_animation_keep_anim_armature=False,
    export_morph=True, export_morph_normal=True, export_try_sparse_sk=True,
    export_skins=True, export_influence_nb=4, export_extras=True,
    export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
    export_draco_position_quantization=15, export_draco_normal_quantization=12,
    export_draco_texcoord_quantization=14,
    export_copyright='Snow Rig (CC) Blender Foundation | studio.blender.org; CC BY 4.0. DaniVex adaptation.',
)
print('EXPORTED', str(target), target.stat().st_size, flush=True)
