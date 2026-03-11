/**
 * File: ConnectionMonitor.cs
 * Purpose: Tracks active frontend SignalR connections for lightweight operational monitoring.
 * Dependencies: ConcurrentDictionary, ILogger
 * Last Modified: 2026-03-09
 *
 * Key Functions:
 * - AddConnection(): Registers a newly connected client.
 * - RemoveConnection(): Removes a disconnected client.
 * - GetConnectionCount(): Returns the current active connection count.
 */
using System;
using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Communication.SignalR {

    public class ConnectionMonitor {
        private readonly ConcurrentDictionary<string, DateTime> _connections = new ();
        private readonly ILogger<ConnectionMonitor> _logger;

        public ConnectionMonitor (ILogger<ConnectionMonitor> logger) {
            _logger = logger;
        }

        public void AddConnection (string connectionId) {
            _connections.TryAdd (connectionId, DateTime.UtcNow);
            _logger.LogInformation ("Added connection {ConnectionId}. Total connections: {Count}",
                connectionId, _connections.Count);
        }

        public void RemoveConnection (string connectionId) {
            if (_connections.TryRemove (connectionId, out var connectedAt)) {
                _logger.LogInformation ("Removed connection {ConnectionId}. Duration: {Duration}",
                    connectionId, DateTime.UtcNow - connectedAt);
            }
        }

        public int GetConnectionCount () {
            return _connections.Count;
        }
    }
}