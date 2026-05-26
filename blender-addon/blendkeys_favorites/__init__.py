bl_info = {
    "name": "BlendKeys Favorites",
    "author": "BlendKeys",
    "version": (0, 1, 1),
    "blender": (4, 0, 0),
    "location": "3D Viewport > Header > BlendKeys, Sidebar > BlendKeys",
    "description": "Show favorite Blender shortcuts saved by the BlendKeys desktop app.",
    "category": "3D View",
}

import json
import os
from pathlib import Path

import bpy


ADDON_KEYMAPS = []


def blendkeys_data_dir():
    appdata = os.environ.get("APPDATA")
    if appdata:
        return Path(appdata) / "BlendKeys"
    return Path.home() / "AppData" / "Roaming" / "BlendKeys"


def favorites_path():
    return blendkeys_data_dir() / "favorites.json"


def shared_shortcuts_path():
    return blendkeys_data_dir() / "library" / "shortcuts.json"


def shortcuts_path():
    return Path(__file__).with_name("shortcuts.json")


def read_json_file(path, fallback):
    try:
        with open(path, "r", encoding="utf-8-sig") as file:
            return json.load(file)
    except Exception:
        return fallback


def read_favorite_ids():
    data = read_json_file(favorites_path(), {})
    ids = data.get("favoriteShortcutIds", [])
    if not isinstance(ids, list):
        return []
    return [item for item in ids if isinstance(item, str)]


def read_shortcut_index():
    shortcuts = read_shortcuts_from_path(shared_shortcuts_path())
    if not shortcuts:
        shortcuts = read_shortcuts_from_path(shortcuts_path())

    return {
        shortcut.get("id"): shortcut
        for shortcut in shortcuts
        if isinstance(shortcut, dict) and isinstance(shortcut.get("id"), str)
    }


def read_shortcuts_from_path(path):
    data = read_json_file(path, [])
    if isinstance(data, dict):
        shortcuts = data.get("shortcuts", [])
    else:
        shortcuts = data
    return shortcuts if isinstance(shortcuts, list) else []


def get_favorite_shortcuts():
    shortcut_index = read_shortcut_index()
    favorites = []
    for shortcut_id in read_favorite_ids():
        shortcut = shortcut_index.get(shortcut_id)
        if shortcut:
            favorites.append(shortcut)
        else:
            favorites.append(
                {
                    "id": shortcut_id,
                    "action": shortcut_id,
                    "keys": "Unknown",
                    "category": "Favorite",
                    "mode": "Unknown",
                    "description": "This favorite exists in BlendKeys, but this add-on does not have metadata for it yet.",
                }
            )
    return favorites


def draw_shortcut_rows(layout, favorites):
    if not favorites:
        box = layout.box()
        box.label(text="No BlendKeys favorites yet", icon="INFO")
        box.label(text="Star shortcuts in BlendKeys, then reopen this panel.")
        return

    for shortcut in favorites:
        box = layout.box()
        row = box.row(align=True)
        row.label(text=shortcut.get("keys", "Unknown"), icon="KEYINGSET")
        row.label(text=shortcut.get("action", "Unknown shortcut"))

        meta = box.row(align=True)
        meta.label(text=shortcut.get("category", ""))
        meta.label(text=shortcut.get("mode", ""))

        description = shortcut.get("description")
        if description:
            box.label(text=description)


class BLENDKEYS_OT_show_favorites(bpy.types.Operator):
    bl_idname = "blendkeys.show_favorites"
    bl_label = "BlendKeys Favorites"
    bl_description = "Show favorite shortcuts from the BlendKeys desktop app"
    bl_options = {"REGISTER"}

    def invoke(self, context, event):
        return context.window_manager.invoke_props_dialog(self, width=620)

    def draw(self, context):
        layout = self.layout
        header = layout.row(align=True)
        header.label(text="BlendKeys Favorites", icon="SOLO_ON")
        header.label(text=f"{len(get_favorite_shortcuts())} shortcuts")

        layout.separator()
        draw_shortcut_rows(layout, get_favorite_shortcuts())

        layout.separator()
        layout.label(text=f"Reading: {favorites_path()}")

    def execute(self, context):
        return {"FINISHED"}


class BLENDKEYS_PT_favorites_panel(bpy.types.Panel):
    bl_label = "BlendKeys Favorites"
    bl_idname = "BLENDKEYS_PT_favorites_panel"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "BlendKeys"

    def draw(self, context):
        layout = self.layout
        row = layout.row()
        row.operator(BLENDKEYS_OT_show_favorites.bl_idname, text="Open Favorites", icon="SOLO_ON")

        layout.separator()
        draw_shortcut_rows(layout, get_favorite_shortcuts())


def draw_header_button(self, context):
    layout = self.layout
    layout.separator()
    layout.operator(BLENDKEYS_OT_show_favorites.bl_idname, text="BlendKeys", icon="SOLO_ON")


def draw_view_menu(self, context):
    self.layout.separator()
    self.layout.operator(BLENDKEYS_OT_show_favorites.bl_idname, text="BlendKeys Favorites", icon="SOLO_ON")


CLASSES = (
    BLENDKEYS_OT_show_favorites,
    BLENDKEYS_PT_favorites_panel,
)


def register():
    for addon_class in CLASSES:
        bpy.utils.register_class(addon_class)

    bpy.types.VIEW3D_HT_header.append(draw_header_button)
    bpy.types.VIEW3D_MT_view.append(draw_view_menu)

    key_config = bpy.context.window_manager.keyconfigs.addon
    if key_config:
        keymap = key_config.keymaps.new(name="Window", space_type="EMPTY")
        keymap_item = keymap.keymap_items.new(
            BLENDKEYS_OT_show_favorites.bl_idname,
            type="F",
            value="PRESS",
            ctrl=True,
            alt=True,
        )
        ADDON_KEYMAPS.append((keymap, keymap_item))


def unregister():
    for keymap, keymap_item in ADDON_KEYMAPS:
        keymap.keymap_items.remove(keymap_item)
    ADDON_KEYMAPS.clear()

    bpy.types.VIEW3D_MT_view.remove(draw_view_menu)
    bpy.types.VIEW3D_HT_header.remove(draw_header_button)

    for addon_class in reversed(CLASSES):
        bpy.utils.unregister_class(addon_class)
