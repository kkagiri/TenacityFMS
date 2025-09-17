//Cursor: Get System Configurations List Query
using System.Collections.Generic;
using FMS.Application.Common;
using FMS.Application.Features.SystemConfiguration;
using MediatR;

namespace FMS.Application.Queries.Database.SystemConfigurationQueries {
    public class GetSystemConfigurationsListQuery : IRequest<FMSResponseMessage<IEnumerable<SystemConfigurationDto>>> {
        public string? Category { get; set; }
        public string? DataType { get; set; }
        public bool? IsEditable { get; set; }
        public bool? IsActive { get; set; }
        public string? SearchTerm { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }

        public GetSystemConfigurationsListQuery (int page = 1, int pageSize = 50) {
            Page = page;
            PageSize = pageSize;
        }
    }
}