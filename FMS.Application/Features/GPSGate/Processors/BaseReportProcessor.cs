using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Xml.Linq;

namespace FMS.Application.Features.GPSGate.Processors
{
    /// <summary>
    /// Base class for report processors with common XML parsing logic
    /// </summary>
    /// <typeparam name="T">The model type for the report data</typeparam>
    public abstract class BaseReportProcessor<T> : IReportProcessor<T> where T : class
    {
        protected readonly ILogger _logger;

        protected BaseReportProcessor(ILogger logger)
        {
            _logger = logger;
        }

        public abstract int ReportId { get; }
        public abstract string ReportName { get; }

        /// <summary>
        /// Processes the complete report XML and returns parsed data
        /// </summary>
        public virtual List<T> ProcessReport(XDocument reportXml)
        {
            try
            {
                _logger.LogInformation($"Processing {ReportName} (ID: {ReportId})");

                // Log the structure for debugging
                _logger.LogDebug($"Report XML root: {reportXml.Root?.Name.LocalName}");

                // Find the Rows element - handle namespaces by using LocalName
                var rowsElement = reportXml.Descendants()
                    .FirstOrDefault(e => e.Name.LocalName == "Rows");

                if (rowsElement == null)
                {
                    _logger.LogWarning($"No Rows element found in report. Available elements: {string.Join(", ", reportXml.Descendants().Select(e => e.Name.LocalName).Distinct().Take(20))}");
                    throw new InvalidOperationException($"Invalid report structure for {ReportName}: No Rows element found");
                }

                // Get all Row elements using LocalName to ignore namespaces
                var allRows = rowsElement.Elements()
                    .Where(e => e.Name.LocalName == "Row")
                    .ToList();

                _logger.LogDebug($"Found {allRows.Count} total Row elements");

                // Get header rows (kind="h") and data rows (kind="i")
                var headerRows = allRows.Where(r => r.Attribute("kind")?.Value == "h").ToList();
                var dataRows = allRows.Where(r => r.Attribute("kind")?.Value == "i").ToList();

                _logger.LogInformation($"Found {headerRows.Count} header rows and {dataRows.Count} data rows in {ReportName}");

                if (!dataRows.Any())
                {
                    _logger.LogWarning($"No data rows found in {ReportName}");
                    return new List<T>();
                }

                // Parse each data row
                var result = new List<T>();
                foreach (var dataRow in dataRows)
                {
                    try
                    {
                        var parsedRow = ParseRow(dataRow);
                        if (parsedRow != null)
                        {
                            result.Add(parsedRow);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, $"Error parsing row in {ReportName}: {dataRow}");
                        // Continue processing other rows
                    }
                }

                _logger.LogInformation($"Successfully parsed {result.Count} rows from {ReportName}");
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error processing {ReportName}");
                throw;
            }
        }

        /// <summary>
        /// Parse a single data row - must be implemented by derived classes
        /// </summary>
        public abstract T ParseRow(XElement dataRow);

        /// <summary>
        /// Validates the report structure
        /// </summary>
        public virtual bool ValidateReportStructure(XDocument reportXml)
        {
            // Check for basic report structure using LocalName to ignore namespaces
            var hasRows = reportXml.Descendants().Any(e => e.Name.LocalName == "Rows");
            return hasRows;
        }

        /// <summary>
        /// Helper method to safely parse decimal values from XML cells
        /// </summary>
        protected decimal? ParseDecimal(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return null;

            if (decimal.TryParse(value, System.Globalization.NumberStyles.Float,
                System.Globalization.CultureInfo.InvariantCulture, out var result))
            {
                return result;
            }

            return null;
        }

        /// <summary>
        /// Helper method to safely parse integer values from XML cells
        /// </summary>
        protected int? ParseInt(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return null;

            if (int.TryParse(value, out var result))
            {
                return result;
            }

            return null;
        }

        /// <summary>
        /// Helper method to safely parse DateTime values from XML cells
        /// </summary>
        protected DateTime? ParseDateTime(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return null;

            if (DateTime.TryParse(value, out var result))
            {
                return result;
            }

            return null;
        }

        /// <summary>
        /// Helper method to safely parse TimeSpan values from XML cells
        /// </summary>
        protected TimeSpan? ParseTimeSpan(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return null;

            if (TimeSpan.TryParse(value, out var result))
            {
                return result;
            }

            return null;
        }

        /// <summary>
        /// Gets cell value by reference ID from a data row
        /// </summary>
        protected string GetCellValue(XElement dataRow, string refId)
        {
            return dataRow.Elements()
                .FirstOrDefault(c => c.Name.LocalName == "Cell" && c.Attribute("ref")?.Value == refId)?.Value;
        }
    }
}
