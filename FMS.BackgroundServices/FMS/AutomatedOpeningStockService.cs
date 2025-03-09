using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MediatR;
using Microsoft.EntityFrameworkCore;
using FMS.Persistence.DataAccess;
using FMS.Application.Command.DatabaseCommand.TankStockCommand;
using FMS.Domain.Entities.enums;

namespace FMS.BackgroundServices.FMS
{
    public class AutomatedOpeningStockService : BackgroundService
    {
        private readonly ILogger<AutomatedOpeningStockService> _logger;
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly IConfiguration _configuration;

        public AutomatedOpeningStockService(ILogger<AutomatedOpeningStockService> logger, IServiceScopeFactory serviceScopeFactory, IConfiguration configuration)
        {
            _logger = logger;
            _serviceScopeFactory = serviceScopeFactory;
            _configuration = configuration;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogInformation("AutomatedOpeningStockService running at: {time}", DateTimeOffset.Now);

                var now = DateTime.Now;
                var startOfShiftTime = TimeSpan.TryParse(_configuration["StartOfShiftTime"], out var parsedTime)
                    ? parsedTime
                    : new TimeSpan(6, 0, 0); // Default to 6:00 AM if not specified
                var timeUntilStartOfShift = ((now.TimeOfDay > startOfShiftTime)
                                    ? (startOfShiftTime + TimeSpan.FromDays(1))
                                    : startOfShiftTime) - now.TimeOfDay;

                await Task.Delay(timeUntilStartOfShift, stoppingToken);

                using (var scope = _serviceScopeFactory.CreateScope())
                {
                    var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();
                    var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();

                    var tanks = await context.Tanks.Where(t => t.UseBookKeeping == 1).ToListAsync(stoppingToken);

                    foreach (var tank in tanks)
                    {
                        var openingStock = await GetOpeningStock(context, tank.Id, stoppingToken);
                        if (openingStock.HasValue)
                        {
                            await mediator.Send(new OpeningStockCommand(tank.Id, openingStock.Value, "e66b6544-70e8-4a77-bd11-584e6eb35f62"), stoppingToken);
                        }
                    }
                }
            }
        }

        private async Task<decimal?> GetOpeningStock(GpsdataContext context, int tankId, CancellationToken stoppingToken)
        {
            var priorityList = _configuration.GetSection("OpeningStockPriority").Get<List<string>>() ??
                new List<string> { "Sensor", "ClosingStock", "CurrentVolume" };

            foreach (var priority in priorityList)
            {
                switch (priority)
                {
                    case "Sensor":
                        // Implement sensor reading logic here
                        // For now, we'll skip this as it's not implemented
                        break;

                    case "ClosingStock":
                        var lastClosingStock = await context.TankVolumeHistories
                            .Where(x => x.TankId == tankId &&
                                        x.ChangeReason == VolumeChangeReasonEnum.ClosingStock)
                            .OrderByDescending(x => x.Timestamp)
                            .FirstOrDefaultAsync(stoppingToken);


                        if (lastClosingStock != null)
                        {
                            return lastClosingStock.NewVolume;
                        }
                        break;

                    case "CurrentVolume":
                        var tank = await context.Tanks.FindAsync(new object[] { tankId }, stoppingToken);
                        if (tank?.CurrentStock.HasValue == true)
                        {
                            return tank.CurrentStock.Value;
                        }
                        break;
                }
            }

            return null;
        }
    }
}