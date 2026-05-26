param(
  [string]$Version = "",
  [string]$KeyPath = "$env:USERPROFILE\.tauri\blendkeys-updater.key",
  [string]$Password = ""
)

$ErrorActionPreference = "Stop"

if (-not $Version) {
  $config = Get-Content ".\src-tauri\tauri.conf.json" -Raw | ConvertFrom-Json
  $Version = $config.version
}

$setup = Resolve-Path ".\src-tauri\target\release\bundle\nsis\BlendKeys_${Version}_x64-setup.exe"
$signature = "$setup.sig"

if (-not (Test-Path $signature)) {
  npm run tauri signer sign -- -f $KeyPath --password="$Password" $setup
}

npm run release:manifest
