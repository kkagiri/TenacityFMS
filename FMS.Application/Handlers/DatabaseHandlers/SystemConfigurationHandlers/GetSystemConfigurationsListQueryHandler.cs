using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.SystemConfiguration;
using FMS.Application.Queries.Database.SystemConfigurationQueries;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Handlers.DatabaseHandlers.SystemConfigurationHandlers {
    public class GetSystemConfigurationsListQueryHandler
        : IRequestHandler<GetSystemConfigurationsListQuery, FMSResponseMessage<IEnumerable<SystemConfigurationDto>>> {
            private readonly GpsdataContext _context;
            private readonly IMapper _mapper;
            private readonly ILogger<GetSystemConfigurationsListQueryHandler> _logger;

            public GetSystemConfigurationsListQueryHandler (
                GpsdataContext context,
                IMapper mapper,
                ILogger<GetSystemConfigurationsListQueryHandler> logger) {
                _context = context;
                _mapper = mapper;
                _logger = logger;
            }

            public async Task<FMSResponseMessage<IEnumerable<SystemConfigurationDto>>> Handle (
                GetSystemConfigurationsListQuery request,
                CancellationToken cancellationToken) {
                try {
                    var query = _context.SystemConfigurations.AsQueryable ();

                    // Apply filters
                    if (request.IsActive.HasValue) {
                        query = query.Where (c => c.IsActive == request.IsActive.Value);
                    }

                    if (!string.IsNullOrEmpty (request.Category)) {
                        query = query.Where (c => c.Category == request.Category);
                    }

                    if (!string.IsNullOrEmpty (request.DataType)) {
                        query = query.Where (c => c.DataType == request.DataType);
                    }

                    if (request.IsEditable.HasValue) {
                        query = query.Where (c => c.IsEditable == request.IsEditable.Value);
                    }

                    if (!string.IsNullOrEmpty (request.SearchTerm)) {
                        query = query.Where (c => c.ConfigurationKey.Contains (request.SearchTerm) ||
                            c.Description.Contains (request.SearchTerm));
                    }

                    // Order by category then by key
                    query = query.OrderBy (c => c.Category).ThenBy (c => c.ConfigurationKey);

                    // Apply pagination
                    var totalCount = await query.CountAsync (cancellationToken);
                    var configurations = await query
                        .Skip ((request.Page - 1) * request.PageSize)
                        .Take (request.PageSize)
                        .ToListAsync (cancellationToken);

                    var configDtos = _mapper.Map<IEnumerable<SystemConfigurationDto>> (configurations);

                    _logger.LogDebug ("Retrieved {Count} system configurations (Page {Page}, Size {PageSize}, Total {Total})",
                        configurations.Count, request.Page, request.PageSize, totalCount);

                    return new FMSResponseMessage<IEnumerable<SystemConfigurationDto>> (
                        true, "Configurations retrieved successfully", configDtos);
                } catch (Exception ex) {
                    _logger.LogError (ex, "Error retrieving system configurations");
                    return new FMSResponseMessage<IEnumerable<SystemConfigurationDto>> (
                        false, $"Error retrieving configurations: {ex.Message}", null);
                }
            }
        }
}