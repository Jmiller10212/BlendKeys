using System.Text.Json;

namespace BlendKeysWidgetProvider;

public static class WidgetCards
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static string BuildTemplate(string widgetSize)
    {
        var favorites = BuildFavoriteRows(widgetSize).ToArray();
        var template = new
        {
            type = "AdaptiveCard",
            version = "1.5",
            minHeight = "170px",
            body = new object[]
            {
                new
                {
                    type = "Container",
                    spacing = "Small",
                    items = favorites,
                },
                new
                {
                    type = "TextBlock",
                    text = "Favorites from BlendKeys",
                    isSubtle = true,
                    size = "Small",
                    spacing = "Small",
                },
            },
        };

        return JsonSerializer.Serialize(template, JsonOptions);
    }

    private static List<object> BuildFavoriteRows(string widgetSize)
    {
        var favoriteIds = FavoritesStore.ReadFavoriteIds();
        var shortcutIndex = FavoritesStore.ReadShortcutIndex();
        var limit = widgetSize.ToLowerInvariant() switch
        {
            "small" => 3,
            "medium" => 6,
            _ => 10,
        };

        var favoriteItems = new List<object>();
        foreach (var id in favoriteIds.Take(limit))
        {
            if (!shortcutIndex.TryGetValue(id, out var shortcut))
            {
                favoriteItems.Add(new
                {
                    type = "TextBlock",
                    text = id,
                    wrap = true,
                    weight = "Bolder",
                    color = "Default",
                });
                continue;
            }

            favoriteItems.Add(new
            {
                type = "ColumnSet",
                spacing = "Small",
                separator = favoriteItems.Count > 0,
                columns = new object[]
                {
                    new
                    {
                        type = "Column",
                        width = "auto",
                        verticalContentAlignment = "Center",
                        items = new object[]
                        {
                            new
                            {
                                type = "TextBlock",
                                text = shortcut.Keys,
                                weight = "Bolder",
                                color = "Warning",
                                size = "Small",
                                maxLines = 1,
                                wrap = false,
                            },
                        },
                    },
                    new
                    {
                        type = "Column",
                        width = "stretch",
                        verticalContentAlignment = "Center",
                        items = new object[]
                        {
                            new
                            {
                                type = "TextBlock",
                                text = shortcut.Action,
                                color = "Default",
                                weight = "Bolder",
                                size = "Small",
                                maxLines = 1,
                                wrap = false,
                            },
                        },
                    },
                },
            });
        }

        if (favoriteItems.Count == 0)
        {
            favoriteItems.Add(new
            {
                type = "TextBlock",
                text = "No favorites yet. Open BlendKeys and star shortcuts to pin them here.",
                color = "Default",
                wrap = true,
            });
        }

        return favoriteItems;
    }
}
