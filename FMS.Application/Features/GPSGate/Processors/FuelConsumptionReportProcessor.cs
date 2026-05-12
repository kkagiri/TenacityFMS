using FMS.Application.Features.GPSGate.DTOs;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Xml.Linq;

namespace FMS.Application.Features.GPSGate.Processors
{
    /// <summary>
    /// Processor for Fuel Consumption Report (Report ID: 208)
    /// Handles report with columns: VehicleID, EngHours, TotalFuel, FlowMeterEngHrs,
    /// FlowMeterFuel, Location, Distance, AvgSpeed, MaxSpeed, etc.
    /// </summary>
    public class FuelConsumptionReportProcessor : BaseReportProcessor<FuelConsumptionReportDto>
    {
        public FuelConsumptionReportProcessor(ILogger<FuelConsumptionReportProcessor> logger)
            : base(logger)
        {
        }

        public override int ReportId => 208;
        public override string ReportName => "Fuel Consumption Report";

        public override FuelConsumptionReportDto ParseRow(XElement dataRow)
        {
            var dto = new FuelConsumptionReportDto();

            foreach (var cell in dataRow.Descendants("Cell"))
            {
                var refValue = cell.Attribute("ref")?.Value;
                if (string.IsNullOrEmpty(refValue))
                    continue;

                var cellValue = cell.Value;

                // Map based on the reference ID pattern from GPSGate
                // Reference format: i_0_0_[columnIndex]
                switch (refValue)
                {
                    case "i_0_0_0": // Vehicle ID
                        dto.VehicleId = ParseInt(cellValue) ?? 0;
                        break;

                    case "i_0_0_1": // Engine Hours (Ignition Hours)
                        dto.EngineHours = ParseDecimal(cellValue);
                        break;

                    case "i_0_0_2": // Total Fuel from Fuel Probe
                        dto.TotalFuelProbe = ParseDecimal(cellValue);
                        break;

                    case "i_0_0_3": // Engine Hours from Flowmeter
                        dto.FlowMeterEngineHours = ParseDecimal(cellValue);
                        break;

                    case "i_0_0_4": // Total Fuel from Flowmeter
                        dto.FlowMeterFuelUsed = ParseDecimal(cellValue);
                        break;

                    case "i_0_0_5": // GPS Last Location
                        dto.LastLocation = cellValue;
                        break;

                    case "i_0_0_6": // Total Distance
                        dto.TotalDistance = ParseDecimal(cellValue);
                        break;

                    case "i_0_0_7": // Average Speed
                        dto.AverageSpeed = ParseDecimal(cellValue);
                        break;

                    case "i_0_0_8": // Max Speed
                        dto.MaxSpeed = ParseDecimal(cellValue);
                        break;

                    case "i_0_0_9": // Total Fuel Normal (Flowmeter)
                        dto.TotalFuelNormal = ParseDecimal(cellValue);
                        break;

                    case "i_0_0_10": // Total Fuel Idle (Flowmeter)
                        dto.TotalFuelIdle = ParseDecimal(cellValue);
                        break;

                    case "i_0_0_11": // Total Engine Hours Normal (Flowmeter)
                        dto.EngineHoursNormal = ParseDecimal(cellValue);
                        break;

                    case "i_0_0_12": // Total Engine Hours Idle (Flowmeter)
                        dto.EngineHoursIdle = ParseDecimal(cellValue);
                        break;

                    case "i_0_0_13": // Date
                        dto.ReportDate = ParseDateTime(cellValue);
                        break;

                    default:
                        _logger.LogDebug($"Unknown cell reference in Fuel Consumption Report: {refValue}");
                        break;
                }
            }

            return dto;
        }
    }
}
