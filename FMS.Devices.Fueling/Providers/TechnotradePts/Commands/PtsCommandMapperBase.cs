/*
 * File:          PtsCommandMapperBase.cs
 * Purpose:       Provides shared helpers for outbound Technotrade PTS command mappers.
 * Dependencies:  Newtonsoft.Json.Linq
 * Last Modified: 2026-05-03
 *
 * Key Functions:
 * - ToJObject(): Normalizes command data for jsonPTS packet Data.
 */
using Newtonsoft.Json.Linq;

namespace FMS.Devices.Fueling.Providers.TechnotradePts.Commands;

public abstract class PtsCommandMapperBase : IPtsCommandMapper
{
    private readonly IReadOnlyDictionary<string, string> _commandMap;

    protected PtsCommandMapperBase(IReadOnlyDictionary<string, string> commandMap)
    {
        _commandMap = commandMap;
    }

    public bool CanMap(string commandType) => _commandMap.ContainsKey(commandType);

    public virtual PtsCommandMapping TryMap(string commandType, object? commandData)
    {
        if (!_commandMap.TryGetValue(commandType, out var packetType))
        {
            throw new InvalidOperationException($"Unsupported Technotrade PTS command type '{commandType}'.");
        }

        return new PtsCommandMapping(commandType, packetType, ToJObject(commandData));
    }

    public static JObject? ToJObject(object? commandData)
    {
        if (commandData == null)
        {
            return null;
        }

        return commandData switch
        {
            JObject jObject => jObject,
            JToken token when token.Type == JTokenType.Object => (JObject)token,
            _ => JObject.FromObject(commandData)
        };
    }
}
