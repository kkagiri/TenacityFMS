using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.UserActivitiesCommands
{
    public class CreateUserActivityCommand : IRequest<int>
    {
        public string UserId { get; set; }
        public string Action { get; set; }
        public string Controller { get; set; }
        public string ActionName { get; set; }
        public string Parameters { get; set; }
        public string IpAddress { get; set; }
        public DateTime Timestamp { get; set; }
    }

    public class CreateUserActivityCommandHandler : IRequestHandler<CreateUserActivityCommand, int>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<CreateUserActivityCommandHandler> _logger;

        public CreateUserActivityCommandHandler(GpsdataContext context, ILogger<CreateUserActivityCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<int> Handle(CreateUserActivityCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var activity = new UserActivity
                {
                    UserId = request.UserId,
                    Action = request.Action,
                    Controller = request.Controller,
                    ActionName = request.ActionName,
                    Parameters = request.Parameters,
                    Timestamp = request.Timestamp
                };

                _context.UserActivities.Add(activity);
                await _context.SaveChangesAsync(cancellationToken);

                return activity.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating user activity");
                throw;
            }
        }
    }
}