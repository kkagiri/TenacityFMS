# FMS IoT Refactoring Guide
## Implementing ISO 30141 IoT Reference Architecture

### **Executive Summary**
This document outlines the refactoring strategy to transform the current FMS (Fuel Management System) into a standardized IoT architecture following ISO/IEC 30141:2018 guidelines. The refactoring will improve scalability, maintainability, security, and regulatory compliance while enabling independent scaling of different system components.

---

## **Current Architecture Analysis**

### **Current State Issues**
Based on analysis of `FMS.PTS.WindowsService/Program.cs` and `FMS.WebClient/Program.cs`:

1. **Monolithic Dependencies**: Both services share similar dependencies
2. **Mixed Responsibilities**: IoT gateway, processing, and business logic intermingled
3. **Tight Coupling**: Direct dependencies between layers
4. **Scaling Limitations**: Cannot scale components independently
5. **Testing Complexity**: Difficult to test components in isolation

### **Current Dependency Distribution**

#### FMS.PTS.WindowsService (Current IoT Service)
```csharp
// Communication & Connection (Should move to Gateway)
using FMS.Application.Communication;
using FMS.Application.Communication.Connection;
using FMS.Application.Communication.HttpPolling;
using FMS.Application.Communication.Tracker;
using FMS.Application.Communication.webSocket;

// Message Processing (Should move to ProcessingEngine)
using FMS.Application.Handlers;
using FMS.Application.PTSServices.PumpService;
using FMS.Application.Command.PTSCommand.Common;

// Business Logic (Should stay in Application)
using FMS.Application.Features.AutomatedReconciliation.Services;
using FMS.Application.Services.Configuration;
```

#### FMS.WebClient (Current Web Service)
```csharp
// Shared IoT Dependencies (Indicates tight coupling)
using FMS.Application.Communication.Connection;
using FMS.Application.Communication.Redis;
using FMS.Application.PTSServices.PumpService;

// Dashboard & UI (Should stay in WebClient)
using FMS.Application.Services.Dashboard;
using FMS.Application.Features.Dashboard;
```

---

## **Target Architecture: ISO 30141 Compliant**

### **Layer 1: FMS.IoT.Gateway**
**Responsibility**: Device connectivity, protocol handling, and edge processing

```
+-------------------------------------------------------------+
¦                   FMS.IoT.Gateway                           ¦
+-------------------------------------------------------------¦
¦ Core Components:                                           ¦
¦ • PTSWebSocketListenerService                             ¦
¦ • DeviceConnectionTracker                                 ¦
¦ • Protocol Handlers (WebSocket, HTTP, Serial)            ¦
¦ • Connection Health Monitoring                           ¦
¦ • Edge Security (Authentication, Encryption)             ¦
¦ • Buffer Management                                       ¦
¦                                                           ¦
¦ Key Interfaces:                                          ¦
¦ • IDeviceGateway                                         ¦
¦ • IProtocolHandler                                       ¦
¦ • IConnectionManager                                     ¦
¦ • IEdgeProcessor                                         ¦
+-------------------------------------------------------------+
```

### **Layer 2: FMS.IoT.ProcessingEngine**
**Responsibility**: Message processing, transformation, and routing

```
+-------------------------------------------------------------+
¦               FMS.IoT.ProcessingEngine                      ¦
+-------------------------------------------------------------¦
¦ Core Components:                                           ¦
¦ • PTSMessageProcessor                                     ¦
¦ • PacketHandlers (Upload*, Pump*, Tank*)                  ¦
¦ • Command Processing Pipeline                             ¦
¦ • Data Transformation Services                           ¦
¦ • Message Routing Engine                                 ¦
¦ • Event Processing Complex Event Processing)             ¦
¦                                                           ¦
¦ Key Interfaces:                                          ¦
¦ • IMessageProcessor                                      ¦
¦ • ICommandProcessor                                      ¦
¦ • IDataTransformer                                       ¦
¦ • IEventProcessor                                        ¦
+-------------------------------------------------------------+
```

