using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using FMS.Domain.Entities.Dashboard;

namespace FMS.Application.Services.Dashboard
{
    public class WidgetDataTransformerService : IWidgetDataTransformerService
    {
        public async Task<object> TransformAsync(string widgetType, object rawData, Dictionary<string, object> configuration)
        {
            configuration = configuration ?? new Dictionary<string, object>();
            var normalized = IdentifierNormalizer.NormalizeChartAlias(widgetType);
            var key = IdentifierNormalizer.NormalizeWidgetType(normalized);

            return key
            switch
            {
                WidgetTypeDefinitions.KEY_STAT_TICKER => TransformForTicker(rawData, configuration),
                WidgetTypeDefinitions.BIG_STAT_CARD => TransformForBigStatCard(rawData, configuration),
                WidgetTypeDefinitions.LINE_CHART => TransformForLineChart(rawData, configuration),
                WidgetTypeDefinitions.BAR_CHART => TransformForBarChart(rawData, configuration),
                WidgetTypeDefinitions.PIE_CHART => TransformForPieChart(rawData, configuration),
                WidgetTypeDefinitions.GAUGE_CHART => TransformForGaugeChart(rawData, configuration),
                WidgetTypeDefinitions.STAT_CARD_WITH_TREND => TransformForStatCardWithTrend(rawData, configuration),
                WidgetTypeDefinitions.DATA_TABLE => await TransformForDataTable(rawData, configuration),
                WidgetTypeDefinitions.PROGRESS_LIST => await TransformForProgressList(rawData, configuration),
                _ => rawData
            };
        }

        private object TransformForTicker(object rawData, Dictionary<string, object> configuration)
        {
            var items = MaterializeEnumerable(GetMemberValue(rawData, "items", "entries", "messages", "values"));
            var maxItems = int.MaxValue;
            if (configuration != null && configuration.TryGetValue("maxItems", out var maxItemsObj) && int.TryParse(maxItemsObj?.ToString(), out var configuredMax) && configuredMax > 0)
            {
                maxItems = configuredMax;
            }
            if (items.Count == 0)
            {
                items = MaterializeEnumerable(rawData);
            }

            if (items.Count == 0)
            {
                var currentFallback = ExtractCurrent(rawData);
                return new[]
                {
                    new
                    {
                        id = "current",
                        text = string.Format(System.Globalization.CultureInfo.InvariantCulture, "{0} {1}", currentFallback.value, currentFallback.unit).Trim(),
                        timestamp = currentFallback.timestamp,
                        source = "system",
                        type = "value"
                    }
                };
            }

            var transformed = new List<object>();
            var index = 0;
            foreach (var entry in items)
            {
                if (index >= maxItems)
                {
                    break;
                }
                if (entry == null)
                {
                    continue;
                }

                if (entry is string textValue)
                {
                    transformed.Add(new
                    {
                        id = $"ticker-{index}",
                        text = textValue,
                        timestamp = DateTime.UtcNow,
                        source = "system",
                        type = "text"
                    });
                    index++;
                    continue;
                }

                var textObj = GetMemberValue(entry, "text", "message", "title", "value", "label", "content");
                var timestampObj = GetMemberValue(entry, "timestamp", "createdAt", "occurredAt", "time");
                var sourceObj = GetMemberValue(entry, "source", "origin", "category");
                var typeObj = GetMemberValue(entry, "type", "level", "severity");
                var idObj = GetMemberValue(entry, "id", "key", "code");

                DateTime resolvedTimestamp = DateTime.UtcNow;
                if (timestampObj is DateTime ts)
                {
                    resolvedTimestamp = ts;
                }
                else if (DateTime.TryParse(timestampObj?.ToString(), out var parsedTs))
                {
                    resolvedTimestamp = parsedTs;
                }

                var text = textObj?.ToString() ?? entry.ToString();
                var identifier = idObj?.ToString() ?? $"ticker-{index}";

                transformed.Add(new
                {
                    id = identifier,
                    text,
                    timestamp = resolvedTimestamp,
                    source = sourceObj?.ToString(),
                    type = typeObj?.ToString()
                });
                index++;
            }

            return transformed;
        }

        private object TransformForBigStatCard(object rawData, Dictionary<string, object> configuration)
        {
            var current = ExtractCurrent(rawData);
            var timeSeries = ExtractTimeSeries(rawData);
            var change = ExtractChange(rawData);
            var metadata = ExtractMetadata(rawData);
            var (changeValue, changePercentage, changeDirection) = NormalizeChange(change);
            var period = ResolvePeriod(rawData, configuration);

            var resolvedValue = current.value;
            if (resolvedValue == 0m)
            {
                var seriesTotal = timeSeries.Sum(point => point.value);
                if (seriesTotal > 0m)
                {
                    resolvedValue = seriesTotal;
                }
                else
                {
                    var fallbackValue = TryDecimal(GetMemberValue(rawData, "value", "Value", "total", "Total"));
                    if (fallbackValue.HasValue)
                    {
                        resolvedValue = fallbackValue.Value;
                    }
                }
            }

            decimal? previousValue = null;
            if (changeValue != 0m)
            {
                previousValue = resolvedValue - changeValue;
            }

