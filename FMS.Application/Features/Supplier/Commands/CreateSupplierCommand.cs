using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.FMS.Supplier;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.SupplierCommands {
    public record CreateSupplierCommand (SupplierDTO SupplierDTO) : IRequest<FMSResponseMessage>;

    public class CreateSupplierCommandHandler : IRequestHandler<CreateSupplierCommand, FMSResponseMessage> {
        private readonly GpsdataContext _context;
        private readonly ILogger<CreateSupplierCommandHandler> _logger;
        private readonly IMapper _mapper;

        public CreateSupplierCommandHandler (GpsdataContext context, ILogger<CreateSupplierCommandHandler> logger, IMapper mapper) {
            _context = context;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<FMSResponseMessage> Handle (CreateSupplierCommand request, CancellationToken cancellationToken) {
            try {
                var supplier = _mapper.Map<Supplier> (request.SupplierDTO);
                _context.Suppliers.Add (supplier);
                await _context.SaveChangesAsync (cancellationToken);

                return new FMSResponseMessage (true, "Supplier created successfully");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error creating supplier");
                return new FMSResponseMessage (false, "Error creating supplier");
            }
        }
    }
}