### **Layer 3: FMS.Application (Enhanced)**
**Responsibility**: Business logic, domain services, and data persistence

```
+-------------------------------------------------------------+
¦                  FMS.Application                            ¦
+-------------------------------------------------------------¦
¦ Domain Services:                                           ¦
¦ • TankManagement                                          ¦
¦ • AutomatedReconciliation                                 ¦
¦ • Vehicle Management                                      ¦
¦ • User Management                                         ¦
¦ • Dashboard Services                                      ¦
¦ • Notification Services                                   ¦
¦                                                           ¦
¦ Key Interfaces:                                          ¦
¦ • IDomainService                                         ¦
¦ • IBusinessWorkflow                                      ¦
¦ • IDataRepository                                        ¦
¦ • IIntegrationService                                    ¦
+-------------------------------------------------------------+
```

---

## **Implementation Plan**

### **Phase 1: Project Structure Creation**

#### Create New Projects
```bash
# From Tenacity.Fms root directory
dotnet new classlib -n FMS.IoT.Gateway
dotnet new classlib -n FMS.IoT.ProcessingEngine
dotnet new classlib -n FMS.IoT.Contracts  # Shared contracts/interfaces
```

#### Project References Setup
```xml
<!-- FMS.IoT.Gateway.csproj -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
  </PropertyGroup>

  <ItemGroup>
    <ProjectReference Include="..\FMS.IoT.Contracts\FMS.IoT.Contracts.csproj" />
    <ProjectReference Include="..\FMS.Domain\FMS.Domain.csproj" />
  </ItemGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.Extensions.Hosting" Version="8.0.0" />
    <PackageReference Include="Microsoft.Extensions.Logging" Version="8.0.0" />
    <PackageReference Include="StackExchange.Redis" Version="2.7.4" />
    <PackageReference Include="System.Net.WebSockets" Version="4.3.0" />
  </ItemGroup>
</Project>

<!-- FMS.IoT.ProcessingEngine.csproj -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
  </PropertyGroup>

  <ItemGroup>
    <ProjectReference Include="..\FMS.IoT.Contracts\FMS.IoT.Contracts.csproj" />
    <ProjectReference Include="..\FMS.Domain\FMS.Domain.csproj" />
    <ProjectReference Include="..\FMS.Application\FMS.Application.csproj" />
  </ItemGroup>

  <ItemGroup>
    <PackageReference Include="MediatR" Version="12.2.0" />
    <PackageReference Include="Microsoft.Extensions.Hosting" Version="8.0.0" />
    <PackageReference Include="StackExchange.Redis" Version="2.7.4" />
  </ItemGroup>
</Project>
```

### **Phase 2: Interface Definitions (FMS.IoT.Contracts)**

#### Core Gateway Interfaces
```csharp
// FMS.IoT.Contracts/Gateway/IDeviceGateway.cs
namespace FMS.IoT.Contracts.Gateway;

public interface IDeviceGateway
{
    Task<bool> StartAsync(CancellationToken cancellationToken = default);
    Task<bool> StopAsync(CancellationToken cancellationToken = default);
    Task<DeviceConnection> AcceptConnectionAsync(string deviceId, string protocol);
    Task<bool> DisconnectDeviceAsync(string deviceId);
    IAsyncEnumerable<DeviceMessage> GetDeviceMessagesAsync(CancellationToken cancellationToken);
}

// FMS.IoT.Contracts/Gateway/IProtocolHandler.cs
public interface IProtocolHandler
{
    string Protocol { get; }
    Task<bool> CanHandleAsync(string protocol);
    Task<DeviceMessage> ParseMessageAsync(byte[] rawData);
    Task<byte[]> SerializeMessageAsync(DeviceMessage message);
}

// FMS.IoT.Contracts/Gateway/IConnectionManager.cs
public interface IConnectionManager
{
    Task RegisterConnectionAsync(string deviceId, IDeviceConnection connection);
    Task UnregisterConnectionAsync(string deviceId);
    IDeviceConnection GetConnection(string deviceId);
    IEnumerable<string> GetConnectedDevices();
    Task<bool> IsDeviceConnectedAsync(string deviceId);
}
```

