/**
 * File: DashboardHub.cs
 * Purpose: Hosts the shared constructor and dependencies for dashboard SignalR partials.
 * Dependencies: IDataSourceManager, IWidgetFactoryService, GpsdataContext, ConnectionMonitor, ILogger
 * Last Modified: 2026-03-11
 *
 * Key Functions:
 * - DashboardHub(): Resolves shared services used across dashboard hub partials.
 */
using FMS.Application.Services.Dashboard;
using FMS.Persistence.DataAccess;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Communication.SignalR
{
    /// <summary>
    /// Root partial for DashboardHub: holds shared dependencies & constructor only.
    /// Implementation lives in other partial files (Protocol, InitialLoad, Streaming, Subscriptions, Helpers, MetricsAndRequests).
    /// </summary>
    public partial class DashboardHub : Hub
    {
        internal readonly IDataSourceManager _dataSourceManager;
        // internal readonly IWidgetDataService _widgetDataService;
        internal readonly IWidgetFactoryService _widgetFactoryService;
        internal readonly GpsdataContext _context;
        internal readonly ConnectionMonitor _connectionMonitor;
        internal readonly ILogger<DashboardHub> _logger;

        public DashboardHub(
            IDataSourceManager dataSourceManager,
            IWidgetFactoryService widgetFactoryService,
            GpsdataContext context,
            ConnectionMonitor connectionMonitor,
            ILogger<DashboardHub> logger)
        {
            _dataSourceManager = dataSourceManager;
            _widgetFactoryService = widgetFactoryService;
            _context = context;
            _connectionMonitor = connectionMonitor;
            _logger = logger;
        }
    }
}