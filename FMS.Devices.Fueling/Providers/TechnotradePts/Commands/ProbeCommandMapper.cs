/*
 * File:          ProbeCommandMapper.cs
 * Purpose:       Maps probe and tank-calibration commands to Technotrade jsonPTS request types.
 * Dependencies:  PtsCommandMapperBase
 * Last Modified: 2026-05-03
 *
 * Key Functions:
 * - TryMap(): Maps supported probe command names to jsonPTS packet types.
 */
namespace FMS.Devices.Fueling.Providers.TechnotradePts.Commands;

public sealed class ProbeCommandMapper : PtsCommandMapperBase
{
    private static readonly IReadOnlyDictionary<string, string> CommandMap =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["ProbeGetTankCalibrationChartTotalRecordsNumber"] = "ProbeGetTankCalibrationChartTotalRecordsNumber",
            ["ProbeGetTankCalibrationChartRecordsList"] = "ProbeGetTankCalibrationChartRecordsList",
            ["ProbeSetTankCalibrationChartRecordsList"] = "ProbeSetTankCalibrationChartRecordsList",
            ["ProbeAddTankCalibrationChartRecordToList"] = "ProbeAddTankCalibrationChartRecordToList",
            ["ProbeEditTankCalibrationChartRecordInList"] = "ProbeEditTankCalibrationChartRecordInList",
            ["ProbeDeleteTankCalibrationChartRecordFromList"] = "ProbeDeleteTankCalibrationChartRecordFromList",
            ["ProbeGetTankIntervalVolumeChartTotalRecordsNumber"] = "ProbeGetTankIntervalVolumeChartTotalRecordsNumber",
            ["ProbeGetTankIntervalVolumeChartRecordsList"] = "ProbeGetTankIntervalVolumeChartRecordsList",
            ["ProbeGetTankAutomaticCalibrationChartTotalRecordsNumber"] = "ProbeGetTankAutomaticCalibrationChartTotalRecordsNumber",
            ["ProbeGetTankAutomaticCalibrationChartRecordsList"] = "ProbeGetTankAutomaticCalibrationChartRecordsList",
            ["ProbeGenerateTankAutomaticCalibrationChart"] = "ProbeGenerateTankAutomaticCalibrationChart",
            ["ProbeGetTankVolumeForHeight"] = "ProbeGetTankVolumeForHeight"
        };

    public ProbeCommandMapper()
        : base(CommandMap)
    {
    }
}
