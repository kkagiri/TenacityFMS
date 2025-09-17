using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.Dashboard;
using FMS.Domain.Entities.Dashboard;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace FMS.Application.Command.DatabaseCommand.Dashboard {
    // Update Widget Instance Command
    public record UpdateWidgetInstanceCommand (
        string UserId,
        int WidgetInstanceId,
        WidgetConfigurationDto Configuration,
        string Actor) : IRequest<FMSResponseMessage<DashboardWidgetInstanceDto>>;

    public class UpdateWidgetInstanceCommandHandler : IRequestHandler<UpdateWidgetInstanceCommand, FMSResponseMessage<DashboardWidgetInstanceDto>> {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<UpdateWidgetInstanceCommandHandler> _logger;

        public UpdateWidgetInstanceCommandHandler (
            GpsdataContext context,
            IMapper mapper,
            ILogger<UpdateWidgetInstanceCommandHandler> logger) {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<FMSResponseMessage<DashboardWidgetInstanceDto>> Handle (
            UpdateWidgetInstanceCommand request,
            CancellationToken cancellationToken) {
            try {
                var widgetInstance = await _context.DashboardWidgetInstances
                    .Include (w => w.Template)
                    .FirstOrDefaultAsync (w => w.Id == request.WidgetInstanceId && w.UserId == request.UserId, cancellationToken);

                if (widgetInstance == null) {
                    return new FMSResponseMessage<DashboardWidgetInstanceDto> (
                        false, "Widget instance not found", null!);
                }

                // Update configuration
                var configuration = new {
                    settings = request.Configuration.Settings,
                    filters = request.Configuration.Filters,
                    visualizationType = request.Configuration.VisualizationType,
                    datePreset = "yesterday",
                    mode = "cumulative"
                };

                widgetInstance.CustomName = request.Configuration.CustomName;
                widgetInstance.ConfigurationJson = JsonConvert.SerializeObject (configuration);

                widgetInstance.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync (cancellationToken);

                var dto = _mapper.Map<DashboardWidgetInstanceDto> (widgetInstance);
                return new FMSResponseMessage<DashboardWidgetInstanceDto> (
                    true, "Widget instance updated successfully", dto);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error updating widget instance {WidgetId} for user {UserId}",
                    request.WidgetInstanceId, request.UserId);
                return new FMSResponseMessage<DashboardWidgetInstanceDto> (
                    false, ex.Message, null!);
            }
        }
    }
}