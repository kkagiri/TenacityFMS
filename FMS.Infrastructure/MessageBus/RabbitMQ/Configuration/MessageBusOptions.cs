using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Infrastructure.EventBus.RabbitMQ.Configuration
{
    public class MessageBusOptions
    {
        public string HostName { get; set; } = "localhost";
        public int Port { get; set; } = 5672; // Default RabbitMQ port
        public string UserName { get; set; } = "guest";
        public string Password { get; set; } = "guest";
        public string VirtualHost { get; set; } = "/";
        public bool UseSsl { get; set; }

        public bool AutomaticRecoveryEnabled { get; set; } = true;
        public int NetworkRecoveryIntervalSeconds { get; set; } = 10;
    }

}
