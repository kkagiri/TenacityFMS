# Legacy Dashboard Services Removed (Sept 2025)

This project has fully decommissioned the following legacy backend services:

- IDashboardMetricsService (and DashboardMetricsService implementation)
- IWidgetDataService (and WidgetDataService implementation)

## What to use instead

- IDataSourceManager — single orchestration entry point
- IMetricCalculationService — metric computation
- ITimeSeriesDataService — aggregated time-series
- IWidgetDataTransformerService — widget payload shaping
- IDataSourceMetadataService — metadata catalog
- IWidgetFactoryService — widget configuration validation/transforms (where applicable)

See `Documentation/Features/Dashboard/DataSourceManager-Refactor.md` for the full architecture, contracts, and metadata catalog.

## Migration notes

- Controllers and Hubs: inject and use `IDataSourceManager`
- SignalR: Data envelopes follow schema v2
- DI: Only register the new services (legacy registrations removed)

## Source cleanup

- The old class files were removed/decommissioned. Any remaining references in docs have been updated to reflect the new services.
- If you still find references to the legacy types, replace with the services listed above.
