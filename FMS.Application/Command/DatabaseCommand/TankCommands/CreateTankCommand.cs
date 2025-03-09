using AutoMapper;
using FMS.Application.ModelsDTOs.FMS.Tank;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Command.DatabaseCommand.TankCommands
{
    public record CreateTankCommand(TankDTO TankDto) : IRequest<int>;

    public class CreateTankCommandHandler : IRequestHandler<CreateTankCommand, int>
    {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<CreateTankCommandHandler> _logger;

        public CreateTankCommandHandler(GpsdataContext context, IMapper mapper, ILogger<CreateTankCommandHandler> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<int> Handle(CreateTankCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var tank = _mapper.Map<Tank>(request.TankDto);

                if (tank.SiteId == null) throw new ArgumentException("SiteId is required");

                var siteExists = await _context.Sites.AnyAsync(s => s.Id == tank.SiteId, cancellationToken);
                if (!siteExists)
                {
                    throw new ArgumentException("Invalid SiteId");
                }


                if (tank.PtsId != null)
                {
                    var ptsExists = await _context.Ptsdevices.AnyAsync(p => p.Ptsid == tank.PtsId, cancellationToken);
                    if (!ptsExists)
                    {
                        throw new ArgumentException("Invalid PtsId");
                    }
                }

                tank.UseBookKeeping = request.TankDto.UseBookKeeping ? (sbyte)1 : (sbyte)0;

                _context.Tanks.Add(tank);
                await _context.SaveChangesAsync(cancellationToken);

                return tank.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating tank");
                throw;
            }
        }
    }
}
