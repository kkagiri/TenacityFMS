
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using AutoMapper.Configuration.Annotations;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Communication.HttpPolling;

//ToDo: Implement this later
public class PendingCommandsRepository : IPendingCommandRepository
{
    private readonly GpsdataContext _context;
    private readonly ILogger<PendingCommandsRepository> _logger;

    private readonly IMemoryCache _memoryCache;
    private const string CacheKeyPrefix = "PendingCommand_";

    public PendingCommandsRepository(GpsdataContext context, ILogger<PendingCommandsRepository> logger, IMemoryCache memoryCache)
    {
        _context = context;
        _logger = logger;
        _memoryCache = memoryCache;
    }

    public async Task SavePendingConfigurationAsync(string deviceId, string commandType, object commandData)
    {
        try
        {
            var commandDataJson = JsonSerializer.Serialize(commandData);

            // Claude3: Create new command
            var newCommand = new PendingCommand
            {
                CommandType = commandType,
                CommandDataJson = commandDataJson
            };

            // Claude3: Create device-command relationship
            var deviceCommand = new PtsDeviceCommand
            {
                PendingCommand = newCommand,
                PtsDeviceId = int.Parse(deviceId)
            };

            newCommand.PtsDeviceCommands.Add(deviceCommand);

            _context.PendingCommands.Add(newCommand);
            await _context.SaveChangesAsync();

            await UpdateCacheForDeviceAsync(deviceId);


        }
        catch (Exception ex)
        {

            _logger.LogError(ex, "Something went wrong ");
        }
    }
    private async Task UpdateCacheForDeviceAsync(string deviceId)
    {
        var commands = await GetPendingConfigurationsAsync(deviceId);
        var cacheKey = $"{CacheKeyPrefix}{deviceId}";
        _memoryCache.Set(cacheKey, commands);
    }

    public async Task ClearPendingConfigurationAsync(string deviceId)
    {
        var pending = await _context.PendingCommands
             .FirstOrDefaultAsync(pc => pc.PTSDeviceId == deviceId);

        if (pending != null)
        {
            _context.PendingCommands.Remove(pending);
            await _context.SaveChangesAsync();
        }
        var cacheKey = $"{CacheKeyPrefix}{deviceId}";
        _memoryCache.Remove(cacheKey);
    }

    public async Task<IEnumerable<(string commandType, object commandData)>> GetPendingConfigurationsAsync(string deviceId)
    {
        var cacheKey = $"{CacheKeyPrefix}{deviceId}";

        if (_memoryCache.TryGetValue(cacheKey, out IEnumerable<(string, object)> cachedCommands))
        {
            return cachedCommands;
        }

        var commands = await _context.PtsDeviceCommands
            .Include(dc => dc.PendingCommand)
            .Where(dc => dc.PtsDeviceId == int.Parse(deviceId))
            .Select(dc => new
            {
                dc.PendingCommand.CommandType,
                dc.PendingCommand.CommandDataJson
            })
            .ToListAsync();

        var result = commands.Select(c => (
            c.CommandType,
            JsonSerializer.Deserialize<object>(c.CommandDataJson)!
        )).ToList();

        _memoryCache.Set(cacheKey, result);
        return result;
    }


}
