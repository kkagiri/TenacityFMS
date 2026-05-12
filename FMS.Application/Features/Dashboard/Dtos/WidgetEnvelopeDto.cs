using System;
using System.Collections.Generic;

namespace FMS.Application.Features.Dashboard.DTOs {
    /// <summary>
    /// Generic, versioned envelope contract with typed Data payload.
    /// Mirrors fields from the non-generic WidgetDataEnvelope for compatibility.
    /// </summary>
    public record WidgetEnvelopeDto<TData> (
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
        TData Data,
        WidgetMetadataDto Metadata,
        IReadOnlyList<string> ? Errors = null,
        IReadOnlyList<string> ? Validation = null,
        int SchemaVersion = 2,
        string? CorrelationId = null,
        object? Debug = null
    );

    /// <summary>
    /// Typed metadata DTO (kept separate from existing WidgetMetadata to ease migration).
    /// </summary>
    public record WidgetMetadataDto (
        string DisplayName,
        string? Unit,
        bool? SupportsLive,
        bool? SupportsHistorical,
        int? RefreshIntervalSeconds
    );

    /// <summary>
    /// Error detail (future-ready). Not wired into the envelope yet; we continue to use string lists for now.
    /// </summary>
    public record ErrorDetailDto (
        string Code,
        string Message,
        object? Details = null
    );
}