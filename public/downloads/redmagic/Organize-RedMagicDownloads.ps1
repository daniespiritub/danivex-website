<#
  Organize-RedMagicDownloads.ps1
  Parte de la guia "Root RedMagic 11 Pro gratis" de DaniVex (danivex.com).

  Que hace: busca en tus carpetas Descargas y Escritorio los archivos que
  la guia te pidio descargar (platform-tools, driver Qualcomm, ZTE Family
  Toolbox, el firmware viejo, Magisk, payload-dumper-go) y los COPIA
  -nunca mueve ni borra el original- a una carpeta C:\ZTE organizada por
  subcarpetas, igual que la guia los menciona.

  Que NO hace: no descarga nada de internet, no toca el telefono, no
  desbloquea nada ni escribe en ninguna particion. Es solo organizacion
  de archivos en tu propio PC. Leelo antes de correrlo, como con
  cualquier script que te encuentres en internet.

  Uso: clic derecho -> Ejecutar con PowerShell (o abre PowerShell en esta
  carpeta y corre: .\Organize-RedMagicDownloads.ps1)
#>

$ErrorActionPreference = 'Stop'

function Write-Step($n, $msg) { Write-Host "`n[$n] $msg" -ForegroundColor Cyan }
function Write-Ok($msg) { Write-Host "  OK -> $msg" -ForegroundColor Green }
function Write-Miss($msg) { Write-Host "  FALTA -> $msg" -ForegroundColor Yellow }

Write-Host "=== Organizador de descargas - Guia RedMagic 11 Pro (DaniVex) ===" -ForegroundColor Magenta

# ----- Paso 1: crear la estructura de carpetas -----
Write-Step 1 'Creando C:\ZTE y sus subcarpetas'
$root = 'C:\ZTE'
$folders = [ordered]@{
    Tools    = Join-Path $root 'Tools'     # platform-tools, driver Qualcomm, payload-dumper-go
    Toolbox  = Join-Path $root 'Toolbox'   # ZTE Family Toolbox
    Firmware = Join-Path $root 'Firmware'  # update.zip del firmware viejo (Fase 04)
    OldAbl   = Join-Path $root 'OldAbl'    # aqui cae abl.img cuando lo extraigas
    Magisk   = Join-Path $root 'Magisk'    # APK de Magisk + imagenes parcheadas
}
foreach ($f in $folders.Values) { New-Item -ItemType Directory -Force -Path $f | Out-Null }
Write-Ok "$root listo (Tools, Toolbox, Firmware, OldAbl, Magisk)"

Read-Host "`nPresiona Enter para buscar tus descargas en Descargas y Escritorio"

# ----- Paso 2: buscar cada herramienta por nombre -----
Write-Step 2 'Buscando cada herramienta'
$searchDirs = @("$env:USERPROFILE\Downloads", "$env:USERPROFILE\Desktop") | Where-Object { Test-Path $_ }

$patterns = @(
    @{ Name = 'Platform-Tools (adb/fastboot)';      Match = 'platform-tools.*\.zip$';                 Dest = $folders.Tools;    Extract = $true }
    @{ Name = 'Driver Qualcomm USB';                 Match = 'qcom.*driver.*\.(zip|exe|msi)$';         Dest = $folders.Tools;    Extract = $false }
    @{ Name = 'ZTE Family Toolbox';                  Match = '(family.*toolbox|家族工具箱).*\.(7z|zip|rar)$'; Dest = $folders.Toolbox;  Extract = $false }
    @{ Name = 'Firmware oficial Nubia (update.zip)'; Match = '^update\.zip$|nx809j.*\.zip$';            Dest = $folders.Firmware; Extract = $false }
    @{ Name = 'Magisk APK';                          Match = 'magisk.*\.apk$';                         Dest = $folders.Magisk;   Extract = $false }
    @{ Name = 'payload-dumper-go';                   Match = 'payload-dumper-go.*\.(zip|exe)$';        Dest = $folders.Tools;    Extract = $true }
)

$found = @()
foreach ($p in $patterns) {
    $hit = $null
    foreach ($dir in $searchDirs) {
        $hit = Get-ChildItem -Path $dir -File -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -match $p.Match } |
            Sort-Object LastWriteTime -Descending | Select-Object -First 1
        if ($hit) { break }
    }
    if ($hit) {
        Write-Ok "$($p.Name) -> $($hit.Name)"
        $found += [PSCustomObject]@{ Pattern = $p; File = $hit }
    } else {
        Write-Miss "$($p.Name) (no se encontro - descargalo desde la seccion Recursos de la guia y vuelve a correr el script)"
    }
}

if ($found.Count -eq 0) {
    Write-Host "`nNo se encontro ninguno de los archivos esperados en Descargas ni Escritorio." -ForegroundColor Red
    Write-Host "Descarga lo que falte desde la seccion Recursos de la guia y vuelve a correr este script." -ForegroundColor Red
    exit 1
}

# ----- Paso 3: copiar (y extraer los .zip que se puedan) -----
Write-Step 3 "Copiando $($found.Count) archivo(s) a C:\ZTE"
foreach ($item in $found) {
    $dest = $item.Pattern.Dest
    $file = $item.File
    Copy-Item -Path $file.FullName -Destination $dest -Force

    if ($item.Pattern.Extract -and $file.Extension -eq '.zip') {
        try {
            Expand-Archive -Path $file.FullName -DestinationPath $dest -Force
            Write-Ok "$($file.Name) copiado y extraido en $dest"
        } catch {
            Write-Miss "$($file.Name) copiado, pero no se pudo auto-extraer -- hazle doble clic en $dest"
        }
    } elseif ($file.Extension -in '.7z', '.rar') {
        Write-Ok "$($file.Name) copiado a $dest -- hazle doble clic ahi para descomprimirlo (necesitas 7-Zip o WinRAR instalado)"
    } else {
        Write-Ok "$($file.Name) copiado a $dest"
    }
}

# ----- Paso 4: abrir las carpetas que vas a usar primero -----
Write-Step 4 'Abriendo las carpetas que vas a necesitar ahora'
Start-Process explorer.exe $folders.Toolbox
Start-Process explorer.exe $folders.Firmware

Write-Host "`n=== Listo. C:\ZTE quedo organizado: ===" -ForegroundColor Magenta
Write-Host "  C:\ZTE\Tools     - platform-tools, driver Qualcomm, payload-dumper-go"
Write-Host "  C:\ZTE\Toolbox   - ZTE Family Toolbox (descomprimelo aqui mismo si quedo en .7z/.rar)"
Write-Host "  C:\ZTE\Firmware  - el update.zip del firmware viejo (Fase 04)"
Write-Host "  C:\ZTE\OldAbl    - aqui vas a guardar abl.img cuando lo extraigas con payload-dumper-go"
Write-Host "  C:\ZTE\Magisk    - el APK de Magisk y las imagenes parcheadas"
Write-Host "`nSigue la guia desde la Fase 01 con esta carpeta ya organizada." -ForegroundColor Cyan
