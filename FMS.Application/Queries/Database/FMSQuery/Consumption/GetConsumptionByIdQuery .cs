using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Org.BouncyCastle.Asn1.Ocsp;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Headers;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Queries.Database.FMSQuery.Consumption
{
    public class GetConsumptionByIdQuery : IRequest<Vehicleconsumption>

    {
        public  int Id { get; set; }
    }


    public class GetConsumptionByIdQueryHandler : IRequestHandler<GetConsumptionByIdQuery, Vehicleconsumption>
    {

        private readonly GpsdataContext _context;
        private readonly ILogger _logger;

        public GetConsumptionByIdQueryHandler (GpsdataContext context, ILogger<GetConsumptionByIdQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<Vehicleconsumption> Handle(GetConsumptionByIdQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var consumption = await _context.Vehicleconsumptions.Include(x=>x.Employee).FirstOrDefaultAsync(x=>x.Id== request.Id, cancellationToken);

                return consumption;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.ToString());

                throw new Exception("Cannot get consumption", ex);
            }

            
        }
    }
}
