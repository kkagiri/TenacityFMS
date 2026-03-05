/**
 * File: IExcelParsingService.cs
 * Purpose: Interface for parsing fuel report Excel files into ConsumptionDTOs.
 *          Ports the frontend SheetJS logic to C# using ClosedXML.
 * Dependencies: ConsumptionDTO
 * Last Modified: 2026-03-03
 *
 * Key Methods:
 * - ParseKmLReport: Parses km/l (truck/pickup) Excel files
 * - ParseLHrReport: Parses l/hr (heavy equipment) Excel files
 * - DetectReportMetadata: Extracts site, month, year from filename
 */
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.Features.Vehicle.DTOs;

namespace FMS.Application.Features.FuelImport.Services;

/// <summary>
/// Metadata extracted from a fuel report filename and folder path.
/// </summary>
public class FuelReportFileMetadata
{
    public string FilePath { get; set; } = null!;
    public string FileName { get; set; } = null!;
    public string ReportType { get; set; } = null!;  // "km/l" or "l/hr"
    public string? DetectedSiteName { get; set; }
    public string? DetectedMonth { get; set; }
    public int? DetectedYear { get; set; }
    public long FileSizeBytes { get; set; }
    public DateTime FileLastModifiedUtc { get; set; }
}

/// <summary>
/// Result of parsing a single Excel file.
/// </summary>
public class ExcelParseResult
{
    public bool Success { get; set; }
    public List<ConsumptionDTO> Records { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
    public string? ErrorMessage { get; set; }
    public int TotalRowsFound { get; set; }
    public int ValidRowsCount { get; set; }
    public int SkippedRowsCount { get; set; }
}

/// <summary>
/// Parses fuel report Excel files into ConsumptionDTOs.
/// Mirrors the frontend parsing logic (useExcelParsing.js) in C#.
/// </summary>
public interface IExcelParsingService
{
    /// <summary>
    /// Parse a km/l report file (Truck/Pickup). All rows get the same siteId.
    /// </summary>
    /// <param name="filePath">Full path to the .xlsx file</param>
    /// <param name="siteId">Site ID for all records (resolved from filename)</param>
    /// <param name="skipRows">Number of header rows to skip (default 8)</param>
    ExcelParseResult ParseKmLReport(string filePath, int siteId, int skipRows = 8);

    /// <summary>
    /// Parse an l/hr report file (Heavy Equipment). Each row has its own site from the Location column.
    /// </summary>
    /// <param name="filePath">Full path to the .xlsx file</param>
    /// <param name="siteIdLookup">Dictionary mapping site name (lowercase) → siteId</param>
    /// <param name="skipRows">Number of header rows to skip (default 6)</param>
    ExcelParseResult ParseLHrReport(string filePath, Dictionary<string, int> siteIdLookup, int skipRows = 6);

    /// <summary>
    /// Extract metadata from filename and folder path without reading the file.
    /// </summary>
    FuelReportFileMetadata DetectReportMetadata(string filePath);
}
