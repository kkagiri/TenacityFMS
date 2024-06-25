using NLog.LayoutRenderers;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;

namespace FMS.ATGClient.RabbitMQ
{
    public class RabbitMQService : IDisposable
    {

        private readonly IConnection _connection;
        private readonly IModel _channel;
        private const string ExchangeName = "upload-status-exchange";
        private const string QueueName = "upload-status-queue";

        private const string RoutingKey = "upload-status";

        public RabbitMQService(string connectionString)
        {
            var factory = new ConnectionFactory
            {
                Uri = new Uri(connectionString)
            };

            _connection = factory.CreateConnection();
            _channel = _connection.CreateModel();

            _channel.ExchangeDeclare(ExchangeName, ExchangeType.Direct, true);
            _channel.QueueDeclare(QueueName, true, false, false, null);
            _channel.QueueBind(QueueName, ExchangeName,RoutingKey);
        }


        public void PublishUploadStatus(string uploadStatusJson)
        {
            var body = Encoding.UTF8.GetBytes(uploadStatusJson);
              var properties = _channel.CreateBasicProperties();
            properties.Persistent = true;

            _channel.BasicPublish(ExchangeName,RoutingKey, properties, body);
        }

        public void ConsumeUploadStatus(EventHandler<BasicDeliverEventArgs> handler, CancellationToken stoppingToken)
        {
            var consumer = new EventingBasicConsumer(_channel);
            consumer.Received += (model,ea) =>
            {
                try
                {
                    
                    handler(this,ea);
                                    
                }
                catch(Exception ex)
                {
                   Console.WriteLine("Error processing message:",ex.Message);
                }
            };
        

            _channel.BasicConsume(QueueName, false, consumer);
        }

        public void Dispose()
        {
          _channel?.Dispose();
            _connection?.Dispose();
        }
    }
}
