using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.ReportCommand;

public class GenerateVehicleReportCommand : IRequest<int>
{
    public string ReportName { get; set; }
    public string GenerateBy {get;set;}

    public string RoleID { get; set; }


    public DateTime StartDate { get; set; } 
    public DateTime EndDate { get; set; }   

} 


public class GenerateVehicleReportCommandHandler : IRequestHandler<GenerateVehicleReportCommand,int>

{
    private readonly GpsdataContext _context;

   // private readonly IEmailService  _emailService;

    private readonly ILogger<GenerateVehicleReportCommandHandler> _logger;
    public GenerateVehicleReportCommandHandler(GpsdataContext context, ILogger<GenerateVehicleReportCommandHandler> logger)
     {
        _context = context;
        _logger = logger;
        
     }


     public Task<int> Handle(GenerateVehicleReportCommand request, CancellationToken cancellationToken)
     {
        // try{

        //     var report = new VehicleConsumptionReport
        //     {
        //         ReportName = request.ReportName,
                
        //     }

        // }
     throw new NotImplementedException();
     }


}