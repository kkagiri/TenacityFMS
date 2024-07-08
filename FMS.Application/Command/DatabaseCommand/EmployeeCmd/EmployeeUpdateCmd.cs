using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Models.Vehicle;
using FMS.Application.ModelsDTOs.FMS.Employee;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.EmployeeCmd
{
    public record  EmployeeUpdateCmd(int Id,EmployeeDto EmployeeDto) : IRequest<EmployeeUpdateResponse>;
  
    public class EmployeeUpdateCmdHandler : IRequestHandler<EmployeeUpdateCmd, EmployeeUpdateResponse>
    {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<EmployeeUpdateCmdHandler> _logger;

        public EmployeeUpdateCmdHandler(GpsdataContext context,IMapper mapper, ILogger<EmployeeUpdateCmdHandler> logger)
        {
            _context = context;
            _logger = logger;
            _mapper = mapper;
            
        }

        public async Task<EmployeeUpdateResponse> Handle(EmployeeUpdateCmd request, CancellationToken cancellationToken)
        {
            try
            {

                if (request.Id != request.EmployeeDto.Id) return new EmployeeUpdateResponse(false, $"ID {request.Id} mismatch with{request.EmployeeDto.Id}", null);

                var siteId = await _context.Sites.FindAsync(request.EmployeeDto.SiteId);
                if (siteId == null) return new EmployeeUpdateResponse(false, $"Site {request.EmployeeDto.SiteId} not Found", null);
                var employee = await _context.Employees.Include(e => e.Vehicles).FirstOrDefaultAsync(e => e.Id == request.EmployeeDto.Id, cancellationToken);

                if (employee == null) return new EmployeeUpdateResponse(false, $"Employee {request.EmployeeDto.Id} not Found", null);
                //_mapper.Map(request.EmployeeDto, employee);


                //feature of assigning multiple vehicles used 
                employee.Vehicles.Clear();

                foreach (var vehicle in request.EmployeeDto.Vehicles)
                {
                    var result = await _context.Vehicles.FirstOrDefaultAsync(i=>i.VehicleId==vehicle);
                    if (result != null)
                    {
                        employee.Vehicles.Add(result);
                     
                    }
                }

                _context.Employees.Update(employee);
                await _context.SaveChangesAsync(cancellationToken);
                var updatedEmployee = _mapper.Map<EmployeeDto>(employee);
                return new EmployeeUpdateResponse(true,"Employee Updated", updatedEmployee);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.ToString(), "Error in EmployeeUpdateCmdHandler");
                return new EmployeeUpdateResponse(false, ex.Message, null);
            }
            }
    }

    public record EmployeeUpdateResponse (bool Success, string Message, EmployeeDto employeeDto);

}