            var timestampSource = current.timestamp == default && timeSeries.Count > 0
                ? timeSeries[^1].timestamp
                : current.timestamp;

            if (timestampSource == default)
            {
                timestampSource = DateTime.UtcNow;
            }

            var resolvedTimestamp = ResolveTimestamp(rawData, timestampSource);
            var (utc, local) = NormalizeTimestamp(resolvedTimestamp);

            return new
            {
                value = resolvedValue,
                unit = ResolveUnit(metadata, rawData, current.unit),
                trend = new { direction = changeDirection, percentage = changePercentage ?? 0m, value = changeValue },
                previousValue,
                change = new { value = changeValue, percentage = changePercentage, direction = changeDirection },
                period,
                lastUpdated = local,
                timestampUtc = utc,
                metadata
            };
        }

        private object TransformForLineChart(object rawData, Dictionary<string, object> configuration)
        {
            var series = ExtractTimeSeries(rawData) ?? new List<(DateTime timestamp, decimal value)>();
            var orderedSeries = series
                .Where(point => point.timestamp != default)
                .OrderBy(point => point.timestamp)
                .ToList();

            var timeSeries = orderedSeries
                .Select(point =>
                {
                    var (utc, local) = NormalizeTimestamp(point.timestamp);
                    return new
                    {
                        timestampUtc = utc,
                        timestampLocal = local,
                        value = point.value
                    };
                })
                .ToList();

            var chartData = timeSeries
                .Select(p => new { argument = p.timestampUtc, value = p.value })
                .ToList();

            var current = ExtractCurrent(rawData);
            var metadata = ExtractMetadata(rawData);
            var summary = BuildLineSummary(orderedSeries);

            var timestampSource = current.timestamp == default ? DateTime.UtcNow : current.timestamp;
            var resolvedTimestamp = ResolveTimestamp(rawData, timestampSource);
            var (resolvedUtc, resolvedLocal) = NormalizeTimestamp(resolvedTimestamp);

            return new
            {
                series = new[] { new { name = "Series", points = timeSeries } },
                timeSeries,
                chartData,
                unit = ResolveUnit(metadata, rawData, current.unit),
                lastUpdated = resolvedLocal,
                timestampUtc = resolvedUtc,
                metadata,
                summary
            };
        }

        private object TransformForBarChart(object rawData, Dictionary<string, object> configuration)
        {
            var timeSeriesPoints = ExtractTimeSeries(rawData);
            var categories = ExtractCategories(rawData);
            var metadata = ExtractMetadata(rawData);

            if (categories.Count == 0 && timeSeriesPoints.Count > 0)
            {
                categories = BuildCategoriesFromTimeSeries(timeSeriesPoints, configuration);
            }

            var limit = categories.Count;
            if (configuration != null)
            {
                if (configuration.TryGetValue("maxItems", out var maxItemsObj) && int.TryParse(maxItemsObj?.ToString(), out var maxItems) && maxItems > 0)
                {
                    limit = Math.Min(limit, maxItems);
                }
                else if (configuration.TryGetValue("top", out var topObj) && int.TryParse(topObj?.ToString(), out var top) && top > 0)
                {
                    limit = Math.Min(limit, top);
                }
            }

            limit = Math.Max(limit, 0);

            var series = new List<object>();
            var chartData = new List<object>();
            var total = 0m;
            (string label, decimal value, decimal percentage)? highest = null;
            (string label, decimal value, decimal percentage)? lowest = null;

            for (var index = 0; index < categories.Count && index < limit; index++)
            {
                var category = categories[index];
                var categoryLabel = string.IsNullOrWhiteSpace(category.key) ? $"Category {index + 1}" : category.key;

                var seriesEntry = new { category = categoryLabel, value = category.value, percentage = category.percent };
                var chartEntry = new { argument = categoryLabel, value = category.value };

                series.Add(seriesEntry);
                chartData.Add(chartEntry);
                total += category.value;

                if (!highest.HasValue || category.value > highest.Value.value)
                {
                    highest = (categoryLabel, category.value, category.percent);
                }

                if (!lowest.HasValue || category.value < lowest.Value.value)
                {
                    lowest = (categoryLabel, category.value, category.percent);
                }
            }

            var average = series.Count > 0 ? Math.Round(total / series.Count, 2) : 0m;

            var summary = series.Count == 0
                ? null
                : new
                {
                    total,
                    average,
                    highest = !highest.HasValue ? null : new { label = highest.Value.label, value = highest.Value.value, percentage = highest.Value.percentage },
                    lowest = !lowest.HasValue ? null : new { label = lowest.Value.label, value = lowest.Value.value, percentage = lowest.Value.percentage }
                };

            var timeSeriesPayload = new List<object>(timeSeriesPoints.Count);
            DateTime? lastTimestampUtc = null;
            DateTime? lastTimestampLocal = null;

            foreach (var point in timeSeriesPoints)
            {
                var (utc, local) = NormalizeTimestamp(point.timestamp);
                timeSeriesPayload.Add(new { timestampUtc = utc, timestampLocal = local, value = point.value });
                lastTimestampUtc = utc;
                lastTimestampLocal = local;
            }

