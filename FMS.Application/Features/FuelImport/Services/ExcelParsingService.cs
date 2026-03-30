/**
 * File: ExcelParsingService.cs
 * Purpose: Parses fuel report Excel files using ClosedXML, porting frontend SheetJS logic to C#.
 *          Handles both km/l and l/hr report formats with flexible column matching.
 * Dependencies: ClosedXML, ConsumptionDTO, Vehicle/Site entities via DbContext
 * Last Modified: 2026-03-03
 *
 * Key Functions:
 * - ParseKmLReport: Parse truck/pickup reports (site from filename)
 * - ParseLHrReport: Parse heavy equipment reports (site per row from Location column)
 * - DetectReportMetadata: Extract site/month/year from filename regex
 * - GetColumnValue: 3-tier flexible column matching (exact → normalized → partial)
 * - ResolveVehicleId: Case-insensitive match on HyoungNo, NumberPlate
 */
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using ClosedXML.Excel;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelImport.Services;

public class ExcelParsingService : IExcelParsingService
{
    private readonly GpsdataContext _context;
    private readonly ILogger<ExcelParsingService> _logger;

    // Site name mappings (mirrors frontend parsing/index.js)
    private static readonly Dictionary<string, string> SiteNameMappings = new(StringComparer.OrdinalIgnoreCase)
    {
        ["FOOTBRIDGE"] = "BRIDGE",
        ["IP"] = "Industrial Plot",
        ["british embassy"] = "BHC",
        ["LANGATA KIBERA"] = "LANGATA-KIBERA",
        ["NARO MORU"] = "NARUMORO",
        ["OLKARI KEDONG"] = "OLKARIA-KEDONG",
        ["OLKARIA KEDONG"] = "OLKARIA-KEDONG"
    };

    private static readonly string[] MonthTokens =
    {
        "january", "jan", "february", "feb", "march", "mar", "april", "apr", "may",
        "june", "jun", "july", "jul", "august", "aug", "september", "sep", "october", "oct",
        "november", "nov", "december", "dec"
    };

