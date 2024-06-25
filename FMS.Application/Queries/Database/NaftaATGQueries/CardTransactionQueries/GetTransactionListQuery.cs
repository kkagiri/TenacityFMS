using AutoMapper;
using FMS.Application.ModelsDTOs.NaftaATG;
using FMS.Domain.ATGEntities.Nafta;
using FMS.Persistence.DataAccess.Nafta;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Queries.Database.NaftaATGQueries.CardTransactionQueries
{
    public class GetTransactionListQuery : IRequest<List<SalesTranscationDTO>>
    {
        public   DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
    }

    public class GetTransactionListQueryHandler : IRequestHandler<GetTransactionListQuery, List<SalesTranscationDTO>>
    {

        private readonly NaftaContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger _logger;


        public GetTransactionListQueryHandler  (NaftaContext context, IMapper mapper , ILogger<GetTransactionListQueryHandler> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;

        }

        public async Task<List<SalesTranscationDTO>> Handle(GetTransactionListQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var transactions = await _context.Sales
                    .Include(s => s.NaftaCard)
                     .Where(s => s.Createtime != null &&
                        DateTime.Parse(s.Createtime) >= request.StartDate.Date &&
                        DateTime.Parse(s.Createtime) <= request.EndDate.Date)
                     .Select(s => new SalesTranscationDTO
                    {
                        ID= s.Id,
                        CreateTime = DateTime.Parse(s.Createtime),
                        Amount = (decimal)(s.Amount ?? 0),
                        CardHolder = s.NaftaCard != null ? s.NaftaCard.Holder : null

                    }).ToListAsync(cancellationToken);
            
            



                return transactions;

            }
            catch (Exception ex) {

                _logger.LogError(ex, "An error occured while getting sales transaction");
                throw;
            }

        }
    }
}
