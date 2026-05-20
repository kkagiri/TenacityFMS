/*
 * File:          TenantBrandingController.cs
 * Purpose:       Tenant-scoped white-label branding endpoints for fms.frontend.
 * Dependencies:  MediatR, FMSResponse, MultiTenancy CQRS requests
 * Last Modified: 2026-05-16
 */
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Common.Constants;
using FMS.Application.Configuration;
using FMS.Application.Features.MultiTenancy.Commands;
using FMS.Application.Features.MultiTenancy.DTOs;
using FMS.Application.Features.MultiTenancy.Queries;
using FMS.WebClient.Attributes;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.IO;
using System.Linq;

namespace FMS.WebClient.Controllers.Tenants;

[ApiController]
[Authorize]
[Route("api/v1/tenant/branding")]
public sealed class TenantBrandingController : ControllerBase
{
    private static readonly string[] AllowedLogoExtensions = [".png", ".jpg", ".jpeg", ".webp", ".svg"];
    private const long MaxLogoBytes = 2 * 1024 * 1024;

    private readonly IMediator _mediator;
    private readonly FileStorageSettings _fileStorageSettings;
    private readonly ILogger<TenantBrandingController> _logger;

    public TenantBrandingController(
        IMediator mediator,
        IOptions<FileStorageSettings> fileStorageSettings,
        ILogger<TenantBrandingController> logger)
    {
        _mediator = mediator;
        _fileStorageSettings = fileStorageSettings.Value;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<FMSResponse<TenantBrandingDto>>> Get(CancellationToken cancellationToken)
    {
        var response = await _mediator.Send(new GetTenantBrandingQuery(), cancellationToken);

        if (!response.IsSuccess && string.Equals(response.ErrorCode, "UNAUTHORIZED", System.StringComparison.OrdinalIgnoreCase))
        {
            return Unauthorized(response);
        }

        if (!response.IsSuccess && string.Equals(response.ErrorCode, "TENANT_NOT_FOUND", System.StringComparison.OrdinalIgnoreCase))
        {
            return NotFound(response);
        }

        return Ok(response);
    }

    [HttpPatch]
    [RequirePermission(Permissions.MultiTenancy.ManageBranding)]
    public async Task<ActionResult<FMSResponse<TenantBrandingDto>>> Patch(
        [FromBody] UpdateTenantBrandingRequestDto? request,
        CancellationToken cancellationToken)
    {
        var response = await _mediator.Send(
            new UpdateTenantBrandingCommand(
                request?.LogoUrl,
                request?.PrimaryColor,
                request?.SecondaryColor),
            cancellationToken);

        if (response.IsSuccess)
        {
            return Ok(response);
        }

        return response.ErrorCode switch
        {
            "UNAUTHORIZED" => Unauthorized(response),
            "FORBIDDEN" or "CUSTOMER_TENANT_RESTRICTED" => StatusCode(403, response),
            "TENANT_NOT_FOUND" => NotFound(response),
            "VALIDATION_FAILED" => BadRequest(response),
            _ => BadRequest(response),
        };
    }

    [HttpPost("logo")]
    [RequirePermission(Permissions.MultiTenancy.ManageBranding)]
    [RequestSizeLimit(MaxLogoBytes)]
    public async Task<ActionResult<FMSResponse<TenantBrandingDto>>> UploadLogo(
        IFormFile? file,
        CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(FMSResponse<TenantBrandingDto>.ValidationFailed(["Logo file is required."]));
        }

        if (file.Length > MaxLogoBytes)
        {
            return BadRequest(FMSResponse<TenantBrandingDto>.ValidationFailed(["Logo file cannot exceed 2 MB."]));
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedLogoExtensions.Contains(extension))
        {
            return BadRequest(FMSResponse<TenantBrandingDto>.ValidationFailed(["Logo must be a PNG, JPG, WEBP, or SVG file."]));
        }

        var currentBranding = await _mediator.Send(new GetTenantBrandingQuery(), cancellationToken);
        if (!currentBranding.IsSuccess)
        {
            return currentBranding.ErrorCode switch
            {
                "UNAUTHORIZED" => Unauthorized(currentBranding),
                "TENANT_NOT_FOUND" => NotFound(currentBranding),
                _ => BadRequest(currentBranding),
            };
        }

        var tenantId = currentBranding.Data!.TenantId;
        var relativeDirectory = Path.Combine("branding", tenantId.ToString("N"));
        var physicalDirectory = Path.Combine(_fileStorageSettings.BasePath, relativeDirectory);
        Directory.CreateDirectory(physicalDirectory);

        var fileName = $"logo-{Guid.NewGuid():N}{extension}";
        var physicalPath = Path.Combine(physicalDirectory, fileName);

        await using (var stream = new FileStream(physicalPath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        var relativeFilePath = $"branding/{tenantId:N}/{fileName}";
        var logoUrl = $"{Request.Scheme}://{Request.Host}/api/v1/files/{relativeFilePath}";

        var response = await _mediator.Send(
            new UpdateTenantBrandingCommand(
                logoUrl,
                currentBranding.Data.PrimaryColor,
                currentBranding.Data.SecondaryColor),
            cancellationToken);

        if (!response.IsSuccess)
        {
            _logger.LogWarning("Tenant logo file saved but branding update failed for tenant {TenantId}: {Message}", tenantId, response.Message);
        }

        return response.IsSuccess
            ? Ok(response)
            : BadRequest(response);
    }
}
