/**
 * File: TankCalibrationChartDtos.cs
 * Purpose: Defines application-layer DTOs for PTS tank calibration and interval-volume chart operations.
 * Dependencies: System.Collections.Generic
 * Last Modified: 2026-03-23
 *
 * Key Types:
 * - ProbeChartTotalRecordsResponse: Total-record response for probe chart queries.
 * - ProbeTankChartRecordsResponse: Manual or automatic calibration chart records.
 * - ProbeTankIntervalVolumeChartRecordsResponse: Interval-volume chart records with pass counts.
 */
using System.Collections.Generic;

namespace FMS.Application.Features.PTS.DTOs
{
    public class ProbeChartTotalRecordsResponse
    {
        public int Probe { get; set; }
        public int TotalNumber { get; set; }
    }

    public class ProbeTankChartRecordDto
    {
        public int Height { get; set; }
        public int Volume { get; set; }
    }

    public class ProbeTankChartRecordsResponse
    {
        public int Probe { get; set; }
        public List<ProbeTankChartRecordDto> Records { get; set; } = new();
    }

    public class ProbeTankIntervalVolumeChartRecordDto
    {
        public int Height { get; set; }
        public int Volume { get; set; }
        public int PassesNumber { get; set; }
    }

    public class ProbeTankIntervalVolumeChartRecordsResponse
    {
        public int Probe { get; set; }
        public List<ProbeTankIntervalVolumeChartRecordDto> Records { get; set; } = new();
    }
}