    // km/l filename pattern: "{SITENAME} Fuel Report {MONTH} {YEAR}.xlsx"
    private static readonly Regex KmLFilenameRegex = new(
        @"^(.+?)\s+Fuel\s+Report\s+(\w+)\s+(\d{4})\.xlsx$",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    // l/hr filename pattern: "Heavy Equipment Fuel Report {MONTH} {YEAR}.xlsx"
    private static readonly Regex LHrFilenameRegex = new(
        @"Heavy\s+Equip(?:ment)?\s+Fuel\s+Report\s+(\w+)\s+(\d{4})\.xlsx$",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public ExcelParsingService(GpsdataContext context, ILogger<ExcelParsingService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public FuelReportFileMetadata DetectReportMetadata(string filePath)
    {
        var fileInfo = new FileInfo(filePath);
        var fileName = fileInfo.Name;
        var metadata = new FuelReportFileMetadata
        {
            FilePath = filePath,
            FileName = fileName,
            FileSizeBytes = fileInfo.Exists ? fileInfo.Length : 0,
            FileLastModifiedUtc = fileInfo.Exists ? fileInfo.LastWriteTimeUtc : DateTime.UtcNow
        };

        // Detect report type from folder path
        var normalizedPath = filePath.Replace('\\', '/').ToLowerInvariant();
        if (normalizedPath.Contains("heavy report") || normalizedPath.Contains("heavy equipment"))
        {
            metadata.ReportType = "l/hr";
            var match = LHrFilenameRegex.Match(fileName);
            if (match.Success)
            {
                metadata.DetectedMonth = match.Groups[1].Value.ToUpperInvariant();
                metadata.DetectedYear = int.TryParse(match.Groups[2].Value, out var y) ? y : null;
            }
        }
        else
        {
            // Default to km/l for Truck Report, Pickup Report, or unknown
            metadata.ReportType = "km/l";
            var match = KmLFilenameRegex.Match(fileName);
            if (match.Success)
            {
                metadata.DetectedSiteName = match.Groups[1].Value.Trim();
                metadata.DetectedMonth = match.Groups[2].Value.ToUpperInvariant();
                metadata.DetectedYear = int.TryParse(match.Groups[3].Value, out var y) ? y : null;
            }
            else
            {
                metadata.DetectedSiteName = TryExtractKmLSiteName(fileName);
                var (month, year) = TryExtractMonthAndYear(fileName, filePath);
                metadata.DetectedMonth = month;
                metadata.DetectedYear = year;
            }
        }

        return metadata;
    }

    public ExcelParseResult ParseKmLReport(string filePath, int siteId, int skipRows = 8)
    {
        var result = new ExcelParseResult();
        try
        {
            using var workbook = new XLWorkbook(filePath);
            var worksheet = workbook.Worksheets.First();

            // Read headers from row after skipRows
            var headerRow = skipRows + 1;
            var headers = ReadHeaders(worksheet, headerRow);
            if (headers.Count == 0)
            {
                result.ErrorMessage = $"No headers found at row {headerRow}";
                return result;
            }

            // Load vehicle lookup
            var vehicleLookup = LoadVehicleLookup();

            // Parse data rows
            var lastRow = worksheet.LastRowUsed()?.RowNumber() ?? headerRow;
            for (int row = headerRow + 1; row <= lastRow; row++)
            {
                var rowData = ReadRow(worksheet, row, headers);
                result.TotalRowsFound++;

                var vehicleName = GetColumnValue(rowData, "Vehicle Name", "Vehicle", "VEHICLE", "Hyoung No", "Reg#");
                if (string.IsNullOrWhiteSpace(vehicleName))
                {
                    // Check if row has any useful data (distance/fuel)
                    var distVal = GetNumericValue(rowData, "Km Covered", "Total Distance (GPS)", "Total Distance", "Distance", "km covered", "total distance");
                    var fuelVal = GetNumericValue(rowData, "Fuel", "Total Fuel", "Fuel Used", "Fuel Consumption", "fuel", "total fuel");
                    if (distVal == null && fuelVal == null)
                    {
                        result.SkippedRowsCount++;
                        continue;
                    }
                }

                var vehicleId = ResolveVehicleId(vehicleName, vehicleLookup);
                var date = GetDateValue(rowData, "Date");

                if (date == null)
                {
                    result.Warnings.Add($"Row {row}: Missing or invalid date, skipped");
                    result.SkippedRowsCount++;
                    continue;
                }

                if (vehicleId == 0)
                {
                    result.Warnings.Add($"Row {row}: Vehicle '{vehicleName}' not found in system, skipped");
                    result.SkippedRowsCount++;
                    continue;
                }

                var dto = new ConsumptionDTO
                {
                    VehicleId = vehicleId,
                    SiteId = siteId,
                    Date = date.Value,
                    IsKmperLiter = true,
                    IsNightShift = false,
                    DriverName = GetColumnValue(rowData, "Driver", "Driver Name", "driver name"),
                    TotalDistance = GetNumericValue(rowData, "Km Covered", "Total Distance (GPS)", "Total Distance", "Distance", "km covered", "total distance"),
                    MaxSpeed = GetNumericValue(rowData, "Max Speed", "Maximum Speed"),
                    AvgSpeed = GetNumericValue(rowData, "Average Speed", "Avg Speed", "Avg. Speed"),
                    ExpectedConsumption = GetNumericValue(rowData, "Expected Fuel Avg (km/l)", "Expected Average", "Expected Avg", "Expected", "expected average"),
                    FuelEfficiency = GetNumericValue(rowData, "Km/ Litre", "Fuel Efficiency", "Efficiency", "km/l", "Km/L"),
                    TotalFuel = GetNumericValue(rowData, "Fuel", "Total Fuel", "Fuel Used", "Fuel Consumption", "fuel", "total fuel"),
                    FuelLost = GetNumericValue(rowData, "Fuel Lost", "Lost Fuel", "fuel lost"),
                    Comments = GetColumnValue(rowData, "Comments", "Comment", "comments", "comment") ?? "",
                    RowIndex = row
                };

                result.Records.Add(dto);
                result.ValidRowsCount++;
            }

            result.Success = true;
        }
        catch (Exception ex)
        {
            result.ErrorMessage = $"Failed to parse km/l report: {ex.Message}";
            _logger.LogError(ex, "Error parsing km/l report: {FilePath}", filePath);
        }
        return result;
    }

    public ExcelParseResult ParseLHrReport(string filePath, Dictionary<string, int> siteIdLookup, int skipRows = 6)
    {
        var result = new ExcelParseResult();
        try
        {
            using var workbook = new XLWorkbook(filePath);
            var worksheet = workbook.Worksheets.First();

            var headerRow = skipRows + 1;
            var headers = ReadHeaders(worksheet, headerRow);
            if (headers.Count == 0)
            {
                result.ErrorMessage = $"No headers found at row {headerRow}";
                return result;
            }

            var vehicleLookup = LoadVehicleLookup();
            var lastRow = worksheet.LastRowUsed()?.RowNumber() ?? headerRow;

            for (int row = headerRow + 1; row <= lastRow; row++)
            {
                var rowData = ReadRow(worksheet, row, headers);
                result.TotalRowsFound++;

                // l/hr reports have a known typo: "Vehice Name"
                var vehicleName = GetColumnValue(rowData, "Vehice Name", "Vehicle Name");
                if (string.IsNullOrWhiteSpace(vehicleName))
                {
                    var fuelVal = GetNumericValue(rowData, "Total fuel", "Total Fuel");
                    var engVal = GetNumericValue(rowData, "Runtime Eng hrs", "Engine Hours");
                    if (fuelVal == null && engVal == null)
                    {
                        result.SkippedRowsCount++;
                        continue;
                    }
                }

                var vehicleId = ResolveVehicleId(vehicleName, vehicleLookup);
                var date = GetDateValue(rowData, "Date");

                if (date == null)
                {
                    result.Warnings.Add($"Row {row}: Missing or invalid date, skipped");
                    result.SkippedRowsCount++;
                    continue;
                }

                if (vehicleId == 0)
                {
                    result.Warnings.Add($"Row {row}: Vehicle '{vehicleName}' not found in system, skipped");
                    result.SkippedRowsCount++;
                    continue;
                }

                // Resolve site from Location column
                var locationName = GetColumnValue(rowData, "Location");
                var siteId = ResolveSiteId(locationName, siteIdLookup);
                if (siteId == 0)
                {
                    result.Warnings.Add($"Row {row}: Location '{locationName}' not matched to any site, skipped");
                    result.SkippedRowsCount++;
                    continue;
                }

                var comments = GetColumnValue(rowData, "Comments", "Comment") ?? "";
                var isNightShift = comments.Contains("night shift", StringComparison.OrdinalIgnoreCase);

                var dto = new ConsumptionDTO
                {
                    VehicleId = vehicleId,
                    SiteId = siteId,
                    Date = date.Value,
                    IsKmperLiter = false,
                    IsNightShift = isNightShift,
                    DriverName = GetColumnValue(rowData, "Driver Name", "Driver"),
                    EngHours = GetNumericValue(rowData, "Runtime Eng hrs", "Engine Hours"),
                    TotalFuel = GetNumericValue(rowData, "Total fuel", "Total Fuel"),
                    FuelEfficiency = GetNumericValue(rowData, "Fuel Eff (l/hr)", "Fuel Efficiency"),
                    ExpectedConsumption = GetNumericValue(rowData, "Expected Fuel Eff", "Expected Average"),
                    FuelLost = GetNumericValue(rowData, "Fuel lost", "Fuel Lost"),
                    FlowMeterEngineHrs = GetNumericValue(rowData, "Flow meter Eng Hrs", "Flow Meter Engine Hours"),
                    FlowMeterFuelUsed = GetNumericValue(rowData, "Flow meter Total fuel", "Flow Meter Fuel"),
                    FlowMeterEffiency = GetNumericValue(rowData, "Flow meter Fuel eff", "Flow Meter Efficiency"),
                    FlowMeterFuelLost = GetNumericValue(rowData, "Flow meter Fuel lost", "Flow Meter Fuel Lost"),
                    ExcessWorkingHrsCost = GetNumericValue(rowData, "Excessive Hours (10)", "Excess Working Hours Cost"),
                    Comments = comments,
                    RowIndex = row
                };

                result.Records.Add(dto);
                result.ValidRowsCount++;
            }

            result.Success = true;
        }
        catch (Exception ex)
        {
            result.ErrorMessage = $"Failed to parse l/hr report: {ex.Message}";
            _logger.LogError(ex, "Error parsing l/hr report: {FilePath}", filePath);
        }
        return result;
    }

    #region Private Helpers

    /// <summary>
    /// Read header names from a row. Returns column index → header name mapping.
    /// </summary>
    private Dictionary<int, string> ReadHeaders(IXLWorksheet ws, int headerRow)
    {
        var headers = new Dictionary<int, string>();
        var row = ws.Row(headerRow);
        var lastCol = ws.LastColumnUsed()?.ColumnNumber() ?? 0;
        for (int col = 1; col <= lastCol; col++)
        {
            var val = row.Cell(col).GetString()?.Trim();
            if (!string.IsNullOrWhiteSpace(val))
                headers[col] = val;
        }
        return headers;
    }

    /// <summary>
    /// Read a data row into a header-name → value dictionary.
    /// </summary>
    private Dictionary<string, string> ReadRow(IXLWorksheet ws, int rowNum, Dictionary<int, string> headers)
    {
        var data = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        var row = ws.Row(rowNum);
        foreach (var (col, headerName) in headers)
        {
            var cell = row.Cell(col);
            string value;
            if (cell.HasFormula)
            {
                // For formula cells, try cached value first
                try { value = cell.CachedValue.ToString() ?? cell.GetString(); }
                catch { value = cell.GetString(); }
            }
            else if (cell.DataType == XLDataType.DateTime)
            {
                value = cell.GetDateTime().ToString("o");
            }
            else if (cell.DataType == XLDataType.Number)
            {
                value = cell.GetDouble().ToString(CultureInfo.InvariantCulture);
            }
            else
            {
                value = cell.GetString();
            }
            data[headerName] = value?.Trim() ?? "";
        }
        return data;
    }

    /// <summary>
    /// 3-tier flexible column matching: exact → normalized → partial.
    /// Mirrors frontend getColumnValue() from parsing/index.js.
    /// </summary>
    private string? GetColumnValue(Dictionary<string, string> row, params string[] candidates)
    {
        foreach (var candidate in candidates)
        {
            // Tier 1: Exact match (case-insensitive via dictionary comparer)
            if (row.TryGetValue(candidate, out var val) && !string.IsNullOrWhiteSpace(val))
                return val;
        }

        // Tier 2: Normalized match (strip newlines, collapse whitespace, lowercase)
        var normalizedKeys = row.Keys.ToDictionary(k => NormalizeHeader(k), k => k);
        foreach (var candidate in candidates)
        {
            var normCandidate = NormalizeHeader(candidate);
            if (normalizedKeys.TryGetValue(normCandidate, out var originalKey))
            {
                var val = row[originalKey];
                if (!string.IsNullOrWhiteSpace(val))
                    return val;
            }
        }

        // Tier 3: Partial/contains match
        foreach (var candidate in candidates)
        {
            var normCandidate = NormalizeHeader(candidate);
            foreach (var (key, value) in row)
            {
                var normKey = NormalizeHeader(key);
                if (normKey.Contains(normCandidate) || normCandidate.Contains(normKey))
                {
                    if (!string.IsNullOrWhiteSpace(value))
                        return value;
                }
            }
        }

        return null;
    }

    /// <summary>
    /// Get a numeric value from a row, trying multiple column name candidates.
    /// </summary>
    private decimal? GetNumericValue(Dictionary<string, string> row, params string[] candidates)
    {
        var strVal = GetColumnValue(row, candidates);
        if (string.IsNullOrWhiteSpace(strVal))
            return null;
        return decimal.TryParse(strVal, NumberStyles.Any, CultureInfo.InvariantCulture, out var num) ? num : null;
    }

    /// <summary>
    /// Get a date value from a row. Handles Excel serial dates, ISO strings, and common formats.
    /// </summary>
    private DateTime? GetDateValue(Dictionary<string, string> row, string columnName)
    {
        var strVal = GetColumnValue(row, columnName);
        if (string.IsNullOrWhiteSpace(strVal))
            return null;

        // Try ISO 8601 first (from ClosedXML DateTime cells)
        if (DateTime.TryParse(strVal, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var dt))
            return dt;

        // Try Excel serial date number
        if (double.TryParse(strVal, NumberStyles.Any, CultureInfo.InvariantCulture, out var serial) && serial > 1)
        {
            try
            {
                // Excel serial: days since 1899-12-30
                return DateTime.FromOADate(serial);
            }
            catch { /* not a valid serial */ }
        }

        // Last resort: try common date formats
        var formats = new[] { "dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd", "d-MMM-yy", "d-MMM-yyyy" };
        if (DateTime.TryParseExact(strVal, formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out dt))
            return dt;

        return null;
    }

    /// <summary>
    /// Normalize a header string for flexible matching.
    /// </summary>
    private static string NormalizeHeader(string header)
    {
        return Regex.Replace(header.Trim().ToLowerInvariant(), @"[\s\n\r]+", " ");
    }

    /// <summary>
    /// Load all active vehicles into a lookup dictionary for name resolution.
    /// Key: normalized name (lowercase), Value: vehicleId
    /// </summary>
    private Dictionary<string, int> LoadVehicleLookup()
    {
        var lookup = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var vehicles = _context.Vehicles
            .Where(v => v.IsActive == 1)
            .Select(v => new { v.VehicleId, v.HyoungNo, v.NumberPlate })
            .ToList();

        foreach (var v in vehicles)
        {
            if (!string.IsNullOrWhiteSpace(v.HyoungNo))
                lookup.TryAdd(v.HyoungNo.Trim(), v.VehicleId);
            if (!string.IsNullOrWhiteSpace(v.NumberPlate))
                lookup.TryAdd(v.NumberPlate.Trim(), v.VehicleId);
        }

        return lookup;
    }

    /// <summary>
    /// Resolve a vehicle name to a vehicleId using case-insensitive matching on HyoungNo and NumberPlate.
    /// </summary>
    private int ResolveVehicleId(string? vehicleName, Dictionary<string, int> lookup)
    {
        if (string.IsNullOrWhiteSpace(vehicleName))
            return 0;

        var trimmed = vehicleName.Trim();
        return lookup.TryGetValue(trimmed, out var id) ? id : 0;
    }

    /// <summary>
    /// Resolve a site location name to a siteId, applying name mappings.
    /// </summary>
    private int ResolveSiteId(string? locationName, Dictionary<string, int> siteIdLookup)
    {
        if (string.IsNullOrWhiteSpace(locationName))
            return 0;

        var name = locationName.Trim();

        // Apply mappings first (FOOTBRIDGE → BRIDGE, etc.)
        if (SiteNameMappings.TryGetValue(name, out var mappedName))
            name = mappedName;

        if (siteIdLookup.TryGetValue(name, out var id))
            return id;

        var normalizedKey = NormalizeSiteKey(name);
        return siteIdLookup.TryGetValue(normalizedKey, out id) ? id : 0;
    }

    private static string? TryExtractKmLSiteName(string fileName)
    {
        var baseName = Path.GetFileNameWithoutExtension(fileName);
        if (string.IsNullOrWhiteSpace(baseName))
            return null;

        var cleaned = Regex.Replace(baseName, @"\b(19|20)\d{2}\b", " ", RegexOptions.IgnoreCase);
        cleaned = Regex.Replace(cleaned, $@"\b({string.Join("|", MonthTokens)})\b", " ", RegexOptions.IgnoreCase);
        cleaned = Regex.Replace(cleaned, @"\b(daily|fuel|report|template|repaired)\b", " ", RegexOptions.IgnoreCase);
        cleaned = Regex.Replace(cleaned, @"[^A-Za-z0-9]+", " ");
        cleaned = Regex.Replace(cleaned, @"\s+", " ").Trim();

        if (string.IsNullOrWhiteSpace(cleaned))
            return null;

        if (SiteNameMappings.TryGetValue(cleaned, out var mappedName))
            return mappedName;

        var tokens = cleaned.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        return string.Join(" ", tokens.Select(token => token.Length <= 3
            ? token.ToUpperInvariant()
            : CultureInfo.InvariantCulture.TextInfo.ToTitleCase(token.ToLowerInvariant())));
    }

    private static (string? Month, int? Year) TryExtractMonthAndYear(string fileName, string filePath)
    {
        var searchText = $"{Path.GetFileNameWithoutExtension(fileName)} {filePath}";
        var monthMatch = Regex.Match(searchText,
            $@"\b({string.Join("|", MonthTokens)})\b",
            RegexOptions.IgnoreCase);

        string? month = monthMatch.Success ? monthMatch.Groups[1].Value.ToUpperInvariant() : null;

        var yearMatch = Regex.Match(searchText, @"\b((?:19|20)\d{2})\b");
        int? year = yearMatch.Success && int.TryParse(yearMatch.Groups[1].Value, out var parsedYear)
            ? parsedYear
            : null;

        return (month, year);
    }

    private static string NormalizeSiteKey(string value)
    {
        return Regex.Replace(value.Trim().ToUpperInvariant(), @"[^A-Z0-9]+", string.Empty);
    }

    #endregion
}
