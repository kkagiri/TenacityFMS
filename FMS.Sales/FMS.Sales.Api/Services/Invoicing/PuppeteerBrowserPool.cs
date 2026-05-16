using System.Threading;
using System.Threading.Tasks;
using PuppeteerSharp;

namespace FMS.Sales.Api.Services.Invoicing
{
    public sealed class PuppeteerBrowserPool : IPuppeteerBrowserPool
    {
        private readonly SemaphoreSlim _initLock = new(1, 1);
        private IBrowser? _browser;
        private bool _disposed;

        public async Task<IBrowser> GetBrowserAsync(CancellationToken cancellationToken)
        {
            if (_browser is { IsClosed: false })
            {
                return _browser;
            }

            await _initLock.WaitAsync(cancellationToken);
            try
            {
                if (_browser is { IsClosed: false })
                {
                    return _browser;
                }

                await new BrowserFetcher().DownloadAsync();
                _browser = await Puppeteer.LaunchAsync(new LaunchOptions
                {
                    Headless = true,
                    Args = new[] { "--no-sandbox", "--disable-dev-shm-usage" },
                });
                return _browser;
            }
            finally
            {
                _initLock.Release();
            }
        }

        public async ValueTask DisposeAsync()
        {
            if (_disposed) return;
            _disposed = true;

            if (_browser is not null)
            {
                await _browser.CloseAsync();
                await _browser.DisposeAsync();
            }

            _initLock.Dispose();
        }
    }
}
