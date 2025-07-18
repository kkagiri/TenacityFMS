//Cursor: Update System Configuration Command
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.SystemConfiguration;
using MediatR;

namespace FMS.Application.Command.DatabaseCommand.SystemConfigurationCommands {
    public class UpdateSystemConfigurationCommand : IRequest<FMSResponseMessage<SystemConfigurationDto>> {
        public UpdateSystemConfigurationDto ConfigurationDto { get; }
        public string ModifiedBy { get; }

        public UpdateSystemConfigurationCommand (UpdateSystemConfigurationDto configurationDto, string modifiedBy) {
            ConfigurationDto = configurationDto;
            ModifiedBy = modifiedBy;
        }
    }
}