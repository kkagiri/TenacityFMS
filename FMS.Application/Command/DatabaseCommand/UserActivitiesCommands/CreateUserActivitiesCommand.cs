using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.UserActivitiesCommands
{
    public record CreateUserActivitiesCommand(string UserId, string Action, string Controller, string ActionName, string Parameters) : IRequest<int>;

    public class CreateUserActivitiesCommandHandler : IRequestHandler<CreateUserActivitiesCommand, int>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<CreateUserActivitiesCommandHandler> _logger;

        public CreateUserActivitiesCommandHandler(GpsdataContext context, ILogger<CreateUserActivitiesCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<int> Handle(CreateUserActivitiesCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var userActivity = new UserActivity
                {
                    UserId = request.UserId,
                    Action = request.Action,
                    Controller = request.Controller,
                    ActionName = request.ActionName,
                    Parameters = request.Parameters,
                    Timestamp = DateTime.Now
                };
                _context.UserActivities.Add(userActivity);
                await _context.SaveChangesAsync(cancellationToken);

                return userActivity.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating user activity");
                throw;
            }
        }
    }
}