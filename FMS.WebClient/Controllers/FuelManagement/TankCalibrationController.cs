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
using FMS.Application.Features.PTS.DTOs;
using FMS.Application.Features.TankManagement.TankCalibration;
using FMS.Application.Features.TankManagement.TankCalibration.Commands;
using FMS.Application.Features.TankManagement.TankCalibration.DTOs;
using FMS.Application.Features.TankManagement.TankCalibration.Queries;
using FMS.Application.PTSServices.PTSConfigService;
using FMS.Application.Features.TankManagement.TankCalibration.Services;
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
    public class TankCalibrationController : ControllerBase
    {
        private readonly GpsdataContext _context;
        private readonly IMediator _mediator;
        private readonly IPTSConfigService _ptsConfigService;
        private readonly ITankCalibrationValidator _validator;
        private readonly ILogger<TankCalibrationController> _logger;

        public TankCalibrationController(
            GpsdataContext context,
            IMediator mediator,
            IPTSConfigService ptsConfigService,
            ITankCalibrationValidator validator,
            ILogger<TankCalibrationController> logger)
        {
            _context = context;
            _mediator = mediator;
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
                ProbeNumber = tank.ProbeNumber
            };
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
            public ActionResult<FMSResponse<TankCalibrationSnapshotDto>>? ErrorResult { get; init; }
        }
    }
}