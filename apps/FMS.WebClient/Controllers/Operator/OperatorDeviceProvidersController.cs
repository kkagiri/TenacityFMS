/*
 * File:          OperatorDeviceProvidersController.cs
 * Purpose:       Cross-tenant device-provider support APIs for FMS.Admin operators.
 * Dependencies:  FMSResponse, GpsdataContext, EF Core, tenant authorization attributes
 * Last Modified: 2026-05-15
 *
 * Key Functions:
 * - GetProviders(): Returns paged provider configurations across client tenants.
 * - CreateProvider(): Creates a provider configuration for a selected client tenant.
 * - UpdateProvider(): Updates a selected provider configuration.
 * - GetMappings(): Returns device-provider mappings with tenant/provider context.
 */
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Common.Constants;
using FMS.Domain.Entities.Devices;
using FMS.Domain.Entities.Features.MultiTenancy;
using FMS.Persistence.DataAccess;
using FMS.WebClient.Attributes;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FMS.WebClient.Controllers.Operator;

[ApiController]
[Authorize]
[AllowCrossTenant]
[Route("api/v1/operator/device-providers")]
public sealed class OperatorDeviceProvidersController : ControllerBase
{
    private readonly GpsdataContext _context;

    public OperatorDeviceProvidersController(GpsdataContext context)
    {
        _context = context;
    }

