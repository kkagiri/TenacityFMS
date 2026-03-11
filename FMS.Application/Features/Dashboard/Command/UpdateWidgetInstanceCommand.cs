using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.Dashboard;
using FMS.Application.Services.Dashboard;
using FMS.Domain.Entities.Dashboard;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.Dashboard
{
    // Update Widget Instance Command
    public record UpdateWidgetInstanceCommand(
        string UserId,
        int WidgetInstanceId,
        WidgetConfigurationDto Configuration,
        string Actor) : IRequest<FMSResponseMessage<DashboardWidgetInstanceDto>>;

    public class UpdateWidgetInstanceCommandHandler : IRequestHandler<UpdateWidgetInstanceCommand, FMSResponseMessage<DashboardWidgetInstanceDto>>
    {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<UpdateWidgetInstanceCommandHandler> _logger;
        private readonly IWidgetConfigurationPreparationService _widgetConfigurationPreparationService;
        private readonly IWidgetInstanceDtoHydrationService _widgetInstanceDtoHydrationService;

        public UpdateWidgetInstanceCommandHandler(
            GpsdataContext context,
            IMapper mapper,
            ILogger<UpdateWidgetInstanceCommandHandler> logger,
            IWidgetConfigurationPreparationService widgetConfigurationPreparationService,
            IWidgetInstanceDtoHydrationService widgetInstanceDtoHydrationService)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
            _widgetConfigurationPreparationService = widgetConfigurationPreparationService;
            _widgetInstanceDtoHydrationService = widgetInstanceDtoHydrationService;
        }

        public async Task<FMSResponseMessage<DashboardWidgetInstanceDto>> Handle(
            UpdateWidgetInstanceCommand request,
            CancellationToken cancellationToken)
        {
            try
            {
                var widgetInstance = await _context.DashboardWidgetInstances
                    .Include(w => w.Template)
                    .FirstOrDefaultAsync(w => w.Id == request.WidgetInstanceId && w.UserId == request.UserId, cancellationToken);

                if (widgetInstance == null)
                {
                    return new FMSResponseMessage<DashboardWidgetInstanceDto>(
                        false, "Widget instance not found", null!);
                }

                WidgetConfigurationPreparationResult preparedConfiguration = await _widgetConfigurationPreparationService
                    .PrepareAsync(request.Configuration, cancellationToken);

                if (!preparedConfiguration.Success)
                {
                    return new FMSResponseMessage<DashboardWidgetInstanceDto>(
                        false, preparedConfiguration.Message, null!);
                }

                widgetInstance.CustomName = request.Configuration.CustomName;
                widgetInstance.TemplateId = preparedConfiguration.TemplateId;
                widgetInstance.Template = preparedConfiguration.Template;
                widgetInstance.WidgetType = preparedConfiguration.WidgetType;
                widgetInstance.Category = preparedConfiguration.Category;
                widgetInstance.DataSource = preparedConfiguration.DataSource;
                widgetInstance.IsCustomWidget = preparedConfiguration.IsCustomWidget;
                widgetInstance.ConfigurationJson = preparedConfiguration.ConfigurationJson;

                if (request.Configuration.PositionX.HasValue)
                {
                    widgetInstance.PositionX = request.Configuration.PositionX.Value;
                }

                if (request.Configuration.PositionY.HasValue)
                {
                    widgetInstance.PositionY = request.Configuration.PositionY.Value;
                }

                if (request.Configuration.Width.HasValue)
                {
                    widgetInstance.Width = request.Configuration.Width.Value;
                }

                if (request.Configuration.Height.HasValue)
                {
                    widgetInstance.Height = request.Configuration.Height.Value;
                }

                if (preparedConfiguration.IsVisible.HasValue)
                {
                    widgetInstance.IsVisible = preparedConfiguration.IsVisible.Value;
                }

                widgetInstance.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync(cancellationToken);

                var dto = _widgetInstanceDtoHydrationService.Hydrate(
                    widgetInstance,
                    _mapper.Map<DashboardWidgetInstanceDto>(widgetInstance));
                return new FMSResponseMessage<DashboardWidgetInstanceDto>(
                    true, "Widget instance updated successfully", dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating widget instance {WidgetId} for user {UserId}",
                    request.WidgetInstanceId, request.UserId);
                return new FMSResponseMessage<DashboardWidgetInstanceDto>(
                    false, ex.Message, null!);
            }
        }
    }
}