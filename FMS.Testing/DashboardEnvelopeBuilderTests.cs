using System;
using FMS.Application.Features.Dashboard.Contracts;
using FMS.Application.Features.Dashboard.DTOs;
using Xunit;

namespace FMS.Testing {
    public class DashboardEnvelopeBuilderTests {
        [Fact]
        public void BuildUpdate_Typed_Ticker_Envelope_HasExpectedShape () {
            // Arrange
            var widgetId = 42;
            var widgetType = "ticker";
            var category = "general";
            var dataSource = "fuel_dispense";
            var mode = "live";
            var timeRange = string.Empty;
            var aggregation = "none";
            var updateType = "ticker";
            var metadata = new WidgetMetadata ("Ticker", unit: "L", supportsLive : true, supportsHistorical : true, refreshIntervalSeconds : 30);
            var payload = new TickerUpdateDto ("fuel_dispense", 123.45m, "L", DateTime.UtcNow, "123 L");

            // Act
            var env = WidgetEnvelopeBuilder.BuildUpdate (
                widgetId,
                widgetType,
                category,
                dataSource,
                mode,
                timeRange,
                aggregation,
                updateType,
                payload,
                metadata
            );

            // Assert
            Assert.Equal (widgetId, env.WidgetInstanceId);
            Assert.Equal (widgetType, env.WidgetType);
            Assert.Equal (category, env.Category);
            Assert.Equal (dataSource, env.DataSource);
            Assert.Equal (mode, env.Mode);
            Assert.Equal (timeRange, env.TimeRange);
            Assert.Equal (aggregation, env.Aggregation);
            Assert.Equal (updateType, env.UpdateType);
            Assert.False (env.IsInitialLoad);
            Assert.True (env.TimestampUtc <= DateTime.UtcNow);
            Assert.NotNull (env.Metadata);
            Assert.Equal ("Ticker", env.Metadata.DisplayName);
            Assert.Equal ("L", env.Metadata.Unit);
            Assert.True (env.Metadata.SupportsLive);
            Assert.True (env.Metadata.SupportsHistorical);
            Assert.Equal (30, env.Metadata.RefreshIntervalSeconds);
            Assert.Null (env.Errors);
            Assert.Null (env.Validation);
            Assert.Equal (2, env.SchemaVersion);
            Assert.IsType<TickerUpdateDto> (env.Data);
            Assert.Equal ("fuel_dispense", env.Data.MetricType);
            Assert.Equal (123.45m, env.Data.Value);
            Assert.Equal ("L", env.Data.Unit);
            Assert.Equal ("123 L", env.Data.FormattedValue);
        }

        [Fact]
        public void BuildErrorTyped_ProducesErrorEnvelope () {
            // Arrange
            var errors = new [] { "Something went wrong" };

            // Act
            var env = WidgetEnvelopeBuilder.BuildErrorTyped (
                widgetInstanceId: 0,
                widgetType: "dashboard_overview",
                category: "general",
                dataSource: "dashboard_overview",
                updateType: "error",
                errors : errors
            );

            // Assert
            Assert.Equal ("dashboard_overview", env.WidgetType);
            Assert.Equal ("general", env.Category);
            Assert.Equal ("dashboard_overview", env.DataSource);
            Assert.Equal ("error", env.UpdateType);
            Assert.False (env.IsInitialLoad);
            Assert.NotNull (env.Errors);
            Assert.Single (env.Errors);
            Assert.Equal ("Something went wrong", env.Errors![0]);
            Assert.Null (env.Validation);
            Assert.Equal (2, env.SchemaVersion);
            Assert.NotNull (env.Metadata);
            Assert.Equal ("dashboard_overview", env.Metadata.DisplayName);
        }
    }
}