            var fallbackTimestamp = lastTimestampUtc ?? DateTime.UtcNow;
            var resolvedTimestamp = ResolveTimestamp(rawData, fallbackTimestamp);
            var (resolvedUtc, resolvedLocal) = NormalizeTimestamp(resolvedTimestamp);
            if (lastTimestampUtc.HasValue)
            {
                resolvedUtc = lastTimestampUtc.Value;
                if (lastTimestampLocal.HasValue)
                {
                    resolvedLocal = lastTimestampLocal.Value;
                }
            }

            var fallbackUnit = GetMemberValue(rawData, "unit", "Unit")?.ToString();

            return new
            {
                series,
                chartData,
                timeSeries = timeSeriesPayload,
                total,
                summary,
                unit = ResolveUnit(metadata, rawData, GetSafeUnit(fallbackUnit)),
                metadata,
                lastUpdated = resolvedLocal,
                timestampUtc = resolvedUtc
            };
        }

        private object TransformForPieChart(object rawData, Dictionary<string, object> configuration)
        {
            List<(string key, decimal value, decimal percent)> categories = ExtractCategories(rawData);
            object? metadata = ExtractMetadata(rawData);

            // If no categories found (groupBy='none'), convert time-series to categories
            if (categories.Count == 0)
            {
                var timeSeries = ExtractTimeSeries(rawData);
                if (timeSeries.Count > 0)
                {
                    // Convert time-series points to categorical slices for pie chart
                    decimal timeSeriesTotal = timeSeries.Sum(p => p.value);
                    categories = timeSeries
                        .Select(p =>
                        {
                            var label = p.timestamp.ToString("MMM dd", System.Globalization.CultureInfo.InvariantCulture);
                            var percent = timeSeriesTotal > 0 ? Math.Round((p.value / timeSeriesTotal) * 100m, 2) : 0m;
                            return (key: label, value: p.value, percent: percent);
                        })
                        .ToList();
                }
            }

            int limit = categories.Count;
            if (configuration != null)
            {
                if (configuration.TryGetValue("maxSlices", out object maxSlicesObj) && int.TryParse(maxSlicesObj?.ToString(), out int maxSlices) && maxSlices > 0)
                {
                    limit = Math.Min(limit, maxSlices);
                }
                else if (configuration.TryGetValue("top", out object topObj) && int.TryParse(topObj?.ToString(), out int top) && top > 0)
                {
                    limit = Math.Min(limit, top);
                }
            }

            bool includeOthers = true;
            if (configuration != null && configuration.TryGetValue("includeOthers", out object includeOthersObj) && includeOthersObj is bool includeOthersFlag)
            {
                includeOthers = includeOthersFlag;
            }

            List<object> slices = new();
            decimal total = 0m;
            decimal othersValue = 0m;
            decimal othersPercent = 0m;
            decimal dominantValue = decimal.MinValue;
            string dominantLabel = string.Empty;

            for (int index = 0; index < categories.Count; index++)
            {
                (string key, decimal value, decimal percent) category = categories[index];
                string label = string.IsNullOrWhiteSpace(category.key) ? $"Category {index + 1}" : category.key;

                total += category.value;

                if (index < limit)
                {
                    object slice = new
                    {
                        category = label,
                        label,
                        value = category.value,
                        percentage = category.percent
                    };

                    slices.Add(slice);

                    if (category.value > dominantValue)
                    {
                        dominantValue = category.value;
                        dominantLabel = label;
                    }
                }
                else
                {
                    othersValue += category.value;
                    othersPercent += category.percent;
                }
            }

            if (includeOthers && othersValue > 0m)
            {
                decimal roundedOthersPercent = Math.Round(othersPercent, 2);
                slices.Add(new { category = "Others", label = "Others", value = othersValue, percentage = roundedOthersPercent });

                if (othersValue > dominantValue)
                {
                    dominantValue = othersValue;
                    dominantLabel = "Others";
                }
            }

            decimal roundedTotal = Math.Round(total, 2);
            string? fallbackUnit = GetMemberValue(rawData, "unit", "Unit")?.ToString();
            DateTime lastUpdated = ResolveTimestamp(rawData, DateTime.UtcNow);

            object? summary = slices.Count == 0
                ? null
                : new
                {
                    total = roundedTotal,
                    dominantCategory = dominantLabel,
                    dominantValue = Math.Round(dominantValue, 2),
                    categories = slices.Count
                };

            return new
            {
                slices,
                total = roundedTotal,
                summary,
                unit = ResolveUnit(metadata, rawData, GetSafeUnit(fallbackUnit)),
                metadata,
                lastUpdated
            };
        }

        private object TransformForGaugeChart(object rawData, Dictionary<string, object> configuration)
        {
            var current = ExtractCurrent(rawData);
            var metadata = ExtractMetadata(rawData);

            decimal min = TryDecimal(GetMemberValue(rawData, "min", "Min", "minimum", "Minimum", "lowerBound", "LowerBound")) ?? 0m;
            decimal max = TryDecimal(GetMemberValue(rawData, "max", "Max", "maximum", "Maximum", "upperBound", "UpperBound")) ?? Math.Max(current.value, min + 1m);

