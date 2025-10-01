using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FMS.Application.Services.Dashboard
{
    // Partial: Widget data transformers (stub implementations to keep build green)
    public partial class DataSourceManager
    {
        private object TransformForTicker(object rawData, Dictionary<string, object> configuration)
        {
            // Expect either { value, unit, timestamp } or { current: { value, unit, timestamp } }
            var current = ExtractCurrent(rawData);
            return new
            {
                value = current.value,
                unit = current.unit,
                timestamp = current.timestamp
            };
        }

        private object TransformForBigStatCard(object rawData, Dictionary<string, object> configuration)
        {
            var current = ExtractCurrent(rawData);
            var change = ExtractChange(rawData);
            return new
            {
                primary = new { value = current.value, unit = current.unit },
                change,
                timestamp = current.timestamp
            };
        }

        private object TransformForLineChart(object rawData, Dictionary<string, object> configuration)
        {
            // Expect { timeSeries: [{ timestamp, value }], metadata }
            var series = ExtractTimeSeries(rawData);
            return new
            {
                series = new[] { new { name = "Series", points = series } }
            };
        }

        private object TransformForBarChart(object rawData, Dictionary<string, object> configuration)
        {
            // Expect categorical distribution: { categories: [{ key, value, percent }], total }
            var categories = ExtractCategories(rawData);
            var items = categories.Select(c => new { category = c.key, value = c.value, percent = c.percent }).ToList();
            return new { items };
        }

        private object TransformForPieChart(object rawData, Dictionary<string, object> configuration)
        {
            var categories = ExtractCategories(rawData);
            var slices = categories.Select(c => new { label = c.key, value = c.value, percent = c.percent }).ToList();
            var total = categories.Sum(c => c.value);
            return new { slices, total };
        }

        private object TransformForGaugeChart(object rawData, Dictionary<string, object> configuration)
        {
            var current = ExtractCurrent(rawData);
            // Optional thresholds from configuration
            configuration = configuration ?? new Dictionary<string, object>();
            configuration.TryGetValue("min", out var minObj);
            configuration.TryGetValue("max", out var maxObj);
            decimal? min = TryDecimal(minObj);
            decimal? max = TryDecimal(maxObj);
            return new
            {
                value = current.value,
                unit = current.unit,
                min = min ?? 0,
                max = max ?? (current.value * 1.2m)
            };
        }

        private object TransformForStatCardWithTrend(object rawData, Dictionary<string, object> configuration)
        {
            var current = ExtractCurrent(rawData);
            var series = ExtractTimeSeries(rawData);
            var change = ExtractChange(rawData);
            return new
            {
                value = current.value,
                unit = current.unit,
                trend = series,
                change
            };
        }

        private Task<object> TransformForDataTable(object rawData, Dictionary<string, object> configuration)
        {
            // Expect either tabular rows or categorical entries
            var categories = ExtractCategories(rawData);
            if (categories.Any())
            {
                var rows = categories.Select((c, i) => new { rank = i + 1, key = c.key, value = c.value, percent = c.percent }).ToList();
                return Task.FromResult<object>(new { rows });
            }
            // Fallback: serialize raw time series into table
            var series = ExtractTimeSeries(rawData);
            var timeRows = series.Select(p => new { timestamp = p.timestamp, value = p.value }).ToList();
            return Task.FromResult<object>(new { rows = timeRows });
        }

        private Task<object> TransformForProgressList(object rawData, Dictionary<string, object> configuration)
        {
            var categories = ExtractCategories(rawData);
            // Build progress items (name, percent, value)
            var items = categories.Select(c => new { name = c.key, percent = c.percent, value = c.value }).ToList();
            return Task.FromResult<object>(new { items });
        }

        // ---- helpers for transformers
        private (decimal value, string unit, DateTime timestamp) ExtractCurrent(object raw)
        {
            if (raw == null) return (0m, GetSafeUnit(null), DateTime.UtcNow);

            // Try to find raw.current
            var currentProp = raw.GetType().GetProperty("current");
            var node = currentProp?.GetValue(raw) ?? raw;

            var valueProp = node.GetType().GetProperty("value") ?? node.GetType().GetProperty("Value");
            var unitProp = node.GetType().GetProperty("unit") ?? node.GetType().GetProperty("Unit");
            var tsProp = node.GetType().GetProperty("timestamp") ?? node.GetType().GetProperty("Timestamp");

            var value = TryDecimal(valueProp?.GetValue(node));
            var unit = unitProp?.GetValue(node)?.ToString() ?? GetSafeUnit(null);
            var tsObj = tsProp?.GetValue(node);
            var ts = tsObj is DateTime dt ? dt : DateTime.UtcNow;
            return (value ?? 0m, unit, ts);
        }

        private List<(DateTime timestamp, decimal value)> ExtractTimeSeries(object raw)
        {
            var result = new List<(DateTime, decimal)>();
            if (raw == null) return result;

            var tsProp = raw.GetType().GetProperty("timeSeries") ?? raw.GetType().GetProperty("dataPoints");
            var seriesObj = tsProp?.GetValue(raw);
            if (seriesObj is System.Collections.IEnumerable enumerable)
            {
                foreach (var item in enumerable)
                {
                    var tProp = item.GetType().GetProperty("timestamp") ?? item.GetType().GetProperty("Timestamp");
                    var vProp = item.GetType().GetProperty("value") ?? item.GetType().GetProperty("Value");
                    DateTime t = DateTime.UtcNow;
                    decimal v = 0m;
                    var tVal = tProp?.GetValue(item);
                    if (tVal is DateTime dd) t = dd;
                    var vVal = vProp?.GetValue(item);
                    var vd = TryDecimal(vVal) ?? 0m;
                    v = vd;
                    result.Add((t, v));
                }
            }
            return result;
        }

        private List<(string key, decimal value, decimal percent)> ExtractCategories(object raw)
        {
            var result = new List<(string, decimal, decimal)>();
            if (raw == null) return result;
            // Try raw.categories
            var catProp = raw.GetType().GetProperty("categories") ?? raw.GetType().GetProperty("Categories");
            var listObj = catProp?.GetValue(raw);
            if (listObj is System.Collections.IEnumerable enumerable)
            {
                // Determine total if present
                decimal total = 0m;
                foreach (var item in enumerable)
                {
                    var vProp = item.GetType().GetProperty("value") ?? item.GetType().GetProperty("Value");
                    var v = TryDecimal(vProp?.GetValue(item)) ?? 0m;
                    total += v;
                }

                foreach (var item in enumerable)
                {
                    var kProp = item.GetType().GetProperty("key") ?? item.GetType().GetProperty("name") ?? item.GetType().GetProperty("Key");
                    var vProp = item.GetType().GetProperty("value") ?? item.GetType().GetProperty("Value");
                    var pProp = item.GetType().GetProperty("percent") ?? item.GetType().GetProperty("percentage") ?? item.GetType().GetProperty("Percent");
                    var key = kProp?.GetValue(item)?.ToString() ?? "";
                    var value = TryDecimal(vProp?.GetValue(item)) ?? 0m;
                    decimal percent;
                    var pObj = pProp?.GetValue(item);
                    if (pObj != null && decimal.TryParse(pObj.ToString(), out var p)) percent = p;
                    else percent = total > 0 ? Math.Round((value / total) * 100m, 2) : 0m;
                    result.Add((key, value, percent));
                }
            }
            return result;
        }

        private static decimal? TryDecimal(object obj)
        {
            if (obj == null) return null;
            if (obj is decimal d) return d;
            if (obj is int i) return i;
            if (obj is long l) return l;
            if (obj is double db) return (decimal)db;
            if (decimal.TryParse(obj.ToString(), out var r)) return r;
            return null;
        }

        private string GetSafeUnit(string unit) => string.IsNullOrWhiteSpace(unit) ? "units" : unit;

        // Attempts to read a provided change object or compute from series
        private object ExtractChange(object raw)
        {
            if (raw == null) return new { value = 0m, percentage = 0m, direction = "stable" };

            // Prefer raw.change if provided
            var changeProp = raw.GetType().GetProperty("change") ?? raw.GetType().GetProperty("Change");
            var cObj = changeProp?.GetValue(raw);
            if (cObj != null)
            {
                var vProp = cObj.GetType().GetProperty("value") ?? cObj.GetType().GetProperty("Value");
                var pProp = cObj.GetType().GetProperty("percentage") ?? cObj.GetType().GetProperty("percent") ?? cObj.GetType().GetProperty("Percentage");
                var dProp = cObj.GetType().GetProperty("direction") ?? cObj.GetType().GetProperty("Direction");
                var v = TryDecimal(vProp?.GetValue(cObj)) ?? 0m;
                var pct = TryDecimal(pProp?.GetValue(cObj)) ?? 0m;
                var dir = dProp?.GetValue(cObj)?.ToString() ?? (v == 0 ? "stable" : (v > 0 ? "up" : "down"));
                return new { value = v, percentage = pct, direction = dir };
            }

            // Infer from timeSeries if present: compare last vs previous point
            var series = ExtractTimeSeries(raw);
            if (series.Count >= 2)
            {
                var last = series[^1].value;
                var prev = series[^2].value;
                var delta = last - prev;
                var pct = prev == 0 ? (last == 0 ? 0m : 100m) : Math.Round((delta / prev) * 100m, 2);
                var dir = delta == 0 ? "stable" : (delta > 0 ? "up" : "down");
                return new { value = delta, percentage = pct, direction = dir };
            }

            // Fallback stable
            return new { value = 0m, percentage = 0m, direction = "stable" };
        }
    }
}