#### Core Processing Engine Interfaces
```csharp
// FMS.IoT.Contracts/ProcessingEngine/IMessageProcessor.cs
namespace FMS.IoT.Contracts.ProcessingEngine;

public interface IMessageProcessor
{
    Task<ProcessingResult> ProcessMessageAsync(DeviceMessage message, CancellationToken cancellationToken = default);
    Task<CommandResult> ProcessCommandAsync(DeviceCommand command, CancellationToken cancellationToken = default);
}

// FMS.IoT.Contracts/ProcessingEngine/IDataTransformer.cs
public interface IDataTransformer
{
    Task<T> TransformAsync<T>(DeviceMessage message) where T : class;
    Task<DeviceMessage> TransformToDeviceMessageAsync<T>(T domainObject) where T : class;
}

// FMS.IoT.Contracts/ProcessingEngine/IEventProcessor.cs
public interface IEventProcessor
{
    Task PublishEventAsync<T>(T eventData) where T : class;
    Task<bool> SubscribeToEventAsync<T>(Func<T, Task> handler) where T : class;
}
```

### **Phase 3: Gateway Implementation**

#### Device Gateway Service
```csharp
// FMS.IoT.Gateway/Services/DeviceGatewayService.cs
namespace FMS.IoT.Gateway.Services;

public class DeviceGatewayService : BackgroundService, IDeviceGateway
{
    private readonly ILogger<DeviceGatewayService> _logger;
    private readonly IConnectionManager _connectionManager;
    private readonly IServiceProvider _serviceProvider;
    private readonly IGatewayConfiguration _configuration;
    private readonly Channel<DeviceMessage> _messageChannel;

    public DeviceGatewayService(
        ILogger<DeviceGatewayService> logger,
        IConnectionManager connectionManager,
        IServiceProvider serviceProvider,
        IGatewayConfiguration configuration)
    {
        _logger = logger;
        _connectionManager = connectionManager;
        _serviceProvider = serviceProvider;
        _configuration = configuration;

        var options = new BoundedChannelOptions(1000)
        {
            FullMode = BoundedChannelFullMode.Wait,
            SingleReader = false,
            SingleWriter = false
        };
        _messageChannel = Channel.CreateBounded<DeviceMessage>(options);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var listeners = new List<Task>();

        // Start protocol-specific listeners
        foreach (var protocolConfig in _configuration.Protocols)
        {
            var protocolHandler = _serviceProvider.GetRequiredKeyedService<IProtocolHandler>(protocolConfig.Protocol);
            listeners.Add(StartProtocolListener(protocolHandler, protocolConfig, stoppingToken));
        }

        await Task.WhenAll(listeners);
    }

    private async Task StartProtocolListener(IProtocolHandler handler, ProtocolConfiguration config, CancellationToken cancellationToken)
    {
        switch (handler.Protocol.ToLower())
        {
            case "websocket":
                await StartWebSocketListener(config, cancellationToken);
                break;
            case "http":
                await StartHttpListener(config, cancellationToken);
                break;
            default:
                _logger.LogWarning("Unknown protocol: {Protocol}", handler.Protocol);
                break;
        }
    }

    public async IAsyncEnumerable<DeviceMessage> GetDeviceMessagesAsync([EnumeratorCancellation] CancellationToken cancellationToken)
    {
        await foreach (var message in _messageChannel.Reader.ReadAllAsync(cancellationToken))
        {
            yield return message;
        }
    }
}
```

