//Cursor: Delete System Configuration Command
using FMS.Application.Common;
using MediatR;

namespace FMS.Application.Command.DatabaseCommand.SystemConfigurationCommands {
    public class DeleteSystemConfigurationCommand : IRequest<FMSResponseMessage> {
        public int Id { get; }

        public DeleteSystemConfigurationCommand (int id) {
            Id = id;
        }
    }
}