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
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Dashboard.Command
{
    // Create Widget Instance Command
    public record CreateWidgetInstanceCommand(
        string UserId,
        WidgetConfigurationDto Configuration,
        string Actor) : IRequest<FMSResponseMessage<DashboardWidgetInstanceDto>>;

    public class CreateWidgetInstanceCommandHandler : IRequestHandler<CreateWidgetInstanceCommand, FMSResponseMessage<DashboardWidgetInstanceDto>>
    {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<CreateWidgetInstanceCommandHandler> _logger;
        private readonly IWidgetConfigurationPreparationService _widgetConfigurationPreparationService;
        private readonly IWidgetInstanceDtoHydrationService _widgetInstanceDtoHydrationService;

        public CreateWidgetInstanceCommandHandler(
            GpsdataContext context,
            IMapper mapper,
            ILogger<CreateWidgetInstanceCommandHandler> logger,
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
            CreateWidgetInstanceCommand request,
            CancellationToken cancellationToken)
        {
            try
            {
                WidgetConfigurationPreparationResult preparedConfiguration = await _widgetConfigurationPreparationService
                    .PrepareAsync(request.Configuration, cancellationToken);

                if (!preparedConfiguration.Success)
                {
                    return new FMSResponseMessage<DashboardWidgetInstanceDto>(
                        false, preparedConfiguration.Message, null!);
                }

                DashboardWidgetInstance widgetInstance = new DashboardWidgetInstance
                {
                    UserId = request.UserId,
                    TemplateId = preparedConfiguration.TemplateId,
                    CustomName = request.Configuration.CustomName,
                    WidgetType = preparedConfiguration.WidgetType,
                    Category = preparedConfiguration.Category,
                    DataSource = preparedConfiguration.DataSource,
                    PositionX = request.Configuration.PositionX ?? 0,
                    PositionY = request.Configuration.PositionY ?? 0,
                    Width = request.Configuration.Width ?? 4,
                    Height = request.Configuration.Height ?? 3,
                    IsVisible = preparedConfiguration.IsVisible ?? true,
                    IsCustomWidget = preparedConfiguration.IsCustomWidget,
                    ConfigurationJson = preparedConfiguration.ConfigurationJson,
                };

                _context.DashboardWidgetInstances.Add(widgetInstance);
                await _context.SaveChangesAsync(cancellationToken);

                DashboardWidgetInstanceDto dto = _widgetInstanceDtoHydrationService.Hydrate(
                    widgetInstance,
                    _mapper.Map<DashboardWidgetInstanceDto>(widgetInstance));
                if (!preparedConfiguration.IsCustomWidget && preparedConfiguration.Template != null)
                {
                    dto.Template = _mapper.Map<DashboardWidgetTemplateDto>(preparedConfiguration.Template);
                }

                return new FMSResponseMessage<DashboardWidgetInstanceDto>(
                    true, "Widget instance created successfully", dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating widget instance for user {UserId}", request.UserId);
                return new FMSResponseMessage<DashboardWidgetInstanceDto>(
                    false, ex.Message, null!);
            }
        }
    }
}