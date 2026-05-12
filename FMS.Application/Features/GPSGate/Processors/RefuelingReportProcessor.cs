using FMS.Application.Features.GPSGate.DTOs;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Xml.Linq;

namespace FMS.Application.Features.GPSGate.Processors
{
    /// <summary>
    /// Processor for Refueling Report (Report ID: 212)
    /// Handles report with columns: Vehicle, Date, Start Time, Duration, Address,
    /// Fuel Before, Fuel After, Refill Volume
    /// </summary>
    public class RefuelingReportProcessor : BaseReportProcessor<RefuelingReportDto>
    {
        public RefuelingReportProcessor(ILogger<RefuelingReportProcessor> logger)
            : base(logger)
        {
        }

        public override int ReportId => 212;
        public override string ReportName => "Refueling Report";

        public override RefuelingReportDto ParseRow(XElement dataRow)
        {
            var dto = new RefuelingReportDto();

            // Use Elements() and check LocalName to handle namespaces properly
            foreach (var cell in dataRow.Elements().Where(e => e.Name.LocalName == "Cell"))
            {
                var refValue = cell.Attribute("ref")?.Value;
                if (string.IsNullOrEmpty(refValue))
                    continue;

                var cellValue = cell.Value?.Trim();

                // Map based on the reference ID pattern from GPSGate
                // Reference format: i_0_0_[columnIndex]
                // Columns: Vehicle, Date, Start Time, Duration, Fuel Before, Fuel After, Refill Volume
                switch (refValue)
                {
                    case "i_0_0_0": // Vehicle Name/ID
                        dto.Vehicle = cellValue;
                        // Try to extract vehicle ID if it's numeric
                        dto.VehicleId = ParseInt(cellValue);
                        break;

                    case "i_0_0_1": // Date
                        dto.Date = ParseDateTime(cellValue);
                        break;

                    case "i_0_0_2": // Start Time
                        dto.StartTime = ParseTimeSpan(cellValue);
                        break;

                    case "i_0_0_3": // Duration
                        dto.Duration = ParseTimeSpan(cellValue);
                        break;

                    case "i_0_0_4": // Fuel Before
                        dto.FuelBefore = ParseFuelValue(cellValue);
                        break;

                    case "i_0_0_5": // Fuel After
                        dto.FuelAfter = ParseFuelValue(cellValue);
                        break;

                    case "i_0_0_6": // Refill Volume
                        dto.RefillVolume = ParseFuelValue(cellValue);
                        break;

                    default:
                        // Ignore unknown cell references (header cells, footer cells, etc.)
                        break;
                }
            }

            return dto;
        }

        /// <summary>
        /// Parses fuel values that may include units (e.g., "239.5 l")
        /// </summary>
        private decimal? ParseFuelValue(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return null;

            // Remove common unit indicators (l, L, liters, etc.)
            var cleanValue = value.Replace("l", "")
                                  .Replace("L", "")
                                  .Replace("liters", "")
                                  .Replace("Liters", "")
                                  .Trim();

            return ParseDecimal(cleanValue);
        }
    }
}
