using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.FMS.Supplier;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.SupplierCommands {
    public record UpdateSupplierCommand (int Id, SupplierDTO SupplierDTO) : IRequest<FMSResponseMessage>;

    public class UpdateSupplierCommandHandler : IRequestHandler<UpdateSupplierCommand, FMSResponseMessage> {
        private readonly GpsdataContext _context;
        private readonly ILogger<UpdateSupplierCommandHandler> _logger;
        private readonly IMapper _mapper;

        public UpdateSupplierCommandHandler (GpsdataContext context, ILogger<UpdateSupplierCommandHandler> logger, IMapper mapper) {
            _context = context;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<FMSResponseMessage> Handle (UpdateSupplierCommand request, CancellationToken cancellationToken) {
            try {
                var supplier = await _context.Suppliers.FindAsync (new object[] { request.Id }, cancellationToken);
                if (supplier == null) return new FMSResponseMessage (false, $"Supplier with ID {request.Id} not found");

                _mapper.Map (request.SupplierDTO, supplier);
                await _context.SaveChangesAsync (cancellationToken);

                return new FMSResponseMessage (true, "Supplier updated successfully");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error updating supplier");
                return new FMSResponseMessage (false, "Error updating supplier");
            }
        }
    }
}