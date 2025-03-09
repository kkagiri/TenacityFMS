
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
using Org.BouncyCastle.Asn1.Cms;

namespace FMS.Application.Communication.HttpPolling;

//ToDo: Implement this later
public class PendingCommandsRepository : IPendingCommandRepository
{
    private readonly GpsdataContext _context;
    private readonly ILogger<PendingCommandsRepository> _logger;

    private readonly IMemoryCache _memoryCache;
    private const string CacheKeyPrefix = "PendingCommands_";

    public PendingCommandsRepository(GpsdataContext context, ILogger<PendingCommandsRepository> logger, IMemoryCache memoryCache)
    {
        _context = context;
        _logger = logger;
        _memoryCache = memoryCache;
    }

    public async Task<int> QueueCommandAsync(string pTSDeviceId, string commandType, object commandData, int priority = 0, string? source = null)
    {
        try
        {
            //create a ptsdevice-command association .
            var pendingCommand = new PtsDevicePendingCommand
            {
                PtsDeviceId = pTSDeviceId,
                CommandType = commandType,

                CommandDataJson = JsonSerializer.Serialize(commandData),
                AssignedAt = DateTime.UtcNow,
                Status = "Pending",
                Priority = priority,
                Source = source ?? "API"

            };

            _context.PtsDevicePendingCommands.Add(pendingCommand);
            await _context.SaveChangesAsync();
            await InvalidateCacheAsync(pTSDeviceId);
            return pendingCommand.Id;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while assigning command to device.");
            throw;
        }
    }

    /// <summary>
    ///  Get all pending commands for a device either from the cache or the database
    /// </summary>
    /// <param name="pTSDeviceId"></param>
    /// <returns></returns>
    public async Task<IEnumerable<(int commandId, string commandType, object commandData, string status)>> GetPendingCommandsForDeviceAsync(string pTSDeviceId)
    {
        try
        {
            var cacheKey = $"{CacheKeyPrefix}{pTSDeviceId}_Pending";
            if (_memoryCache.TryGetValue(cacheKey, out IEnumerable<(int, string, object, string)> commands))
            {
                return commands;
            }

            var pendingCommands = await _context.PtsDevicePendingCommands
                                    .Where(p => p.PtsDeviceId == pTSDeviceId && p.Status == "Pending")
                                     .OrderBy(pc => pc.Priority).ThenBy(c => c.AssignedAt)
                                     .ToListAsync();

            var result = pendingCommands.Select(pc => (pc.Id, pc.CommandType, JsonSerializer.Deserialize<object>(pc.CommandDataJson)!, pc.Status)).ToList();

            _memoryCache.Set(cacheKey, result, TimeSpan.FromMinutes(5));
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while getting pending commands for device.");
            throw;
        }
    }


    /// <summary>
    /// Remove a pending command from the device either from the cache or the database
    /// </summary>
    /// <param name="pTSDeviceId"></param>
    /// <param name="commandType"></param>
    /// <returns></returns>
    /// <exception cref="NotImplementedException"></exception>

    private async Task InvalidateCacheAsync(string deviceId)
    {
        var pendingCacheKey = $"{CacheKeyPrefix}{deviceId}_Pending";
        _memoryCache.Remove(pendingCacheKey);
    }

