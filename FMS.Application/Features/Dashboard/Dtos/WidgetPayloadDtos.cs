using System;
using System.Collections.Generic;

namespace FMS.Application.Features.Dashboard.DTOs {
    public record TickerUpdateDto (
        string MetricType,
        decimal Value,
        string Unit,
        DateTime TimestampUtc,
        string FormattedValue
    );

    public record GraphUpdateDto (
        string GraphId,
        string GraphType,
        object DataPoints, // Keep as object for now; can be refined later
        DateTime TimestampUtc
    );

    public record DashboardLayoutDto (
        string UserId,
        object LayoutData,
        DateTime TimestampUtc
    );

    public record DashboardMetricsDto (
        object Metrics,
        DateTime TimestampUtc
    );
}