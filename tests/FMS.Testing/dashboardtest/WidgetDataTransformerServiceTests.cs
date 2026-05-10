using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using FMS.Application.Services.Dashboard;
using FMS.Domain.Entities.Dashboard;
using Xunit;

namespace FMS.Testing
{
    public class WidgetDataTransformerServiceTests
    {
        private static readonly DateTime FixedNow = new DateTime(2025, 9, 29, 12, 0, 0, DateTimeKind.Utc);
        private static readonly Dictionary<string, object> EmptyConfiguration = new Dictionary<string, object>();

        private static JsonDocument ToJson(object obj)
        {
            var json = JsonSerializer.Serialize(obj);
            return JsonDocument.Parse(json);
        }

        [Fact]
        public async Task Transform_Ticker_ProducesFallbackEntryWhenNoItems()
        {
            var service = new WidgetDataTransformerService();
            var raw = new
            {
                current = new { value = 123.45m, unit = "L", timestamp = FixedNow }
            };

            var result = await service.TransformAsync("ticker", raw, EmptyConfiguration);
            using var doc = ToJson(result);
            var root = doc.RootElement;

            Assert.Equal(JsonValueKind.Array, root.ValueKind);
            var entry = root[0];
            Assert.Equal("current", entry.GetProperty("id").GetString());
            Assert.Contains("123.45", entry.GetProperty("text").GetString(), StringComparison.OrdinalIgnoreCase);
            Assert.Equal(FixedNow, entry.GetProperty("timestamp").GetDateTime());
        }

        [Fact]
        public async Task Transform_BigStatCard_ReturnsRichPayload()
        {
            var service = new WidgetDataTransformerService();
            var raw = new
            {
                current = new { value = 88.2m, unit = "%", timestamp = FixedNow },
                change = new { value = 5.5m, percentage = 6.65m, direction = "up" }
            };

            var result = await service.TransformAsync(WidgetTypeDefinitions.BIG_STAT_CARD, raw, EmptyConfiguration);
            using var doc = ToJson(result);
            var root = doc.RootElement;

            Assert.Equal(88.2m, root.GetProperty("value").GetDecimal());
            Assert.Equal("%", root.GetProperty("unit").GetString());
            var change = root.GetProperty("change");
            Assert.Equal(5.5m, change.GetProperty("value").GetDecimal());
            Assert.Equal(6.65m, change.GetProperty("percentage").GetDecimal());
            var trend = root.GetProperty("trend");
            Assert.Equal("up", trend.GetProperty("direction").GetString());
            Assert.Equal(FixedNow, root.GetProperty("timestampUtc").GetDateTime());
        }

        [Fact]
        public async Task Transform_LineChart_ProducesSeriesAndMetadata()
        {
            var service = new WidgetDataTransformerService();
            var raw = new
            {
                timeSeries = new[]
                {
                    new { timestamp = FixedNow.AddMinutes(-1), value = 10m },
                    new { timestamp = FixedNow, value = 15m }
                },
                current = new { value = 15m, unit = "L", timestamp = FixedNow }
            };

            var result = await service.TransformAsync("LINE-CHART", raw, EmptyConfiguration);
            using var doc = ToJson(result);
            var root = doc.RootElement;

            var series = root.GetProperty("series");
            Assert.Equal(1, series.GetArrayLength());
            var points = series[0].GetProperty("points");
            Assert.Equal(2, points.GetArrayLength());
            Assert.Equal(10m, points[0].GetProperty("value").GetDecimal());
            Assert.Equal(15m, points[1].GetProperty("value").GetDecimal());

            var timeSeries = root.GetProperty("timeSeries");
            Assert.Equal(2, timeSeries.GetArrayLength());
            Assert.Equal(FixedNow.AddMinutes(-1), timeSeries[0].GetProperty("timestampUtc").GetDateTime());

            var chartData = root.GetProperty("chartData");
            Assert.Equal(2, chartData.GetArrayLength());
            Assert.Equal(FixedNow.AddMinutes(-1), chartData[0].GetProperty("argument").GetDateTime());

            Assert.Equal("L", root.GetProperty("unit").GetString());
            Assert.Equal(FixedNow.ToLocalTime(), root.GetProperty("lastUpdated").GetDateTime());
            Assert.Equal(FixedNow, root.GetProperty("timestampUtc").GetDateTime());
        }

