/**
 * File: TankCalibrationValidator.cs
 * Purpose: Protocol-level validation for PTS calibration chart operations (record limits, height/volume ranges, batch sizes).
 * Dependencies: FMSResponse, TankCalibrationChartTypes
 * Last Modified: 2026-03-23
 *
 * Key Functions:
 * - ValidateRecordWrite(): Validates a single height/volume record for add/edit.
 * - ValidateRecordList(): Validates a batch of records for set-chart operations.
 * - ValidateChartType(): Validates chart type is supported.
 * - ValidatePageParameters(): Validates paging arguments.
 */
using System.Collections.Generic;
using System.Linq;
using FMS.Application.Common;
using FMS.Application.Features.PTS.DTOs;

namespace FMS.Application.Features.TankManagement.TankCalibration.Services
{
    /// <summary>
    /// Protocol-level validation for PTS calibration chart operations.
    /// </summary>
    public interface ITankCalibrationValidator
    {
        FMSResponse? ValidateRecordWrite(ProbeTankCalibrationRecordWriteDto record);
        FMSResponse? ValidateRecordList(ProbeTankCalibrationRecordListRequestDto request);
        FMSResponse? ValidateChartType(string? chartType);
        FMSResponse? ValidatePageParameters(int? startNumber, int? totalNumber);
        FMSResponse? ValidateHeight(int height);
    }

    public class TankCalibrationValidator : ITankCalibrationValidator
    {
        /// <summary>Maximum records a PTS device can store in a single calibration chart.</summary>
        public const int MaxChartRecords = 500;

        /// <summary>Minimum allowed calibration height in mm.</summary>
        public const int MinHeight = 0;

        /// <summary>Maximum allowed calibration height in mm (15 metres).</summary>
        public const int MaxHeight = 15000;

        /// <summary>Minimum allowed volume in litres.</summary>
        public const int MinVolume = 0;

        /// <summary>Maximum allowed volume in litres (500,000L).</summary>
        public const int MaxVolume = 500000;

        /// <summary>Maximum records in a single batch request.</summary>
        public const int MaxBatchSize = 100;

        public FMSResponse? ValidateRecordWrite(ProbeTankCalibrationRecordWriteDto record)
        {
            if (record == null)
            {
                return FMSResponse.ValidationFailed(new List<string> { "Calibration record is required." });
            }

            var errors = new List<string>();

            if (record.Height < MinHeight || record.Height > MaxHeight)
            {
                errors.Add($"Height must be between {MinHeight} and {MaxHeight} mm. Got {record.Height}.");
            }

            if (record.Volume < MinVolume || record.Volume > MaxVolume)
            {
                errors.Add($"Volume must be between {MinVolume} and {MaxVolume} litres. Got {record.Volume}.");
            }

            return errors.Count > 0 ? FMSResponse.ValidationFailed(errors) : null;
        }

        public FMSResponse? ValidateRecordList(ProbeTankCalibrationRecordListRequestDto request)
        {
            if (request == null || request.Records == null)
            {
                return FMSResponse.ValidationFailed(new List<string> { "Records list is required." });
            }

            var errors = new List<string>();

            if (request.Records.Count == 0)
            {
                errors.Add("At least one calibration record is required.");
            }

            if (request.Records.Count > MaxChartRecords)
            {
                errors.Add($"Record count {request.Records.Count} exceeds the protocol limit of {MaxChartRecords} records per chart.");
            }

            // Validate each record
            for (int i = 0; i < request.Records.Count; i++)
            {
                var rec = request.Records[i];
                if (rec.Height < MinHeight || rec.Height > MaxHeight)
                {
                    errors.Add($"Record [{i}]: Height {rec.Height} is outside the valid range ({MinHeight}–{MaxHeight} mm).");
                }
                if (rec.Volume < MinVolume || rec.Volume > MaxVolume)
                {
                    errors.Add($"Record [{i}]: Volume {rec.Volume} is outside the valid range ({MinVolume}–{MaxVolume} L).");
                }
            }

            // Check for duplicate heights
            var duplicateHeights = request.Records
                .GroupBy(r => r.Height)
                .Where(g => g.Count() > 1)
                .Select(g => g.Key)
                .ToList();

            if (duplicateHeights.Count > 0)
            {
                errors.Add($"Duplicate heights found: {string.Join(", ", duplicateHeights)}. Each height must be unique.");
            }

            return errors.Count > 0 ? FMSResponse.ValidationFailed(errors) : null;
        }

        public FMSResponse? ValidateChartType(string? chartType)
        {
            if (!TankCalibrationChartTypes.IsSupported(chartType))
            {
                return FMSResponse.ValidationFailed(new List<string>
                {
                    $"Unsupported chart type '{chartType}'. Supported: {TankCalibrationChartTypes.Manual}, {TankCalibrationChartTypes.IntervalVolume}, {TankCalibrationChartTypes.Automatic}."
                });
            }

            return null;
        }

        public FMSResponse? ValidatePageParameters(int? startNumber, int? totalNumber)
        {
            var errors = new List<string>();

            if (startNumber.HasValue && startNumber.Value < 0)
            {
                errors.Add("startNumber must be zero or greater.");
            }

            if (totalNumber.HasValue && (totalNumber.Value < 1 || totalNumber.Value > MaxBatchSize))
            {
                errors.Add($"totalNumber must be between 1 and {MaxBatchSize}.");
            }

            return errors.Count > 0 ? FMSResponse.ValidationFailed(errors) : null;
        }

        public FMSResponse? ValidateHeight(int height)
        {
            if (height < MinHeight || height > MaxHeight)
            {
                return FMSResponse.ValidationFailed(new List<string>
                {
                    $"Height must be between {MinHeight} and {MaxHeight} mm. Got {height}."
                });
            }

            return null;
        }
    }
}
