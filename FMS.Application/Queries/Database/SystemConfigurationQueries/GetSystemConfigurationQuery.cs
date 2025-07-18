//Cursor: Get System Configuration Query
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.SystemConfiguration;
using MediatR;

namespace FMS.Application.Queries.Database.SystemConfigurationQueries {
    public class GetSystemConfigurationQuery : IRequest<FMSResponseMessage<SystemConfigurationDto>> {
        public int Id { get; }

        public GetSystemConfigurationQuery (int id) {
            Id = id;
        }
    }
}