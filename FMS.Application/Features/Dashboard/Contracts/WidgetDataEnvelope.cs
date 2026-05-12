using System;
using System.Collections.Generic;
using FMS.Application.Features.Dashboard.DTOs;

namespace FMS.Application.Features.Dashboard.Contracts {
    /// <summary>
    /// Protocol versioned unified envelope for all widget data transmissions over SignalR.
    /// Phase 2 (dual-send) minimal implementation – Data remains object; later phases can refine shape.
    /// </summary>
    public record WidgetDataEnvelope (
        int WidgetInstanceId,
        string WidgetType,
        string Category,
        string DataSource,
        string Mode,
        string TimeRange,
        string Aggregation,
        string UpdateType,
        bool IsInitialLoad,
        DateTime TimestampUtc,
        object Data,
        WidgetMetadata Metadata,
        IReadOnlyList<string> ? Errors = null,
        IReadOnlyList<string> ? Validation = null,
        int ProtocolVersion = 2,
        object? Debug = null
    );

    public record WidgetMetadata (
        string DisplayName,
        string? Unit,
        bool? SupportsLive,
        bool? SupportsHistorical,
        int? RefreshIntervalSeconds
    );

    /// <summary>
    /// Builder to centralize envelope construction; keeps hub lean.
    /// </summary>
    public static class WidgetEnvelopeBuilder {
        // --- Generic typed overloads (new) ---
        public static WidgetEnvelopeDto<TData> BuildInitial<TData> (
            int widgetInstanceId,
            string widgetType,
            string category,
            string dataSource,
            string mode,
            string timeRange,
            string aggregation,
            TData data,
            WidgetMetadata metadata,
            string? correlationId = null,
            object? debug = null
        ) => new (
            WidgetInstanceId: widgetInstanceId,
            WidgetType: widgetType,
            Category: category,
            DataSource: dataSource,
            Mode: mode,
            TimeRange: timeRange,
            Aggregation: aggregation,
            UpdateType: "initial",
            IsInitialLoad : true,
            TimestampUtc : DateTime.UtcNow,
            Data : data,
            Metadata : MapMetadata (metadata),
            Errors : null,
            Validation : null,
            SchemaVersion : 2,
            CorrelationId : correlationId,
            Debug : debug
        );

        public static WidgetEnvelopeDto<TData> BuildUpdate<TData> (
            int widgetInstanceId,
            string widgetType,
            string category,
            string dataSource,
            string mode,
            string timeRange,
            string aggregation,
            string updateType,
            TData data,
            WidgetMetadata metadata,
            string? correlationId = null,
            object? debug = null
        ) => new (
            WidgetInstanceId: widgetInstanceId,
            WidgetType: widgetType,
            Category: category,
            DataSource: dataSource,
            Mode: mode,
            TimeRange: timeRange,
            Aggregation: aggregation,
            UpdateType: updateType,
            IsInitialLoad: false,
            TimestampUtc: DateTime.UtcNow,
            Data: data,
            Metadata: MapMetadata (metadata),
            Errors: null,
            Validation: null,
            SchemaVersion: 2,
            CorrelationId: correlationId,
            Debug: debug
        );

        public static WidgetEnvelopeDto<object> BuildErrorTyped (
            int widgetInstanceId,
            string widgetType,
            string category,
            string dataSource,
            string updateType,
            IReadOnlyCollection<string> errors,
            IReadOnlyCollection<string> ? validation = null,
            string? correlationId = null
        ) => new (
            WidgetInstanceId: widgetInstanceId,
            WidgetType: widgetType,
            Category: category,
            DataSource: dataSource,
            Mode: string.Empty,
            TimeRange: string.Empty,
            Aggregation: string.Empty,
            UpdateType: updateType,
            IsInitialLoad: updateType == "initial",
            TimestampUtc: DateTime.UtcNow,
            Data: new { },
            Metadata: new WidgetMetadataDto (widgetType, null, null, null, null),
            Errors : errors.Count == 0 ? Array.Empty<string> () : errors is string[] eArr ? eArr : new List<string> (errors).ToArray (),
            Validation : validation == null ? null : (validation.Count == 0 ? Array.Empty<string> () : (validation is string[] vArr ? vArr : new List<string> (validation).ToArray ())),
            SchemaVersion : 2,
            CorrelationId : correlationId,
            Debug : null
        );

