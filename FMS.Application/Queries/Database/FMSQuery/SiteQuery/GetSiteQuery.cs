using AutoMapper;
using FMS.Application.Models;
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

namespace FMS.Application.Queries.Database.FMSQuery.SiteQuery
{
    public record GetSiteQuery : IRequest<List<SiteDTO>>;

    public class GetSiteQueryHandler : IRequestHandler<GetSiteQuery, List<SiteDTO>>
    {


        private readonly GpsdataContext _context;
        private readonly ILogger<GetSiteQueryHandler> _logger;
        private readonly IMapper _mapper;

        public GetSiteQueryHandler(GpsdataContext context, ILogger<GetSiteQueryHandler> logger, IMapper mapper)
        {

            _context = context;
            _logger = logger;
            _mapper = mapper;
        }


        public async Task<List<SiteDTO>> Handle(GetSiteQuery request, CancellationToken cancellationToken)
        {
            try
            {
                return _mapper.Map<List<SiteDTO>>(await _context.Sites.OrderBy(x => x.Name).ToListAsync(cancellationToken));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetSiteQuery");
                throw;
            }
        }
    }
}