            if (configuration != null)
            {
                if (configuration.TryGetValue("min", out var minObj) && TryDecimal(minObj) is decimal configuredMin)
                {
                    min = configuredMin;
                }

                if (configuration.TryGetValue("max", out var maxObj) && TryDecimal(maxObj) is decimal configuredMax)
                {
                    max = configuredMax;
                }
            }

            if (max <= min)
            {
                max = min + Math.Max(1m, Math.Abs(current.value));
            }

            var target = TryDecimal(GetMemberValue(rawData, "target", "Target", "goal", "Goal", "expected", "Expected"));
            var warning = TryDecimal(GetMemberValue(rawData, "warningThreshold", "WarningThreshold", "warning", "Warning"));
            var critical = TryDecimal(GetMemberValue(rawData, "criticalThreshold", "CriticalThreshold", "critical", "Critical"));
            var statusObj = GetMemberValue(rawData, "status", "Status", "state", "State");
            var status = statusObj?.ToString();

            if (string.IsNullOrWhiteSpace(status))
            {
                status = critical.HasValue && current.value >= critical.Value
                    ? "critical"
                    : warning.HasValue && current.value >= warning.Value
                        ? "warning"
                        : "normal";
            }

            var segments = new List<object>();
            var rawSegments = ExtractNamedCollection(rawData, "segments", "Segments", "ranges", "Ranges");
            if (rawSegments.Count > 0)
            {
                var segmentIndex = 0;
                foreach (var segment in rawSegments)
                {
                    var start = TryDecimal(GetMemberValue(segment, "start", "Start", "from", "From")) ?? min;
                    var end = TryDecimal(GetMemberValue(segment, "end", "End", "to", "To")) ?? max;
                    var label = GetMemberValue(segment, "label", "Label", "name", "Name")?.ToString() ?? $"Range {segmentIndex + 1}";
                    var color = GetMemberValue(segment, "color", "Color", "hex", "Hex")?.ToString();

                    segments.Add(new
                    {
                        id = $"segment-{segmentIndex}",
                        label,
                        start,
                        end,
                        color
                    });
                    segmentIndex++;
                }
            }
            else
            {
                if (warning.HasValue)
                {
                    var warningEnd = critical ?? max;
                    segments.Add(new { id = "warning", label = "Warning", start = warning.Value, end = warningEnd, color = "#f0ad4e" });
                }

                if (critical.HasValue)
                {
                    segments.Add(new { id = "critical", label = "Critical", start = critical.Value, end = max, color = "#d9534f" });
                }
            }

            var clampedValue = Math.Clamp(current.value, min, max);
            var percentage = max > min ? Math.Round(((clampedValue - min) / (max - min)) * 100m, 2) : 0m;
            var lastUpdated = ResolveTimestamp(rawData, current.timestamp);
            var resolvedUnit = ResolveUnit(metadata, rawData, current.unit);

            return new
            {
                value = clampedValue,
                unit = resolvedUnit,
                min,
                max,
                percentage,
                status,
                target,
                thresholds = new { warning, critical },
                segments,
                metadata,
                lastUpdated
            };
        }

        private object TransformForStatCardWithTrend(object rawData, Dictionary<string, object> configuration)
        {
            var current = ExtractCurrent(rawData);
            var metadata = ExtractMetadata(rawData);
            var series = ExtractTimeSeries(rawData);
            var change = ExtractChange(rawData);
            var (changeValue, changePercentage, changeDirection) = NormalizeChange(change);
            var ordered = series.OrderBy(point => point.timestamp).ToList();
            var sparkline = ordered.Select(point => new { timestampUtc = point.timestamp, value = point.value }).ToList();
            var summary = BuildLineSummary(ordered);
            var (utc, local) = NormalizeTimestamp(current.timestamp);
            var displayMode = configuration != null && configuration.TryGetValue("displayMode", out var modeObj) ? modeObj?.ToString() : null;

            return new
            {
                value = current.value,
                unit = ResolveUnit(metadata, rawData, current.unit),
                change = new { value = changeValue, percentage = changePercentage, direction = changeDirection },
                trend = new { direction = changeDirection, percentage = changePercentage ?? 0m, value = changeValue },
                sparkline,
                summary,
                displayMode,
                metadata,
                lastUpdated = local,
                timestampUtc = utc
            };
        }

