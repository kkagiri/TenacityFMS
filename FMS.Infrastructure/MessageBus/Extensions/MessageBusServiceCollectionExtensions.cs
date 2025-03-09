using FMS.Infrastructure.EventBus.RabbitMQ;
using FMS.Infrastructure.EventBus.RabbitMQ.Configuration;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Infrastructure.EventBus.Extensions
{
    public static class MessageBusServiceCollectionExtensions
    {
        public static IServiceCollection AddMessageBus(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            services.Configure<MessageBusOptions>(
                configuration.GetSection("MessageBus"));

            services.AddSingleton<IMessageBusClient, RabbitMQClient>();

            return services;
        }
    }
}
