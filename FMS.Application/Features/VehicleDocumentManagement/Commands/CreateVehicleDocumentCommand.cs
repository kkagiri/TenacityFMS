using AutoMapper;
using FMS.Application.Common;
using FMS.Application.CommonInterface;
using FMS.Application.Features.VehicleDocumentManagement.Dtos;
using FMS.Domain.Entities.Features.VehicleDocumentManagement;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.VehicleDocumentManagement.Commands;

public record CreateVehicleDocumentCommand(CreateVehicleDocumentDto CreateVehicleDocumentDto) : IRequest<FMSResponse<VehicleDocumentDto>>;

public class CreateVehicleDocumentCommandHandler : IRequestHandler<CreateVehicleDocumentCommand, FMSResponse<VehicleDocumentDto>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<CreateVehicleDocumentCommandHandler> _logger;
    private readonly IFileHandlingService _fileHandlingService;

    public CreateVehicleDocumentCommandHandler(GpsdataContext context, IMapper mapper, ILogger<CreateVehicleDocumentCommandHandler> logger, IFileHandlingService fileHandlingService)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
        _fileHandlingService = fileHandlingService;
    }

    public async Task<FMSResponse<VehicleDocumentDto>> Handle(CreateVehicleDocumentCommand request, CancellationToken cancellationToken)
    {
        try
        {
            string documentFileUrl = null;
            string documentFileName = null;

            if (request.CreateVehicleDocumentDto.DocumentFile != null)
            {
                documentFileUrl = await _fileHandlingService.UploadFileAsync(request.CreateVehicleDocumentDto.DocumentFile, "vehicle-documents");
                documentFileName = request.CreateVehicleDocumentDto.DocumentFile.FileName;
            }

            var vehicleDocument = new VehicleDocument(
                request.CreateVehicleDocumentDto.VehicleId,
                request.CreateVehicleDocumentDto.DocumentType,
                request.CreateVehicleDocumentDto.DocumentNumber,
                request.CreateVehicleDocumentDto.IssueDate,
                request.CreateVehicleDocumentDto.ExpiryDate,
                request.CreateVehicleDocumentDto.IssuingAuthority,
                request.CreateVehicleDocumentDto.Notes,
                documentFileName,
                documentFileUrl,
                "System" // Replace with actual user
            );

            await _context.VehicleDocuments.AddAsync(vehicleDocument, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            var vehicleDocumentDto = _mapper.Map<VehicleDocumentDto>(vehicleDocument);

            return FMSResponse<VehicleDocumentDto>.Success(vehicleDocumentDto, "Vehicle document created successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating vehicle document.");
            return FMSResponse<VehicleDocumentDto>.Fail("Error creating vehicle document.");
        }
    }
}
