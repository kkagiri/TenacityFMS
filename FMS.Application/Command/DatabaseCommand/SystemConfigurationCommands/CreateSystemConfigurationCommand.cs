//Cursor: Create System Configuration Command
using FMS.Application.Common;
using FMS.Application.Features.SystemConfiguration;
using MediatR;

namespace FMS.Application.Command.DatabaseCommand.SystemConfigurationCommands {
    public class CreateSystemConfigurationCommand : IRequest<FMSResponseMessage<SystemConfigurationDto>> {
        public CreateSystemConfigurationDto ConfigurationDto { get; }
        public string CreatedBy { get; }

        public CreateSystemConfigurationCommand (CreateSystemConfigurationDto configurationDto, string createdBy) {
            ConfigurationDto = configurationDto;
            CreatedBy = createdBy;
        }
    }
}