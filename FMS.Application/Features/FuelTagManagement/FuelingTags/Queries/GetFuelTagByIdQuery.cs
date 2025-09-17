using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Features.FuelTagManagement.FuelingTags.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;

namespace FMS.Application.Features.FuelTagManagement.FuelingTags.Queries
{
    public record GetFuelTagByIdQuery (int Id) : IRequest<FuelTagDTO?>;

    public class GetTagByIdQueryHandler(GpsdataContext context, IMapper mapper) : IRequestHandler<GetFuelTagByIdQuery, FuelTagDTO?>
    {
        private readonly GpsdataContext _context = context;
        private readonly IMapper _mapper = mapper;

        public async Task<FuelTagDTO?> Handle (GetFuelTagByIdQuery request, CancellationToken cancellationToken) {
            var tag = await _context.FuelTags.FindAsync (request.Id);
            return tag != null ? _mapper.Map<FuelTagDTO> (tag) : null;
        }
    }
}