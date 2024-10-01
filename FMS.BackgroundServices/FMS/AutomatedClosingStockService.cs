using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using System.Threading;
using Microsoft.Extensions.Logging;
using MediatR;
using Microsoft.EntityFrameworkCore;
using FMS.Persistence.DataAccess;
using FMS.Application.Command.DatabaseCommand.TankStockCommand;
using FMS.Domain.Entities.enums;

namespace FMS.BackgroundServices.FMS
{
    public class AutomatedClosingStockService :BackgroundService
    {
        private readonly ILogger<AutomatedClosingStockService> _logger;
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly IConfiguration _configuration;

        public AutomatedClosingStockService(ILogger<AutomatedClosingStockService> logger, IServiceScopeFactory serviceScopeFactory, IConfiguration configuration, IMediator mediator)
        {
            _logger = logger;
            _serviceScopeFactory = serviceScopeFactory;
            _configuration = configuration;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogInformation("AutomatedClosingStockService running at: {time}", DateTimeOffset.Now);

                var now = DateTime.Now;
                var endOfShiftTime = TimeSpan.TryParse(_configuration["EndOfShiftTime"], out var parsedTime)
                    ? parsedTime
                    : new TimeSpan(18, 0, 0);
                var timeUntilEndOfShift = ((now.TimeOfDay > endOfShiftTime)
                                    ? (endOfShiftTime + TimeSpan.FromDays(1))
                                    : endOfShiftTime) - now.TimeOfDay;

                await Task.Delay(timeUntilEndOfShift, stoppingToken);

                using (var scope = _serviceScopeFactory.CreateScope())
                {
                    var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();
                    var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();

                    var tanks = await context.Tanks
                        .Where(t => t.UseBookKeeping == 1)
                        .Where(x => !x.TankVolumeHistories.Any(tvh => 
                            tvh.Timestamp.Date == DateTime.Now.Date && 
                            tvh.ChangeReason == VolumeChangeReasonEnum.ClosingStock))
                        .ToListAsync(stoppingToken);
   
                    foreach(var tank in tanks)
                    {
                        var closingStock = await GetClosingStock(context, tank.Id, stoppingToken);
                        if (closingStock.HasValue)
                        {
                            await mediator.Send(new ClosingStockCommand(tank.Id, closingStock.Value, "6d1af84f-b86f-48c4-a70f-eed5dd5dbcea"), stoppingToken);
                            _logger.LogInformation("Closing stock created for tank {TankId}", tank.Id);
                        }
                        else
                        {
                            _logger.LogWarning("Unable to determine closing stock for tank {TankId}", tank.Id);
                        }
                    }
                }

                // Wait for a short period before the next iteration
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
        }

        private async Task<decimal?> GetClosingStock(GpsdataContext context, int tankId, CancellationToken stoppingToken)
        {
            var priorityList = _configuration.GetSection("ClosingStockPriority").Get<List<string>>() ?? 
                new List<string> { "Sensor", "LastEntry", "CurrentVolume" };

            foreach (var priority in priorityList)
            {
                switch (priority)
                {
                    case "Sensor":
                        // Implement sensor reading logic here
                        // For now, we'll skip this as it's not implemented
                        break;

                    case "LastEntry":
                        var lastEntry = await context.TankVolumeHistories
                            .Where(x => x.TankId == tankId)
                            .OrderByDescending(x => x.Timestamp)
                            .FirstOrDefaultAsync(stoppingToken);

                        if (lastEntry != null)
                        {
                            return lastEntry.NewVolume;
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
