/**
 * File: TankCalibrationController.cs
 * Purpose: Exposes tank-scoped APIs for local calibration history, sync, generation, and manual PTS calibration edits.
 * Dependencies: MediatR, GpsdataContext, IPTSConfigService, ASP.NET Core MVC
 * Last Modified: 2026-03-23
 *
 * Key Actions:
 * - GetCurrentSnapshot(): Returns the latest locally stored calibration snapshot.
 * - SyncSnapshot(): Pulls a PTS chart and stores it in local history.
 * - SetManualChart(): Replaces the manual calibration chart on the linked probe and stores a synced snapshot.
 */
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Common.Constants;
using FMS.Application.Features.Devices.Fueling.Services;
using FMS.Application.Features.Devices.Fueling.UploadStatus.DTOs;
using FMS.Application.Features.TankManagement.TankCalibration;
using FMS.Application.Features.TankManagement.TankCalibration.Commands;
using FMS.Application.Features.TankManagement.TankCalibration.DTOs;
using FMS.Application.Features.TankManagement.TankCalibration.Queries;
using FMS.Application.Features.TankManagement.TankCalibration.Services;
using FMS.Domain.PTSCommon.Responses;
using FMS.Persistence.DataAccess;
using FMS.WebClient.Attributes;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FMS.WebClient.Controllers.FuelManagement
{
    [ApiController]
    [Route("api/v1/tanks/{tankId:int}/calibration")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.Tank.Read)]
    [RejectCustomerTenant]
    public class TankCalibrationController : ControllerBase
    {
        private readonly GpsdataContext _context;
        private readonly IMediator _mediator;
        private readonly ICalibrationLearningService _learningService;
        private readonly IPTSConfigService _ptsConfigService;
        private readonly ITankCalibrationValidator _validator;
        private readonly ILogger<TankCalibrationController> _logger;

        public TankCalibrationController(
            GpsdataContext context,
            IMediator mediator,
            ICalibrationLearningService learningService,
            IPTSConfigService ptsConfigService,
            ITankCalibrationValidator validator,
            ILogger<TankCalibrationController> logger)
        {
            _context = context;
            _mediator = mediator;
            _learningService = learningService;
            _ptsConfigService = ptsConfigService;
            _validator = validator;
            _logger = logger;
        }

        [HttpGet("current")]
        [RequirePermission(Permissions.Tank.Read)]
        public async Task<ActionResult<FMSResponse<TankCalibrationSnapshotDto>>> GetCurrentSnapshot(int tankId, [FromQuery] string chartType = TankCalibrationChartTypes.Manual)
        {
            var result = await _mediator.Send(new GetTankCalibrationCurrentSnapshotQuery(tankId, chartType));
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpGet("history")]
        [RequirePermission(Permissions.Tank.Read)]
        public async Task<ActionResult<FMSPagedResponse<List<TankCalibrationSnapshotHistoryItemDto>>>> GetHistory(
            int tankId,
            [FromQuery] string? chartType = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20)
        {
            var result = await _mediator.Send(new GetTankCalibrationHistoryQuery(tankId, chartType, pageNumber, pageSize));
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpGet("history/{snapshotId:long}")]
        [RequirePermission(Permissions.Tank.Read)]
        public async Task<ActionResult<FMSResponse<TankCalibrationSnapshotDto>>> GetSnapshotById(long snapshotId)
        {
            var result = await _mediator.Send(new GetTankCalibrationSnapshotByIdQuery(snapshotId));
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpPost("sync")]
        [RequirePermission(Permissions.Tank.Edit)]
        public async Task<ActionResult<FMSResponse<TankCalibrationSnapshotDto>>> SyncSnapshot(int tankId, [FromBody] TankCalibrationSyncRequestDto request)
        {
            var bindingResult = await ResolveTankBindingAsync(tankId);
            if (bindingResult.ErrorResult != null)
            {
                return bindingResult.ErrorResult;
            }

            var chartType = string.IsNullOrWhiteSpace(request.ChartType) ? TankCalibrationChartTypes.Manual : request.ChartType;
            var source = string.IsNullOrWhiteSpace(request.Source) ? "manual-sync" : request.Source!;

            var result = await _mediator.Send(new SyncTankCalibrationSnapshotCommand(
                bindingResult.TankId,
                bindingResult.TankName!,
                bindingResult.PtsDeviceId!,
                bindingResult.ProbeNumber!.Value,
                chartType,
                GetCurrentActor(),
                source,
                request.Notes));

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            _logger.LogInformation(
                "Calibration {Action} by {Actor} for TankId {TankId}. ChartType={ChartType}, Source={Source}.",
                "SyncSnapshot", GetCurrentActor(), tankId, chartType, source);

            return Ok(result);
        }

        [HttpPost("generate-automatic")]
        [RequirePermission(Permissions.Tank.Edit)]
        public async Task<ActionResult<FMSResponse<TankCalibrationSnapshotDto>>> GenerateAutomaticChart(int tankId)
        {
            var bindingResult = await ResolveTankBindingAsync(tankId);
            if (bindingResult.ErrorResult != null)
            {
                return bindingResult.ErrorResult;
            }

            var configurationStatus = await GetAutomaticCalibrationStatusAsync(bindingResult);
            if (configurationStatus.IsVerified && !configurationStatus.IsEnabled)
            {
                return BadRequest(FMSResponse<TankCalibrationSnapshotDto>.Failed(configurationStatus.Message));
            }

            if (configurationStatus.IsVerified && !configurationStatus.IsReadyForGeneration)
            {
                return BadRequest(FMSResponse<TankCalibrationSnapshotDto>.Failed(configurationStatus.Message));
            }

            var generateResult = await _ptsConfigService.GenerateTankAutomaticCalibrationChartAsync(bindingResult.PtsDeviceId!, bindingResult.ProbeNumber!.Value);
            if (!generateResult.IsSuccess)
            {
                return BadRequest(generateResult);
            }

            var result = await _mediator.Send(new SyncTankCalibrationSnapshotCommand(
                bindingResult.TankId,
                bindingResult.TankName!,
                bindingResult.PtsDeviceId!,
                bindingResult.ProbeNumber.Value,
                TankCalibrationChartTypes.Automatic,
                GetCurrentActor(),
                "generate-automatic",
                "Automatic calibration chart generated from PTS controller."));

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            _logger.LogInformation(
                "Calibration {Action} by {Actor} for TankId {TankId}. Automatic chart generated from PTS controller.",
                "GenerateAutomaticChart", GetCurrentActor(), tankId);

            return Ok(result);
        }

        [HttpPost("manual/set")]
        [RequirePermission(Permissions.Tank.Edit)]
        public async Task<ActionResult<FMSResponse<TankCalibrationSnapshotDto>>> SetManualChart(int tankId, [FromBody] ProbeTankCalibrationRecordListRequestDto request)
        {
            var validationError = _validator.ValidateRecordList(request);
            if (validationError != null)
            {
                return BadRequest(validationError);
            }

            var bindingResult = await ResolveTankBindingAsync(tankId);
            if (bindingResult.ErrorResult != null)
            {
                return bindingResult.ErrorResult;
            }

            var deviceResult = await _ptsConfigService.SetTankCalibrationChartRecordsAsync(bindingResult.PtsDeviceId!, bindingResult.ProbeNumber!.Value, request);
            if (!deviceResult.IsSuccess)
            {
                return BadRequest(deviceResult);
            }

            _logger.LogInformation(
                "Calibration {Action} by {Actor} for TankId {TankId}. RecordCount={RecordCount}.",
                "SetManualChart", GetCurrentActor(), tankId, request.Records?.Count ?? 0);

            return await SyncManualSnapshotAsync(bindingResult, "manual-set", "Manual calibration chart replaced from tank calibration panel.");
        }

        [HttpPost("manual/record")]
        [RequirePermission(Permissions.Tank.Edit)]
        public async Task<ActionResult<FMSResponse<TankCalibrationSnapshotDto>>> AddManualRecord(int tankId, [FromBody] ProbeTankCalibrationRecordWriteDto request)
        {
            var validationError = _validator.ValidateRecordWrite(request);
            if (validationError != null)
            {
                return BadRequest(validationError);
            }

            var bindingResult = await ResolveTankBindingAsync(tankId);
            if (bindingResult.ErrorResult != null)
            {
                return bindingResult.ErrorResult;
            }

            var deviceResult = await _ptsConfigService.AddTankCalibrationChartRecordAsync(bindingResult.PtsDeviceId!, bindingResult.ProbeNumber!.Value, request);
            if (!deviceResult.IsSuccess)
            {
                return BadRequest(deviceResult);
            }

            _logger.LogInformation(
                "Calibration {Action} by {Actor} for TankId {TankId}. Height={Height}.",
                "AddManualRecord", GetCurrentActor(), tankId, request.Height);

            return await SyncManualSnapshotAsync(bindingResult, "manual-add", $"Manual calibration record added at height {request.Height}.");
        }

        [HttpPut("manual/record")]
        [RequirePermission(Permissions.Tank.Edit)]
        public async Task<ActionResult<FMSResponse<TankCalibrationSnapshotDto>>> EditManualRecord(int tankId, [FromBody] ProbeTankCalibrationRecordWriteDto request)
        {
            var validationError = _validator.ValidateRecordWrite(request);
            if (validationError != null)
            {
                return BadRequest(validationError);
            }

            var bindingResult = await ResolveTankBindingAsync(tankId);
            if (bindingResult.ErrorResult != null)
            {
                return bindingResult.ErrorResult;
            }

            var deviceResult = await _ptsConfigService.EditTankCalibrationChartRecordAsync(bindingResult.PtsDeviceId!, bindingResult.ProbeNumber!.Value, request);
            if (!deviceResult.IsSuccess)
            {
                return BadRequest(deviceResult);
            }

            _logger.LogInformation(
                "Calibration {Action} by {Actor} for TankId {TankId}. Height={Height}.",
                "EditManualRecord", GetCurrentActor(), tankId, request.Height);

            return await SyncManualSnapshotAsync(bindingResult, "manual-edit", $"Manual calibration record updated at height {request.Height}.");
        }

        [HttpDelete("manual/record/{height:int}")]
        [RequirePermission(Permissions.Tank.Edit)]
        public async Task<ActionResult<FMSResponse<TankCalibrationSnapshotDto>>> DeleteManualRecord(int tankId, int height)
        {
            var validationError = _validator.ValidateHeight(height);
            if (validationError != null)
            {
                return BadRequest(validationError);
            }

            var bindingResult = await ResolveTankBindingAsync(tankId);
            if (bindingResult.ErrorResult != null)
            {
                return bindingResult.ErrorResult;
            }

            var deviceResult = await _ptsConfigService.DeleteTankCalibrationChartRecordAsync(bindingResult.PtsDeviceId!, bindingResult.ProbeNumber!.Value, height);
            if (!deviceResult.IsSuccess)
            {
                return BadRequest(deviceResult);
            }

            _logger.LogInformation(
                "Calibration {Action} by {Actor} for TankId {TankId}. Height={Height}.",
                "DeleteManualRecord", GetCurrentActor(), tankId, height);

            return await SyncManualSnapshotAsync(bindingResult, "manual-delete", $"Manual calibration record deleted at height {height}.");
        }

        private async Task<ActionResult<FMSResponse<TankCalibrationSnapshotDto>>> SyncManualSnapshotAsync(TankBindingResult bindingResult, string source, string notes)
        {
            var result = await _mediator.Send(new SyncTankCalibrationSnapshotCommand(
                bindingResult.TankId,
                bindingResult.TankName!,
                bindingResult.PtsDeviceId!,
                bindingResult.ProbeNumber!.Value,
                TankCalibrationChartTypes.Manual,
                GetCurrentActor(),
                source,
                notes));

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpGet("health")]
        [RequirePermission(Permissions.Tank.Read)]
        public async Task<ActionResult<FMSResponse<CalibrationHealthSummaryDto>>> GetHealth(int tankId)
        {
            var result = await _mediator.Send(new GetCalibrationHealthQuery(tankId));
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpGet("variances")]
        [RequirePermission(Permissions.Tank.Read)]
        public async Task<ActionResult<FMSResponse<List<CalibrationVarianceDto>>>> GetVariances(
            int tankId,
            [FromQuery] int maxDeliveries = 20)
        {
            var analysisService = HttpContext.RequestServices.GetRequiredService<ICalibrationAnalysisService>();
            var variances = await analysisService.GetVariancesAsync(tankId, maxDeliveries);
            return Ok(FMSResponse<List<CalibrationVarianceDto>>.Success(variances.ToList()));
        }

        [HttpPost("learning/extract")]
        [RequirePermission(Permissions.Tank.Edit)]
        public async Task<ActionResult<FMSResponse<CalibrationLearningExtractionResultDto>>> ExtractLearningData(
            int tankId,
            [FromBody] CalibrationLearningExtractionRequestDto request)
        {
            if (request == null)
            {
                return BadRequest(FMSResponse<CalibrationLearningExtractionResultDto>.Failed("Extraction request is required."));
            }

            if (!request.IncludeDispensing && !request.IncludeDeliveries)
            {
                return BadRequest(FMSResponse<CalibrationLearningExtractionResultDto>.Failed("At least one extraction source must be enabled."));
            }

            try
            {
                var allDataPoints = new List<CalibrationDataPointDto>();
                var dispensingPoints = request.IncludeDispensing
                    ? await _learningService.ExtractDataPointsFromDispensingAsync(tankId, request.StartDateUtc, request.EndDateUtc)
                    : new List<CalibrationDataPointDto>();
                var deliveryPoints = request.IncludeDeliveries
                    ? await _learningService.ExtractDataPointsFromDeliveriesAsync(tankId, request.StartDateUtc, request.EndDateUtc)
                    : new List<CalibrationDataPointDto>();

                allDataPoints.AddRange(dispensingPoints);
                allDataPoints.AddRange(deliveryPoints);

                var result = new CalibrationLearningExtractionResultDto
                {
                    TankId = tankId,
                    DispensingPointCount = dispensingPoints.Count,
                    DeliveryPointCount = deliveryPoints.Count,
                    TotalPointCount = allDataPoints.Count,
                    DataPoints = allDataPoints,
                };

                _logger.LogInformation(
                    "Calibration {Action} by {Actor} for TankId {TankId}. DispensingPoints={DispensingCount}, DeliveryPoints={DeliveryCount}.",
                    "ExtractLearningData", GetCurrentActor(), tankId, dispensingPoints.Count, deliveryPoints.Count);

                return Ok(FMSResponse<CalibrationLearningExtractionResultDto>.Success(result, "Calibration learning data extracted successfully."));
            }
            catch (System.ArgumentException ex)
            {
                _logger.LogWarning(
                    "Calibration {Action} failed for TankId {TankId}. Error={Error}.",
                    "ExtractLearningData", tankId, ex.Message);
                return BadRequest(FMSResponse<CalibrationLearningExtractionResultDto>.Failed(ex.Message));
            }
            catch (System.InvalidOperationException ex)
            {
                return BadRequest(FMSResponse<CalibrationLearningExtractionResultDto>.Failed(ex.Message));
            }
        }

        [HttpGet("learning/coverage")]
        [RequirePermission(Permissions.Tank.Read)]
        public async Task<ActionResult<FMSResponse<CalibrationCoverageDto>>> GetLearningCoverage(int tankId)
        {
            try
            {
                var coverage = await _learningService.GetAccumulationSummaryAsync(tankId);
                return Ok(FMSResponse<CalibrationCoverageDto>.Success(coverage));
            }
            catch (System.InvalidOperationException ex)
            {
                return BadRequest(FMSResponse<CalibrationCoverageDto>.Failed(ex.Message));
            }
        }

        [HttpPost("learning/generate")]
        [RequirePermission(Permissions.Tank.Edit)]
        public async Task<ActionResult<FMSResponse<TankCalibrationSnapshotDto>>> GenerateLearnedChart(int tankId)
        {
            try
            {
                var snapshot = await _learningService.GenerateLearnedChartAsync(tankId);

                _logger.LogInformation(
                    "Calibration {Action} by {Actor} for TankId {TankId}. SnapshotId={SnapshotId}.",
                    "GenerateLearnedChart", GetCurrentActor(), tankId, snapshot.Id);

                return Ok(FMSResponse<TankCalibrationSnapshotDto>.Success(snapshot, "FMS learned calibration chart generated successfully."));
            }
            catch (System.InvalidOperationException ex)
            {
                return BadRequest(FMSResponse<TankCalibrationSnapshotDto>.Failed(ex.Message));
            }
        }

        [HttpPost("learning/seed/{snapshotId:long}")]
        [RequirePermission(Permissions.Tank.Edit)]
        public async Task<ActionResult<FMSResponse<CalibrationCoverageDto>>> SeedLearningFromSnapshot(int tankId, long snapshotId)
        {
            try
            {
                var coverage = await _learningService.SeedFromSnapshotAsync(tankId, snapshotId);

                _logger.LogInformation(
                    "Calibration {Action} by {Actor} for TankId {TankId}. SourceSnapshotId={SnapshotId}.",
                    "SeedLearningFromSnapshot", GetCurrentActor(), tankId, snapshotId);

                return Ok(FMSResponse<CalibrationCoverageDto>.Success(coverage, "Calibration learning baseline seeded successfully."));
            }
            catch (System.InvalidOperationException ex)
            {
                return BadRequest(FMSResponse<CalibrationCoverageDto>.Failed(ex.Message));
            }
        }

        [HttpGet("learning/compare")]
        [RequirePermission(Permissions.Tank.Read)]
        public async Task<ActionResult<FMSResponse<List<CalibrationComparisonDto>>>> CompareLearnedChart(
            int tankId,
            [FromQuery] long? referenceSnapshotId = null,
            [FromQuery] long? comparedSnapshotId = null,
            [FromQuery] string? comparedChartType = null)
        {
            try
            {
                var comparisons = await _learningService.CompareChartsAsync(
                    tankId,
                    referenceSnapshotId,
                    comparedSnapshotId,
                    comparedChartType);

                return Ok(FMSResponse<List<CalibrationComparisonDto>>.Success(comparisons.ToList()));
            }
            catch (System.ArgumentException ex)
            {
                return BadRequest(FMSResponse<List<CalibrationComparisonDto>>.Failed(ex.Message));
            }
            catch (System.InvalidOperationException ex)
            {
                return BadRequest(FMSResponse<List<CalibrationComparisonDto>>.Failed(ex.Message));
            }
        }

        private async Task<TankBindingResult> ResolveTankBindingAsync(int tankId)
        {
            var tank = await _context.Tanks
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == tankId);

            if (tank == null)
            {
                return new TankBindingResult
                {
                    ErrorResult = NotFound(FMSResponse<TankCalibrationSnapshotDto>.Failed("Tank was not found."))
                };
            }

            if (string.IsNullOrWhiteSpace(tank.PtsId) || !tank.ProbeNumber.HasValue)
            {
                return new TankBindingResult
                {
                    ErrorResult = BadRequest(FMSResponse<TankCalibrationSnapshotDto>.Failed("Tank is not linked to a PTS device and probe."))
                };
            }

            return new TankBindingResult
            {
                TankId = tank.Id,
                TankName = tank.Name,
                PtsDeviceId = tank.PtsId,
                ProbeNumber = tank.ProbeNumber,
                PtsTankId = tank.PtsTankId
            };
        }

        private async Task<AutomaticCalibrationStatus> GetAutomaticCalibrationStatusAsync(TankBindingResult bindingResult)
        {
            var effectivePtsTankId = bindingResult.PtsTankId ?? bindingResult.ProbeNumber;
            var usedProbeFallback = !bindingResult.PtsTankId.HasValue && bindingResult.ProbeNumber.HasValue;

            if (string.IsNullOrWhiteSpace(bindingResult.PtsDeviceId) || !effectivePtsTankId.HasValue)
            {
                return AutomaticCalibrationStatus.Unverified("Automatic calibration configuration could not be verified for this tank.");
            }

            var configResult = await _ptsConfigService.GetTanksConfigurationAsync(bindingResult.PtsDeviceId);
            if (!configResult.IsSuccess || configResult.Data?.Tanks == null)
            {
                return AutomaticCalibrationStatus.Unverified(configResult.Message ?? "Unable to read PTS tank configuration.");
            }

            var tankConfig = configResult.Data.Tanks.FirstOrDefault(t => t.Id == effectivePtsTankId.Value);
            if (tankConfig == null)
            {
                return AutomaticCalibrationStatus.Unverified($"PTS tank configuration {effectivePtsTankId.Value} was not found on the device.");
            }

            if (!tankConfig.AutomaticCalibrationEnabled)
            {
                return AutomaticCalibrationStatus.Verified(false, false,
                    usedProbeFallback
                        ? "Automatic calibration is disabled in PTS tank configuration. Using probe/tank channel as the configuration mapping because PtsTankId is not set."
                        : "Automatic calibration is disabled in PTS tank configuration.");
            }

            if (!tankConfig.AutomaticCalibrationReadyForGeneration)
            {
                return AutomaticCalibrationStatus.Verified(true, false,
                    usedProbeFallback
                        ? "Automatic calibration is enabled, but the controller is not ready for generation yet. Using probe/tank channel as the configuration mapping because PtsTankId is not set."
                        : "Automatic calibration is enabled, but the controller is not ready for generation yet.");
            }

            return AutomaticCalibrationStatus.Verified(true, true,
                usedProbeFallback
                    ? "Automatic calibration is enabled and ready for generation. Using probe/tank channel as the configuration mapping because PtsTankId is not set."
                    : "Automatic calibration is enabled and ready for generation.");
        }

        private string GetCurrentActor()
        {
            return User?.Identity?.Name
                ?? User.FindFirstValue(ClaimTypes.Name)
                ?? User.FindFirstValue("name")
                ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? "system";
        }

        private sealed class TankBindingResult
        {
            public int TankId { get; init; }
            public string? TankName { get; init; }
            public string? PtsDeviceId { get; init; }
            public int? ProbeNumber { get; init; }
            public int? PtsTankId { get; init; }
            public ActionResult<FMSResponse<TankCalibrationSnapshotDto>>? ErrorResult { get; init; }
        }

        private sealed record AutomaticCalibrationStatus(bool IsVerified, bool IsEnabled, bool IsReadyForGeneration, string Message)
        {
            public static AutomaticCalibrationStatus Unverified(string message) => new(false, false, false, message);

            public static AutomaticCalibrationStatus Verified(bool isEnabled, bool isReadyForGeneration, string message)
                => new(true, isEnabled, isReadyForGeneration, message);
        }
    }
}
