param(
    [string]$Blender = '.qa/companion-source/blender/blender-4.5.13-windows-x64/blender.exe',
    [string]$Source = '.qa/companion-source/snow/Snow/snow_v4.2.blend',
    [switch]$OptimizeOnly
)

$ErrorActionPreference = 'Stop'
$repo = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
Push-Location -LiteralPath $repo
try {
    if (-not $OptimizeOnly) {
    $exe = (Resolve-Path -LiteralPath $Blender).Path
    $sourceFile = (Resolve-Path -LiteralPath $Source).Path
    $stages = @(
        @{ Input = $sourceFile; Script = 'build_web_asset.py' },
        @{ Input = '.qa/companion-source/web/geometry.blend'; Script = 'bake_materials.py' },
        @{ Input = '.qa/companion-source/web/materials.blend'; Script = 'author_animation.py' },
        @{ Input = '.qa/companion-source/web/animated.blend'; Script = 'export_web_asset.py' }
    )
    foreach ($stage in $stages) {
        $script = Join-Path $PSScriptRoot $stage.Script
        & $exe --background --enable-autoexec $stage.Input --python-exit-code 1 --python $script
        if ($LASTEXITCODE -ne 0) { throw "Companion stage failed: $($stage.Script)" }
    }
    }
    $web = '.qa/companion-source/web'
    $steps = @(
        @('webp', "$web/DaniVexCharacter.glb", "$web/DaniVexCharacter-webp.glb", '--quality', '94', '--effort', '80'),
        @('tangents', "$web/DaniVexCharacter-webp.glb", "$web/DaniVexCharacter-tangents.glb"),
        @('draco', "$web/DaniVexCharacter-tangents.glb", "$web/DaniVexCharacter-optimized.glb", '--method', 'sequential', '--quantize-position', '15', '--quantize-normal', '12', '--quantize-texcoord', '14')
    )
    foreach ($arguments in $steps) {
        & npx.cmd --yes '@gltf-transform/cli@4.5.0' @arguments
        if ($LASTEXITCODE -ne 0) { throw "Companion optimization failed: $($arguments[0])" }
    }
    Write-Output 'Candidate built under .qa/companion-source/web. Visual acceptance is still required before publication.'
}
finally {
    Pop-Location
}
