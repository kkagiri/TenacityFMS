using FMS.Application.Common;
using FMS.Application.Features.SystemConfiguration;
using MediatR;

namespace FMS.Application.Queries.Database.SystemConfigurationQueries
{
    /// <summary>
    /// Query to get a system configuration by its key
    /// </summary>
    public class GetSystemConfigurationByKeyQuery : IRequest<FMSResponseMessage<SystemConfigurationDto>>
    {
        public string ConfigurationKey { get; }

        public GetSystemConfigurationByKeyQuery(string configurationKey)
        {
            ConfigurationKey = configurationKey;
        }
    }
}
