import {
  BookOpen,
  Boxes,
  ChevronRight,
  Command,
  Compass,
  Filter,
  FolderOpen,
  GraduationCap,
  Keyboard,
  Layers3,
  MousePointer2,
  PackageOpen,
  Palette,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { check, type Update } from "@tauri-apps/plugin-updater";
import "./App.css";
import defaultShortcutLibrary from "./data/defaultShortcutLibrary.json";
import { cheatsheets, glossary, type Keybind } from "./data/blenderShortcuts";

type View = "shortcuts" | "library" | "cheatsheets" | "glossary" | "addons";
const FAVORITES_STORAGE_KEY = "blendkeys.favoriteShortcutIds";
const THEME_STORAGE_KEY = "blendkeys.theme";

type AddonStatus = {
  blenderAddonInstalled: boolean;
  blenderProfiles: string[];
  blenderAddonLibraryPath: string;
  blenderAddonZipPath: string;
  widgetInstalled: boolean;
};

type ShortcutFilters = {
  categories: string[];
  modes: string[];
};

type ShortcutLibrary = {
  version: number;
  filters: ShortcutFilters;
  shortcuts: Keybind[];
};

type ShortcutLibraryResponse = {
  library: ShortcutLibrary;
  path: string;
  error?: string | null;
};

const navigation = [
  { id: "shortcuts" as const, label: "Shortcuts", icon: Keyboard },
  { id: "library" as const, label: "Library", icon: Settings2 },
  { id: "cheatsheets" as const, label: "Cheatsheets", icon: BookOpen },
  { id: "glossary" as const, label: "Glossary", icon: GraduationCap },
  { id: "addons" as const, label: "Add-ons", icon: PackageOpen },
];

const categoryIcons: Record<string, typeof Compass> = {
  Navigation: Compass,
  Selection: MousePointer2,
  Transform: Command,
  Modeling: Boxes,
  "Object Mode": Layers3,
  "Edit Mode": Sparkles,
  Viewport: Compass,
};

const fallbackLibrary = defaultShortcutLibrary as ShortcutLibrary;
const releaseHighlight = "Expanded reference update 0.1.4: 100+ more shortcuts and a deeper glossary.";

const themes = [
  { id: "studio", name: "Blender Studio", note: "Default orange and blue studio look." },
  { id: "midnight", name: "Midnight Blue", note: "Cooler blue workspace with quieter orange." },
  { id: "graphite", name: "Graphite", note: "Neutral dark gray for long study sessions." },
  { id: "ember", name: "Ember", note: "Warmer orange-forward contrast." },
] as const;

type ThemeId = (typeof themes)[number]["id"];

const readTheme = (): ThemeId => {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  return themes.some((theme) => theme.id === saved) ? (saved as ThemeId) : "studio";
};

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, " ");
const tokenize = (value: string) =>
  normalize(value)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

function scoreShortcut(shortcut: Keybind, query: string) {
  if (!query) return shortcut.beginnerPriority;

  const haystack = normalize(
    [
      shortcut.action,
      shortcut.keys,
      shortcut.category,
      shortcut.mode,
      shortcut.description,
      shortcut.tags.join(" "),
    ].join(" "),
  );
  const normalizedQuery = normalize(query);
  const tokens = tokenize(haystack);
  const terms = normalizedQuery.split(" ").filter(Boolean);
  const matches = terms.filter(
    (term) =>
      tokens.includes(term) ||
      tokens.some((token) => term.length >= 3 && token.startsWith(term)),
  ).length;

  if (matches === 0) return 0;
  const directAction = normalize(shortcut.action).includes(normalizedQuery)
    ? 8
    : 0;
  const keyMatch = normalize(shortcut.keys).includes(normalizedQuery) ? 6 : 0;
  return matches * 3 + directAction + keyMatch + shortcut.beginnerPriority;
}

function readLocalFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function writeLocalFavorites(favoriteIds: string[]) {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds));
}

const emptyShortcut = (categories: string[], modes: string[]): Keybind => ({
  id: "",
  action: "",
  keys: "",
  category: categories[0] ?? "General UI",
  mode: modes[0] ?? "Global",
  description: "",
  tags: [],
  beginnerPriority: 3,
});

const shortcutToForm = (shortcut: Keybind): Keybind => ({
  ...shortcut,
  tags: [...shortcut.tags],
});

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeKeyName = (key: string) => {
  if (key === " ") return "Space";
  if (key.startsWith("Arrow")) return key.replace("Arrow", "");
  if (key.length === 1) return key.toUpperCase();
  return key;
};

async function callFavoritesCommand(command: string, payload?: Record<string, unknown>) {
  try {
    return await invoke<string[]>(command, payload);
  } catch {
    const current = readLocalFavorites();
    if (command === "add_favorite") {
      const shortcutId = String(payload?.shortcutId ?? "");
      const next = [shortcutId, ...current.filter((id) => id !== shortcutId)].filter(Boolean);
      writeLocalFavorites(next);
      return next;
    }
    if (command === "remove_favorite") {
      const shortcutId = String(payload?.shortcutId ?? "");
      const next = current.filter((id) => id !== shortcutId);
      writeLocalFavorites(next);
      return next;
    }
    if (command === "migrate_favorites") {
      return current;
    }
    return current;
  }
}

