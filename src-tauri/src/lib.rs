use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{
    collections::HashSet,
    fs,
    path::{Path, PathBuf},
    process::Command,
    sync::Mutex,
};
use tauri::{Emitter, Manager};

const FAVORITES_FILE_NAME: &str = "favorites.json";
const DEFAULT_SHORTCUT_LIBRARY_JSON: &str =
    include_str!("../../src/data/defaultShortcutLibrary.json");

#[derive(Debug, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct FavoritesStore {
    favorite_shortcut_ids: Vec<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct Keybind {
    id: String,
    action: String,
    keys: String,
    category: String,
    mode: String,
    description: String,
    tags: Vec<String>,
    beginner_priority: u8,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
struct ShortcutFilters {
    categories: Vec<String>,
    modes: Vec<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
struct ShortcutLibrary {
    version: u32,
    filters: ShortcutFilters,
    shortcuts: Vec<Keybind>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ShortcutLibraryResponse {
    library: ShortcutLibrary,
    path: String,
    error: Option<String>,
}

#[derive(Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
struct AddonStatus {
    blender_addon_installed: bool,
    blender_profiles: Vec<String>,
    blender_addon_library_path: String,
    blender_addon_zip_path: String,
    widget_installed: bool,
}

#[derive(Default)]
struct WatcherState(Mutex<Option<RecommendedWatcher>>);

fn blendkeys_data_dir() -> Result<PathBuf, String> {
    let app_data = std::env::var_os("APPDATA")
        .map(PathBuf::from)
        .ok_or_else(|| "APPDATA is not available on this Windows profile.".to_string())?;
    Ok(app_data.join("BlendKeys"))
}

fn favorites_path() -> Result<PathBuf, String> {
    Ok(blendkeys_data_dir()?.join(FAVORITES_FILE_NAME))
}

fn shortcut_library_dir() -> Result<PathBuf, String> {
    Ok(blendkeys_data_dir()?.join("library"))
}

fn shortcut_library_path() -> Result<PathBuf, String> {
    Ok(shortcut_library_dir()?.join("shortcuts.json"))
}

fn normalize_ids(ids: Vec<String>) -> Vec<String> {
    let mut seen = HashSet::new();
    ids.into_iter()
        .map(|id| id.trim().to_string())
        .filter(|id| !id.is_empty())
        .filter(|id| seen.insert(id.clone()))
        .collect()
}

fn read_store() -> Result<FavoritesStore, String> {
    let path = favorites_path()?;
    if !path.exists() {
        return Ok(FavoritesStore::default());
    }

    let content = fs::read_to_string(&path)
        .map_err(|error| format!("Unable to read {}: {error}", path.display()))?;
    serde_json::from_str(content.trim_start_matches('\u{feff}'))
        .map_err(|error| format!("Unable to parse {}: {error}", path.display()))
}

fn write_store(store: &FavoritesStore) -> Result<(), String> {
    let directory = blendkeys_data_dir()?;
    fs::create_dir_all(&directory)
        .map_err(|error| format!("Unable to create {}: {error}", directory.display()))?;

    let path = directory.join(FAVORITES_FILE_NAME);
    let content = serde_json::to_string_pretty(store)
        .map_err(|error| format!("Unable to serialize favorites: {error}"))?;
    fs::write(&path, content)
        .map_err(|error| format!("Unable to write {}: {error}", path.display()))
}

fn default_shortcut_library() -> ShortcutLibrary {
    parse_shortcut_library(DEFAULT_SHORTCUT_LIBRARY_JSON).unwrap_or_else(|error| {
        panic!("Bundled default shortcut library is invalid: {error}");
    })
}

fn string_array(value: Option<&Value>) -> Vec<String> {
    value
        .and_then(Value::as_array)
        .map(|items| {
            items
                .iter()
                .filter_map(Value::as_str)
                .map(str::trim)
                .filter(|item| !item.is_empty())
                .map(ToString::to_string)
                .collect()
        })
        .unwrap_or_default()
}

fn value_string(object: &serde_json::Map<String, Value>, key: &str) -> Option<String> {
    object
        .get(key)
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(ToString::to_string)
}

fn parse_shortcut_library(content: &str) -> Result<ShortcutLibrary, String> {
    let normalized_content = content.trim_start_matches('\u{feff}');
    let value: Value = serde_json::from_str(normalized_content)
        .map_err(|error| format!("Invalid shortcut library JSON: {error}"))?;
    let object = value
        .as_object()
        .ok_or_else(|| "Shortcut library must be a JSON object.".to_string())?;
    let version = object.get("version").and_then(Value::as_u64).unwrap_or(1) as u32;

    let filter_object = object.get("filters").and_then(Value::as_object);
    let mut filters = ShortcutFilters {
        categories: string_array(filter_object.and_then(|filters| filters.get("categories"))),
        modes: string_array(filter_object.and_then(|filters| filters.get("modes"))),
    };

    let raw_shortcuts = object
        .get("shortcuts")
        .and_then(Value::as_array)
        .ok_or_else(|| "Shortcut library must contain a shortcuts array.".to_string())?;
    let mut seen = HashSet::new();
    let mut shortcuts = Vec::new();

    for item in raw_shortcuts {
        let Some(shortcut) = item.as_object() else {
            continue;
        };
        let Some(id) = value_string(shortcut, "id") else {
            continue;
        };
        if !seen.insert(id.clone()) {
            continue;
        }
        let Some(action) = value_string(shortcut, "action") else {
            continue;
        };
        let Some(keys) = value_string(shortcut, "keys") else {
            continue;
        };
        let Some(category) = value_string(shortcut, "category") else {
            continue;
        };
        let Some(mode) = value_string(shortcut, "mode") else {
            continue;
        };
        let Some(description) = value_string(shortcut, "description") else {
            continue;
        };
        let tags = string_array(shortcut.get("tags"));
        let beginner_priority = shortcut
            .get("beginnerPriority")
            .and_then(Value::as_u64)
            .unwrap_or(3)
            .clamp(1, 5) as u8;

        shortcuts.push(Keybind {
            id,
            action,
            keys,
            category,
            mode,
            description,
            tags,
            beginner_priority,
        });
    }

    if shortcuts.is_empty() {
        return Err("Shortcut library does not contain any valid shortcuts.".to_string());
    }

    if filters.categories.is_empty() {
        filters.categories =
            unique_strings(shortcuts.iter().map(|shortcut| shortcut.category.clone()));
    }
    if filters.modes.is_empty() {
        filters.modes = unique_strings(shortcuts.iter().map(|shortcut| shortcut.mode.clone()));
    }

    Ok(ShortcutLibrary {
        version,
        filters,
        shortcuts,
    })
}

fn unique_strings(values: impl Iterator<Item = String>) -> Vec<String> {
    let mut seen = HashSet::new();
    values
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .filter(|value| seen.insert(value.clone()))
        .collect()
}

fn write_default_shortcut_library() -> Result<(), String> {
    let directory = shortcut_library_dir()?;
    fs::create_dir_all(&directory)
        .map_err(|error| format!("Unable to create {}: {error}", directory.display()))?;
    let path = directory.join("shortcuts.json");
    fs::write(&path, DEFAULT_SHORTCUT_LIBRARY_JSON)
        .map_err(|error| format!("Unable to write {}: {error}", path.display()))
}

fn write_shortcut_library(library: &ShortcutLibrary) -> Result<(), String> {
    let directory = shortcut_library_dir()?;
    fs::create_dir_all(&directory)
        .map_err(|error| format!("Unable to create {}: {error}", directory.display()))?;
    let path = directory.join("shortcuts.json");
    let temp_path = directory.join("shortcuts.json.tmp");
    let content = serde_json::to_string_pretty(library)
        .map_err(|error| format!("Unable to serialize shortcut library: {error}"))?;
    fs::write(&temp_path, format!("{content}\n"))
        .map_err(|error| format!("Unable to write {}: {error}", temp_path.display()))?;
    if path.exists() {
        fs::remove_file(&path)
            .map_err(|error| format!("Unable to replace {}: {error}", path.display()))?;
    }
    fs::rename(&temp_path, &path).map_err(|error| {
        format!(
            "Unable to move {} to {}: {error}",
            temp_path.display(),
            path.display()
        )
    })
}

fn seed_shortcut_library_if_missing() -> Result<(), String> {
    let path = shortcut_library_path()?;
    if path.exists() {
        return Ok(());
    }
    write_default_shortcut_library()
}

fn read_shortcut_library_from_disk() -> Result<ShortcutLibraryResponse, String> {
    seed_shortcut_library_if_missing()?;
    let path = shortcut_library_path()?;
    let content = fs::read_to_string(&path)
        .map_err(|error| format!("Unable to read {}: {error}", path.display()))?;

    match parse_shortcut_library(&content) {
        Ok(library) => Ok(ShortcutLibraryResponse {
            library,
            path: path.display().to_string(),
            error: None,
        }),
        Err(error) => Ok(ShortcutLibraryResponse {
            library: default_shortcut_library(),
            path: path.display().to_string(),
            error: Some(error),
        }),
    }
}

fn validate_shortcut_library(library: &ShortcutLibrary) -> Result<ShortcutLibrary, String> {
    if library.shortcuts.is_empty() {
        return Err("Add at least one shortcut before saving.".to_string());
    }

    let mut seen = HashSet::new();
    let mut shortcuts = Vec::new();
    for shortcut in &library.shortcuts {
        let id = shortcut.id.trim();
        if id.is_empty() {
            return Err("Every shortcut needs an id.".to_string());
        }
        if !id.chars().all(|character| {
            character.is_ascii_lowercase() || character.is_ascii_digit() || character == '-'
        }) {
            return Err(format!(
                "Shortcut id \"{id}\" must use lowercase letters, numbers, and hyphens only."
            ));
        }
        if !seen.insert(id.to_string()) {
            return Err(format!("Shortcut id \"{id}\" is already used."));
        }
        if shortcut.action.trim().is_empty()
            || shortcut.keys.trim().is_empty()
            || shortcut.category.trim().is_empty()
            || shortcut.mode.trim().is_empty()
            || shortcut.description.trim().is_empty()
        {
            return Err(format!(
                "Shortcut \"{id}\" is missing an action, keys, category, mode, or description."
            ));
        }

        shortcuts.push(Keybind {
            id: id.to_string(),
            action: shortcut.action.trim().to_string(),
            keys: shortcut.keys.trim().to_string(),
            category: shortcut.category.trim().to_string(),
            mode: shortcut.mode.trim().to_string(),
            description: shortcut.description.trim().to_string(),
            tags: unique_strings(shortcut.tags.iter().map(|tag| tag.trim().to_string())),
            beginner_priority: shortcut.beginner_priority.clamp(1, 5),
        });
    }

    let categories = unique_strings(
        library
            .filters
            .categories
            .iter()
            .map(|category| category.trim().to_string())
            .chain(shortcuts.iter().map(|shortcut| shortcut.category.clone())),
    );
    let modes = unique_strings(
        library
            .filters
            .modes
            .iter()
            .map(|mode| mode.trim().to_string())
            .chain(shortcuts.iter().map(|shortcut| shortcut.mode.clone())),
    );

    Ok(ShortcutLibrary {
        version: library.version.max(1),
        filters: ShortcutFilters { categories, modes },
        shortcuts,
    })
}

fn start_file_watcher(app: tauri::AppHandle) -> Result<RecommendedWatcher, String> {
    seed_shortcut_library_if_missing()?;
    fs::create_dir_all(blendkeys_data_dir()?)
        .map_err(|error| format!("Unable to create BlendKeys app data folder: {error}"))?;
    let data_dir = blendkeys_data_dir()?;
    let favorites = favorites_path()?;
    let library = shortcut_library_path()?;

    let mut watcher = RecommendedWatcher::new(
        move |result: notify::Result<notify::Event>| {
            let Ok(event) = result else {
                return;
            };
            let paths = event.paths;
            if paths.iter().any(|path| path == &favorites) {
                let _ = app.emit("favorites-changed", ());
            }
            if paths.iter().any(|path| path == &library) {
                let _ = app.emit("shortcut-library-changed", ());
            }
        },
        Config::default(),
    )
    .map_err(|error| format!("Unable to start file watcher: {error}"))?;

    watcher
        .watch(&data_dir, RecursiveMode::Recursive)
        .map_err(|error| format!("Unable to watch {}: {error}", data_dir.display()))?;
    Ok(watcher)
}

fn documents_dir() -> Result<PathBuf, String> {
    std::env::var_os("USERPROFILE")
        .map(PathBuf::from)
        .map(|path| path.join("Documents"))
        .ok_or_else(|| "USERPROFILE is not available on this Windows profile.".to_string())
}

fn local_app_data_dir() -> Result<PathBuf, String> {
    std::env::var_os("LOCALAPPDATA")
        .map(PathBuf::from)
        .ok_or_else(|| "LOCALAPPDATA is not available on this Windows profile.".to_string())
}

fn blender_profiles_root() -> Result<PathBuf, String> {
    let app_data = std::env::var_os("APPDATA")
        .map(PathBuf::from)
        .ok_or_else(|| "APPDATA is not available on this Windows profile.".to_string())?;
    Ok(app_data.join("Blender Foundation").join("Blender"))
}

fn blender_addon_library_dir() -> Result<PathBuf, String> {
    Ok(documents_dir()?.join("BlendKeys").join("Addons"))
}

fn blender_addon_zip_path() -> Result<PathBuf, String> {
    Ok(blender_addon_library_dir()?.join("BlendKeys-Blender-Addon.zip"))
}

fn blender_profile_dirs() -> Result<Vec<PathBuf>, String> {
    let root = blender_profiles_root()?;
    if !root.exists() {
        return Ok(Vec::new());
    }

    let mut profiles = Vec::new();
    for entry in fs::read_dir(&root)
        .map_err(|error| format!("Unable to read {}: {error}", root.display()))?
    {
        let entry =
            entry.map_err(|error| format!("Unable to read Blender profile entry: {error}"))?;
        let path = entry.path();
        if path.is_dir() {
            profiles.push(path);
        }
    }
    profiles.sort();
    Ok(profiles)
}

fn blender_addon_target(profile: &Path) -> PathBuf {
    profile
        .join("scripts")
        .join("addons")
        .join("blendkeys_favorites")
}

fn copy_directory(source: &Path, destination: &Path) -> Result<(), String> {
    if destination.exists() {
        fs::remove_dir_all(destination)
            .map_err(|error| format!("Unable to replace {}: {error}", destination.display()))?;
    }

    fs::create_dir_all(destination)
        .map_err(|error| format!("Unable to create {}: {error}", destination.display()))?;

    for entry in fs::read_dir(source)
        .map_err(|error| format!("Unable to read {}: {error}", source.display()))?
    {
        let entry = entry.map_err(|error| format!("Unable to read add-on file: {error}"))?;
        let source_path = entry.path();
        let destination_path = destination.join(entry.file_name());
        if source_path.is_dir() {
            copy_directory(&source_path, &destination_path)?;
        } else {
            fs::copy(&source_path, &destination_path).map_err(|error| {
                format!(
                    "Unable to copy {} to {}: {error}",
                    source_path.display(),
                    destination_path.display()
                )
            })?;
        }
    }

    Ok(())
}

fn project_root_candidate() -> Option<PathBuf> {
    let current_dir = std::env::current_dir().ok()?;
    if current_dir.join("blender-addon").exists() {
        return Some(current_dir);
    }
    current_dir
        .ancestors()
        .find(|path| path.join("blender-addon").exists())
        .map(Path::to_path_buf)
}

fn addon_source_dir() -> Result<PathBuf, String> {
    let installed = local_app_data_dir()?
        .join("BlendKeysSuite")
        .join("Extras")
        .join("blendkeys_favorites");
    if installed.exists() {
        return Ok(installed);
    }

    if let Some(root) = project_root_candidate() {
        let source = root.join("blender-addon").join("blendkeys_favorites");
        if source.exists() {
            return Ok(source);
        }
    }

    Err("BlendKeys Blender add-on source folder was not found. Run the full installer with Blender add-on files selected.".to_string())
}

fn addon_zip_source() -> Result<PathBuf, String> {
    let installed = local_app_data_dir()?
        .join("BlendKeysSuite")
        .join("Extras")
        .join("BlendKeys-Blender-Addon.zip");
    if installed.exists() {
        return Ok(installed);
    }

    if let Some(root) = project_root_candidate() {
        let source = root.join("release").join("BlendKeys-Blender-Addon.zip");
        if source.exists() {
            return Ok(source);
        }
    }

    Err("BlendKeys Blender add-on zip was not found. Run the full installer with Blender add-on files selected.".to_string())
}

fn widget_script_path() -> Result<PathBuf, String> {
    let installed = local_app_data_dir()?
        .join("BlendKeysSuite")
        .join("Extras")
        .join("install-widget.ps1");
    if installed.exists() {
        return Ok(installed);
    }

    if let Some(root) = project_root_candidate() {
        let source = root.join("installer").join("install-widget.ps1");
        if source.exists() {
            return Ok(source);
        }
    }

    Err("BlendKeys widget installer script was not found. Run the full installer with Windows Widgets board add-on selected.".to_string())
}

fn run_powershell(args: &[&str]) -> Result<String, String> {
    let output = Command::new("powershell.exe")
        .args(["-NoProfile", "-ExecutionPolicy", "Bypass"])
        .args(args)
        .output()
        .map_err(|error| format!("Unable to start PowerShell: {error}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout);
        return Err(format!("PowerShell failed: {stderr}{stdout}"));
    }

    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

fn widget_is_installed() -> bool {
    run_powershell(&[
        "-Command",
        "if (Get-AppxPackage BlendKeys.WidgetProvider) { 'true' } else { 'false' }",
    ])
    .map(|value| value.eq_ignore_ascii_case("true"))
    .unwrap_or(false)
}

fn open_in_explorer(path: &Path) -> Result<(), String> {
    Command::new("explorer.exe")
        .arg(path)
        .spawn()
        .map_err(|error| format!("Unable to open {}: {error}", path.display()))?;
    Ok(())
}

fn open_in_notepad(path: &Path) -> Result<(), String> {
    Command::new("notepad.exe")
        .arg(path)
        .spawn()
        .map_err(|error| format!("Unable to open {}: {error}", path.display()))?;
    Ok(())
}

#[tauri::command]
fn read_favorites() -> Result<Vec<String>, String> {
    Ok(read_store()?.favorite_shortcut_ids)
}

#[tauri::command]
fn add_favorite(shortcut_id: String) -> Result<Vec<String>, String> {
    let mut store = read_store()?;
    store.favorite_shortcut_ids = normalize_ids(
        std::iter::once(shortcut_id)
            .chain(store.favorite_shortcut_ids)
            .collect(),
    );
    write_store(&store)?;
    Ok(store.favorite_shortcut_ids)
}

#[tauri::command]
fn remove_favorite(shortcut_id: String) -> Result<Vec<String>, String> {
    let mut store = read_store()?;
    store
        .favorite_shortcut_ids
        .retain(|favorite_id| favorite_id != &shortcut_id);
    write_store(&store)?;
    Ok(store.favorite_shortcut_ids)
}

#[tauri::command]
fn migrate_favorites(local_favorite_ids: Vec<String>) -> Result<Vec<String>, String> {
    let mut store = read_store()?;
    store.favorite_shortcut_ids = normalize_ids(
        store
            .favorite_shortcut_ids
            .into_iter()
            .chain(local_favorite_ids)
            .collect(),
    );
    write_store(&store)?;
    Ok(store.favorite_shortcut_ids)
}

#[tauri::command]
fn read_shortcut_library() -> Result<ShortcutLibraryResponse, String> {
    read_shortcut_library_from_disk()
}

#[tauri::command]
fn open_shortcut_library_file() -> Result<ShortcutLibraryResponse, String> {
    seed_shortcut_library_if_missing()?;
    open_in_notepad(&shortcut_library_path()?)?;
    read_shortcut_library_from_disk()
}

#[tauri::command]
fn open_shortcut_library_folder() -> Result<ShortcutLibraryResponse, String> {
    seed_shortcut_library_if_missing()?;
    open_in_explorer(&shortcut_library_dir()?)?;
    read_shortcut_library_from_disk()
}

#[tauri::command]
fn restore_default_shortcut_library() -> Result<ShortcutLibraryResponse, String> {
    write_default_shortcut_library()?;
    read_shortcut_library_from_disk()
}

#[tauri::command]
fn save_shortcut_library(library: ShortcutLibrary) -> Result<ShortcutLibraryResponse, String> {
    let validated = validate_shortcut_library(&library)?;
    write_shortcut_library(&validated)?;
    read_shortcut_library_from_disk()
}

#[tauri::command]
fn get_addon_status() -> Result<AddonStatus, String> {
    let profiles = blender_profile_dirs()?;
    let installed = profiles
        .iter()
        .any(|profile| blender_addon_target(profile).join("__init__.py").exists());
    let library_dir = blender_addon_library_dir()?;
    let zip_path = blender_addon_zip_path()?;

    Ok(AddonStatus {
        blender_addon_installed: installed,
        blender_profiles: profiles
            .iter()
            .map(|path| path.display().to_string())
            .collect(),
        blender_addon_library_path: library_dir.display().to_string(),
        blender_addon_zip_path: zip_path.display().to_string(),
        widget_installed: widget_is_installed(),
    })
}

#[tauri::command]
fn open_blender_addon_folder() -> Result<AddonStatus, String> {
    let path = blender_addon_library_dir()?;
    fs::create_dir_all(&path)
        .map_err(|error| format!("Unable to create {}: {error}", path.display()))?;
    open_in_explorer(&path)?;
    get_addon_status()
}

#[tauri::command]
fn install_blender_addon() -> Result<AddonStatus, String> {
    let library_dir = blender_addon_library_dir()?;
    fs::create_dir_all(&library_dir)
        .map_err(|error| format!("Unable to create {}: {error}", library_dir.display()))?;
    fs::copy(addon_zip_source()?, blender_addon_zip_path()?)
        .map_err(|error| format!("Unable to copy Blender add-on zip: {error}"))?;

    let source = addon_source_dir()?;
    for profile in blender_profile_dirs()? {
        let target = blender_addon_target(&profile);
        fs::create_dir_all(target.parent().unwrap_or(&profile))
            .map_err(|error| format!("Unable to create Blender add-ons folder: {error}"))?;
        copy_directory(&source, &target)?;
    }

    get_addon_status()
}

#[tauri::command]
fn uninstall_blender_addon() -> Result<AddonStatus, String> {
    for profile in blender_profile_dirs()? {
        let target = blender_addon_target(&profile);
        if target.exists() {
            fs::remove_dir_all(&target)
                .map_err(|error| format!("Unable to remove {}: {error}", target.display()))?;
        }
    }
    let zip_path = blender_addon_zip_path()?;
    if zip_path.exists() {
        fs::remove_file(&zip_path)
            .map_err(|error| format!("Unable to remove {}: {error}", zip_path.display()))?;
    }
    get_addon_status()
}

#[tauri::command]
fn install_widget_provider() -> Result<AddonStatus, String> {
    let script = widget_script_path()?;
    let script_arg = script.display().to_string();
    run_powershell(&["-File", &script_arg])?;
    get_addon_status()
}

#[tauri::command]
fn uninstall_widget_provider() -> Result<AddonStatus, String> {
    run_powershell(&[
        "-Command",
        "Get-AppxPackage BlendKeys.WidgetProvider | Remove-AppxPackage",
    ])?;
    get_addon_status()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(WatcherState::default())
        .setup(|app| {
            #[cfg(desktop)]
            app.handle()
                .plugin(tauri_plugin_updater::Builder::new().build())?;
            let watcher = start_file_watcher(app.handle().clone())?;
            let state = app.state::<WatcherState>();
            *state
                .0
                .lock()
                .map_err(|_| "Unable to store file watcher.".to_string())? = Some(watcher);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            add_favorite,
            get_addon_status,
            install_blender_addon,
            install_widget_provider,
            migrate_favorites,
            open_blender_addon_folder,
            open_shortcut_library_file,
            open_shortcut_library_folder,
            read_favorites,
            read_shortcut_library,
            remove_favorite,
            restore_default_shortcut_library,
            save_shortcut_library,
            uninstall_blender_addon,
            uninstall_widget_provider
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