        private Task<object> TransformForDataTable(object rawData, Dictionary<string, object> configuration)
        {
            var metadata = ExtractMetadata(rawData);
            var lastUpdated = ResolveTimestamp(rawData, DateTime.UtcNow);
            var columns = ExtractNamedCollection(rawData, "columns", "Columns");
            var summary = GetMemberValue(rawData, "summary", "Summary");
            var total = GetMemberValue(rawData, "total", "Total");
            var rows = new List<object>();
            var maxRows = int.MaxValue;
            if (configuration != null && configuration.TryGetValue("maxRows", out var maxRowsObj) && int.TryParse(maxRowsObj?.ToString(), out var configuredMax) && configuredMax > 0)
            {
                maxRows = configuredMax;
            }

            var explicitRows = ExtractNamedCollection(rawData, "rows", "Rows", "items", "Items", "data", "Data", "entries", "Entries");
            if (explicitRows.Count > 0)
            {
                for (var index = 0; index < explicitRows.Count && index < maxRows; index++)
                {
                    var entry = explicitRows[index];
                    if (entry == null)
                    {
                        continue;
                    }

                    var normalized = ConvertToDictionary(entry);
                    normalized.TryAdd("rowIndex", index + 1);
                    rows.Add(normalized);
                }
            }
            else
            {
                var categories = ExtractCategories(rawData);
                if (categories.Count > 0)
                {
                    var rank = 1;
                    foreach (var category in categories)
                    {
                        if (rank > maxRows)
                        {
                            break;
                        }

                        var label = string.IsNullOrWhiteSpace(category.key) ? $"Item {rank}" : category.key;
                        rows.Add(new { rank, key = category.key, label, value = category.value, percentage = category.percent });
                        rank++;
                    }
                }
                else
                {
                    var series = ExtractTimeSeries(rawData);
                    var ordered = series.OrderBy(point => point.timestamp).ToList();
                    for (var index = 0; index < ordered.Count && index < maxRows; index++)
                    {
                        var point = ordered[index];
                        var (utc, local) = NormalizeTimestamp(point.timestamp);
                        rows.Add(new { index = index + 1, timestampUtc = utc, timestampLocal = local, value = point.value });
                    }
                }
            }

            return Task.FromResult<object>(new
            {
                rows,
                columns,
                summary,
                total,
                metadata,
                lastUpdated
            });
        }

        private Task<object> TransformForProgressList(object rawData, Dictionary<string, object> configuration)
        {
            var metadata = ExtractMetadata(rawData);
            var lastUpdated = ResolveTimestamp(rawData, DateTime.UtcNow);
            var maxItems = int.MaxValue;
            if (configuration != null && configuration.TryGetValue("maxItems", out var maxItemsObj) && int.TryParse(maxItemsObj?.ToString(), out var configuredMax) && configuredMax > 0)
            {
                maxItems = configuredMax;
            }

            var sourceItems = ExtractNamedCollection(rawData, "items", "Items", "entries", "Entries", "list", "List");
            var items = new List<object>();
            var completedCount = 0;
            decimal totalProgress = 0m;

            if (sourceItems.Count > 0)
            {
                for (var index = 0; index < sourceItems.Count && index < maxItems; index++)
                {
                    var entry = sourceItems[index];
                    if (entry == null)
                    {
                        continue;
                    }

                    var normalized = ConvertToDictionary(entry);
                    var id = normalized.TryGetValue("id", out var idObj) ? idObj?.ToString() : null;
                    var name = normalized.TryGetValue("name", out var nameObj) ? nameObj?.ToString() : normalized.TryGetValue("label", out var labelObj) ? labelObj?.ToString() : null;
                    var description = normalized.TryGetValue("description", out var descriptionObj) ? descriptionObj?.ToString() : null;
                    var status = normalized.TryGetValue("status", out var statusObj) ? statusObj?.ToString() : null;
                    var priority = normalized.TryGetValue("priority", out var priorityObj) ? priorityObj?.ToString() : null;

                    decimal progressValue = 0m;
                    if (normalized.TryGetValue("progress", out var progressObj) && TryDecimal(progressObj) is decimal explicitProgress)
                    {
                        progressValue = explicitProgress <= 1m && explicitProgress >= 0m ? explicitProgress * 100m : explicitProgress;
                    }
                    else
                    {
                        var value = normalized.TryGetValue("value", out var valueObj) ? TryDecimal(valueObj) : null;
                        var target = normalized.TryGetValue("target", out var targetObj) ? TryDecimal(targetObj) : null;
                        var max = target ?? TryDecimal(GetMemberValue(rawData, "maximum", "Maximum", "max", "Max", "target", "Target")) ?? 100m;
                        if (value.HasValue && max > 0m)
                        {
                            progressValue = (value.Value / max) * 100m;
                        }
                    }

                    progressValue = Math.Clamp(Math.Round(progressValue, 2), 0m, 100m);
                    totalProgress += progressValue;

                    var dueObj = normalized.TryGetValue("dueDate", out var dueDateObj) ? dueDateObj : null;
                    DateTime? dueDate = null;
                    if (dueObj is DateTime directDue)
                    {
                        dueDate = directDue;
                    }
                    else if (DateTime.TryParse(dueObj?.ToString(), out var parsedDue))
                    {
                        dueDate = parsedDue;
                    }

                    var updatedObj = normalized.TryGetValue("lastUpdated", out var lastUpdatedObj) ? lastUpdatedObj : null;
                    DateTime? itemUpdated = null;
                    if (updatedObj is DateTime directUpdate)
                    {
                        itemUpdated = directUpdate;
                    }
                    else if (DateTime.TryParse(updatedObj?.ToString(), out var parsedUpdate))
                    {
                        itemUpdated = parsedUpdate;
                    }

                    var effectiveStatus = string.IsNullOrWhiteSpace(status)
                        ? progressValue >= 100m ? "completed" : "inprogress"
                        : status;

                    if (string.Equals(effectiveStatus, "completed", StringComparison.OrdinalIgnoreCase))
                    {
                        completedCount++;
                    }

                    items.Add(new
                    {
                        id = id ?? $"item-{index + 1}",
                        name = name ?? $"Item {index + 1}",
                        description,
                        status = effectiveStatus,
                        priority,
                        progress = progressValue,
                        metadata = normalized,
                        dueDate,
                        lastUpdated = itemUpdated
                    });
                }
            }
            else
            {
                var categories = ExtractCategories(rawData);
                if (categories.Count > 0)
                {
                    for (var index = 0; index < categories.Count && index < maxItems; index++)
                    {
                        var category = categories[index];
                        var progressValue = Math.Clamp(Math.Round(category.percent, 2), 0m, 100m);
                        totalProgress += progressValue;
                        if (progressValue >= 100m)
                        {
                            completedCount++;
                        }

                        items.Add(new
                        {
                            id = $"category-{index + 1}",
                            name = string.IsNullOrWhiteSpace(category.key) ? $"Item {index + 1}" : category.key,
                            description = string.Empty,
                            status = progressValue >= 100m ? "completed" : "inprogress",
                            priority = (string?)null,
                            progress = progressValue,
                            metadata = new { value = category.value, percentage = category.percent }
                        });
                    }
                }
                else
                {
                    var series = ExtractTimeSeries(rawData);
                    var ordered = series.OrderBy(point => point.timestamp).ToList();
                    for (var index = 0; index < ordered.Count && index < maxItems; index++)
                    {
                        var point = ordered[index];
                        var progressValue = Math.Clamp(Math.Round(point.value, 2), 0m, 100m);
                        totalProgress += progressValue;
                        if (progressValue >= 100m)
                        {
                            completedCount++;
                        }

                        items.Add(new
                        {
                            id = $"series-{index + 1}",
                            name = point.timestamp.ToString("g"),
                            description = string.Empty,
                            status = progressValue >= 100m ? "completed" : "inprogress",
                            priority = (string?)null,
                            progress = progressValue,
                            metadata = new { point.value, point.timestamp }
                        });
                    }
                }
            }

            var averageProgress = items.Count > 0 ? Math.Round(totalProgress / items.Count, 2) : 0m;

            return Task.FromResult<object>(new
            {
                items,
                summary = new
                {
                    total = items.Count,
                    completed = completedCount,
                    averageProgress
                },
                metadata,
                lastUpdated
            });
        }

