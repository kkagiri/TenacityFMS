using System.Threading.Tasks;
using FMS.Application.Common.PTSResponse;

namespace FMS.Application.Command.PTSCommand.Common;

public interface ICommandExecutor
{
    Task<CommandResult> ExecuteCommandAsync(string deviceId, string commandType, object commandData);

}