#### WebSocket Protocol Handler
```csharp
// FMS.IoT.Gateway/Protocols/WebSocketProtocolHandler.cs
namespace FMS.IoT.Gateway.Protocols;

public class WebSocketProtocolHandler : IProtocolHandler
{
    public string Protocol => "WebSocket";

    private readonly ILogger<WebSocketProtocolHandler> _logger;
    private readonly IConnectionManager _connectionManager;

    public WebSocketProtocolHandler(
        ILogger<WebSocketProtocolHandler> logger,
        IConnectionManager connectionManager)
    {
        _logger = logger;
        _connectionManager = connectionManager;
    }

    public Task<bool> CanHandleAsync(string protocol)
    {
        return Task.FromResult(string.Equals(protocol, "websocket", StringComparison.OrdinalIgnoreCase));
    }

    public async Task<DeviceMessage> ParseMessageAsync(byte[] rawData)
    {
        var jsonString = Encoding.UTF8.GetString(rawData);
        var ptsMessage = JsonSerializer.Deserialize<PTSMessage>(jsonString);

        return new DeviceMessage
        {
            MessageId = Guid.NewGuid().ToString(),
            DeviceId = ExtractDeviceId(ptsMessage),
            Protocol = Protocol,
            Timestamp = DateTime.UtcNow,
            RawData = rawData,
            ParsedData = ptsMessage
        };
    }

    public async Task<byte[]> SerializeMessageAsync(DeviceMessage message)
    {
        var jsonString = JsonSerializer.Serialize(message.ParsedData);
        return Encoding.UTF8.GetBytes(jsonString);
    }

    private string ExtractDeviceId(PTSMessage message)
    {
        // Extract device ID from PTS message
        // Implementation based on current PTSMessage structure
        return message.DeviceId ?? "unknown";
    }
}
```

### **Phase 4: Processing Engine Implementation**

#### Message Processing Service
```csharp
// FMS.IoT.ProcessingEngine/Services/MessageProcessingService.cs
namespace FMS.IoT.ProcessingEngine.Services;

public class MessageProcessingService : BackgroundService, IMessageProcessor
{
    private readonly ILogger<MessageProcessingService> _logger;
    private readonly IDeviceGateway _gateway;
    private readonly IDataTransformer _transformer;
    private readonly IEventProcessor _eventProcessor;
    private readonly IMediator _mediator;

    public MessageProcessingService(
        ILogger<MessageProcessingService> logger,
        IDeviceGateway gateway,
        IDataTransformer transformer,
        IEventProcessor eventProcessor,
        IMediator mediator)
    {
        _logger = logger;
        _gateway = gateway;
        _transformer = transformer;
        _eventProcessor = eventProcessor;
        _mediator = mediator;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var message in _gateway.GetDeviceMessagesAsync(stoppingToken))
        {
            _ = Task.Run(async () => await ProcessMessageAsync(message, stoppingToken), stoppingToken);
        }
    }

    public async Task<ProcessingResult> ProcessMessageAsync(DeviceMessage message, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Processing message {MessageId} from device {DeviceId}",
                message.MessageId, message.DeviceId);

            // Step 1: Transform raw message to domain objects
            var domainEvents = await _transformer.TransformAsync<List<IDomainEvent>>(message);

            // Step 2: Process each domain event
            var results = new List<CommandResult>();
            foreach (var domainEvent in domainEvents)
            {
                var result = await _mediator.Send(domainEvent, cancellationToken);
                results.Add(result);
            }

            // Step 3: Publish processing events
            await _eventProcessor.PublishEventAsync(new MessageProcessedEvent
            {
                MessageId = message.MessageId,
                DeviceId = message.DeviceId,
                ProcessedAt = DateTime.UtcNow,
                Success = results.All(r => r.Success)
            });

            return new ProcessingResult
            {
                Success = results.All(r => r.Success),
                Results = results,
                ProcessedAt = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing message {MessageId} from device {DeviceId}",
                message.MessageId, message.DeviceId);

            await _eventProcessor.PublishEventAsync(new MessageProcessingFailedEvent
            {
                MessageId = message.MessageId,
                DeviceId = message.DeviceId,
                Error = ex.Message,
                FailedAt = DateTime.UtcNow
            });

            return new ProcessingResult
            {
                Success = false,
                Error = ex.Message,
                ProcessedAt = DateTime.UtcNow
            };
        }
    }
}
```

### **Phase 5: Service Registration & Configuration**