        private (decimal value, string unit, DateTime timestamp) ExtractCurrent(object raw)
        {
            if (raw == null)
            {
                return (0m, GetSafeUnit(null), DateTime.UtcNow);
            }

            var currentProp = raw.GetType().GetProperty("current") ?? raw.GetType().GetProperty("Current");
            var node = currentProp?.GetValue(raw) ?? raw;
            var valueObj = GetMemberValue(node, "value", "Value");
            var unitObj = GetMemberValue(node, "unit", "Unit");
            var tsObj = GetMemberValue(node, "timestamp", "Timestamp", "lastUpdated", "LastUpdated");

            var value = TryDecimal(valueObj);
            var unit = unitObj?.ToString() ?? GetSafeUnit(null);
            var ts = tsObj is DateTime dt ? dt : DateTime.UtcNow;
            return (value ?? 0m, unit, ts);
        }

        private List<(DateTime timestamp, decimal value)> ExtractTimeSeries(object raw)
        {
            var result = new List<(DateTime, decimal)>();
            if (raw == null)
            {
                return result;
            }

            var seriesObj = GetMemberValue(raw, "timeSeries", "TimeSeries", "dataPoints", "DataPoints");
            if (seriesObj is System.Collections.IEnumerable enumerable)
            {
                foreach (var item in enumerable)
                {
                    var tVal = GetMemberValue(item, "timestamp", "Timestamp", "timestampUtc", "TimestampUtc");
                    var vVal = GetMemberValue(item, "value", "Value", "amount", "Amount");

                    DateTime timestamp = DateTime.UtcNow;
                    if (tVal is DateTime dt)
                    {
                        timestamp = dt;
                    }
                    else if (DateTime.TryParse(tVal?.ToString(), out var parsed))
                    {
                        timestamp = parsed;
                    }

                    var value = TryDecimal(vVal) ?? 0m;

                    result.Add((timestamp, value));
                }
            }

            return result;
        }

        private List<(string key, decimal value, decimal percent)> ExtractCategories(object raw)
        {
            var result = new List<(string, decimal, decimal)>();
            if (raw == null)
            {
                return result;
            }

            var listObj = GetMemberValue(raw, "categories", "Categories", "items", "Items");
            if (listObj is System.Collections.IEnumerable enumerable)
            {
                decimal total = 0m;
                foreach (var item in enumerable)
                {
                    var vVal = GetMemberValue(item, "value", "Value", "amount", "Amount");
                    var value = TryDecimal(vVal) ?? 0m;
                    total += value;
                }

                foreach (var item in enumerable)
                {
                    var keyVal = GetMemberValue(item, "key", "Key", "name", "Name");
                    var vVal = GetMemberValue(item, "value", "Value", "amount", "Amount");
                    var pVal = GetMemberValue(item, "percent", "Percent", "percentage", "Percentage");

                    var key = keyVal?.ToString() ?? string.Empty;
                    var value = TryDecimal(vVal) ?? 0m;
                    decimal percent;

                    if (pVal != null && decimal.TryParse(pVal.ToString(), out var parsedPercent))
                    {
                        percent = parsedPercent;
                    }
                    else
                    {
                        percent = total > 0 ? Math.Round((value / total) * 100m, 2) : 0m;
                    }

                    result.Add((key, value, percent));
                }
            }

            return result;
        }