        [Fact]
        public async Task Transform_BarChart_ComputesSummaryAndSeries()
        {
            var service = new WidgetDataTransformerService();
            var raw = new
            {
                categories = new[]
                {
                    new { key = "A", value = 30m, percent = 60m },
                    new { key = "B", value = 20m, percent = 40m }
                }
            };

            var result = await service.TransformAsync(WidgetTypeDefinitions.BAR_CHART, raw, EmptyConfiguration);
            using var doc = ToJson(result);
            var root = doc.RootElement;

            var series = root.GetProperty("series");
            Assert.Equal(2, series.GetArrayLength());
            Assert.Equal("A", series[0].GetProperty("category").GetString());
            Assert.Equal(30m, series[0].GetProperty("value").GetDecimal());

            var summary = root.GetProperty("summary");
            Assert.Equal(50m, summary.GetProperty("total").GetDecimal());
            Assert.Equal("A", summary.GetProperty("highest").GetProperty("label").GetString());

            var timeSeries = root.GetProperty("timeSeries");
            Assert.Equal(JsonValueKind.Array, timeSeries.ValueKind);
            Assert.Equal(0, timeSeries.GetArrayLength());
        }

        [Fact]
        public async Task Transform_BarChart_DerivesCategoriesFromTimeSeries()
        {
            var service = new WidgetDataTransformerService();
            var raw = new
            {
                timeSeries = new[]
                {
                    new { timestamp = FixedNow.AddHours(-2), value = 12.5m },
                    new { timestamp = FixedNow.AddHours(-1), value = 17.5m }
                }
            };

            var configuration = new Dictionary<string, object>
            {
                ["categoryLabelFormat"] = "HH:mm"
            };

            var result = await service.TransformAsync(WidgetTypeDefinitions.BAR_CHART, raw, configuration);
            using var doc = ToJson(result);
            var root = doc.RootElement;

            var series = root.GetProperty("series");
            Assert.Equal(2, series.GetArrayLength());

            var expectedFirstLabel = FixedNow.AddHours(-2).ToLocalTime().ToString("HH:mm");
            Assert.Equal(expectedFirstLabel, series[0].GetProperty("category").GetString());
            Assert.Equal(12.5m, series[0].GetProperty("value").GetDecimal());

            var timeSeries = root.GetProperty("timeSeries");
            Assert.Equal(2, timeSeries.GetArrayLength());
            Assert.Equal(FixedNow.AddHours(-1), timeSeries[1].GetProperty("timestampUtc").GetDateTime());

            Assert.True(root.TryGetProperty("timestampUtc", out var timestampUtc));
            Assert.Equal(FixedNow.AddHours(-1), timestampUtc.GetDateTime());
        }

        [Fact]
        public async Task Transform_BigStatCard_UsesTimeSeriesWhenCurrentIsZero()
        {
            var service = new WidgetDataTransformerService();
            var raw = new
            {
                current = new { value = 0m, unit = "L", timestamp = default(DateTime) },
                timeSeries = new[]
                {
                    new { timestamp = FixedNow.AddHours(-3), value = 8m },
                    new { timestamp = FixedNow.AddHours(-2), value = 9m },
                    new { timestamp = FixedNow.AddHours(-1), value = 13m }
                },
                change = new { value = 5m, percentage = 25m, direction = "up" }
            };

            var result = await service.TransformAsync(WidgetTypeDefinitions.BIG_STAT_CARD, raw, EmptyConfiguration);
            using var doc = ToJson(result);
            var root = doc.RootElement;

            Assert.Equal(30m, root.GetProperty("value").GetDecimal());
            Assert.Equal(FixedNow.AddHours(-1), root.GetProperty("timestampUtc").GetDateTime());

            var change = root.GetProperty("change");
            Assert.Equal(5m, change.GetProperty("value").GetDecimal());

            var previous = root.GetProperty("previousValue");
            Assert.Equal(25m, previous.GetDecimal());
        }

        [Fact]
        public async Task Transform_PieChart_ProvidesSlicesAndSummary()
        {
            var service = new WidgetDataTransformerService();
            var raw = new
            {
                categories = new[]
                {
                    new { key = "Diesel", value = 100m, percent = 62.5m },
                    new { key = "Petrol", value = 60m, percent = 37.5m }
                }
            };

            var result = await service.TransformAsync(WidgetTypeDefinitions.PIE_CHART, raw, EmptyConfiguration);
            using var doc = ToJson(result);
            var root = doc.RootElement;

            var slices = root.GetProperty("slices");
            Assert.Equal(2, slices.GetArrayLength());
            Assert.Equal("Diesel", slices[0].GetProperty("label").GetString());
            Assert.Equal(160m, root.GetProperty("total").GetDecimal());

            var summary = root.GetProperty("summary");
            Assert.Equal("Diesel", summary.GetProperty("dominantCategory").GetString());
        }

