# BlendKeys

BlendKeys is a Windows desktop companion app for learning Blender shortcuts. It ships an offline Blender 4.x shortcut reference, searchable keybind browser, beginner cheatsheets, a compact glossary, and signed in-app updates.

Favorites are stored in a shared Windows app-data file so companion surfaces can read them:

```text
%APPDATA%\BlendKeys\favorites.json
```

The editable shortcut library is also stored in app data:

```text
%APPDATA%\BlendKeys\library\shortcuts.json
```

BlendKeys seeds this file on first launch. You can edit it directly, then use `Add-ons > Shortcut data file > Reload shortcut library` to update the app without rebuilding or reinstalling. New categories and modes added to that JSON show up as filters automatically.

## Run Locally

```powershell
npm install
npm run tauri dev
```

## Build

```powershell
npm run build
npm run tauri build
```

The Windows app executable is produced at:

```text
src-tauri\target\release\blendkeys.exe
```

The NSIS installer is produced at:

```text
src-tauri\target\release\bundle\nsis\BlendKeys_0.1.0_x64-setup.exe
```

The full suite installer is:

```text
release\BlendKeys-Full-Installer.exe
```

## Updates

BlendKeys uses the Tauri updater plugin and checks GitHub Releases at:

```text
https://github.com/Jmiller10212/BlendKeys/releases/latest/download/latest.json
```

The updater signing key is stored outside the repo at:

```text
%USERPROFILE%\.tauri\blendkeys-updater.key
```

Keep that private key backed up and never commit it. Future update builds must be signed with the same key.

To create local updater files after a signed Tauri build:

```powershell
npm run tauri build
.\scripts\sign-update.ps1
```

Publish these files from `release\updater\` to a GitHub release tag matching the version, such as `v0.1.1`:

```text
BlendKeys_0.1.1_x64-setup.exe
BlendKeys_0.1.1_x64-setup.exe.sig
latest.json
```

It always installs the BlendKeys desktop app. On the components page, optional add-ons can also be selected:

- `Blender add-on files`: copies the add-on zip to `Documents\BlendKeys\Addons` and installs the add-on folder into detected Blender profile folders.
- `Windows Widgets board add-on`: installs the MSIX widget provider for the Windows Widgets board.

The installer also stages the add-on support files locally, so either optional add-on can be installed or uninstalled later from the app's `Add-ons` tab.

## Windows Widget Provider

The `widget-provider\` folder contains the Windows App SDK companion provider for a real Windows Widgets board widget. It reads the same shared favorites file and renders favorite shortcuts as Adaptive Card data.

Building/deploying the widget provider requires Visual Studio Windows application development tooling and MSIX packaging tools.

## Blender Add-on

The `blender-addon\blendkeys_favorites\` folder contains a Blender add-on that reads the same shared favorites file and shows those shortcuts inside Blender.

Installable zip staged inside the suite installer resources:

```text
installer\resources\BlendKeys-Blender-Addon.zip
```

In Blender, install it from `Edit > Preferences > Add-ons > Install...`, then choose the zip and enable `BlendKeys Favorites`.

Once enabled:

- Press `Ctrl + Alt + F` to open the favorites popup.
- Click `BlendKeys` in the 3D Viewport header.
- Use the `BlendKeys` tab in the 3D Viewport sidebar.
- Use `View > BlendKeys Favorites`.

The BlendKeys desktop app also has an `Add-ons` tab. From there you can:

- Install, reinstall, or uninstall the Blender add-on.
- Open the local add-on zip folder.
- Install, reinstall, or uninstall the Windows Widgets board provider.
- Refresh add-on status after installing or removing components.
