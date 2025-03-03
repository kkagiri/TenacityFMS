using FMS.Application.Common;
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
using FMS.Application.ModelsDTOs.FMS.Tag;
using AutoMapper;

namespace FMS.Application.Command.DatabaseCommand.TagCmd
{
    public record CreateTagCommand(TagDTO TagDTO) : IRequest<int>;

    public class CreateTagCommandHandler : IRequestHandler<CreateTagCommand, int>
    {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<CreateTagCommandHandler> _logger;

        public CreateTagCommandHandler(GpsdataContext context, IMapper mapper, ILogger<CreateTagCommandHandler> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<int> Handle(CreateTagCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var tag = _mapper.Map<Tag>(request.TagDTO);
                _context.Tags.Add(tag);
                await _context.SaveChangesAsync(cancellationToken);
                return tag.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating tag");
                throw;
            }
        }
    }
}
