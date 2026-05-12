/**
 * File:          GetSiteStatsQuery.cs
 * Purpose:       CQRS query record to request quick stats for a specific site
 * Dependencies:  MediatR, FMSResponse, SiteStatsDTO
 * Last Modified: 2026-02-25
 */
using FMS.Application.Common;
using FMS.Application.Features.Site.DTOs;
using MediatR;

namespace FMS.Application.Features.Site.Queries;

public record GetSiteStatsQuery(int SiteId) : IRequest<FMSResponse<SiteStatsDTO>>;
