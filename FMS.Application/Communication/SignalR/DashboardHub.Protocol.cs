using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Communication.SignalR {
    /// <summary>
    /// Protocol negotiation & telemetry partial for DashboardHub.
    /// Handles AcceptProtocol variants, telemetry counters, connection lifecycle overrides.
    /// </summary>
    public partial class DashboardHub : Hub {
        // Protocol groups to support selective legacy broadcast while sending envelopes to all
        private const string LegacyGroup = "protocol:legacy";
        private const string V2Group = "protocol:v2";
        private static readonly ConcurrentDictionary<string, int> _connectionProtocols = new (); // connectionId -> protocolVersion
        private static int _legacyConnectionCount = 0; // protocol < 2 (or not negotiated)
        private static int _v2ConnectionCount = 0; // protocol >= 2

        public async Task AcceptProtocol (int version) {
            try {
                Context.Items["ProtocolVersion"] = version;
                TrackProtocolNegotiation (Context.ConnectionId, version);
                _logger.LogInformation ("Connection {ConnectionId} accepted protocol version {Version}", Context.ConnectionId, version);
                // Move caller into appropriate protocol group
                if (version >= 2) {
                    await Groups.RemoveFromGroupAsync (Context.ConnectionId, LegacyGroup);
                    await Groups.AddToGroupAsync (Context.ConnectionId, V2Group);
                } else {
                    await Groups.RemoveFromGroupAsync (Context.ConnectionId, V2Group);
                    await Groups.AddToGroupAsync (Context.ConnectionId, LegacyGroup);
                }
                await Clients.Caller.SendAsync ("ProtocolAccepted", new {
                    acceptedVersion = version,
                        serverVersion = 2,
                        legacySuppressed = version >= 2,
                        timestamp = DateTime.UtcNow
                });
                return;
            } catch (Exception ex) {
                _logger.LogError (ex, "Error accepting protocol version {Version}", version);
                await Clients.Caller.SendAsync ("ProtocolAccepted", new {
                    acceptedVersion = 0,
                        serverVersion = 2,
                        legacySuppressed = false,
                        error = "Failed to accept protocol version",
                        timestamp = DateTime.UtcNow
                });
                return;
            }
        }

        /// <summary>
        /// Advanced negotiation using a strongly-typed payload.
        /// Example payload from client: { maxVersion: 2, features: ["initialBatch","streaming"] }
        /// </summary>
        public class ProtocolNegotiationRequest {
            public int? MaxVersion { get; set; }
            public List<string> ? Features { get; set; }
        }

        /// <summary>
        /// Accept advanced protocol negotiation. Prefers v2 when requested and supported.
        /// </summary>
        public async Task AcceptProtocolAdvanced (ProtocolNegotiationRequest negotiation) {
            try {
                // Default to highest supported when not specified
                var requestedVersion = negotiation?.MaxVersion ?? 2;
                var features = negotiation?.Features;

                // Server supports up to v2 for now
                var negotiatedVersion = Math.Min (requestedVersion, 2);

                Context.Items["ProtocolVersion"] = negotiatedVersion;
                TrackProtocolNegotiation (Context.ConnectionId, negotiatedVersion);
                _logger.LogInformation (
                    "Connection {ConnectionId} accepted protocol advanced version {Version} (requested {Requested}) with features {Features}",
                    Context.ConnectionId,
                    negotiatedVersion,
                    requestedVersion,
                    features == null ? "(none)" : string.Join (",", features)
                );

                // Move caller into appropriate protocol group
                if (negotiatedVersion >= 2) {
                    await Groups.RemoveFromGroupAsync (Context.ConnectionId, LegacyGroup);
                    await Groups.AddToGroupAsync (Context.ConnectionId, V2Group);
                } else {
                    await Groups.RemoveFromGroupAsync (Context.ConnectionId, V2Group);
                    await Groups.AddToGroupAsync (Context.ConnectionId, LegacyGroup);
                }

                await Clients.Caller.SendAsync ("ProtocolAccepted", new {
                    acceptedVersion = negotiatedVersion,
                        requestedVersion = requestedVersion,
                        serverVersion = 2,
                        legacySuppressed = negotiatedVersion >= 2,
                        features = features,
                        timestamp = DateTime.UtcNow
                });
                return;
            } catch (Exception ex) {
                _logger.LogError (ex, "Error in advanced protocol negotiation");
                await Clients.Caller.SendAsync ("ProtocolAccepted", new {
                    acceptedVersion = 0,
                        serverVersion = 2,
                        legacySuppressed = false,
                        error = "Failed advanced protocol negotiation",
                        timestamp = DateTime.UtcNow
                });
                return;
            }
        }

        public Task GetProtocolTelemetry () {
            var legacy = _legacyConnectionCount;
            var v2 = _v2ConnectionCount;
            var total = Math.Max (legacy + v2, 1);
            return Clients.Caller.SendAsync ("ProtocolTelemetry", new {
                legacyConnections = legacy,
                    v2Connections = v2,
                    totalConnections = legacy + v2,
                    v2Percentage = (double) v2 / total * 100.0,
                    timestamp = DateTime.UtcNow
            });
        }

        public override async Task OnConnectedAsync () {
            // Default classify as legacy until negotiated
            TrackProtocolNegotiation (Context.ConnectionId, 1);
            await Groups.AddToGroupAsync (Context.ConnectionId, LegacyGroup);
            await base.OnConnectedAsync ();
        }

        public override Task OnDisconnectedAsync (Exception? exception) {
            if (_connectionProtocols.TryRemove (Context.ConnectionId, out var version)) {
                if (version >= 2) System.Threading.Interlocked.Decrement (ref _v2ConnectionCount);
                else System.Threading.Interlocked.Decrement (ref _legacyConnectionCount);
            }
            return base.OnDisconnectedAsync (exception);
        }

        private void TrackProtocolNegotiation (string connectionId, int version) {
            var prev = _connectionProtocols.AddOrUpdate (connectionId, version, (_, _) => version);
            if (prev != version) {
                if (prev >= 2) System.Threading.Interlocked.Decrement (ref _v2ConnectionCount);
                else System.Threading.Interlocked.Decrement (ref _legacyConnectionCount);
                if (version >= 2) System.Threading.Interlocked.Increment (ref _v2ConnectionCount);
                else System.Threading.Interlocked.Increment (ref _legacyConnectionCount);
            }
        }

        private bool SupportsEnvelopeV2 () =>
            Context.Items.TryGetValue ("ProtocolVersion", out var pvObj) && pvObj is int pv && pv >= 2;
    }
}