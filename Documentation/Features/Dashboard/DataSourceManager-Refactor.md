# Dashboard DataSourceManager Refactor (Sept 2025)

This document summarizes the refactor to the dashboard data flow, focusing on Single Responsibility, type safety, and extensibility.

## What changed

- Decomposed DataSourceManager into dedicated services:
  - IMetricCalculationService + MetricCalculationService: Computes metrics (fuel dispensed, fuel used GPS, engine hours, distance, etc.)
  - ITimeSeriesDataService + TimeSeriesDataService: Builds time-series data using EF Core with metadata-driven granularity
  - IWidgetDataTransformerService + WidgetDataTransformerService: Shapes raw data into widget-ready payloads
  - IDataSourceMetadataService + DataSourceMetadataService: Exposes catalog metadata without constructing the full manager
- Identifier normalization centralized in FMS.Domain via IdentifierNormalizer to reduce string comparison drift
- Expanded metadata catalog (M1 categories) in DataSourceManager.Metadata.cs with defaults (modes, aggregations, granularities, groupBy)
- DataSourceManager now orchestrates services and SignalR broadcast only; no direct EF queries in the class

## Contracts

- IDataSourceManager
  - GetInitialDataAsync(string dataSource, DashboardMetricRequestDto request)
  - GetLiveDataAsync(string dataSource, DashboardMetricRequestDto request)
  - GetAggregatedDataAsync(string dataSource, DashboardMetricRequestDto request, string aggregationInterval = "hourly")
  - TransformDataForWidgetType(string widgetType, object rawData, Dictionary<string, object> configuration)
  - GetDataSourceMetadata(string dataSource)
  - GetAllDataSources()

- IMetricCalculationService
  - Task<DashboardMetricResponseDto> ComputeMetricAsync(DashboardMetricRequestDto request)
  - Task<object> CalculateChangeAsync(DashboardMetricResponseDto currentResponse)

- ITimeSeriesDataService
  - Task<object> GetTimeSeriesAsync(string dataSource, DashboardMetricRequestDto request)

- IWidgetDataTransformerService
  - Task<object> TransformAsync(string widgetType, object rawData, Dictionary<string, object> configuration)

- IDataSourceMetadataService
  - DataSourceMetadata GetMetadata(string dataSource)
  - IEnumerable<KeyValuePair<string, DataSourceMetadata>> GetAll()

## Identifier normalization

Located in `FMS.Domain/Entities/Dashboard/IdentifierNormalizer.cs`.
- NormalizeDataSource: maps legacy aliases to canonical WidgetTypeDefinitions.DataSources constants
- NormalizeWidgetType: maps legacy chart/widget strings to canonical widget types
- NormalizeChartAlias: additional v1 chart aliases

Always normalize inputs before routing.

## Metadata catalog

`DataSourceManager.Metadata.cs` provides a rich per-data-source catalog:
- SupportedModes, SupportedAggregations, SupportedGranularities
- SupportedGroupBy (ensures "none" exists and is first)
- Defaults and Recommendations (DatePreset, Granularity, CumulativeDefault, SmoothingDefault)
- Category, Units, and compatibility with widget types

Use `IDataSourceMetadataService` when you only need catalog data.

## DI registrations

Both WebClient and PTS Windows Service register the new services:

- IMetricCalculationService → MetricCalculationService
- IWidgetDataTransformerService → WidgetDataTransformerService
- IDataSourceMetadataService → DataSourceMetadataService
- ITimeSeriesDataService → TimeSeriesDataService
- IDataSourceManager → DataSourceManager

Legacy services (IDashboardMetricsService, IWidgetDataService) have been removed. All callers must use IDataSourceManager and related services.

## Notes and edge cases

- Live modes are disabled for metrics that rely on pre-processed GPS aggregates (e.g., FuelUsedGPS).
- Granularity resolution defaults to metadata but may switch to "hour" for short windows based on request.IntervalHours.
- Change calculation compares the previous period of the same duration.

## Next steps

- Migrate remaining callers from the deprecated DashboardMetricsService/IWidgetDataService to IDataSourceManager.
- Add unit tests around IdentifierNormalizer, MetricCalculationService, and TimeSeriesDataService.
- Consider moving transformer helpers to a shared utility to reduce duplication.
