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
using AutoMapper;
using FMS.Application.Queries.Database.FMSQuery.UserManagement.UserQueries;

namespace FMS.Application.Queries.Database.FMSQuery.UserManagement.UserQueries
{
    public record GetUserListQuery : IRequest<List<UserDto>>;

    public class GetUserListQueryHandler : IRequestHandler<GetUserListQuery, List<UserDto>>
    {
        private readonly GpsdataContext _context;

        private readonly ILogger<GetUserListQueryHandler> _logger;
        private readonly IMapper _mapper;
        public GetUserListQueryHandler(GpsdataContext context, ILogger<GetUserListQueryHandler> logger, IMapper mapper)
        {
            _context = context;
            _logger = logger;
            _mapper = mapper;
        }
        public async Task<List<UserDto>> Handle(GetUserListQuery request, CancellationToken cancellationToken)
        {

            try
            {
                var users = await _context.Users
                    .Include(u => u.Department)
                    .Select(u => new UserDto
                    {
                        Id = u.Id,
                        UserName = u.UserName,
                        Email = u.Email,
                        DepartmentId = u.DepartmentId,
                        DepartmentName = u.Department != null ? u.Department.Name : null,
                        IsDeleted = u.IsDeleted
                    })
                    .ToListAsync(cancellationToken);

                return users;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetUserListQueryHandler");
                throw new Exception("Error in GetUserListQueryHandler", ex);
            }


        }


    }
}
