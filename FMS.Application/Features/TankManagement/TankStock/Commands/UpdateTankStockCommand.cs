using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Features.FMS.TankStock;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.TankStockCommand;
public record UpdateTankStockCommand (TankStockDTO TankStockDTO, int Id) : IRequest<bool>;

public class UpdateTankStockCommandHandler : IRequestHandler<UpdateTankStockCommand, bool> {
    private readonly GpsdataContext _context;
    private readonly ILogger<UpdateTankStockCommandHandler> _logger;
    private readonly IMapper _mapper;

    public UpdateTankStockCommandHandler (GpsdataContext context, ILogger<UpdateTankStockCommandHandler> logger, IMapper mapper) {
        _context = context;
        _logger = logger;
        _mapper = mapper;
    }

    public async Task<bool> Handle (UpdateTankStockCommand request, CancellationToken cancellationToken) {
        try {
            var tankStock = await _context.Tankstocks.FindAsync (new object[] { request.Id }, cancellationToken);
            if (tankStock == null) return false;

            var tank = await _context.Tanks.FirstOrDefaultAsync (t => t.Id == request.TankStockDTO.TankId, cancellationToken);
            if (tank == null) throw new Exception ($"Tank with ID {request.TankStockDTO.TankId} does not exist.");

            var user = await _context.Users.FirstOrDefaultAsync (u => u.Id == request.TankStockDTO.RecordedBy, cancellationToken);
            if (user == null) throw new Exception ($"User with ID {request.TankStockDTO.RecordedBy} does not exist.");

            _mapper.Map (request.TankStockDTO, tankStock);
            await _context.SaveChangesAsync (cancellationToken);
            return true;
        } catch (Exception ex) {
            _logger.LogError (ex, "Error updating tank stock");
            throw;
        }
    }

}