#### Gateway Service Registration
```csharp
// FMS.IoT.Gateway/Extensions/ServiceCollectionExtensions.cs
namespace FMS.IoT.Gateway.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddIoTGateway(this IServiceCollection services, IConfiguration configuration)
    {
        // Configuration
        services.Configure<GatewayConfiguration>(configuration.GetSection("IoTGateway"));

        // Core Services
        services.AddSingleton<IDeviceGateway, DeviceGatewayService>();
        services.AddSingleton<IConnectionManager, ConnectionManager>();
        services.AddHostedService<DeviceGatewayService>();

        // Protocol Handlers
        services.AddKeyedSingleton<IProtocolHandler, WebSocketProtocolHandler>("websocket");
        services.AddKeyedSingleton<IProtocolHandler, HttpProtocolHandler>("http");
        services.AddKeyedSingleton<IProtocolHandler, MqttProtocolHandler>("mqtt");

        // Infrastructure
        services.AddSingleton<IConnectionMultiplexer>(sp =>
        {
            var connectionString = configuration.GetConnectionString("Redis");
            return ConnectionMultiplexer.Connect(connectionString);
        });

        return services;
    }
}
```

#### Processing Engine Service Registration
```csharp
// FMS.IoT.ProcessingEngine/Extensions/ServiceCollectionExtensions.cs
namespace FMS.IoT.ProcessingEngine.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddIoTProcessingEngine(this IServiceCollection services, IConfiguration configuration)
    {
        // Configuration
        services.Configure<ProcessingEngineConfiguration>(configuration.GetSection("IoTProcessingEngine"));

        // Core Services
        services.AddScoped<IMessageProcessor, MessageProcessingService>();
        services.AddScoped<IDataTransformer, DataTransformer>();
        services.AddScoped<IEventProcessor, EventProcessor>();
        services.AddHostedService<MessageProcessingService>();

        // Command Handlers
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(ServiceCollectionExtensions).Assembly));

        // Message Handlers (migrated from FMS.Application)
        services.AddScoped<IPacketHandler, UploadStatusHandler>();
        services.AddScoped<IPacketHandler, PumpTransactionHandler>();
        services.AddScoped<IPacketHandler, TankMeasurementHandler>();

        return services;
    }
}
```

### **Phase 6: Configuration Updates**

#### Updated FMS.PTS.WindowsService Program.cs
```csharp
// FMS.PTS.WindowsService/Program.cs (Updated)
namespace FMS.PTS.WindowsService
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = Host.CreateDefaultBuilder(args)
                .UseWindowsService()
                .UseSerilog()
                .ConfigureServices((context, services) =>
                {
                    var configuration = context.Configuration;

                    // Add IoT Gateway (replaces direct communication services)
                    services.AddIoTGateway(configuration);

                    // Add IoT Processing Engine (replaces direct message processing)
                    services.AddIoTProcessingEngine(configuration);

                    // Keep only PTS-specific services
                    ConfigurePTSSpecificServices(services, configuration);
                });

            var host = builder.Build();
            await host.RunAsync();
        }

        private static void ConfigurePTSSpecificServices(IServiceCollection services, IConfiguration configuration)
        {
            // Only PTS-specific configurations remain here
            services.AddDbContext<GpsdataContext>(options =>
                options.UseMySql(configuration.GetConnectionString("FMSConnection")));

            // Background services specific to PTS
            services.AddHostedService<DeviceActivityMonitorService>();
        }
    }
}
```

#### Updated FMS.WebClient Program.cs
```csharp
// FMS.WebClient/Program.cs (Updated)
namespace FMS.WebClient
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            ConfigureServices(builder.Services, builder.Configuration);

            var app = builder.Build();
            await ConfigureApp(app, builder.Environment);

            app.Run();
        }

        private static void ConfigureServices(IServiceCollection services, IConfiguration configuration)
        {
            // Web-specific services
            services.AddControllers();
            services.AddSignalR();

            // Authentication & Authorization
            ConfigureAuthentication(services, configuration);
            ConfigureAuthorization(services);

            // Dashboard & UI Services (no direct IoT dependencies)
            services.AddScoped<IDashboardService, DashboardService>();
            services.AddScoped<IUserManagementService, UserManagementService>();

            // Command interface to IoT layers (through contracts)
            services.AddScoped<IDeviceCommandService, DeviceCommandService>();

            // Keep database context
            ConfigureDatabase(services, configuration);
        }
    }
}
```

