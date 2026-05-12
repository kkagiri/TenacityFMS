using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Features.FMS.Supplier;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.SuppliersQueries {
    public record GetSupplierListQuery : IRequest<List<SupplierDTO>>;

    public class GetSupplierListQueryHandler : IRequestHandler<GetSupplierListQuery, List<SupplierDTO>> {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetSupplierListQueryHandler> _logger;
        private readonly IMapper _mapper;

        public GetSupplierListQueryHandler (GpsdataContext context, ILogger<GetSupplierListQueryHandler> logger, IMapper mapper) {
            _context = context;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<List<SupplierDTO>> Handle (GetSupplierListQuery request, CancellationToken cancellationToken) {
            try {
                var suppliers = await _context.Suppliers.ToListAsync (cancellationToken);
                return _mapper.Map<List<SupplierDTO>> (suppliers);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting supplier list");
                throw;
            }
        }
    }
}