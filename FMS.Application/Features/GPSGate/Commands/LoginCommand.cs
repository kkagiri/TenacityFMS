using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.GPSGate.DTOs;
using FMS.Application.Features.GPSGate.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.GPSGate.Commands
{
    public record LoginCommand(LoginRequestDto LoginRequest) : IRequest<FMSResponse<LoginResponseDto>>;


    public class LoginCommandHandler : IRequestHandler<LoginCommand, FMSResponse<LoginResponseDto>>
    {
        private readonly IGPSGateDirectoryService _directoryService;
        private readonly ILogger<LoginCommandHandler> _logger;

        public LoginCommandHandler(
            IGPSGateDirectoryService directoryService,
            ILogger<LoginCommandHandler> logger)
        {
            _directoryService = directoryService;
            _logger = logger;
        }

        public async Task<FMSResponse<LoginResponseDto>> Handle(LoginCommand request, CancellationToken cancellationToken)
        {
            try
            {
                // Validate input
                if (string.IsNullOrWhiteSpace(request.LoginRequest.Username))
                {
                    return FMSResponse<LoginResponseDto>.Failed("Username is required");
                }

                if (string.IsNullOrWhiteSpace(request.LoginRequest.Password))
                {
                    return FMSResponse<LoginResponseDto>.Failed("Password is required");
                }

                if (request.LoginRequest.ApplicationId <= 0)
                {
                    return FMSResponse<LoginResponseDto>.Failed("Valid Application ID is required");
                }

                _logger.LogInformation($"Processing login command for user: {request.LoginRequest.Username}");

                var result = await _directoryService.LoginAsync(
                    request.LoginRequest.Username,
                    request.LoginRequest.Password,
                    request.LoginRequest.ApplicationId);

                if (!result.Success)
                {
                    _logger.LogWarning($"Login failed for user: {request.LoginRequest.Username}. Reason: {result.Message}");
                    return FMSResponse<LoginResponseDto>.Failed(result.Message);
                }

                _logger.LogInformation($"Login successful for user: {request.LoginRequest.Username}");
                return FMSResponse<LoginResponseDto>.Success(result, "Login successful");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error processing login command for user: {request.LoginRequest.Username}");
                return FMSResponse<LoginResponseDto>.Failed($"Login failed: {ex.Message}");
            }
        }
    }
}
