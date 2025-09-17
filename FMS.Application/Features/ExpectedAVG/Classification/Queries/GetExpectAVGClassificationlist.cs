using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Features.FMS;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Queries.Database.FMSQuery.ExpectedAvg {
    public class GetExpectAVGClassificationlist : IRequest<List<ExpectedAVGClassficationDTO>> {

    }

    public class GetExpectAVGClassificationlistHandler : IRequestHandler<GetExpectAVGClassificationlist, List<ExpectedAVGClassficationDTO>> {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;

        public GetExpectAVGClassificationlistHandler (GpsdataContext context, IMapper mapper) {
            _context = context;
            _mapper = mapper;
        }

        public async Task<List<ExpectedAVGClassficationDTO>> Handle (GetExpectAVGClassificationlist request, CancellationToken cancellationToken) {

            var results = await _context.Expectedaverageclassifications.ToListAsync (cancellationToken);

            return _mapper.Map<List<ExpectedAVGClassficationDTO>> (results);

        }
    }

}