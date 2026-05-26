using Microsoft.Windows.Widgets;
using Microsoft.Windows.Widgets.Providers;

namespace BlendKeysWidgetProvider;

public sealed class WidgetInfoState
{
    public required string WidgetId { get; init; }
    public required string DefinitionId { get; init; }
    public bool IsActive { get; set; }
}

internal sealed class WidgetProvider : IWidgetProvider
{
    public const string ProviderClassId = "6F111170-F5C8-49B8-ABA4-FB6B0BCB1477";

    private static readonly Dictionary<string, WidgetInfoState> RunningWidgets = new(StringComparer.OrdinalIgnoreCase);
    private static readonly ManualResetEvent EmptyWidgetListEvent = new(false);

    public WidgetProvider()
    {
        try
        {
            foreach (var widgetInfo in WidgetManager.GetDefault().GetWidgetInfos())
            {
                var context = widgetInfo.WidgetContext;
                RunningWidgets.TryAdd(
                    context.Id,
                    new WidgetInfoState
                    {
                        WidgetId = context.Id,
                        DefinitionId = context.DefinitionId,
                    });
            }
        }
        catch
        {
            // Windows can activate the provider before widget state is available.
        }
    }

    public static ManualResetEvent GetEmptyWidgetListEvent() => EmptyWidgetListEvent;

    public void CreateWidget(WidgetContext widgetContext)
    {
        var state = new WidgetInfoState
        {
            WidgetId = widgetContext.Id,
            DefinitionId = widgetContext.DefinitionId,
            IsActive = true,
        };

        RunningWidgets[widgetContext.Id] = state;
        EmptyWidgetListEvent.Reset();
        UpdateWidget(state, widgetContext.Size.ToString());
    }

    public void DeleteWidget(string widgetId, string customState)
    {
        RunningWidgets.Remove(widgetId);
        if (RunningWidgets.Count == 0)
        {
            EmptyWidgetListEvent.Set();
        }
    }

    public void OnActionInvoked(WidgetActionInvokedArgs actionInvokedArgs)
    {
        var widgetId = actionInvokedArgs.WidgetContext.Id;
        if (RunningWidgets.TryGetValue(widgetId, out var state))
        {
            UpdateWidget(state, actionInvokedArgs.WidgetContext.Size.ToString());
        }
    }

    public void OnWidgetContextChanged(WidgetContextChangedArgs contextChangedArgs)
    {
        var context = contextChangedArgs.WidgetContext;
        if (RunningWidgets.TryGetValue(context.Id, out var state))
        {
            UpdateWidget(state, context.Size.ToString());
        }
    }

    public void Activate(WidgetContext widgetContext)
    {
        if (!RunningWidgets.TryGetValue(widgetContext.Id, out var state))
        {
            state = new WidgetInfoState
            {
                WidgetId = widgetContext.Id,
                DefinitionId = widgetContext.DefinitionId,
            };
            RunningWidgets[widgetContext.Id] = state;
        }

        state.IsActive = true;
        EmptyWidgetListEvent.Reset();
        UpdateWidget(state, widgetContext.Size.ToString());
    }

    public void Deactivate(string widgetId)
    {
        if (RunningWidgets.TryGetValue(widgetId, out var state))
        {
            state.IsActive = false;
        }
    }

    private static void UpdateWidget(WidgetInfoState state, string widgetSize)
    {
        var updateOptions = new WidgetUpdateRequestOptions(state.WidgetId)
        {
            Template = WidgetCards.BuildTemplate(widgetSize),
            Data = "{}",
            CustomState = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(),
        };

        WidgetManager.GetDefault().UpdateWidget(updateOptions);
    }
}
