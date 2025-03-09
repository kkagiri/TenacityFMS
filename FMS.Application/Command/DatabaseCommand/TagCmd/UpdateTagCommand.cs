using MediatR;
using FMS.Application.ModelsDTOs.FMS.Tag;
using FMS.Persistence.DataAccess;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using FMS.Application.Common;
using System.Threading.Tasks;
using System.Threading;
using System;

namespace FMS.Application.Command.DatabaseCommand.TagCmd;

public record UpdateTagCommand(TagDTO TagDTO) : IRequest<FMSResponseMessage>;

public class UpdateTagCommandHandler : IRequestHandler<UpdateTagCommand, FMSResponseMessage>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<UpdateTagCommandHandler> _logger;

    public UpdateTagCommandHandler(GpsdataContext context, IMapper mapper, ILogger<UpdateTagCommandHandler> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<FMSResponseMessage> Handle(UpdateTagCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var tag = await _context.Tags.FindAsync(request.TagDTO.Id, cancellationToken);
            if (tag == null)
                return new FMSResponseMessage(false, "Tag not found");

            _mapper.Map(request.TagDTO, tag);
            await _context.SaveChangesAsync(cancellationToken);
            return new FMSResponseMessage(true, "Tag updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating tag");
            return new FMSResponseMessage(false, "Error updating tag");
        }
    }
}