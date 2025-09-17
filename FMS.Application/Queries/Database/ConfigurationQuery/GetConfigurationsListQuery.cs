using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.Configuration;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.ConfigurationQuery {
    public record GetConfigurationsListQuery (
        int? SiteId = null,
        bool? IsActive = null,
        int Page = 1,
        int PageSize = 50) : IRequest<FMSResponseMessage<IEnumerable<AutomatedFuelingConfigurationDto>>>;

    public class GetConfigurationsListQueryHandler
        : IRequestHandler<GetConfigurationsListQuery, FMSResponseMessage<IEnumerable<AutomatedFuelingConfigurationDto>>> {
            private readonly GpsdataContext _context;
            private readonly IMapper _mapper;
            private readonly ILogger<GetConfigurationsListQueryHandler> _logger;

            public GetConfigurationsListQueryHandler (
                GpsdataContext context,
                IMapper mapper,
                ILogger<GetConfigurationsListQueryHandler> logger) {
                _context = context;
                _mapper = mapper;
                _logger = logger;
            }

            public async Task<FMSResponseMessage<IEnumerable<AutomatedFuelingConfigurationDto>>> Handle (
                GetConfigurationsListQuery request,
                CancellationToken cancellationToken) {
                try {
                    var query = _context.AutomatedFuelingConfigurations
                        .Include (c => c.Site)
                        .AsQueryable ();

                    // Apply filters
                    if (request.SiteId.HasValue) {
                        query = query.Where (c => c.SiteId == request.SiteId.Value);
                    }

                    if (request.IsActive.HasValue) {
                        query = query.Where (c => c.IsActive == request.IsActive.Value);
                    }

                    // Order by: Global configurations first, then by site name, then by created date
                    query = query.OrderBy (c => c.SiteId.HasValue ? 1 : 0)
                        .ThenBy (c => c.Site != null ? c.Site.Name : "")
                        .ThenByDescending (c => c.CreatedOn);

                    // Apply pagination
                    var configurations = await query
                        .Skip ((request.Page - 1) * request.PageSize)
                        .Take (request.PageSize)
                        .ToListAsync (cancellationToken);

                    var configDtos = _mapper.Map<IEnumerable<AutomatedFuelingConfigurationDto>> (configurations);

                    _logger.LogDebug ("Retrieved {Count} automated fueling configurations (Page {Page}, Size {PageSize})",
                        configurations.Count, request.Page, request.PageSize);

                    return new FMSResponseMessage<IEnumerable<AutomatedFuelingConfigurationDto>> (
                        true, "Configurations retrieved successfully", configDtos);
                } catch (Exception ex) {
                    _logger.LogError (ex, "Error retrieving automated fueling configurations");
                    return new FMSResponseMessage<IEnumerable<AutomatedFuelingConfigurationDto>> (
                        false, $"Error retrieving configurations: {ex.Message}", Enumerable.Empty<AutomatedFuelingConfigurationDto> ());
                }
            }
        }
}