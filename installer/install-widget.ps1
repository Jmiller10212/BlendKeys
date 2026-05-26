$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$certPath = Join-Path $root "BlendKeysLocalSigning.cer"
$appPackagesRoot = Join-Path $root "WidgetProvider\AppPackages"

if (-not (Test-Path $certPath)) {
  throw "Signing certificate not found: $certPath"
}

if (-not (Test-Path $appPackagesRoot)) {
  throw "Widget package folder not found: $appPackagesRoot"
}

$packageRoot = Get-ChildItem -Path $appPackagesRoot -Directory -Filter "BlendKeysWidgetProvider_*_x64_Debug_Test" |
  Sort-Object Name -Descending |
  Select-Object -First 1

if (-not $packageRoot) {
  throw "Widget package folder not found under: $appPackagesRoot"
}

$msixPath = Get-ChildItem -Path $packageRoot.FullName -Filter "BlendKeysWidgetProvider_*_x64_Debug.msix" |
  Sort-Object Name -Descending |
  Select-Object -First 1

if (-not $msixPath) {
  throw "Widget MSIX not found under: $($packageRoot.FullName)"
}

$dependencyPath = Join-Path $packageRoot.FullName "Dependencies\x64\Microsoft.WindowsAppRuntime.1.7.msix"

Import-Certificate -FilePath $certPath -CertStoreLocation "Cert:\CurrentUser\Root" | Out-Null
Import-Certificate -FilePath $certPath -CertStoreLocation "Cert:\CurrentUser\TrustedPeople" | Out-Null

if (Test-Path $dependencyPath) {
  Add-AppxPackage -Path $msixPath.FullName -DependencyPath $dependencyPath -ForceApplicationShutdown -ForceUpdateFromAnyVersion
} else {
  Add-AppxPackage -Path $msixPath.FullName -ForceApplicationShutdown -ForceUpdateFromAnyVersion
}

Get-Process WidgetBoard,WidgetService -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "BlendKeys widget provider installed. Open Win + W, then add BlendKeys Favorites."
