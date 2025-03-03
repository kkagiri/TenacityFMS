using AutoMapper;
using FMS.Application.ModelsDTOs.FMS.UserManagement;
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

namespace FMS.Application.Queries.Database.FMSQuery.UserManagement.Permissions
{
    public record GetPermissionQuery() : IRequest<List<PermissionDTO>>;

    public class GetPermissionListHandler : IRequestHandler<GetPermissionQuery, List<PermissionDTO>>
    {

        private readonly GpsdataContext _context;
        private readonly ILogger<GetPermissionListHandler> _logger;
        private readonly IMapper _mapper;
        public GetPermissionListHandler(GpsdataContext context, ILogger<GetPermissionListHandler> logger, IMapper mapper)
        {
            _logger = logger;
            _context = context;
            _mapper = mapper;
        }
        public async Task<List<PermissionDTO>> Handle(GetPermissionQuery request, CancellationToken cancellationToken)
        {
            try
            {
                return _mapper.Map<List<PermissionDTO>>(await _context.Permissions.Include(p => p.InverseParent).ToListAsync(cancellationToken));
            }
            catch (Exception ex)
            {
                _logger.LogError("Error Getting Permission list", ex.Message);
                throw;
            }
        }
    }
}