        [Fact]
        public async Task Transform_GaugeChart_ComputesPercentageAndThresholds()
        {
            var service = new WidgetDataTransformerService();
            var raw = new { current = new { value = 75m, unit = "%", timestamp = FixedNow } };
            var configuration = new Dictionary<string, object> { ["min"] = 10m, ["max"] = 90m };

            var result = await service.TransformAsync(WidgetTypeDefinitions.GAUGE_CHART, raw, configuration);
            using var doc = ToJson(result);
            var root = doc.RootElement;

            Assert.Equal(75m, root.GetProperty("value").GetDecimal());
            Assert.Equal("%", root.GetProperty("unit").GetString());
            Assert.Equal(10m, root.GetProperty("min").GetDecimal());
            Assert.Equal(90m, root.GetProperty("max").GetDecimal());
            Assert.Equal(81.25m, root.GetProperty("percentage").GetDecimal());
        }

        [Fact]
        public async Task Transform_StatCardWithTrend_ReturnsSparklineAndChange()
        {
            var service = new WidgetDataTransformerService();
            var raw = new
            {
                current = new { value = 200m, unit = "L", timestamp = FixedNow },
                timeSeries = new[]
                {
                    new { timestamp = FixedNow.AddMinutes(-5), value = 150m },
                    new { timestamp = FixedNow, value = 200m }
                },
                change = new { value = 50m, percentage = 33.33m, direction = "up" }
            };

            var result = await service.TransformAsync(WidgetTypeDefinitions.STAT_CARD_WITH_TREND, raw, EmptyConfiguration);
            using var doc = ToJson(result);
            var root = doc.RootElement;

            Assert.Equal(200m, root.GetProperty("value").GetDecimal());
            var change = root.GetProperty("change");
            Assert.Equal(50m, change.GetProperty("value").GetDecimal());

            var sparkline = root.GetProperty("sparkline");
            Assert.Equal(2, sparkline.GetArrayLength());
            Assert.Equal(FixedNow.AddMinutes(-5), sparkline[0].GetProperty("timestampUtc").GetDateTime());

            var summary = root.GetProperty("summary");
            Assert.Equal(200m, summary.GetProperty("max").GetProperty("value").GetDecimal());
        }

        [Fact]
        public async Task Transform_DataTable_FromCategories_YieldsRankedRows()
        {
            var service = new WidgetDataTransformerService();
            var raw = new
            {
                categories = new[]
                {
                    new { key = "Truck", value = 300m, percent = 60m },
                    new { key = "Car", value = 200m, percent = 40m }
                }
            };

            var result = await service.TransformAsync(WidgetTypeDefinitions.DATA_TABLE, raw, EmptyConfiguration);
            using var doc = ToJson(result);
            var rows = doc.RootElement.GetProperty("rows");

            Assert.Equal(2, rows.GetArrayLength());
            Assert.Equal(1, rows[0].GetProperty("rank").GetInt32());
            Assert.Equal("Truck", rows[0].GetProperty("label").GetString());
        }

        [Fact]
        public async Task Transform_ProgressList_NormalizesCategories()
        {
            var service = new WidgetDataTransformerService();
            var raw = new
            {
                categories = new[]
                {
                    new { key = "Type A", value = 10m, percent = 25m },
                    new { key = "Type B", value = 30m, percent = 75m }
                }
            };

            var result = await service.TransformAsync(WidgetTypeDefinitions.PROGRESS_LIST, raw, EmptyConfiguration);
            using var doc = ToJson(result);
            var root = doc.RootElement;

            var items = root.GetProperty("items");
            Assert.Equal(2, items.GetArrayLength());
            Assert.Equal("Type A", items[0].GetProperty("name").GetString());
            Assert.Equal(25m, items[0].GetProperty("progress").GetDecimal());

            var summary = root.GetProperty("summary");
            Assert.Equal(2, summary.GetProperty("total").GetInt32());
            Assert.Equal(50m, summary.GetProperty("averageProgress").GetDecimal());
        }
    }
}