
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using FMS.Application.Handlers.Interface;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Handlers.Common;
public class MessageHandlerRegistry
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IReadOnlyDictionary<string, Type> _handlerMap;
    private readonly ILogger<MessageHandlerRegistry> _logger;

    public MessageHandlerRegistry(
        IServiceProvider serviceProvider,
        IEnumerable<IPacketHandler> handlers,
        ILogger<MessageHandlerRegistry> logger)
    {
        _serviceProvider = serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        if (handlers == null)
            throw new ArgumentNullException(nameof(handlers));

        var handlerMap = new Dictionary<string, Type>(StringComparer.OrdinalIgnoreCase);

        foreach (var handler in handlers)
        {
            var type = handler.GetType();
            var packetType = GetPacketType(type, handler);

            if (string.IsNullOrEmpty(packetType))
            {
                _logger.LogWarning("PacketType could not be determined for handler of type '{TypeName}'. " +
                                 "Ensure either PacketHandlerAttribute is used or PacketType property is implemented.",
                                 type.Name);
                continue;
            }

            if (handlerMap.ContainsKey(packetType))
            {
                throw new InvalidOperationException(
                    $"Multiple handlers found for packet type '{packetType}'. " +
                    $"Existing: {handlerMap[packetType].Name}, New: {type.Name}");
            }

            handlerMap.Add(packetType, type);
            //  _logger.LogDebug("Added handler for packet type '{PacketType}', Handler Type: '{TypeName}'",
            //  packetType, type.Name);
        }

        _handlerMap = handlerMap;
    }

    private string GetPacketType(Type type, IPacketHandler handler)
    {
        var attr = type.GetCustomAttribute<PacketTypeAttribute>();
        return attr?.Type ?? handler.PacketType;
    }

    public IPacketHandler GetHandler(string messageType)
    {
        if (string.IsNullOrEmpty(messageType))
            throw new ArgumentNullException(nameof(messageType));

        if (!_handlerMap.TryGetValue(messageType, out var handlerType))
        {
            throw new NotSupportedException($"No handler registered for message type: {messageType}");
        }

        var handler = _serviceProvider.GetRequiredService(handlerType) as IPacketHandler;
        if (handler == null)
        {
            throw new InvalidOperationException(
                $"Registered handler type '{handlerType.Name}' for message type '{messageType}' " +
                "is not an IPacketHandler.");
        }

        return handler;
    }
}



