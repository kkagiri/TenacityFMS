using System;
using System.Threading;
using System.Threading.Tasks;
using PuppeteerSharp;

namespace FMS.Sales.Api.Services.Invoicing
{
    /// <summary>
    /// Maintains a single warmed Chromium browser instance shared across
    /// PDF rendering requests so we don't pay browser launch cost per call.
    /// </summary>
    public interface IPuppeteerBrowserPool : IAsyncDisposable
    {
        Task<IBrowser> GetBrowserAsync(CancellationToken cancellationToken);
    }
}
