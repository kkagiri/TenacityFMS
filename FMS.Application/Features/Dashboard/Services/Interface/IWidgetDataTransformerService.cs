using System.Collections.Generic;
using System.Threading.Tasks;

namespace FMS.Application.Services.Dashboard {
    public interface IWidgetDataTransformerService {
        Task<object> TransformAsync (string widgetType, object rawData, Dictionary<string, object> configuration);
    }
}