        private static decimal? TryDecimal(object? obj)
        {
            if (obj == null)
            {
                return null;
            }

            if (obj is decimal d)
            {
                return d;
            }

            if (obj is int i)
            {
                return i;
            }

            if (obj is long l)
            {
                return l;
            }

            if (obj is double db)
            {
                return (decimal)db;
            }

            if (decimal.TryParse(obj.ToString(), out var parsed))
            {
                return parsed;
            }

            return null;
        }

        private string GetSafeUnit(string? unit) => string.IsNullOrWhiteSpace(unit) ? "units" : unit;

        private object ExtractChange(object raw)
        {
            if (raw == null)
            {
                return new { value = 0m, percentage = 0m, direction = "stable" };
            }

            var changeProp = raw.GetType().GetProperty("change") ?? raw.GetType().GetProperty("Change");
            var changeObj = changeProp?.GetValue(raw);
            if (changeObj != null)
            {
                var valueProp = changeObj.GetType().GetProperty("value") ?? changeObj.GetType().GetProperty("Value");
                var percentProp = changeObj.GetType().GetProperty("percentage") ?? changeObj.GetType().GetProperty("percent") ?? changeObj.GetType().GetProperty("Percentage");
                var directionProp = changeObj.GetType().GetProperty("direction") ?? changeObj.GetType().GetProperty("Direction");

                var value = TryDecimal(valueProp?.GetValue(changeObj)) ?? 0m;
                var percent = TryDecimal(percentProp?.GetValue(changeObj)) ?? 0m;
                var direction = directionProp?.GetValue(changeObj)?.ToString() ?? (value == 0 ? "stable" : value > 0 ? "up" : "down");

                return new { value, percentage = percent, direction };
            }

            var series = ExtractTimeSeries(raw);
            if (series.Count >= 2)
            {
                var last = series[^1].value;
                var previous = series[^2].value;
                var delta = last - previous;
                var percent = previous == 0 ? (last == 0 ? 0m : 100m) : Math.Round((delta / previous) * 100m, 2);
                var direction = delta == 0 ? "stable" : delta > 0 ? "up" : "down";

                return new { value = delta, percentage = percent, direction };
            }

            return new { value = 0m, percentage = 0m, direction = "stable" };
        }

        private static (DateTime utc, DateTime local) NormalizeTimestamp(DateTime timestamp)
        {
            if (timestamp == default)
            {
                var now = DateTime.UtcNow;
                return (now, now.ToLocalTime());
            }

            switch (timestamp.Kind)
            {
                case DateTimeKind.Utc:
                    return (timestamp, timestamp.ToLocalTime());
                case DateTimeKind.Local:
                    return (timestamp.ToUniversalTime(), timestamp);
                default:
                    var local = DateTime.SpecifyKind(timestamp, DateTimeKind.Local);
                    return (local.ToUniversalTime(), local);
            }
        }

        private object? ExtractMetadata(object raw)
        {
            var metaObj = GetMemberValue(raw, "metadata", "Metadata");
            return metaObj;
        }

        private object? BuildLineSummary(List<(DateTime timestamp, decimal value)> series)
        {
            if (series == null || series.Count == 0)
            {
                return null;
            }

            var ordered = series.OrderBy(p => p.timestamp).ToList();
            var rawTotal = ordered.Sum(p => p.value);
            var total = Math.Round(rawTotal, 2);
            var average = ordered.Count > 0 ? Math.Round(rawTotal / ordered.Count, 2) : 0m;
            var minPoint = ordered.MinBy(p => p.value);
            var maxPoint = ordered.MaxBy(p => p.value);
            var trend = CalculateTrend(ordered);

            return new
            {
                total,
                average,
                min = new { value = minPoint.value, timestamp = minPoint.timestamp },
                max = new { value = maxPoint.value, timestamp = maxPoint.timestamp },
                trend
            };
        }

        private object CalculateTrend(List<(DateTime timestamp, decimal value)> orderedSeries)
        {
            if (orderedSeries == null || orderedSeries.Count < 2)
            {
                return new { direction = "stable", percentage = 0m, value = 0m };
            }

            var first = orderedSeries.First().value;
            var last = orderedSeries.Last().value;
            var delta = last - first;
            var percentage = first == 0m ? (last == 0m ? 0m : 100m) : Math.Round((delta / first) * 100m, 2);
            var direction = delta == 0m ? "stable" : (delta > 0m ? "up" : "down");

            return new { direction, percentage, value = Math.Round(delta, 2) };
        }
        private static List<object> MaterializeEnumerable(object? candidate)
        {
            var list = new List<object>();
            if (candidate == null || candidate is string)
            {
                return list;
            }

            if (candidate is IEnumerable enumerable)
            {
                foreach (var entry in enumerable)
                {
                    list.Add(entry);
                }
            }

            return list;
        }