    public async Task MarkCommandDeliveredAsync(int commandId)
    {
        try
        {
            var command = await _context.PtsDevicePendingCommands.FindAsync(commandId);

            if (command != null && command.Status == "Pending")
            {
                command.Status = "Delivered";
                command.DeliveredAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                await InvalidateCacheAsync(command.PtsDeviceId);

                _logger.LogInformation("Marked command {CommandId} ({CommandType}) as delivered",
                    commandId, command.CommandType);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking command {CommandId} as delivered", commandId);
            throw;
        }
    }


    public async Task MarkCommandCompletedAsync(int commandId, object? responseData = null, int? responseCode = null)
    {
        try
        {
            var command = await _context.PtsDevicePendingCommands.FindAsync(commandId);

            if (command != null && (command.Status == "Pending" || command.Status == "Delivered"))
            {
                command.Status = "Completed";
                command.CompletedAt = DateTime.UtcNow;

                if (responseData != null)
                {
                    command.ResponseJson = JsonSerializer.Serialize(responseData);
                }

                command.ResponseCode = responseCode;

                await _context.SaveChangesAsync();
                await InvalidateCacheAsync(command.PtsDeviceId);

                _logger.LogInformation("Marked command {CommandId} ({CommandType}) as completed",
                    commandId, command.CommandType);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking command {CommandId} as completed", commandId);
            throw;
        }
    }

    public async Task MarkCommandFailedAsync(int commandId, string reason, int? errorCode = null)
    {
        try
        {
            var command = await _context.PtsDevicePendingCommands.FindAsync(commandId);

            if (command != null && (command.Status == "Pending" || command.Status == "Delivered"))
            {
                command.Status = "Failed";
                command.CompletedAt = DateTime.UtcNow;
                command.ResponseJson = JsonSerializer.Serialize(new { error = reason });
                command.ResponseCode = errorCode;

                await _context.SaveChangesAsync();
                await InvalidateCacheAsync(command.PtsDeviceId);

                _logger.LogInformation("Marked command {CommandId} ({CommandType}) as failed: {Reason}",
                    commandId, command.CommandType, reason);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking command {CommandId} as failed", commandId);
            throw;
        }
    }

    public async Task CancelPendingCommandsAsync(string deviceId, string? commandType = null)
    {
        try
        {
            IQueryable<PtsDevicePendingCommand> query = _context.PtsDevicePendingCommands
                  .Where(c => c.PtsDeviceId == deviceId && c.Status == "Pending");

            if (!string.IsNullOrEmpty(commandType))
            {
                query = query.Where(c => c.CommandType == commandType);
            }

            var commands = await query.ToListAsync();

            foreach (var command in commands)
            {
                command.Status = "Cancelled";
            }

            await _context.SaveChangesAsync();
            await InvalidateCacheAsync(deviceId);

            _logger.LogInformation("Cancelled {Count} pending commands for device {DeviceId}{TypeInfo}",
                commands.Count, deviceId, commandType != null ? $" of type {commandType}" : "");
        }

        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while clearing all pending commands.");
            throw;
        }
    }

    public async Task<IEnumerable<PtsDevicePendingCommand>> GetCommandHistoryAsync(string deviceId, int limit = 100)
    {
        try
        {
            return await _context.PtsDevicePendingCommands
                .Where(c => c.PtsDeviceId == deviceId)
                .OrderByDescending(c => c.AssignedAt)
                .Take(limit)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting command history for device {DeviceId}", deviceId);
            throw;
        }
    }
    private async Task UpdateCacheForDeviceAsync(string pTSDeviceId)
    {
        var commands = await GetPendingCommandsForDeviceAsync(pTSDeviceId);

        var cacheKey = $"{CacheKeyPrefix}{pTSDeviceId}";
        _memoryCache.Set(cacheKey, commands);

    }

    public async Task<(int commandId, string commandType, object commandData)?> GetNextPendingCommandAsync(string pTsdeviceId)
    {
        try
        {
            var pendingCommand = await _context.PtsDevicePendingCommands
                .Where(pc => pc.PtsDeviceId == pTsdeviceId && pc.Status == "Pending")
                .OrderByDescending(pc => pc.Priority)
                .ThenBy(pc => pc.AssignedAt)
                .FirstOrDefaultAsync();

            if (pendingCommand == null)
            {
                return null;
            }
            var commandData = JsonSerializer.Deserialize<object>(pendingCommand.CommandDataJson)!;
            return (pendingCommand.Id, pendingCommand.CommandType, commandData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while getting next pending command.");
            throw;
        }
    }


}