---

## **Migration Strategy**

### **Phase 1: Foundation (Week 1-2)**
1. Create new project structures
2. Define core interfaces and contracts
3. Set up basic service registrations
4. Implement basic gateway functionality

### **Phase 2: Gateway Migration (Week 3-4)**
1. Move connection management to Gateway
2. Migrate protocol handlers
3. Implement device lifecycle management
4. Test gateway independently

### **Phase 3: Processing Engine Migration (Week 5-6)**
1. Move message processing logic
2. Migrate packet handlers
3. Implement event processing
4. Test processing engine independently

### **Phase 4: Integration & Testing (Week 7-8)**
1. Integrate all layers
2. Update service configurations
3. Performance testing
4. End-to-end testing

### **Phase 5: Deployment & Optimization (Week 9-10)**
1. Production deployment
2. Monitoring implementation
3. Performance optimization
4. Documentation completion

---

## **Benefits Achieved**

### **1. Standardized Architecture**
- ? ISO 30141 compliant structure
- ? Industry-recognized layering
- ? Clear separation of concerns

### **2. Interoperability**
- ? Standard interfaces for external integration
- ? Protocol-agnostic design
- ? Easy third-party system integration

### **3. Scalability**
- ? Independent scaling of Gateway, Engine, and Application
- ? Horizontal scaling capabilities
- ? Load balancing at each layer

### **4. Security**
- ? Security-by-design at each layer
- ? Isolated security contexts
- ? Comprehensive audit trails

### **5. Maintainability**
- ? Well-defined boundaries
- ? Independent testing capabilities
- ? Isolated change impacts

### **6. Vendor Independence**
- ? Standard interfaces reduce lock-in
- ? Protocol flexibility
- ? Technology stack independence

### **7. Regulatory Compliance**
- ? Audit-ready architecture
- ? Compliance documentation
- ? Traceability at all layers

---

## **Testing Strategy**

### **Unit Testing**
```csharp
// Example Gateway Unit Test
[Test]
public async Task Gateway_Should_Accept_WebSocket_Connection()
{
    // Arrange
    var mockConnectionManager = new Mock<IConnectionManager>();
    var gateway = new DeviceGatewayService(mockConnectionManager.Object);

    // Act
    var result = await gateway.AcceptConnectionAsync("device001", "websocket");

    // Assert
    Assert.That(result, Is.Not.Null);
    mockConnectionManager.Verify(x => x.RegisterConnectionAsync("device001", It.IsAny<IDeviceConnection>()), Times.Once);
}
```

### **Integration Testing**
```csharp
// Example End-to-End Test
[Test]
public async Task End_To_End_Message_Processing()
{
    // Arrange
    var testServer = new TestServer();
    var gateway = testServer.Services.GetService<IDeviceGateway>();
    var processor = testServer.Services.GetService<IMessageProcessor>();

    // Act
    var deviceMessage = CreateTestDeviceMessage();
    var result = await processor.ProcessMessageAsync(deviceMessage);

    // Assert
    Assert.That(result.Success, Is.True);
}
```

---

## **Monitoring & Observability**

### **Key Metrics**
- Gateway: Connection count, message throughput, protocol distribution
- Processing Engine: Processing latency, error rates, transformation success
- Application: Business transaction success, user activity, system performance

### **Logging Strategy**
- Structured logging with correlation IDs
- Distributed tracing across layers
- Performance metrics collection
- Security event logging

---

This refactoring guide provides a comprehensive roadmap for transforming your FMS system into a scalable, maintainable, and standards-compliant IoT architecture while preserving existing functionality and enabling future growth.
