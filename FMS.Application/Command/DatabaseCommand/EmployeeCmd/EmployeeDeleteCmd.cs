using AutoMapper.Configuration.Annotations;
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

namespace FMS.Application.Command.DatabaseCommand.EmployeeCmd
{
    public record EmployeeDeleteCmd(int Id) : IRequest<EmployeeDeleteResponse>;

    public class EmployeeDeleteCmdHandler : IRequestHandler<EmployeeDeleteCmd, EmployeeDeleteResponse>
    {

        private readonly GpsdataContext _context;
        private readonly ILogger<EmployeeDeleteCmdHandler> _logger;

        public EmployeeDeleteCmdHandler(GpsdataContext context, ILogger<EmployeeDeleteCmdHandler> logger)
        {
            _context = context;
            _logger = logger;
        }
        public async Task<EmployeeDeleteResponse> Handle(EmployeeDeleteCmd request, CancellationToken cancellationToken)
        {
            try
            {
                var results = await _context.Employees.FirstOrDefaultAsync(i => i.Id == request.Id, cancellationToken);


                if (results == null) return new EmployeeDeleteResponse(false, "Id not Found");
                _context.Employees.Remove(results);
                await _context.SaveChangesAsync(cancellationToken);
                return new EmployeeDeleteResponse(true, "Id Deleted");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting employee");
                throw new Exception(ex.Message);
            }

        }
    }

    public record EmployeeDeleteResponse(bool Success, string Message);


}
