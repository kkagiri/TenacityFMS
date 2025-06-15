using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Command.DatabaseCommand.SupplierCommands
{
    public record DeleteSupplierCommand(int Id) : IRequest<FMSResponseMessage>;

    public class DeleteSupplierCommandHandler : IRequestHandler<DeleteSupplierCommand, FMSResponseMessage>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<DeleteSupplierCommandHandler> _logger;

        public DeleteSupplierCommandHandler(GpsdataContext context, ILogger<DeleteSupplierCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponseMessage> Handle(DeleteSupplierCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var supplier = await _context.Suppliers.FindAsync(new object[] { request.Id }, cancellationToken);
                if (supplier == null) return new FMSResponseMessage(false, $"Supplier with ID {request.Id} not found");

                _context.Suppliers.Remove(supplier);
                await _context.SaveChangesAsync(cancellationToken);

                return new FMSResponseMessage(true, "Supplier deleted successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting supplier");
                return new FMSResponseMessage(false, "Error deleting supplier");
            }
        }
    }
}
