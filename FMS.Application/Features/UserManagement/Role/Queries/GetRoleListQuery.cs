using AutoMapper;
using FMS.Application.ModelsDTOs.FMS.UserManagement;
using FMS.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Metadata;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Queries.Database.FMSQuery.UserManagement.Roles
{
    public record GetRoleListQuery : IRequest<List<RoleDto>>;

    public class GetRoleListQueryHandler : IRequestHandler<GetRoleListQuery, List<RoleDto>>
    {

        private readonly RoleManager<Role> _roleManager;
        private readonly ILogger<GetRoleListQueryHandler> _logger;
        private readonly IMapper _mapper;

        public GetRoleListQueryHandler(RoleManager<Role> roleManager, ILogger<GetRoleListQueryHandler> logger, IMapper mapper)
        {
            _roleManager = roleManager;
            _logger = logger;
            _mapper = mapper;
        }
        public async Task<List<RoleDto>> Handle(GetRoleListQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var roles = await _roleManager.Roles.ToListAsync();
                var roleDto = _mapper.Map<List<RoleDto>>(roles);
                return roleDto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                throw new Exception(ex.Message); //
            }
        }
    }
}
