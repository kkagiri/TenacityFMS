using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.ModelsDTOs.FMS.TankStock;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.TankStockCommand;



public record CreateTankStockCommand(TankStockDTO TankStockDTO) : IRequest<int>;

public class CreateTankStockCommandHandler : IRequestHandler<CreateTankStockCommand, int>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<CreateTankStockCommandHandler> _logger;
    private readonly IMapper _mapper;

    public CreateTankStockCommandHandler(GpsdataContext context, ILogger<CreateTankStockCommandHandler> logger, IMapper mapper)
    {
        _context = context;
        _logger = logger;
        _mapper = mapper;
    }

    public async Task<int> Handle(CreateTankStockCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var tank = await _context.Tanks.FirstOrDefaultAsync(t => t.Id == request.TankStockDTO.TankId, cancellationToken);
            if (tank == null) throw new Exception($"Tank with ID {request.TankStockDTO.TankId} does not exist.");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.TankStockDTO.RecordedBy, cancellationToken);
            if (user == null) throw new Exception($"User with ID {request.TankStockDTO.RecordedBy} does not exist.");

            var tankStock = _mapper.Map<Tankstock>(request.TankStockDTO);


            // tankStock.ManualDeliveryAmount = tankStock.ManualStartLevel - tankStock.ManualEndLevel;
            tankStock.RecordedBy = user.Id;
            _context.Tankstocks.Add(tankStock);
            await _context.SaveChangesAsync(cancellationToken);
            return tankStock.EntryId;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating tank stock");
            throw;
        }
    }


}
