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

namespace FMS.Application.Command.DatabaseCommand.TagCmd
{
    public class TagCreateCmd :IRequest<Tag>
    {
        public Tag Tag { get; set; }
    }


    public class TagCreateHandlerCmdHandler : IRequestHandler<TagCreateCmd,Tag>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<TagCreateHandlerCmdHandler> _logger; 

        public TagCreateHandlerCmdHandler (GpsdataContext context, ILogger<TagCreateHandlerCmdHandler> logger)
        {
           _context = context;
            _logger = logger;
        }


        public async Task<Tag> Handle(TagCreateCmd request, CancellationToken cancellationToken)
        {
            try
            {
                await _context.Tags.AddAsync(request.Tag, cancellationToken);
                _context.SaveChanges();
                return request.Tag;
           }
            catch (Exception ex)
            {
                _logger.LogError( ex.Message,"Issues saving tag");
              throw;
            }

        }
    }
}
