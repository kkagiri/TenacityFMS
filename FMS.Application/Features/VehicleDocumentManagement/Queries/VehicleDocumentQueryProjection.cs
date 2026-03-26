/**
 * File: VehicleDocumentQueryProjection.cs
 * Purpose: Provides null-safe vehicle document query projections that avoid materializing nullable database fields into domain entities.
 * Dependencies: VehicleDocument domain entity, vehicle document DTOs, LINQ.
 * Last Modified: 2026-03-25
 *
 * Key Functions:
 * - ProjectToVehicleDocumentRows(): projects EF queries into query rows without touching nullable entity-only members.
 * - ToDto(): converts projected rows into API DTOs with computed expiry metadata.
 */

using System;
using System.Collections.Generic;
using System.Linq;
using FMS.Application.Features.VehicleDocumentManagement.Dtos;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.VehicleDocumentManagement;

namespace FMS.Application.Features.VehicleDocumentManagement.Queries;

internal static class VehicleDocumentQueryProjection
{
    public static IQueryable<VehicleDocumentQueryRow> ProjectToVehicleDocumentRows(this IQueryable<VehicleDocument> query)
    {
        return query.Select(document => new VehicleDocumentQueryRow
        {
            Id = document.Id,
            VehicleId = document.VehicleId,
            VehicleRegistration = document.Vehicle != null ? document.Vehicle.HyoungNo : string.Empty,
            DocumentType = document.DocumentType,
            ComplianceCategory = document.ComplianceCategory,
            DocumentNumber = document.DocumentNumber ?? string.Empty,
            IssueDate = document.IssueDate,
            ExpiryDate = document.ExpiryDate,
            AlertLeadDays = document.AlertLeadDays,
            IssuingAuthority = document.IssuingAuthority ?? string.Empty,
            Notes = document.Notes ?? string.Empty,
            DocumentFileName = document.DocumentFileName ?? string.Empty,
            DocumentFileUrl = document.DocumentFileUrl ?? string.Empty,
            Status = document.Status,
            CreatedAt = document.CreatedAt,
            CreatedBy = document.CreatedBy ?? string.Empty
        });
    }

    public static List<VehicleDocumentDto> ToDtos(this IEnumerable<VehicleDocumentQueryRow> rows)
    {
        return rows.Select(ToDto).ToList();
    }

    public static VehicleDocumentDto ToDto(this VehicleDocumentQueryRow row)
    {
        return new VehicleDocumentDto
        {
            Id = row.Id,
            VehicleId = row.VehicleId,
            VehicleRegistration = row.VehicleRegistration ?? string.Empty,
            DocumentType = row.DocumentType,
            DocumentTypeName = row.DocumentType.ToString(),
            ComplianceCategory = row.ComplianceCategory,
            ComplianceCategoryName = row.ComplianceCategory.ToString(),
            DocumentNumber = row.DocumentNumber ?? string.Empty,
            IssueDate = row.IssueDate,
            ExpiryDate = row.ExpiryDate,
            AlertLeadDays = row.AlertLeadDays,
            IssuingAuthority = row.IssuingAuthority ?? string.Empty,
            Notes = row.Notes ?? string.Empty,
            DocumentFileName = row.DocumentFileName ?? string.Empty,
            DocumentFileUrl = NormalizeFileUrl(row.DocumentFileUrl),
            Status = row.Status,
            DaysUntilExpiry = (row.ExpiryDate.Date - DateTime.UtcNow.Date).Days,
            CreatedAt = row.CreatedAt,
            CreatedBy = row.CreatedBy ?? string.Empty
        };
    }

    private static string NormalizeFileUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return string.Empty;
        }

        if (url.StartsWith("/api/v1/files/", StringComparison.OrdinalIgnoreCase))
        {
            return url;
        }

        var normalized = url.TrimStart('/');
        if (normalized.StartsWith("uploads/", StringComparison.OrdinalIgnoreCase))
        {
            normalized = normalized.Substring("uploads/".Length);
        }

        return $"/api/v1/files/{normalized}";
    }
}

internal sealed class VehicleDocumentQueryRow
{
    public Guid Id { get; init; }
    public int VehicleId { get; init; }
    public string VehicleRegistration { get; init; } = string.Empty;
    public VehicleDocumentType DocumentType { get; init; }
    public VehicleComplianceCategory ComplianceCategory { get; init; }
    public string DocumentNumber { get; init; } = string.Empty;
    public DateTime IssueDate { get; init; }
    public DateTime ExpiryDate { get; init; }
    public int AlertLeadDays { get; init; }
    public string IssuingAuthority { get; init; } = string.Empty;
    public string Notes { get; init; } = string.Empty;
    public string DocumentFileName { get; init; } = string.Empty;
    public string DocumentFileUrl { get; init; } = string.Empty;
    public DocumentStatus Status { get; init; }
    public DateTime CreatedAt { get; init; }
    public string CreatedBy { get; init; } = string.Empty;
}