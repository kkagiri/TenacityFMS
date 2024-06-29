using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.UserManagement.UserQueries;

public record GetUserByIdQuery (string UserId):IRequest<User>;

public class GetUserByIdQueryHandler : IRequestHandler<GetUserByIdQuery, User>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetUserByIdQueryHandler> _logger;
    public GetUserByIdQueryHandler(GpsdataContext context , ILogger<GetUserByIdQueryHandler> logger)
    {
        _context = context;
            _logger = logger;
    }
    public async Task<User> Handle(GetUserByIdQuery request, CancellationToken cancellationToken)
    {
        try{
       return  await _context.Users.FirstOrDefaultAsync(x=>x.Id == request.UserId, cancellationToken);
     
        }
        catch(Exception ex)
        {
            _logger.LogError(ex, "Error in GetUserByIdQueryHandler");
            throw new Exception("Error in GetUserByIdQueryHandler", ex);
        }
    }

  
}