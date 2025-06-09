using MediatR;
using FMS.Domain.Entities;
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Persistence.DataAccess;
using Microsoft.Extensions.Logging;
using FMS.Application.Common;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Command.DatabaseCommand.VehicleModelCommand
{
    public record CreateVehicleModelCommand(int? ManufacturerId, string Name) : IRequest<FMSResponseMessage<Vehiclemodel>>;

    public class CreateVehicleModelCommandHandler : IRequestHandler<CreateVehicleModelCommand, FMSResponseMessage<Vehiclemodel>>
    {
        private readonly GpsdataContext _context;
        private readonly IMediator _mediator;

        private readonly ILogger _logger;

        public CreateVehicleModelCommandHandler(GpsdataContext context, IMediator mediator, ILogger<CreateVehicleModelCommandHandler> logger)
        {
            _context = context;
            _mediator = mediator;
            _logger = logger;
        }


        public async Task<FMSResponseMessage<Vehiclemodel>> Handle(CreateVehicleModelCommand request, CancellationToken cancellationToken)
        {

            if (string.IsNullOrEmpty(request.Name)) return new FMSResponseMessage<Vehiclemodel>(false, "Vehicle Model Name is required", null);

            if (!request.ManufacturerId.HasValue) return new FMSResponseMessage<Vehiclemodel>(false, "Manufacturer ID is required", null);

            var manufacturer = await _context.Vehiclemanufacturers.FindAsync(request.ManufacturerId);
            if (manufacturer == null) return new FMSResponseMessage<Vehiclemodel>(false, $"Manufacturer with ID {request.ManufacturerId} not found", null);


            var existingModel = await _context.Vehiclemodels
                 .FirstOrDefaultAsync(vm => vm.Name.ToUpper() == request.Name.ToUpper() && vm.ManufacturerId == request.ManufacturerId);
            if (existingModel != null)
            {
                return new FMSResponseMessage<Vehiclemodel>(false, $"A vehicle model with the name '{request.Name}' already exists for this manufacturer", null);
            }
            using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var vehicleModel = new Vehiclemodel
                {
                    Name = request.Name.ToUpper(),
                    ManufacturerId = request.ManufacturerId.Value
                };

                _context.Vehiclemodels.Add(vehicleModel);
                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                _logger.LogInformation($"Vehicle model created: {vehicleModel.Id}");
                return new FMSResponseMessage<Vehiclemodel>(true, "Vehicle model created successfully", vehicleModel);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                _logger.LogError(ex, "Error in CreateVehicleModelCommandHandler");
                return new FMSResponseMessage<Vehiclemodel>(false, "An error occurred while creating the vehicle model", null);
            }
        }

    }
}
