//Cursor: Get Current (Active) System Configuration Query
using FMS.Application.Common;
using FMS.Application.Features.SystemConfiguration;
using MediatR;

namespace FMS.Application.Queries.Database.SystemConfigurationQueries {
    public class GetCurrentSystemConfigurationQuery : IRequest<FMSResponseMessage<SystemConfigurationDto>> {
        // This query has no parameters as it retrieves the currently active system configuration
        public GetCurrentSystemConfigurationQuery () { }
    }
}