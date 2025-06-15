using MediatR;
using FMS.Application.ModelsDTOs.FMS.Tag;
using FMS.Persistence.DataAccess;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Queries.Database.FMSQuery.TagQueries;

public record GetTagByIdQuery(int Id) : IRequest<TagDTO?>;

public class GetTagByIdQueryHandler : IRequestHandler<GetTagByIdQuery, TagDTO?>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;

    public GetTagByIdQueryHandler(GpsdataContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<TagDTO?> Handle(GetTagByIdQuery request, CancellationToken cancellationToken)
    {
        var tag = await _context.Tags.FindAsync(request.Id);
        return tag != null ? _mapper.Map<TagDTO>(tag) : null;
    }
}