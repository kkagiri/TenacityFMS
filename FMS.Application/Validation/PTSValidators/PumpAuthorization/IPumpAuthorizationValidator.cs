using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Command.PTSCommand.PumpCommands;
using FMS.Application.Common;

namespace FMS.Application.Validation.PTSValidators.PumpAuthorization
{
    /// <summary>
    /// Interface for pump authorization request validation.
    /// Validates basic input parameters, device authorization, and entity existence.
    /// </summary>
    public interface IPumpAuthorizationValidator
    {
        /// <summary>
        /// Validates a pump authorization request.
        /// </summary>
        /// <param name="request">The authorization request to validate</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>FMSResponse indicating validation success or failure with validation errors</returns>
        Task<FMSResponse> ValidateAsync(PumpAuthorizeCommand request, CancellationToken cancellationToken = default);
    }
}
