$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$zipPath = Join-Path $root "BlendKeys-Blender-Addon.zip"
$addonSource = Join-Path $root "blendkeys_favorites"
$addonLibrary = Join-Path ([Environment]::GetFolderPath("MyDocuments")) "BlendKeys\Addons"

if (-not (Test-Path $zipPath)) {
  throw "BlendKeys Blender add-on zip not found: $zipPath"
}

New-Item -ItemType Directory -Path $addonLibrary -Force | Out-Null
Copy-Item -LiteralPath $zipPath -Destination (Join-Path $addonLibrary "BlendKeys-Blender-Addon.zip") -Force

$blenderRoot = Join-Path $env:APPDATA "Blender Foundation\Blender"
if ((Test-Path $addonSource) -and (Test-Path $blenderRoot)) {
  Get-ChildItem -Path $blenderRoot -Directory | ForEach-Object {
    $target = Join-Path $_.FullName "scripts\addons\blendkeys_favorites"
    New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
    if (Test-Path $target) {
      Remove-Item -LiteralPath $target -Recurse -Force
    }
    Copy-Item -LiteralPath $addonSource -Destination $target -Recurse -Force
  }
}

Write-Host "BlendKeys Blender add-on copied to: $addonLibrary"
Write-Host "In Blender, enable it from Edit > Preferences > Add-ons > BlendKeys Favorites."
