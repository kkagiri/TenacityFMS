using AutoMapper;
using FMS.Application.ModelsDTOs.FMS.Employee;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Policy;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Command.DatabaseCommand.EmployeeCmd
{
    public class EmployeeCreateCmd:IRequest<EmployeeCreateResponse>
    {
        public EmployeeDto EmployeeDto { get; set; } 
    }

    public class EmployeeCreateCmdHandler : IRequestHandler<EmployeeCreateCmd, EmployeeCreateResponse>
    {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<EmployeeCreateCmdHandler> _logger; 

        public EmployeeCreateCmdHandler(GpsdataContext context, IMapper mapper,ILogger<EmployeeCreateCmdHandler> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }


        public async Task<EmployeeCreateResponse> Handle(EmployeeCreateCmd request, CancellationToken cancellationToken)
        {
            try
            {
                var site = await _context.Sites.FindAsync(request.EmployeeDto.SiteId);
                if (site == null) return new EmployeeCreateResponse(false, "Site not found", null);
                // Check for duplicate NationalId
                var duplicateEmployee = await _context.Employees.FirstOrDefaultAsync(e => e.NationalId == request.EmployeeDto.NationalId);
                if (duplicateEmployee != null)  return new EmployeeCreateResponse(false, $"Duplicate NationalId {request.EmployeeDto.NationalId} found", null);             
                if (string.IsNullOrWhiteSpace(request.EmployeeDto.Employeestatus)) return new EmployeeCreateResponse( false, "Employee Status cannot be empty. It should be either 'Active' or 'Terminated'.", null);
                 string status = request.EmployeeDto.Employeestatus.Trim();
                if (status != "Active" && status != "Terminated") return new EmployeeCreateResponse( false,"Invalid Employee Status. It should be either 'Active' or 'Terminated'.",null);
                var employee = new Employee
                {
                    SiteId = request.EmployeeDto.SiteId,
                    FullName = request.EmployeeDto.FullName,
                    EmployeeWorkNo = request.EmployeeDto.EmployeeWorkNo,
                    EmployeephoneNumber = request.EmployeeDto.EmployeephoneNumber,
                    NationalId = request.EmployeeDto.NationalId,
                    Employeestatus = request.EmployeeDto.Employeestatus,
                    Site = site,
                    DateCreated = DateTime.UtcNow,
                    DateModified = DateTime.UtcNow,
                    IsModified =false?(sbyte)1:(sbyte)0,  
                    ModifiedBy = request.EmployeeDto.ModifiedBy,
                    CreatedBy = request.EmployeeDto.CreatedBy,
                    Vehicles = new List<Vehicle>()
                };

                // Validate and add vehicles
                foreach (var vehicleId in request.EmployeeDto.Vehicles)
                {
                    var result = await _context.Vehicles.FirstOrDefaultAsync(i => i.VehicleId == vehicleId);
                    if (result == null) return new EmployeeCreateResponse(false, $"Vehicle with ID {vehicleId} not found", null);
                     employee.Vehicles.Add(result);
                }

                _context.Employees.Add(employee);
                await _context.SaveChangesAsync(cancellationToken);

                return new EmployeeCreateResponse(true, "Employee created successfully", _mapper.Map<EmployeeDto>(employee));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating employee");
                throw new Exception(ex.Message);
            }
        }
    }


    public record EmployeeCreateResponse(bool Success, string Message, EmployeeDto EmployeeDto );





}
