using MediatR;
using FMS.Application.ModelsDTOs.FMS.Tag;
using FMS.Persistence.DataAccess;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Queries.Database.FMSQuery.TagQueries;

public record GetAllTagsQuery : IRequest<IEnumerable<TagDTO>>;

public class GetAllTagsQueryHandler : IRequestHandler<GetAllTagsQuery, IEnumerable<TagDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;

    public GetAllTagsQueryHandler(GpsdataContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<IEnumerable<TagDTO>> Handle(GetAllTagsQuery request, CancellationToken cancellationToken)
    {
        var tags = await _context.Tags.ToListAsync(cancellationToken);
        return _mapper.Map<IEnumerable<TagDTO>>(tags);
    }
}