    [HttpGet]
    [RequirePermission(Permissions.Platform.ReadDeviceProvider, Permissions.Platform.ManageDeviceProvider)]
    public async Task<ActionResult<FMSResponse<OperatorDeviceProviderListPayload>>> GetProviders(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] string? search = null,
        [FromQuery] Guid? tenantId = null,
        [FromQuery] string? tenantKind = null,
        [FromQuery] string? deviceCategory = null,
        [FromQuery] bool? isEnabled = null,
        CancellationToken cancellationToken = default)
    {
        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query =
            from provider in _context.ProviderConfigurations.AsNoTracking()
            join tenant in _context.Tenants.AsNoTracking()
                on provider.TenantId equals tenant.Id
            where tenant.TenantKind != TenantKind.Customer
            select new { provider, tenant };

        if (tenantId.HasValue)
        {
            query = query.Where(row => row.provider.TenantId == tenantId.Value);
        }

        if (!string.IsNullOrWhiteSpace(tenantKind) &&
            Enum.TryParse<TenantKind>(tenantKind, ignoreCase: true, out var parsedTenantKind))
        {
            query = query.Where(row => row.tenant.TenantKind == parsedTenantKind);
        }

        if (!string.IsNullOrWhiteSpace(deviceCategory))
        {
            var normalizedCategory = deviceCategory.Trim();
            query = query.Where(row => row.provider.DeviceCategory == normalizedCategory);
        }

        if (isEnabled.HasValue)
        {
            query = query.Where(row => row.provider.IsEnabled == isEnabled.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = search.Trim().ToLower();
            query = query.Where(row =>
                row.provider.Name.ToLower().Contains(normalizedSearch) ||
                row.provider.DisplayName.ToLower().Contains(normalizedSearch) ||
                row.tenant.Name.ToLower().Contains(normalizedSearch) ||
                row.tenant.Code.ToLower().Contains(normalizedSearch));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(row => row.tenant.Name)
            .ThenBy(row => row.provider.DeviceCategory)
            .ThenBy(row => row.provider.Priority)
            .ThenBy(row => row.provider.Name)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(row => new OperatorDeviceProviderDto(
                row.provider.Id,
                row.provider.TenantId,
                row.tenant.Code,
                row.tenant.Name,
                row.tenant.TenantKind.ToString().ToLower(),
                row.provider.Name,
                row.provider.DisplayName,
                row.provider.Description,
                row.provider.DeviceCategory,
                row.provider.IsEnabled,
                row.provider.IsDefault,
                row.provider.Priority,
                row.provider.Settings,
                row.provider.CreatedAt,
                row.provider.UpdatedAt))
            .ToListAsync(cancellationToken);

        var payload = new OperatorDeviceProviderListPayload(
            items,
            PaginationMetadataDto.Create(totalCount, pageNumber, pageSize));

        return Ok(FMSResponse<OperatorDeviceProviderListPayload>.Success(payload, "Device providers loaded successfully."));
    }

    [HttpPost]
    [RequirePermission(Permissions.Platform.ManageDeviceProvider)]
    public async Task<ActionResult<FMSResponse<OperatorDeviceProviderDto>>> CreateProvider(
        [FromBody] OperatorDeviceProviderCreateRequest request,
        CancellationToken cancellationToken = default)
    {
        var errors = ValidateProviderRequest(request.TenantId, request.ProviderName, request.DisplayName, request.DeviceCategory);
        if (errors.Count > 0)
        {
            return BadRequest(FMSResponse<OperatorDeviceProviderDto>.ValidationFailed(errors));
        }

        var tenant = await _context.Tenants
            .AsNoTracking()
            .FirstOrDefaultAsync(currentTenant => currentTenant.Id == request.TenantId, cancellationToken);

        if (tenant is null)
        {
            return NotFound(FMSResponse<OperatorDeviceProviderDto>.NotFound("TENANT_NOT_FOUND", "Tenant not found."));
        }

        if (tenant.TenantKind == TenantKind.Customer)
        {
            return BadRequest(FMSResponse<OperatorDeviceProviderDto>.Failed("Device providers can only be configured for client or system tenants.", "CUSTOMER_TENANT_RESTRICTED"));
        }

        var normalizedName = request.ProviderName.Trim();
        var duplicate = await _context.ProviderConfigurations
            .AnyAsync(provider => provider.TenantId == request.TenantId && provider.Name == normalizedName, cancellationToken);

        if (duplicate)
        {
            return Conflict(FMSResponse<OperatorDeviceProviderDto>.Conflict("DEVICE_PROVIDER_EXISTS", "A provider with this name already exists for the selected tenant."));
        }

        if (request.IsDefault)
        {
            var existingDefaults = await _context.ProviderConfigurations
                .Where(provider =>
                    provider.TenantId == request.TenantId &&
                    provider.DeviceCategory == request.DeviceCategory.Trim() &&
                    provider.IsDefault)
                .ToListAsync(cancellationToken);

            foreach (var existingDefault in existingDefaults)
            {
                existingDefault.IsDefault = false;
                existingDefault.UpdatedAt = DateTime.UtcNow;
            }
        }

        var entity = new ProviderConfigurationEntity
        {
            TenantId = request.TenantId,
            Name = normalizedName,
            DisplayName = request.DisplayName.Trim(),
            Description = request.Description,
            DeviceCategory = request.DeviceCategory.Trim(),
            Version = string.IsNullOrWhiteSpace(request.Version) ? "1.0.0" : request.Version.Trim(),
            Settings = string.IsNullOrWhiteSpace(request.ConfigurationData) ? "{}" : request.ConfigurationData,
            IsEnabled = request.IsEnabled,
            IsDefault = request.IsDefault,
            Priority = request.PriorityOrder,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")
        };

        _context.ProviderConfigurations.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);

        var dto = ToDto(entity, tenant);
        return CreatedAtAction(
            nameof(GetProviders),
            new { providerId = entity.Id },
            FMSResponse<OperatorDeviceProviderDto>.Success(dto, "Device provider created successfully."));
    }

    [HttpPut("{providerId:int}")]
    [RequirePermission(Permissions.Platform.ManageDeviceProvider)]
    public async Task<ActionResult<FMSResponse<OperatorDeviceProviderDto>>> UpdateProvider(
        int providerId,
        [FromBody] OperatorDeviceProviderUpdateRequest request,
        CancellationToken cancellationToken = default)
    {
        var entity = await _context.ProviderConfigurations
            .FirstOrDefaultAsync(provider => provider.Id == providerId, cancellationToken);

        if (entity is null)
        {
            return NotFound(FMSResponse<OperatorDeviceProviderDto>.NotFound("DEVICE_PROVIDER_NOT_FOUND", "Device provider not found."));
        }

        var tenant = await _context.Tenants
            .AsNoTracking()
            .FirstOrDefaultAsync(currentTenant => currentTenant.Id == entity.TenantId, cancellationToken);

        if (tenant is null)
        {
            return NotFound(FMSResponse<OperatorDeviceProviderDto>.NotFound("TENANT_NOT_FOUND", "Provider tenant not found."));
        }

        if (tenant.TenantKind == TenantKind.Customer)
        {
            return BadRequest(FMSResponse<OperatorDeviceProviderDto>.Failed("Customer tenant provider rows cannot be managed.", "CUSTOMER_TENANT_RESTRICTED"));
        }

        if (!string.IsNullOrWhiteSpace(request.DisplayName))
        {
            entity.DisplayName = request.DisplayName.Trim();
        }

        if (request.Description is not null)
        {
            entity.Description = request.Description;
        }

        if (!string.IsNullOrWhiteSpace(request.DeviceCategory))
        {
            entity.DeviceCategory = request.DeviceCategory.Trim();
        }

        if (request.ConfigurationData is not null)
        {
            entity.Settings = string.IsNullOrWhiteSpace(request.ConfigurationData) ? "{}" : request.ConfigurationData;
        }

        if (request.IsEnabled.HasValue)
        {
            entity.IsEnabled = request.IsEnabled.Value;
        }

        if (request.IsDefault.HasValue)
        {
            entity.IsDefault = request.IsDefault.Value;
        }

        if (request.PriorityOrder.HasValue)
        {
            entity.Priority = request.PriorityOrder.Value;
        }

        if (entity.IsDefault)
        {
            var existingDefaults = await _context.ProviderConfigurations
                .Where(provider =>
                    provider.Id != entity.Id &&
                    provider.TenantId == entity.TenantId &&
                    provider.DeviceCategory == entity.DeviceCategory &&
                    provider.IsDefault)
                .ToListAsync(cancellationToken);

            foreach (var existingDefault in existingDefaults)
            {
                existingDefault.IsDefault = false;
                existingDefault.UpdatedAt = DateTime.UtcNow;
            }
        }

        entity.UpdatedAt = DateTime.UtcNow;
        entity.UpdatedBy = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(FMSResponse<OperatorDeviceProviderDto>.Success(ToDto(entity, tenant), "Device provider updated successfully."));
    }

    [HttpGet("mappings")]
    [RequirePermission(Permissions.Platform.ReadDeviceProvider, Permissions.Platform.ManageDeviceProvider)]
    public async Task<ActionResult<FMSResponse<OperatorDeviceProviderMappingListPayload>>> GetMappings(
        [FromQuery] int? providerId = null,
        [FromQuery] Guid? tenantId = null,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var query =
            from mapping in _context.DeviceProviderMappings.AsNoTracking()
            join provider in _context.ProviderConfigurations.AsNoTracking()
                on mapping.ProviderConfigId equals provider.Id
            join tenant in _context.Tenants.AsNoTracking()
                on mapping.TenantId equals tenant.Id
            where tenant.TenantKind != TenantKind.Customer
            select new { mapping, provider, tenant };

        if (providerId.HasValue)
        {
            query = query.Where(row => row.mapping.ProviderConfigId == providerId.Value);
        }

        if (tenantId.HasValue)
        {
            query = query.Where(row => row.mapping.TenantId == tenantId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = search.Trim().ToLower();
            query = query.Where(row =>
                (row.mapping.ExternalDeviceId != null && row.mapping.ExternalDeviceId.ToLower().Contains(normalizedSearch)) ||
                (row.mapping.DeviceName != null && row.mapping.DeviceName.ToLower().Contains(normalizedSearch)) ||
                row.provider.Name.ToLower().Contains(normalizedSearch) ||
                row.tenant.Name.ToLower().Contains(normalizedSearch));
        }

        var items = await query
            .OrderBy(row => row.tenant.Name)
            .ThenBy(row => row.provider.Name)
            .ThenBy(row => row.mapping.DeviceName)
            .Take(250)
            .Select(row => new OperatorDeviceProviderMappingDto(
                row.mapping.Id,
                row.mapping.TenantId,
                row.tenant.Code,
                row.tenant.Name,
                row.mapping.ProviderConfigId,
                row.provider.Name,
                row.provider.DeviceCategory,
                row.mapping.VehicleId,
                row.mapping.FuelingDeviceId,
                row.mapping.ExternalDeviceId,
                row.mapping.DeviceIMEI,
                row.mapping.DeviceName,
                row.mapping.DeviceType,
                row.mapping.IsActive,
                row.mapping.CreatedAt))
            .ToListAsync(cancellationToken);

        var payload = new OperatorDeviceProviderMappingListPayload(items, items.Count);
        return Ok(FMSResponse<OperatorDeviceProviderMappingListPayload>.Success(payload, "Device provider mappings loaded successfully."));
    }

    private static List<string> ValidateProviderRequest(Guid tenantId, string providerName, string displayName, string deviceCategory)
    {
        var errors = new List<string>();

        if (tenantId == Guid.Empty)
        {
            errors.Add("Tenant is required.");
        }

        if (string.IsNullOrWhiteSpace(providerName))
        {
            errors.Add("Provider name is required.");
        }

        if (string.IsNullOrWhiteSpace(displayName))
        {
            errors.Add("Display name is required.");
        }

        if (string.IsNullOrWhiteSpace(deviceCategory))
        {
            errors.Add("Device category is required.");
        }

        return errors;
    }

    private static OperatorDeviceProviderDto ToDto(ProviderConfigurationEntity provider, Tenant tenant) =>
        new(
            provider.Id,
            provider.TenantId,
            tenant.Code,
            tenant.Name,
            tenant.TenantKind.ToString().ToLower(),
            provider.Name,
            provider.DisplayName,
            provider.Description,
            provider.DeviceCategory,
            provider.IsEnabled,
            provider.IsDefault,
            provider.Priority,
            provider.Settings,
            provider.CreatedAt,
            provider.UpdatedAt);

    public sealed record OperatorDeviceProviderCreateRequest(
        [property: Required] Guid TenantId,
        [property: Required] string ProviderName,
        [property: Required] string DisplayName,
        string DeviceCategory,
        string? Description,
        string? Version,
        string? ConfigurationData,
        bool IsEnabled = true,
        bool IsDefault = false,
        int PriorityOrder = 999);

    public sealed record OperatorDeviceProviderUpdateRequest(
        string? DisplayName,
        string? Description,
        string? DeviceCategory,
        string? ConfigurationData,
        bool? IsEnabled,
        bool? IsDefault,
        int? PriorityOrder);

    public sealed record OperatorDeviceProviderListPayload(
        IReadOnlyCollection<OperatorDeviceProviderDto> Items,
        PaginationMetadataDto Pagination);

    public sealed record OperatorDeviceProviderMappingListPayload(
        IReadOnlyCollection<OperatorDeviceProviderMappingDto> Items,
        int Count);

    public sealed record OperatorDeviceProviderDto(
        int ProviderId,
        Guid TenantId,
        string TenantCode,
        string TenantName,
        string TenantKind,
        string ProviderName,
        string DisplayName,
        string? Description,
        string DeviceCategory,
        bool IsEnabled,
        bool IsDefault,
        int PriorityOrder,
        string ConfigurationData,
        DateTime CreatedAt,
        DateTime UpdatedAt);

    public sealed record OperatorDeviceProviderMappingDto(
        int MappingId,
        Guid TenantId,
        string TenantCode,
        string TenantName,
        int ProviderId,
        string ProviderName,
        string DeviceCategory,
        int? VehicleId,
        int? FuelingDeviceId,
        string? ExternalDeviceId,
        string? DeviceIMEI,
        string? DeviceName,
        string? DeviceType,
        bool IsActive,
        DateTime CreatedAt);

    public sealed record PaginationMetadataDto(
        int TotalCount,
        int PageNumber,
        int PageSize,
        int TotalPages,
        bool HasPrevious,
        bool HasNext)
    {
        public static PaginationMetadataDto Create(int totalCount, int pageNumber, int pageSize)
        {
            var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);
            return new PaginationMetadataDto(
                totalCount,
                pageNumber,
                pageSize,
                totalPages,
                pageNumber > 1,
                totalPages > 0 && pageNumber < totalPages);
        }
    }
}
