/*
 * File:          OperatorAuthController.cs
 * Purpose:       Authentication endpoint for the standalone FMS.Admin
 *                operator portal. Only users in the reserved _platform
 *                system tenant can authenticate here.
 * Dependencies:  IMediator, LoginCommand, FMSResponse
 * Last Modified: 2026-05-10
 *
 * Key Functions:
 * - Login(): Issues operator JWT/refresh token for _platform users only.
 */
using FMS.Application.Command.DatabaseCommand.UserManagement;
using FMS.Application.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers.Operator
{
    [ApiController]
    [Route("api/v1/operator")]
    public sealed class OperatorAuthController : ControllerBase
    {
        private readonly IMediator _mediator;

        public OperatorAuthController(IMediator mediator)
        {
            _mediator = mediator;
        }

        public sealed record OperatorLoginRequest(string Username, string Password);

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<ActionResult> Login([FromBody] OperatorLoginRequest request, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();

                return BadRequest(FMSResponse<object>.ValidationFailed(errors));
            }

            try
            {
                var loginResponse = await _mediator.Send(
                    new LoginCommand(request.Username, request.Password, RequirePlatformOperator: true),
                    cancellationToken);

                var responseData = new
                {
                    Token = loginResponse.Token,
                    RefreshToken = loginResponse.RefreshToken,
                    User = loginResponse.User
                };

                return Ok(FMSResponse<object>.Success(responseData, "Operator login successful"));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(FMSResponse<object>.Failed(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    FMSResponse<object>.SystemError($"An error occurred during operator login: {ex.Message}"));
            }
        }
    }
}