function App() {
  const [activeView, setActiveView] = useState<View>("shortcuts");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [mode, setMode] = useState("All");
  const [shortcutLibrary, setShortcutLibrary] = useState<ShortcutLibrary>(fallbackLibrary);
  const [shortcutLibraryPath, setShortcutLibraryPath] = useState("");
  const [shortcutLibraryError, setShortcutLibraryError] = useState("");
  const [libraryBusy, setLibraryBusy] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState(fallbackLibrary.shortcuts[0].id);
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [favoriteWidgetOpen, setFavoriteWidgetOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => readLocalFavorites());
  const [addonStatus, setAddonStatus] = useState<AddonStatus | null>(null);
  const [addonBusy, setAddonBusy] = useState<string | null>(null);
  const [addonMessage, setAddonMessage] = useState("");
  const [editorLibrary, setEditorLibrary] = useState<ShortcutLibrary>(fallbackLibrary);
  const [editorSelectedId, setEditorSelectedId] = useState(fallbackLibrary.shortcuts[0].id);
  const [editorForm, setEditorForm] = useState<Keybind>(() => shortcutToForm(fallbackLibrary.shortcuts[0]));
  const [editorDirty, setEditorDirty] = useState(false);
  const [editorMessage, setEditorMessage] = useState("");
  const [pendingLibraryRefresh, setPendingLibraryRefresh] = useState<ShortcutLibraryResponse | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [newMode, setNewMode] = useState("");
  const [renameCategoryFrom, setRenameCategoryFrom] = useState("");
  const [renameCategoryTo, setRenameCategoryTo] = useState("");
  const [renameModeFrom, setRenameModeFrom] = useState("");
  const [renameModeTo, setRenameModeTo] = useState("");
  const [recordingKeys, setRecordingKeys] = useState(false);
  const [recordingChord, setRecordingChord] = useState("");
  const [recordingSteps, setRecordingSteps] = useState<string[]>([]);
  const [currentVersion, setCurrentVersion] = useState("");
  const [availableUpdate, setAvailableUpdate] = useState<Update | null>(null);
  const [updateBusy, setUpdateBusy] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");
  const [theme, setTheme] = useState<ThemeId>(() => readTheme());

  const keybinds = shortcutLibrary.shortcuts.length ? shortcutLibrary.shortcuts : fallbackLibrary.shortcuts;

  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;

    callFavoritesCommand("migrate_favorites", { localFavoriteIds: readLocalFavorites() })
      .then((sharedFavoriteIds) => {
        if (!cancelled) {
          setFavoriteIds(sharedFavoriteIds);
          writeLocalFavorites(sharedFavoriteIds);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFavoriteIds(readLocalFavorites());
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const applyShortcutLibraryResponse = (response: ShortcutLibraryResponse) => {
    setShortcutLibrary(response.library);
    setShortcutLibraryPath(response.path);
    setShortcutLibraryError(response.error ?? "");
    if (!editorDirty) {
      setEditorLibrary(response.library);
      const nextSelected =
        response.library.shortcuts.find((shortcut) => shortcut.id === editorSelectedId) ??
        response.library.shortcuts[0];
      if (nextSelected) {
        setEditorSelectedId(nextSelected.id);
        setEditorForm(shortcutToForm(nextSelected));
      }
      setPendingLibraryRefresh(null);
    }
    if (!response.library.shortcuts.some((shortcut) => shortcut.id === selectedId)) {
      setSelectedId(response.library.shortcuts[0]?.id ?? fallbackLibrary.shortcuts[0].id);
    }
  };

  const runLibraryAction = async (label: string, command: string) => {
    setLibraryBusy(label);
    try {
      const response = await invoke<ShortcutLibraryResponse>(command);
      applyShortcutLibraryResponse(response);
    } catch (error) {
      setShortcutLibraryError(String(error));
    } finally {
      setLibraryBusy(null);
    }
  };

  useEffect(() => {
    runLibraryAction("load", "read_shortcut_library");
  }, []);

  const checkForAppUpdate = async (showNoUpdate = false) => {
    setUpdateBusy(true);
    if (showNoUpdate) setUpdateMessage("Checking for updates...");
    try {
      const update = await check();
      setAvailableUpdate(update);
      if (update) {
        setUpdateMessage(`Version ${update.version} is available.`);
      } else if (showNoUpdate) {
        setUpdateMessage("BlendKeys is up to date.");
      }
    } catch (error) {
      if (showNoUpdate) {
        setUpdateMessage(`Unable to check for updates: ${String(error)}`);
      }
    } finally {
      setUpdateBusy(false);
    }
  };

  const installAppUpdate = async () => {
    if (!availableUpdate) return;
    setUpdateBusy(true);
    setUpdateMessage("Downloading update...");
    try {
      await availableUpdate.downloadAndInstall((event) => {
        if (event.event === "Started") {
          setUpdateMessage("Downloading update...");
        }
        if (event.event === "Finished") {
          setUpdateMessage("Installing update. BlendKeys may close while Windows applies it.");
        }
      });
    } catch (error) {
      setUpdateMessage(`Unable to install update: ${String(error)}`);
      setUpdateBusy(false);
    }
  };

  useEffect(() => {
    getVersion().then(setCurrentVersion).catch(() => setCurrentVersion(""));
    const timer = window.setTimeout(() => checkForAppUpdate(false), 1400);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unlisteners: Array<() => void> = [];

    listen("favorites-changed", async () => {
      const next = await callFavoritesCommand("read_favorites");
      setFavoriteIds(next);
      writeLocalFavorites(next);
    }).then((unlisten) => unlisteners.push(unlisten));

    listen("shortcut-library-changed", async () => {
      try {
        const response = await invoke<ShortcutLibraryResponse>("read_shortcut_library");
        if (editorDirty) {
          setShortcutLibrary(response.library);
          setShortcutLibraryPath(response.path);
          setShortcutLibraryError(response.error ?? "");
          setPendingLibraryRefresh(response);
          setEditorMessage("Shortcut library changed on disk. Reload from file or keep editing your unsaved changes.");
        } else {
          applyShortcutLibraryResponse(response);
        }
      } catch (error) {
        setShortcutLibraryError(String(error));
      }
    }).then((unlisten) => unlisteners.push(unlisten));

    return () => {
      unlisteners.forEach((unlisten) => unlisten());
    };
  }, [editorDirty, editorSelectedId, selectedId]);

  const refreshAddonStatus = async () => {
    try {
      const status = await invoke<AddonStatus>("get_addon_status");
      setAddonStatus(status);
      return status;
    } catch (error) {
      setAddonMessage(String(error));
      return null;
    }
  };

  useEffect(() => {
    refreshAddonStatus();
  }, []);

  const runAddonAction = async (label: string, command: string, successMessage: string) => {
    setAddonBusy(label);
    setAddonMessage("");
    try {
      const status = await invoke<AddonStatus>(command);
      setAddonStatus(status);
      setAddonMessage(successMessage);
    } catch (error) {
      setAddonMessage(String(error));
    } finally {
      setAddonBusy(null);
    }
  };

  const editorCategories = useMemo(
    () => [...new Set([...editorLibrary.filters.categories, ...editorLibrary.shortcuts.map((shortcut) => shortcut.category)])],
    [editorLibrary],
  );
  const editorModes = useMemo(
    () => [...new Set([...editorLibrary.filters.modes, ...editorLibrary.shortcuts.map((shortcut) => shortcut.mode)])],
    [editorLibrary],
  );

  const updateEditorForm = (updates: Partial<Keybind>) => {
    setEditorForm((current) => ({ ...current, ...updates }));
    setEditorDirty(true);
  };

  const updateEditorLibrary = (nextLibrary: ShortcutLibrary, message = "") => {
    setEditorLibrary(nextLibrary);
    setEditorDirty(true);
    setEditorMessage(message);
  };

  const selectEditorShortcut = (shortcut: Keybind) => {
    setEditorSelectedId(shortcut.id);
    setEditorForm(shortcutToForm(shortcut));
    setRecordingKeys(false);
    setRecordingChord("");
    setRecordingSteps([]);
  };

  const commitEditorForm = (library = editorLibrary) => {
    const cleanForm = {
      ...editorForm,
      id: slugify(editorForm.id || editorForm.action),
      action: editorForm.action.trim(),
      keys: editorForm.keys.trim(),
      category: editorForm.category.trim(),
      mode: editorForm.mode.trim(),
      description: editorForm.description.trim(),
      tags: editorForm.tags.map((tag) => tag.trim()).filter(Boolean),
      beginnerPriority: Math.min(5, Math.max(1, Number(editorForm.beginnerPriority) || 3)),
    };
    const exists = library.shortcuts.some((shortcut) => shortcut.id === editorSelectedId);
    const shortcuts = exists
      ? library.shortcuts.map((shortcut) => (shortcut.id === editorSelectedId ? cleanForm : shortcut))
      : [cleanForm, ...library.shortcuts];
    const nextLibrary = {
      ...library,
      filters: {
        categories: [...new Set([...library.filters.categories, cleanForm.category].filter(Boolean))],
        modes: [...new Set([...library.filters.modes, cleanForm.mode].filter(Boolean))],
      },
      shortcuts,
    };
    setEditorLibrary(nextLibrary);
    setEditorSelectedId(cleanForm.id);
    setEditorForm(cleanForm);
    setEditorDirty(true);
    return nextLibrary;
  };

  const saveEditorLibrary = async () => {
    setLibraryBusy("save-library");
    setEditorMessage("");
    try {
      const response = await invoke<ShortcutLibraryResponse>("save_shortcut_library", {
        library: commitEditorForm(),
      });
      setEditorDirty(false);
      setPendingLibraryRefresh(null);
      applyShortcutLibraryResponse(response);
      setEditorMessage("Shortcut library saved.");
    } catch (error) {
      setEditorMessage(String(error));
    } finally {
      setLibraryBusy(null);
    }
  };

  const createEditorShortcut = () => {
    const form = emptyShortcut(editorCategories, editorModes);
    setEditorSelectedId("");
    setEditorForm(form);
    setActiveView("library");
    setEditorDirty(true);
    setEditorMessage("Creating a new shortcut.");
  };

  const duplicateEditorShortcut = () => {
    const copy = {
      ...editorForm,
      id: `${slugify(editorForm.id)}-copy`,
      action: `${editorForm.action} copy`,
    };
    setEditorSelectedId("");
    setEditorForm(copy);
    setEditorDirty(true);
    setEditorMessage("Duplicated shortcut. Edit the id and save.");
  };

  const deleteEditorShortcut = () => {
    if (!editorSelectedId) return;
    const shortcuts = editorLibrary.shortcuts.filter((shortcut) => shortcut.id !== editorSelectedId);
    if (shortcuts.length === 0) {
      setEditorMessage("At least one shortcut must remain in the library.");
      return;
    }
    const nextLibrary = { ...editorLibrary, shortcuts };
    const nextShortcut = shortcuts[0];
    setEditorLibrary(nextLibrary);
    setEditorSelectedId(nextShortcut.id);
    setEditorForm(shortcutToForm(nextShortcut));
    setEditorDirty(true);
    setEditorMessage("Shortcut deleted. Save the library to write the change.");
  };

  const addFilterValue = (kind: "categories" | "modes", value: string) => {
    const cleanValue = value.trim();
    if (!cleanValue) return;
    const nextLibrary = {
      ...editorLibrary,
      filters: {
        ...editorLibrary.filters,
        [kind]: [...new Set([...editorLibrary.filters[kind], cleanValue])],
      },
    };
    updateEditorLibrary(nextLibrary, `${kind === "categories" ? "Category" : "Mode"} added. Save to write the change.`);
    if (kind === "categories") setNewCategory("");
    if (kind === "modes") setNewMode("");
  };

  const renameFilterValue = (kind: "categories" | "modes", from: string, to: string) => {
    const cleanTo = to.trim();
    if (!from || !cleanTo) return;
    const key = kind === "categories" ? "category" : "mode";
    const nextLibrary = {
      ...editorLibrary,
      filters: {
        ...editorLibrary.filters,
        [kind]: [...new Set(editorLibrary.filters[kind].map((value) => (value === from ? cleanTo : value)))],
      },
      shortcuts: editorLibrary.shortcuts.map((shortcut) => ({
        ...shortcut,
        [key]: (key === "category" ? shortcut.category : shortcut.mode) === from ? cleanTo : key === "category" ? shortcut.category : shortcut.mode,
      })),
    };
    updateEditorLibrary(nextLibrary, `${kind === "categories" ? "Category" : "Mode"} renamed. Save to write the change.`);
    if ((key === "category" ? editorForm.category : editorForm.mode) === from) {
      updateEditorForm({ [key]: cleanTo } as Partial<Keybind>);
    }
  };

  const deleteFilterValue = (kind: "categories" | "modes", value: string) => {
    const key = kind === "categories" ? "category" : "mode";
    if (editorLibrary.shortcuts.some((shortcut) => (key === "category" ? shortcut.category : shortcut.mode) === value)) {
      setEditorMessage(`Cannot delete "${value}" while shortcuts still use it.`);
      return;
    }
    updateEditorLibrary(
      {
        ...editorLibrary,
        filters: {
          ...editorLibrary.filters,
          [kind]: editorLibrary.filters[kind].filter((item) => item !== value),
        },
      },
      `${kind === "categories" ? "Category" : "Mode"} deleted. Save to write the change.`,
    );
  };

  const reloadEditorFromPending = () => {
    if (!pendingLibraryRefresh) return;
    setEditorDirty(false);
    applyShortcutLibraryResponse(pendingLibraryRefresh);
    setEditorMessage("Reloaded editor from disk.");
  };

  const recordCurrentChord = (event: KeyboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const modifiers = [
      event.ctrlKey ? "Ctrl" : "",
      event.altKey ? "Alt" : "",
      event.shiftKey ? "Shift" : "",
    ].filter(Boolean);
    const key = normalizeKeyName(event.key);
    if (["Control", "Alt", "Shift", "Meta"].includes(key)) return;
    setRecordingChord([...modifiers, key].join(" + "));
  };

  const addRecordingStep = () => {
    if (!recordingChord) return;
    setRecordingSteps((steps) => [...steps, recordingChord]);
    setRecordingChord("");
  };

  const finishRecording = () => {
    const steps = recordingChord ? [...recordingSteps, recordingChord] : recordingSteps;
    if (steps.length) {
      updateEditorForm({ keys: steps.join(" then ") });
    }
    setRecordingKeys(false);
    setRecordingChord("");
    setRecordingSteps([]);
  };

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const favoriteShortcuts = useMemo(
    () => favoriteIds.map((id) => keybinds.find((item) => item.id === id)).filter(Boolean) as Keybind[],
    [favoriteIds, keybinds],
  );

  const toggleFavorite = async (shortcutId: string) => {
    const command = favoriteSet.has(shortcutId) ? "remove_favorite" : "add_favorite";
    const next = await callFavoritesCommand(command, { shortcutId });
    setFavoriteIds(next);
    writeLocalFavorites(next);
  };

  const openShortcut = (shortcutId: string) => {
    setSelectedId(shortcutId);
    setActiveView("shortcuts");
    setFavoriteWidgetOpen(false);
  };

  const categories = useMemo(
    () => ["All", ...new Set([...shortcutLibrary.filters.categories, ...keybinds.map((item) => item.category)])],
    [keybinds, shortcutLibrary.filters.categories],
  );
  const modes = useMemo(
    () => ["All", ...new Set([...shortcutLibrary.filters.modes, ...keybinds.map((item) => item.mode)])],
    [keybinds, shortcutLibrary.filters.modes],
  );

  useEffect(() => {
    if (category !== "All" && !categories.includes(category)) {
      setCategory("All");
    }
  }, [categories, category]);

  useEffect(() => {
    if (mode !== "All" && !modes.includes(mode)) {
      setMode("All");
    }
  }, [mode, modes]);

  const filteredShortcuts = useMemo(() => {
    return keybinds
      .map((shortcut) => ({ shortcut, score: scoreShortcut(shortcut, query) }))
      .filter(({ shortcut, score }) => {
        const categoryMatch = category === "All" || shortcut.category === category;
        const modeMatch = mode === "All" || shortcut.mode === mode;
        const favoriteMatch = !favoriteOnly || favoriteSet.has(shortcut.id);
        return categoryMatch && modeMatch && favoriteMatch && score > 0;
      })
      .sort((a, b) => b.score - a.score || a.shortcut.action.localeCompare(b.shortcut.action))
      .map(({ shortcut }) => shortcut);
  }, [category, favoriteOnly, favoriteSet, mode, query]);

  const selected =
    filteredShortcuts.find((shortcut) => shortcut.id === selectedId) ??
    filteredShortcuts[0] ??
    keybinds[0];

  const relatedShortcuts = keybinds
    .filter(
      (shortcut) =>
        shortcut.id !== selected.id &&
        (shortcut.category === selected.category ||
          shortcut.tags.some((tag) => selected.tags.includes(tag))),
    )
    .slice(0, 4);

  const groupedShortcuts = filteredShortcuts.reduce<Record<string, Keybind[]>>(
    (groups, shortcut) => {
      groups[shortcut.category] = groups[shortcut.category] ?? [];
      groups[shortcut.category].push(shortcut);
      return groups;
    },
    {},
  );

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">BK</div>
          <div>
            <p>BlendKeys</p>
            <span>Blender learning desk</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Primary">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={activeView === item.id ? "nav-item active" : "nav-item"}
                key={item.id}
                onClick={() => setActiveView(item.id)}
                type="button"
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-card">
          <span className="eyebrow">Beginner path</span>
          <strong>Start with viewport navigation, then transforms, then edit mode.</strong>
          <p>Use search whenever Blender's menus feel too deep.</p>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">Offline Blender 4.x reference</span>
            <h1>{activeView === "shortcuts" ? "Find the command before you forget it." : activeView === "library" ? "Shape your shortcut library." : activeView === "cheatsheets" ? "Fast Blender workflows." : activeView === "glossary" ? "Blender terms without the fog." : "Manage the extras around BlendKeys."}</h1>
          </div>
          <div className="stat-strip" aria-label="Library stats">
            <span>{keybinds.length} shortcuts</span>
            <span>{favoriteIds.length} favorites</span>
            <span>{cheatsheets.length} sheets</span>
            <span>{glossary.length} terms</span>
          </div>
        </header>

        {shortcutLibraryError && (
          <div className="library-warning">
            <strong>Shortcut library issue</strong>
            <span>{shortcutLibraryError}</span>
          </div>
        )}

        <div className="release-highlight">
          <Sparkles size={18} />
          <strong>What&apos;s new</strong>
          <span>{releaseHighlight}</span>
        </div>

        {activeView === "shortcuts" && (
          <div className="shortcut-view">
            <section className="library-panel">
              <div className="search-row">
                <label className="search-box" htmlFor="shortcut-search">
                  <Search size={20} />
                  <input
                    autoFocus
                    id="shortcut-search"
                    onChange={(event) => setQuery(event.currentTarget.value)}
                    placeholder="Search move, shift a, viewport, extrude..."
                    value={query}
                  />
                </label>
              </div>

              <div className="filters" aria-label="Shortcut filters">
                <Filter size={16} />
                <select value={category} onChange={(event) => setCategory(event.currentTarget.value)}>
                  {categories.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <select value={mode} onChange={(event) => setMode(event.currentTarget.value)}>
                  {modes.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <button
                  className={favoriteOnly ? "filter-chip active" : "filter-chip"}
                  onClick={() => setFavoriteOnly((value) => !value)}
                  type="button"
                >
                  <Star size={15} fill={favoriteOnly ? "currentColor" : "none"} />
                  Favorites
                </button>
              </div>

              <div className="result-summary">
                <span>{filteredShortcuts.length} matches</span>
                <span>{favoriteOnly ? "Saved shortcuts only" : query ? `Searching "${query}"` : "Popular beginner commands"}</span>
              </div>

              <div className="results-list">
                {filteredShortcuts.length === 0 && (
                  <div className="empty-state">
                    <Star size={22} />
                    <strong>No favorites match this view.</strong>
                    <span>Star shortcuts you want to keep close, then open the favorites widget anytime.</span>
                  </div>
                )}
                {Object.entries(groupedShortcuts).map(([group, shortcuts]) => {
                  const Icon = categoryIcons[group] ?? Command;
                  return (
                    <section className="result-group" key={group}>
                      <div className="group-heading">
                        <Icon size={16} />
                        <span>{group}</span>
                      </div>
                      {shortcuts.map((shortcut) => (
                        <div
                          className={selected.id === shortcut.id ? "shortcut-row selected" : "shortcut-row"}
                          key={shortcut.id}
                        >
                          <button
                            aria-label={favoriteSet.has(shortcut.id) ? `Remove ${shortcut.action} from favorites` : `Add ${shortcut.action} to favorites`}
                            className={favoriteSet.has(shortcut.id) ? "star-button active" : "star-button"}
                            onClick={() => toggleFavorite(shortcut.id)}
                            title={favoriteSet.has(shortcut.id) ? "Remove favorite" : "Add favorite"}
                            type="button"
                          >
                            <Star size={17} fill={favoriteSet.has(shortcut.id) ? "currentColor" : "none"} />
                          </button>
                          <kbd>{shortcut.keys}</kbd>
                          <button
                            className="shortcut-main"
                            onClick={() => setSelectedId(shortcut.id)}
                            type="button"
                          >
                            <strong>{shortcut.action}</strong>
                            <span>{shortcut.mode} - {shortcut.description}</span>
                          </button>
                          <ChevronRight size={16} />
                        </div>
                      ))}
                    </section>
                  );
                })}
              </div>
            </section>

            <aside className="detail-panel">
              <div className="detail-hero">
                <span>{selected.category}</span>
                <h2>{selected.action}</h2>
                <kbd>{selected.keys}</kbd>
                <button
                  className={favoriteSet.has(selected.id) ? "detail-favorite active" : "detail-favorite"}
                  onClick={() => toggleFavorite(selected.id)}
                  type="button"
                >
                  <Star size={17} fill={favoriteSet.has(selected.id) ? "currentColor" : "none"} />
                  {favoriteSet.has(selected.id) ? "Favorited" : "Add favorite"}
                </button>
              </div>
              <p>{selected.description}</p>
              <div className="metadata-grid">
                <div>
                  <span>Mode</span>
                  <strong>{selected.mode}</strong>
                </div>
                <div>
                  <span>Priority</span>
                  <strong>{selected.beginnerPriority >= 4 ? "Core" : "Useful"}</strong>
                </div>
              </div>
              <div className="tag-list">
                {selected.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <section className="related">
                <h3>Related shortcuts</h3>
                {relatedShortcuts.map((shortcut) => (
                  <button key={shortcut.id} onClick={() => setSelectedId(shortcut.id)} type="button">
                    <kbd>{shortcut.keys}</kbd>
                    <span>{shortcut.action}</span>
                  </button>
                ))}
              </section>
            </aside>
          </div>
        )}

        {activeView === "library" && (
          <section className="library-editor">
            <div className="editor-toolbar">
              <div>
                <span className="eyebrow">Editable JSON library</span>
                <h2>Categories, modes, and shortcuts</h2>
              </div>
              <div className="addon-actions">
                <button onClick={createEditorShortcut} type="button">
                  <Plus size={18} />
                  New shortcut
                </button>
                <button
                  className="secondary-action"
                  onClick={saveEditorLibrary}
                  disabled={!editorDirty || libraryBusy === "save-library"}
                  type="button"
                >
                  <Settings2 size={18} />
                  {libraryBusy === "save-library" ? "Saving..." : "Save library"}
                </button>
              </div>
            </div>

            {(editorMessage || pendingLibraryRefresh) && (
              <div className="addon-message editor-message">
                <span>{editorMessage || "Shortcut library changed on disk."}</span>
                {pendingLibraryRefresh && (
                  <div className="addon-actions">
                    <button onClick={reloadEditorFromPending} type="button">Reload from file</button>
                    <button className="secondary-action" onClick={() => setPendingLibraryRefresh(null)} type="button">Keep editing</button>
                  </div>
                )}
              </div>
            )}

            <div className="library-editor-grid">
              <aside className="editor-list-panel">
                <div className="editor-list-heading">
                  <strong>{editorLibrary.shortcuts.length} shortcuts</strong>
                  <span>{editorDirty ? "Unsaved changes" : "Saved"}</span>
                </div>
                <div className="editor-shortcut-list">
                  {editorLibrary.shortcuts.map((shortcut) => (
                    <button
                      className={shortcut.id === editorSelectedId ? "editor-shortcut active" : "editor-shortcut"}
                      key={shortcut.id}
                      onClick={() => {
                        if (editorDirty) commitEditorForm();
                        selectEditorShortcut(shortcut);
                      }}
                      type="button"
                    >
                      <kbd>{shortcut.keys}</kbd>
                      <span>{shortcut.action}</span>
                    </button>
                  ))}
                </div>
              </aside>

              <div className="editor-main">
                <article className="editor-card">
                  <div className="addon-card-heading">
                    <div>
                      <span className="eyebrow">Shortcut editor</span>
                      <h2>{editorSelectedId ? "Edit shortcut" : "New shortcut"}</h2>
                    </div>
                    <div className="addon-actions">
                      <button className="secondary-action" onClick={duplicateEditorShortcut} type="button">
                        <Plus size={18} />
                        Duplicate
                      </button>
                      <button className="secondary-action" onClick={deleteEditorShortcut} disabled={!editorSelectedId} type="button">
                        <Trash2 size={18} />
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="editor-form">
                    <label>
                      <span>ID</span>
                      <input
                        value={editorForm.id}
                        onChange={(event) => updateEditorForm({ id: slugify(event.currentTarget.value) })}
                        placeholder="toggle-xray"
                      />
                    </label>
                    <label>
                      <span>Action</span>
                      <input
                        value={editorForm.action}
                        onChange={(event) => updateEditorForm({ action: event.currentTarget.value })}
                        onBlur={() => {
                          if (!editorForm.id) updateEditorForm({ id: slugify(editorForm.action) });
                        }}
                        placeholder="Toggle X-Ray view"
                      />
                    </label>
                    <label className="wide-field">
                      <span>Keys</span>
                      <div className="key-field">
                        <input
                          value={editorForm.keys}
                          onChange={(event) => updateEditorForm({ keys: event.currentTarget.value })}
                          placeholder="Alt + Z"
                        />
                        <button className="secondary-action" onClick={() => setRecordingKeys(true)} type="button">
                          Record keys
                        </button>
                      </div>
                    </label>
                    {recordingKeys && (
                      <div className="key-recorder wide-field">
                        <span className="eyebrow">Recording</span>
                        <input
                          autoFocus
                          onKeyDown={recordCurrentChord}
                          placeholder="Press a shortcut, like Shift + G"
                          value={recordingChord}
                          readOnly
                        />
                        <div className="recording-preview">
                          <kbd>{[...recordingSteps, recordingChord].filter(Boolean).join(" then ") || "Waiting for keys"}</kbd>
                        </div>
                        <div className="addon-actions">
                          <button className="secondary-action" onClick={addRecordingStep} type="button">Add step</button>
                          <button onClick={finishRecording} type="button">Done</button>
                          <button
                            className="secondary-action"
                            onClick={() => {
                              setRecordingChord("");
                              setRecordingSteps([]);
                            }}
                            type="button"
                          >
                            Clear
                          </button>
                          <button className="secondary-action" onClick={() => setRecordingKeys(false)} type="button">Cancel</button>
                        </div>
                      </div>
                    )}
                    <label>
                      <span>Category</span>
                      <select value={editorForm.category} onChange={(event) => updateEditorForm({ category: event.currentTarget.value })}>
                        {editorCategories.map((item) => <option key={item}>{item}</option>)}
                      </select>
                    </label>
                    <label>
                      <span>Mode</span>
                      <select value={editorForm.mode} onChange={(event) => updateEditorForm({ mode: event.currentTarget.value })}>
                        {editorModes.map((item) => <option key={item}>{item}</option>)}
                      </select>
                    </label>
                    <label className="wide-field">
                      <span>Description</span>
                      <textarea
                        value={editorForm.description}
                        onChange={(event) => updateEditorForm({ description: event.currentTarget.value })}
                        placeholder="Explain what this shortcut does."
                      />
                    </label>
                    <label>
                      <span>Tags</span>
                      <input
                        value={editorForm.tags.join(", ")}
                        onChange={(event) => updateEditorForm({ tags: event.currentTarget.value.split(",").map((tag) => tag.trim()) })}
                        placeholder="xray, viewport, toggle"
                      />
                    </label>
                    <label>
                      <span>Beginner priority</span>
                      <input
                        min={1}
                        max={5}
                        type="number"
                        value={editorForm.beginnerPriority}
                        onChange={(event) => updateEditorForm({ beginnerPriority: Number(event.currentTarget.value) })}
                      />
                    </label>
                  </div>
                </article>

                <article className="editor-card">
                  <span className="eyebrow">Filters</span>
                  <div className="filter-manager">
                    <div>
                      <h3>Categories</h3>
                      <div className="inline-editor">
                        <input value={newCategory} onChange={(event) => setNewCategory(event.currentTarget.value)} placeholder="New category" />
                        <button onClick={() => addFilterValue("categories", newCategory)} type="button">Add</button>
                      </div>
                      <div className="inline-editor">
                        <select value={renameCategoryFrom} onChange={(event) => setRenameCategoryFrom(event.currentTarget.value)}>
                          <option value="">Rename category...</option>
                          {editorCategories.map((item) => <option key={item}>{item}</option>)}
                        </select>
                        <input value={renameCategoryTo} onChange={(event) => setRenameCategoryTo(event.currentTarget.value)} placeholder="New name" />
                        <button onClick={() => renameFilterValue("categories", renameCategoryFrom, renameCategoryTo)} type="button">Rename</button>
                      </div>
                      <div className="tag-list">
                        {editorCategories.map((item) => (
                          <button key={item} onClick={() => deleteFilterValue("categories", item)} type="button">{item} <X size={13} /></button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3>Modes</h3>
                      <div className="inline-editor">
                        <input value={newMode} onChange={(event) => setNewMode(event.currentTarget.value)} placeholder="New mode" />
                        <button onClick={() => addFilterValue("modes", newMode)} type="button">Add</button>
                      </div>
                      <div className="inline-editor">
                        <select value={renameModeFrom} onChange={(event) => setRenameModeFrom(event.currentTarget.value)}>
                          <option value="">Rename mode...</option>
                          {editorModes.map((item) => <option key={item}>{item}</option>)}
                        </select>
                        <input value={renameModeTo} onChange={(event) => setRenameModeTo(event.currentTarget.value)} placeholder="New name" />
                        <button onClick={() => renameFilterValue("modes", renameModeFrom, renameModeTo)} type="button">Rename</button>
                      </div>
                      <div className="tag-list">
                        {editorModes.map((item) => (
                          <button key={item} onClick={() => deleteFilterValue("modes", item)} type="button">{item} <X size={13} /></button>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </section>
        )}

        {activeView === "cheatsheets" && (
          <section className="content-grid">
            {cheatsheets.map((sheet) => (
              <article className="learning-card" key={sheet.title}>
                <span className="eyebrow">{sheet.theme}</span>
                <h2>{sheet.title}</h2>
                <p>{sheet.summary}</p>
                <div className="step-list">
                  {sheet.steps.map((step) => (
                    <div key={step.keys}>
                      <kbd>{step.keys}</kbd>
                      <span>{step.label}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </section>
        )}

        {activeView === "glossary" && (
          <section className="glossary-grid">
            {glossary.map((term) => (
              <article className="term-card" key={term.term}>
                <h2>{term.term}</h2>
                <p>{term.definition}</p>
                <span>{term.context}</span>
              </article>
            ))}
          </section>
        )}

        {activeView === "addons" && (
          <section className="addons-view">
            <article className="addon-card compact">
              <div className="addon-card-heading">
                <div>
                  <span className="eyebrow">Appearance</span>
                  <h2><Palette size={19} /> Theme</h2>
                </div>
                <span className="status-pill installed">
                  {themes.find((item) => item.id === theme)?.name ?? "Theme"}
                </span>
              </div>
              <p>
                Change BlendKeys colors without changing how the shortcut browser works.
                Blender Studio is the default theme.
              </p>
              <div className="theme-grid" aria-label="Theme choices">
                {themes.map((item) => (
                  <button
                    className={theme === item.id ? "theme-card active" : "theme-card"}
                    key={item.id}
                    onClick={() => setTheme(item.id)}
                    type="button"
                  >
                    <span className={`theme-swatch ${item.id}`} aria-hidden="true" />
                    <strong>{item.name}</strong>
                    <small>{item.note}</small>
                  </button>
                ))}
              </div>
            </article>

            <article className="addon-card compact">
              <div className="addon-card-heading">
                <div>
                  <span className="eyebrow">App updates</span>
                  <h2>BlendKeys updates</h2>
                </div>
                <span className={availableUpdate ? "status-pill installed" : "status-pill"}>
                  {availableUpdate ? `Update ${availableUpdate.version}` : `Current ${currentVersion || "version"}`}
                </span>
              </div>
              <p>
                Checks GitHub Releases for signed BlendKeys updates. When an update is available,
                install it here without uninstalling first.
              </p>
              <div className="addon-actions">
                <button onClick={() => checkForAppUpdate(true)} disabled={updateBusy} type="button">
                  <Settings2 size={18} />
                  {updateBusy ? "Checking..." : "Check for updates"}
                </button>
                <button
                  className="secondary-action"
                  onClick={installAppUpdate}
                  disabled={!availableUpdate || updateBusy}
                  type="button"
                >
                  <PackageOpen size={18} />
                  Install update
                </button>
              </div>
              {availableUpdate?.body && <div className="addon-message">{availableUpdate.body}</div>}
              {updateMessage && <div className="addon-message">{updateMessage}</div>}
            </article>

            <article className="addon-card">
              <div className="addon-card-heading">
                <div>
                  <span className="eyebrow">Blender integration</span>
                  <h2>BlendKeys Favorites add-on</h2>
                </div>
                <span className={addonStatus?.blenderAddonInstalled ? "status-pill installed" : "status-pill"}>
                  {addonStatus?.blenderAddonInstalled ? "Installed" : "Not installed"}
                </span>
              </div>
              <p>
                Shows your favorite BlendKeys shortcuts inside Blender through a viewport header button,
                sidebar tab, View menu entry, and Ctrl + Alt + F popup.
              </p>
              <div className="addon-actions">
                <button
                  onClick={() => runAddonAction("install-blender", "install_blender_addon", "Blender add-on installed. Enable it in Blender preferences if it is not already enabled.")}
                  type="button"
                >
                  <PackageOpen size={18} />
                  {addonBusy === "install-blender" ? "Installing..." : addonStatus?.blenderAddonInstalled ? "Reinstall add-on" : "Install add-on"}
                </button>
                <button
                  className="secondary-action"
                  onClick={() => runAddonAction("uninstall-blender", "uninstall_blender_addon", "Blender add-on removed from detected Blender profiles.")}
                  disabled={!addonStatus?.blenderAddonInstalled}
                  type="button"
                >
                  <X size={18} />
                  {addonBusy === "uninstall-blender" ? "Removing..." : "Uninstall add-on"}
                </button>
                <button
                  className="secondary-action"
                  onClick={() => runAddonAction("open-folder", "open_blender_addon_folder", "Opened the BlendKeys add-ons folder.")}
                  type="button"
                >
                  <FolderOpen size={18} />
                  Open add-on folder
                </button>
              </div>
              <div className="path-list">
                <span>Zip location</span>
                <code>{addonStatus?.blenderAddonZipPath ?? "Checking..."}</code>
                <span>Detected Blender profiles</span>
                <code>{addonStatus?.blenderProfiles.length ? addonStatus.blenderProfiles.join("\n") : "No Blender profile folders detected yet."}</code>
              </div>
            </article>

            <article className="addon-card">
              <div className="addon-card-heading">
                <div>
                  <span className="eyebrow">Windows Widgets</span>
                  <h2>BlendKeys Favorites widget</h2>
                </div>
                <span className={addonStatus?.widgetInstalled ? "status-pill installed" : "status-pill"}>
                  {addonStatus?.widgetInstalled ? "Installed" : "Not installed"}
                </span>
              </div>
              <p>
                Installs the Windows Widgets board provider. After installing, press Win + W and add
                the BlendKeys Favorites widget.
              </p>
              <div className="addon-actions">
                <button
                  onClick={() => runAddonAction("install-widget", "install_widget_provider", "Windows widget provider installed. Open Win + W to pin it.")}
                  type="button"
                >
                  <Settings2 size={18} />
                  {addonBusy === "install-widget" ? "Installing..." : addonStatus?.widgetInstalled ? "Reinstall widget" : "Install widget"}
                </button>
                <button
                  className="secondary-action"
                  onClick={() => runAddonAction("uninstall-widget", "uninstall_widget_provider", "Windows widget provider uninstalled.")}
                  disabled={!addonStatus?.widgetInstalled}
                  type="button"
                >
                  <X size={18} />
                  {addonBusy === "uninstall-widget" ? "Removing..." : "Uninstall widget"}
                </button>
              </div>
            </article>

            <article className="addon-card compact">
              <div className="addon-card-heading">
                <div>
                  <span className="eyebrow">Editable library</span>
                  <h2>Shortcut data file</h2>
                </div>
              </div>
              <p>
                BlendKeys reads shortcuts and filter metadata from a JSON file in your Windows app data folder.
                Edit that file, then reload the library here without rebuilding the app.
              </p>
              <div className="addon-actions">
                <button
                  onClick={() => runLibraryAction("open-file", "open_shortcut_library_file")}
                  type="button"
                >
                  <FolderOpen size={18} />
                  Open shortcut library file
                </button>
                <button
                  className="secondary-action"
                  onClick={() => runLibraryAction("open-folder", "open_shortcut_library_folder")}
                  type="button"
                >
                  <FolderOpen size={18} />
                  Open shortcut library folder
                </button>
                <button
                  className="secondary-action"
                  onClick={() => runLibraryAction("reload", "read_shortcut_library")}
                  type="button"
                >
                  <Settings2 size={18} />
                  {libraryBusy === "reload" ? "Reloading..." : "Reload shortcut library"}
                </button>
                <button
                  className="secondary-action"
                  onClick={() => runLibraryAction("restore", "restore_default_shortcut_library")}
                  type="button"
                >
                  <X size={18} />
                  Restore default shortcut library
                </button>
              </div>
              <div className="path-list">
                <span>Shortcut library</span>
                <code>{shortcutLibraryPath || "%APPDATA%\\BlendKeys\\library\\shortcuts.json"}</code>
              </div>
              {shortcutLibraryError && <div className="addon-message">{shortcutLibraryError}</div>}
            </article>

            <article className="addon-card compact">
              <div className="addon-card-heading">
                <div>
                  <span className="eyebrow">Status</span>
                  <h2>Installer files</h2>
                </div>
              </div>
              <p>
                The full installer can place these extras beside BlendKeys. If this app cannot find the
                files, rerun the full installer and select the add-ons you want.
              </p>
              {addonMessage && <div className="addon-message">{addonMessage}</div>}
              <button className="secondary-action" onClick={refreshAddonStatus} type="button">
                Refresh status
              </button>
            </article>
          </section>
        )}
      </section>

      <div className="favorite-widget">
        {favoriteWidgetOpen && (
          <section className="favorite-widget-panel" aria-label="Favorite shortcuts">
            <div className="widget-heading">
              <div>
                <span className="eyebrow">Favorites</span>
                <strong>{favoriteIds.length} saved shortcuts</strong>
              </div>
              <button aria-label="Close favorites widget" onClick={() => setFavoriteWidgetOpen(false)} type="button">
                <X size={18} />
              </button>
            </div>
            <div className="widget-list">
              {favoriteShortcuts.length === 0 ? (
                <p>Star shortcuts and they will stay here for quick access.</p>
              ) : (
                favoriteShortcuts.map((shortcut) => (
                  <button key={shortcut.id} onClick={() => openShortcut(shortcut.id)} type="button">
                    <kbd>{shortcut.keys}</kbd>
                    <span>{shortcut.action}</span>
                  </button>
                ))
              )}
            </div>
          </section>
        )}
        <button
          className="favorite-widget-toggle"
          onClick={() => setFavoriteWidgetOpen((value) => !value)}
          type="button"
        >
          <Star size={20} fill={favoriteIds.length ? "currentColor" : "none"} />
          <span>{favoriteIds.length}</span>
        </button>
      </div>
    </main>
  );
}

export default App;
