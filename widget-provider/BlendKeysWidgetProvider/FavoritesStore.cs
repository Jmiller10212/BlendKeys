using System.Text.Json;

namespace BlendKeysWidgetProvider;

public sealed record FavoritesFile(string[] FavoriteShortcutIds);

public sealed record ShortcutInfo(string Id, string Action, string Keys);

public sealed record ShortcutLibrary(ShortcutInfo[] Shortcuts);

public static class FavoritesStore
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = true,
    };

    public static string FavoritesPath =>
        Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "BlendKeys",
            "favorites.json");

    public static string SharedShortcutsPath =>
        Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "BlendKeys",
            "library",
            "shortcuts.json");

    public static IReadOnlyList<string> ReadFavoriteIds()
    {
        if (!File.Exists(FavoritesPath))
        {
            return [];
        }

        var json = File.ReadAllText(FavoritesPath);
        var favorites = JsonSerializer.Deserialize<FavoritesFile>(json, JsonOptions);
        return favorites?.FavoriteShortcutIds ?? [];
    }

    public static IReadOnlyDictionary<string, ShortcutInfo> ReadShortcutIndex()
    {
        var shortcuts = ReadShortcutsFromPath(SharedShortcutsPath);
        if (shortcuts.Count == 0)
        {
            shortcuts = ReadShortcutsFromPath(Path.Combine(AppContext.BaseDirectory, "Data", "shortcuts.json"));
        }

        return shortcuts.ToDictionary(shortcut => shortcut.Id, StringComparer.OrdinalIgnoreCase);
    }

    private static IReadOnlyList<ShortcutInfo> ReadShortcutsFromPath(string path)
    {
        if (!File.Exists(path))
        {
            return [];
        }

        try
        {
            var json = File.ReadAllText(path);
            if (json.TrimStart().StartsWith("[", StringComparison.Ordinal))
            {
                return JsonSerializer.Deserialize<ShortcutInfo[]>(json, JsonOptions) ?? [];
            }

            return JsonSerializer.Deserialize<ShortcutLibrary>(json, JsonOptions)?.Shortcuts ?? [];
        }
        catch
        {
            return [];
        }
    }
}