        private static WidgetMetadataDto MapMetadata (WidgetMetadata m) =>
            new (m.DisplayName, m.Unit, m.SupportsLive, m.SupportsHistorical, m.RefreshIntervalSeconds);

        public static WidgetDataEnvelope BuildInitial (
            int widgetInstanceId,
            string widgetType,
            string category,
            string dataSource,
            string mode,
            string timeRange,
            string aggregation,
            object data,
            WidgetMetadata metadata,
            object? debug = null) => new (
            WidgetInstanceId: widgetInstanceId,
            WidgetType: widgetType,
            Category: category,
            DataSource: dataSource,
            Mode: mode,
            TimeRange: timeRange,
            Aggregation: aggregation,
            UpdateType: "initial",
            IsInitialLoad : true,
            TimestampUtc : DateTime.UtcNow,
            Data : data,
            Metadata : metadata,
            Errors : null,
            Validation : null,
            ProtocolVersion : 2,
            Debug : debug);

        // Wrapper with distinct name to avoid ambiguity with generic overloads
        public static WidgetDataEnvelope BuildInitialUntyped (
            int widgetInstanceId,
            string widgetType,
            string category,
            string dataSource,
            string mode,
            string timeRange,
            string aggregation,
            object data,
            WidgetMetadata metadata,
            object? debug = null) => BuildInitial (
            widgetInstanceId,
            widgetType,
            category,
            dataSource,
            mode,
            timeRange,
            aggregation,
            data,
            metadata,
            debug);

        public static WidgetDataEnvelope BuildUpdate (
            int widgetInstanceId,
            string widgetType,
            string category,
            string dataSource,
            string mode,
            string timeRange,
            string aggregation,
            string updateType,
            object data,
            WidgetMetadata metadata,
            object? debug = null) => new (
            WidgetInstanceId: widgetInstanceId,
            WidgetType: widgetType,
            Category: category,
            DataSource: dataSource,
            Mode: mode,
            TimeRange: timeRange,
            Aggregation: aggregation,
            UpdateType: updateType,
            IsInitialLoad: false,
            TimestampUtc: DateTime.UtcNow,
            Data: data,
            Metadata: metadata,
            Errors: null,
            Validation: null,
            ProtocolVersion: 2,
            Debug: debug);

        // Wrapper with distinct name to avoid ambiguity with generic overloads
        public static WidgetDataEnvelope BuildUpdateUntyped (
            int widgetInstanceId,
            string widgetType,
            string category,
            string dataSource,
            string mode,
            string timeRange,
            string aggregation,
            string updateType,
            object data,
            WidgetMetadata metadata,
            object? debug = null) => BuildUpdate (
            widgetInstanceId,
            widgetType,
            category,
            dataSource,
            mode,
            timeRange,
            aggregation,
            updateType,
            data,
            metadata,
            debug);

        public static WidgetDataEnvelope BuildError (
            int widgetInstanceId,
            string widgetType,
            string category,
            string dataSource,
            string updateType,
            IReadOnlyCollection<string> errors,
            IReadOnlyCollection<string> ? validation = null) => new (
            WidgetInstanceId: widgetInstanceId,
            WidgetType: widgetType,
            Category: category,
            DataSource: dataSource,
            Mode: string.Empty,
            TimeRange: string.Empty,
            Aggregation: string.Empty,
            UpdateType: updateType,
            IsInitialLoad: updateType == "initial",
            TimestampUtc: DateTime.UtcNow,
            Data: new { },
            Metadata: new WidgetMetadata (widgetType, null, null, null, null),
            Errors : errors.Count == 0 ? Array.Empty<string> () : errors is string[] eArr ? eArr : new List<string> (errors).ToArray (),
            Validation : validation == null ? null : (validation.Count == 0 ? Array.Empty<string> () : (validation is string[] vArr ? vArr : new List<string> (validation).ToArray ())),
            ProtocolVersion : 2,
            Debug : null);
    }
}