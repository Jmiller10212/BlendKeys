# BlendKeys Windows Widget Provider

This folder contains the companion Windows App SDK widget-provider project for showing BlendKeys favorites in the Windows Widgets board.

## Shared Data

BlendKeys writes favorites to:

```text
%APPDATA%\BlendKeys\favorites.json
```

The widget provider reads that file and maps favorite ids through:

```text
BlendKeysWidgetProvider\Data\shortcuts.json
```

## Build Requirements

Real Windows Widgets board providers are packaged Windows apps. To build/deploy this project as a real widget provider, install:

- Visual Studio with Windows application development tools
- Windows App SDK tooling
- MSIX packaging tools
- A trusted local signing certificate for sideloading

The current machine has the .NET SDK, but the MSIX/PRI packaging tasks are not installed on PATH, so `dotnet build` can compile the provider source before failing at Windows App SDK packaging.

## Intended Deployment Flow

```powershell
dotnet restore .\BlendKeysWidgetProvider\BlendKeysWidgetProvider.csproj
dotnet build .\BlendKeysWidgetProvider\BlendKeysWidgetProvider.csproj -p:Platform=x64
```

Then package/sign/deploy the MSIX from Visual Studio or MSBuild with the Windows packaging workload installed. After deployment, open `Win + W`, add the `BlendKeys Favorites` widget, and pin it.

## Current Provider Shape

- Reads `%APPDATA%\BlendKeys\favorites.json`
- Renders favorite shortcut keys and actions as Adaptive Card JSON
- Supports size-dependent limits:
  - small: 3 favorites
  - medium: 6 favorites
  - large: 10 favorites
- Uses `blendkeys://...` links as the intended app launch/deep-link target