        private List<object> ExtractNamedCollection(object? source, params string[] memberNames)
        {
            if (source == null)
            {
                return new List<object>();
            }

            foreach (var name in memberNames)
            {
                var candidate = GetMemberValue(source, name);
                var materialized = MaterializeEnumerable(candidate);
                if (materialized.Count > 0)
                {
                    return materialized;
                }
            }

            return MaterializeEnumerable(source);
        }

        private List<(string key, decimal value, decimal percent)> BuildCategoriesFromTimeSeries(List<(DateTime timestamp, decimal value)> timeSeries, Dictionary<string, object> configuration)
        {
            if (timeSeries == null || timeSeries.Count == 0)
            {
                return new List<(string, decimal, decimal)>();
            }

            decimal total = timeSeries.Sum(point => point.value);
            var categories = new List<(string, decimal, decimal)>(timeSeries.Count);

            foreach (var point in timeSeries)
            {
                var normalized = NormalizeTimestamp(point.timestamp);
                string label = FormatCategoryLabel(normalized.local, configuration);
                decimal percentage = total > 0m ? Math.Round(point.value / total * 100m, 2) : 0m;
                categories.Add((label, point.value, percentage));
            }

            return categories;
        }

        private string FormatCategoryLabel(DateTime timestampLocal, Dictionary<string, object> configuration)
        {
            if (configuration != null && configuration.TryGetValue("categoryLabelFormat", out object? formatObj) && formatObj is string format && !string.IsNullOrWhiteSpace(format))
            {
                try
                {
                    return timestampLocal.ToString(format, CultureInfo.InvariantCulture);
                }
                catch
                {
                    // Intentionally ignored - fallback will be used below.
                }
            }

            return timestampLocal.ToString("MMM dd", CultureInfo.InvariantCulture);
        }

        private Dictionary<string, object?> ConvertToDictionary(object entry)
        {
            var dictionary = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);

            if (entry is IDictionary rawDictionary)
            {
                foreach (DictionaryEntry pair in rawDictionary)
                {
                    if (pair.Key == null)
                    {
                        continue;
                    }

                    dictionary[pair.Key.ToString() ?? string.Empty] = pair.Value;
                }

                return dictionary;
            }

            var type = entry.GetType();
            foreach (var property in type.GetProperties())
            {
                dictionary[property.Name] = property.GetValue(entry);
            }

            return dictionary;
        }

        private (decimal value, decimal? percentage, string direction) NormalizeChange(object change)
        {
            if (change == null)
            {
                return (0m, null, "stable");
            }

            var changeType = change.GetType();
            var value = TryDecimal(changeType.GetProperty("value")?.GetValue(change)) ?? 0m;
            var percentage = TryDecimal(changeType.GetProperty("percentage")?.GetValue(change));
            var directionObj = changeType.GetProperty("direction")?.GetValue(change);
            var direction = directionObj?.ToString() ?? (value == 0m ? "stable" : (value > 0m ? "up" : "down"));
            return (value, percentage, direction);
        }

        private string ResolvePeriod(object rawData, Dictionary<string, object> configuration)
        {
            var periodObj = GetMemberValue(rawData, "period", "Period", "timeRange", "TimeRange", "range", "Range");
            if (periodObj != null)
            {
                var periodText = periodObj.ToString();
                if (!string.IsNullOrWhiteSpace(periodText))
                {
                    return periodText;
                }
            }

            if (configuration != null && configuration.TryGetValue("period", out var configPeriod) && configPeriod != null)
            {
                var periodText = configPeriod.ToString();
                if (!string.IsNullOrWhiteSpace(periodText))
                {
                    return periodText;
                }
            }

            return "Current";
        }

        private string ResolveUnit(object? metadata, object rawData, string fallbackUnit)
        {
            var unitCandidate = GetMemberValue(metadata, "unit", "Unit", "units", "Units") ?? GetMemberValue(rawData, "unit", "Unit");
            var unitText = unitCandidate?.ToString();
            return GetSafeUnit(string.IsNullOrWhiteSpace(unitText) ? fallbackUnit : unitText);
        }

        private DateTime ResolveTimestamp(object rawData, DateTime fallback)
        {
            var tsObj = GetMemberValue(rawData, "lastUpdated", "LastUpdated", "timestamp", "Timestamp", "occurredAt", "OccurredAt");
            if (tsObj is DateTime dt)
            {
                return dt;
            }

            if (DateTime.TryParse(tsObj?.ToString(), out var parsed))
            {
                return parsed;
            }

            return fallback;
        }

        private object? GetMemberValue(object? source, params string[] memberNames)
        {
            if (source == null)
            {
                return null;
            }

            foreach (var name in memberNames)
            {
                var prop = source.GetType().GetProperty(name);
                if (prop != null)
                {
                    return prop.GetValue(source);
                }

                if (source is System.Collections.IDictionary dictionary)
                {
                    foreach (System.Collections.DictionaryEntry entry in dictionary)
                    {
                        if (string.Equals(entry.Key?.ToString(), name, StringComparison.OrdinalIgnoreCase))
                        {
                            return entry.Value;
                        }
                    }
                }
            }

            return null;
        }
    }
}