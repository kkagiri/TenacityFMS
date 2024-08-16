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
        private readonly IMediator _mediator;

        public AutomatedClosingStockService(ILogger<AutomatedClosingStockService> logger, IServiceScopeFactory serviceScopeFactory, IConfiguration configuration, IMediator mediator)
        {
            _logger = logger;
            _serviceScopeFactory = serviceScopeFactory;
            _configuration = configuration;
            _mediator = mediator;
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

                    var tanksNeedClosingStock = await context.Tanks.Where(t=>t.UseBookKeeping == 1).
                                                Where(x=>x.TankVolumeHistories.Any(x=>x.Timestamp.Date == DateTime.Now.Date && x.ChangeReason == VolumeChangeReasonEnum.ClosingStock)).ToListAsync(stoppingToken);
                   
                     foreach(var tank in tanksNeedClosingStock)
                    {
                        await mediator.Send(new ClosingStockCommand(tank.Id, tank.CurrentStock ?? 0, "6d1af84f-b86f-48c4-a70f-eed5dd5dbcea"), stoppingToken);
                    }
                
                }
            }
        }
    }
    
    
}
