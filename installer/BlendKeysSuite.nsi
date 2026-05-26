Unicode true
ManifestDPIAware true

!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "FileFunc.nsh"

Name "BlendKeys"
OutFile "..\release\BlendKeys-Full-Installer.exe"
InstallDir "$LOCALAPPDATA\BlendKeysSuite"
InstallDirRegKey HKCU "Software\BlendKeys" "SuiteInstallDir"
RequestExecutionLevel user
Icon "..\src-tauri\icons\icon.ico"

!define MUI_ABORTWARNING
!define MUI_ICON "..\src-tauri\icons\icon.ico"
!define MUI_UNICON "..\src-tauri\icons\icon.ico"
!define MUI_WELCOMEPAGE_TITLE "Install BlendKeys"
!define MUI_WELCOMEPAGE_TEXT "This installer installs the BlendKeys desktop app first. You can also install optional add-ons for Blender and the Windows Widgets board."

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_LANGUAGE "English"

Section "BlendKeys desktop app (required)" SEC_APP
  SectionIn RO
  SetOutPath "$INSTDIR"
  File "resources\BlendKeys-setup.exe"
  DetailPrint "Installing BlendKeys desktop app..."
  ExecWait '"$INSTDIR\BlendKeys-setup.exe" /S' $0
  WriteRegStr HKCU "Software\BlendKeys" "SuiteInstallDir" "$INSTDIR"
SectionEnd

Section -SupportFiles
  SetOutPath "$INSTDIR\Extras"
  File "resources\BlendKeys-Blender-Addon.zip"
  File "certs\BlendKeysLocalSigning.cer"
  File "install-blender-addon.ps1"
  File "install-widget.ps1"
  SetOutPath "$INSTDIR\Extras\blendkeys_favorites"
  File "..\blender-addon\blendkeys_favorites\__init__.py"
  File "..\blender-addon\blendkeys_favorites\shortcuts.json"
  SetOutPath "$INSTDIR\Extras\WidgetProvider\AppPackages"
  File /r "..\widget-provider\BlendKeysWidgetProvider\bin\x64\Debug\net8.0-windows10.0.22621.0\AppPackages\BlendKeysWidgetProvider_0.1.6.0_x64_Debug_Test"
SectionEnd

Section /o "Blender add-on files" SEC_BLENDER
  DetailPrint "Installing BlendKeys Blender add-on files..."
  ExecWait 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\Extras\install-blender-addon.ps1"' $0
SectionEnd

Section /o "Windows Widgets board add-on" SEC_WIDGET
  DetailPrint "Installing BlendKeys Windows widget provider..."
  ExecWait 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\Extras\install-widget.ps1"' $0
SectionEnd

Section -Post
  WriteUninstaller "$INSTDIR\Uninstall BlendKeys Extras.exe"
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\BlendKeys-setup.exe"
  Delete "$INSTDIR\Extras\BlendKeys-Blender-Addon.zip"
  Delete "$INSTDIR\Extras\BlendKeysLocalSigning.cer"
  Delete "$INSTDIR\Extras\install-widget.ps1"
  Delete "$INSTDIR\Extras\install-blender-addon.ps1"
  RMDir /r "$INSTDIR\Extras\WidgetProvider"
  RMDir /r "$INSTDIR\Extras\blendkeys_favorites"
  RMDir "$INSTDIR\Extras"
  Delete "$INSTDIR\Uninstall BlendKeys Extras.exe"
  RMDir "$INSTDIR"
  DeleteRegKey HKCU "Software\BlendKeys"
SectionEnd

LangString DESC_SEC_APP ${LANG_ENGLISH} "Required. Installs the main BlendKeys Windows desktop app."
LangString DESC_SEC_BLENDER ${LANG_ENGLISH} "Copies the BlendKeys Blender add-on zip to Documents\BlendKeys\Addons and installs the add-on folder into detected Blender profile folders."
LangString DESC_SEC_WIDGET ${LANG_ENGLISH} "Installs the real Windows Widgets board provider so you can pin BlendKeys Favorites with Win + W."

!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SEC_APP} $(DESC_SEC_APP)
  !insertmacro MUI_DESCRIPTION_TEXT ${SEC_BLENDER} $(DESC_SEC_BLENDER)
  !insertmacro MUI_DESCRIPTION_TEXT ${SEC_WIDGET} $(DESC_SEC_WIDGET)
!insertmacro MUI_FUNCTION_DESCRIPTION_END
