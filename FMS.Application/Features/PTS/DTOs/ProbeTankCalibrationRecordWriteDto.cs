/**
 * File: ProbeTankCalibrationRecordWriteDto.cs
 * Purpose: Defines write-model DTOs for manual PTS tank calibration chart mutations.
 * Dependencies: System.Collections.Generic
 * Last Modified: 2026-03-23
 *
 * Key Types:
 * - ProbeTankCalibrationRecordWriteDto: Single manual chart record payload.
 * - ProbeTankCalibrationRecordListRequestDto: Bulk record payload for replace operations.
 */
using System.Collections.Generic;

namespace FMS.Application.Features.PTS.DTOs
{
    public class ProbeTankCalibrationRecordWriteDto
    {
        public int Height { get; set; }
        public int Volume { get; set; }
    }

    public class ProbeTankCalibrationRecordListRequestDto
    {
        public List<ProbeTankCalibrationRecordWriteDto> Records { get; set; } = new();
    }
}