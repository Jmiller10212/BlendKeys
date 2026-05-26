using System.Runtime.InteropServices;
using BlendKeysWidgetProvider;
using BlendKeysWidgetProvider.Com;

[DllImport("ole32.dll")]
static extern int CoRegisterClassObject(
    [MarshalAs(UnmanagedType.LPStruct)] Guid rclsid,
    [MarshalAs(UnmanagedType.IUnknown)] object pUnk,
    uint dwClsContext,
    uint flags,
    out uint lpdwRegister);

[DllImport("ole32.dll")]
static extern int CoRevokeClassObject(uint dwRegister);

WinRT.ComWrappersSupport.InitializeComWrappers();

var providerClsid = Guid.Parse(BlendKeysWidgetProvider.WidgetProvider.ProviderClassId);
var result = CoRegisterClassObject(
    providerClsid,
    new WidgetProviderFactory<WidgetProvider>(),
    0x4,
    0x1,
    out var registrationCookie);

if (result < 0)
{
    Marshal.ThrowExceptionForHR(result);
}

using var emptyWidgetListEvent = WidgetProvider.GetEmptyWidgetListEvent();
emptyWidgetListEvent.WaitOne();
CoRevokeClassObject(registrationCookie);
