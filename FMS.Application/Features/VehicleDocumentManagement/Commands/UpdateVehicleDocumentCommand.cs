using AutoMapper;
using FMS.Application.Common;
using FMS.Application.CommonInterface;
using FMS.Application.Features.VehicleDocumentManagement.Dtos;
using FMS.Domain.Entities.Features.VehicleDocumentManagement;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.VehicleDocumentManagement.Commands;

public record UpdateVehicleDocumentCommand(UpdateVehicleDocumentDto UpdateVehicleDocumentDto) : IRequest<FMSResponse<bool>>;

public class UpdateVehicleDocumentCommandHandler : IRequestHandler<UpdateVehicleDocumentCommand, FMSResponse<bool>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<UpdateVehicleDocumentCommandHandler> _logger;
    private readonly IFileHandlingService _fileHandlingService;

    public UpdateVehicleDocumentCommandHandler(GpsdataContext context, ILogger<UpdateVehicleDocumentCommandHandler> logger, IFileHandlingService fileHandlingService)
    {
        _context = context;
        _logger = logger;
        _fileHandlingService = fileHandlingService;
    }

    public async Task<FMSResponse<bool>> Handle(UpdateVehicleDocumentCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var vehicleDocument = await _context.VehicleDocuments.FirstOrDefaultAsync(vd => vd.Id == request.UpdateVehicleDocumentDto.Id, cancellationToken);

            if (vehicleDocument == null)
            {
                return FMSResponse<bool>.Fail("Vehicle document not found.");
            }

            string documentFileUrl = vehicleDocument.DocumentFileUrl;
            string documentFileName = vehicleDocument.DocumentFileName;

            if (request.UpdateVehicleDocumentDto.DocumentFile != null)
            {
                documentFileUrl = await _fileHandlingService.UploadFileAsync(request.UpdateVehicleDocumentDto.DocumentFile, "vehicle-documents");
                documentFileName = request.UpdateVehicleDocumentDto.DocumentFile.FileName;
            }

            vehicleDocument.Update(
                request.UpdateVehicleDocumentDto.DocumentNumber,
                request.UpdateVehicleDocumentDto.IssueDate,
                request.UpdateVehicleDocumentDto.ExpiryDate,
                request.UpdateVehicleDocumentDto.IssuingAuthority,
                request.UpdateVehicleDocumentDto.Notes,
                documentFileName,
                documentFileUrl,
                "System" // Replace with actual user
            );

            _context.VehicleDocuments.Update(vehicleDocument);
            await _context.SaveChangesAsync(cancellationToken);

            return FMSResponse<bool>.Success(true, "Vehicle document updated successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating vehicle document.");
            return FMSResponse<bool>.Fail("Error updating vehicle document.");
        }
    }
}
