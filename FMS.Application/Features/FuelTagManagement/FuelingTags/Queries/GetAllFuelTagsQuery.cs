using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Features.FuelTagManagement.FuelingTags.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.FuelTagManagement.FuelingTags.Queries;

public record GetAllFuelTagsQuery : IRequest<IEnumerable<FuelTagDTO>>;

public class GetAllFuelTagsQueryHandler : IRequestHandler<GetAllFuelTagsQuery, IEnumerable<FuelTagDTO>> {
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;

    public GetAllFuelTagsQueryHandler (GpsdataContext context, IMapper mapper) {
        _context = context;
        _mapper = mapper;
    }

    public async Task<IEnumerable<FuelTagDTO>> Handle (GetAllFuelTagsQuery request, CancellationToken cancellationToken) {
        var tags = await _context.FuelTags.ToListAsync (cancellationToken);
        return _mapper.Map<IEnumerable<FuelTagDTO>> (tags);
    }
}