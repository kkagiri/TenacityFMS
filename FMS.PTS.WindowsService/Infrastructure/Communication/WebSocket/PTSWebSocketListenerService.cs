using System;
using System.Diagnostics;
using System.Net;
using System.Reflection;
using System.Security.Principal;
using System.Text;
using System.Linq;
using FMS.Application.Communication;
using FMS.Application.Communication.Connection;
using FMS.Application.Communication.SignalR;
using FMS.Application.Communication.webSocket;
using MediatR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;

namespace FMS.PTS.WindowsService.Infrastructure.Communication.WebSocket {

    /// <summary>
    /// This background service listens on a specific HTTP port for incoming WebSocket connections from PTS devices.
    /// </summary>
    public class PTSWebSocketListenerService : BackgroundService {
        private readonly ILogger<PTSWebSocketListenerService> _logger;
        private readonly IHubContext<FrontEndHub> _frontendHubContext;
        private HttpListener _httpListener;
        private readonly SemaphoreSlim _lifecycleLock = new (1, 1);
        private readonly PTSServiceSettings? _settings;
        private readonly BufferManager _bufferManager;
        private readonly ILoggerFactory _loggerFactory;
        private readonly IMediator _mediator;
        private readonly IPTSConnectionManager _connectionManager;
        private readonly IServiceScopeFactory _scopeFactory;

        private readonly DeviceConnectionTracker _connectionTracker;

        public PTSWebSocketListenerService (
            BufferManager bufferManager,
            IMediator mediator,
            ILoggerFactory loggerFactory,
            IPTSConnectionManager connectionManager,
            DeviceConnectionTracker connectionTracker,
            IHubContext<FrontEndHub> frontendHubContext,
            IOptions<PTSServiceSettings> options,
            IServiceScopeFactory scopeFactory)

        {
            _loggerFactory = loggerFactory ??
                throw new ArgumentNullException (nameof (loggerFactory));

            //Check if the connection tracker is valid
            var redisField = connectionTracker.GetType ()
                .GetField ("_redisDb", BindingFlags.NonPublic | BindingFlags.Instance);
            if (redisField == null || redisField.GetValue (connectionTracker) == null) {
                throw new InvalidOperationException ("DeviceConnectionTracker was injected but has an invalid cache state");
            }

            _frontendHubContext = frontendHubContext ??
                throw new ArgumentNullException (nameof (frontendHubContext));
            _connectionTracker = connectionTracker ??
                throw new ArgumentNullException (nameof (connectionTracker));
            _logger = loggerFactory.CreateLogger<PTSWebSocketListenerService> ();
            _bufferManager = bufferManager ??
                throw new ArgumentNullException (nameof (bufferManager));
            _mediator = mediator ??
                throw new ArgumentNullException (nameof (mediator));
            _scopeFactory = scopeFactory ??
                throw new ArgumentNullException (nameof (scopeFactory));
            _settings = options.Value;
            _connectionManager = connectionManager;
            _logger.LogInformation ("PTSWebSocketListenerService constructed");
        }
        private async Task InitializeListenerAsync (CancellationToken token) {
            await _lifecycleLock.WaitAsync (token);
            try {
                _httpListener = new HttpListener ();
                await ConfigureListenerAsync (_httpListener);

                _logger.LogInformation ("Initializing HTTP listener...");
                _httpListener.Start ();
            } finally {
                _lifecycleLock.Release ();
            }
        }

        private async Task ConfigureListenerAsync (HttpListener listener) {
            var port = _settings.WebSocket.ListenPort;
            var configuredBasePath = _settings.WebSocket.BasePath ?? "/ptsWebSocket";
            if (string.IsNullOrWhiteSpace (configuredBasePath)) {
                configuredBasePath = "/ptsWebSocket";
            }
            if (!configuredBasePath.StartsWith ("/")) {
                configuredBasePath = "/" + configuredBasePath;
            }
            var segment = configuredBasePath.Trim ('/');

            var prefixes = new HashSet<string> (StringComparer.OrdinalIgnoreCase);
            // Register both with and without trailing slash to catch devices that omit it
            prefixes.Add ($"http://localhost:{port}/{segment}/");
            prefixes.Add ($"http://localhost:{port}/{segment}");

            var hostSetting = _settings.WebSocket.Host?.Trim ();
            if (!string.IsNullOrEmpty (hostSetting)) {
                if (hostSetting == "*" || hostSetting == "0.0.0.0") {
                    prefixes.Add ($"http://+:{port}/{segment}/");
                    prefixes.Add ($"http://+:{port}/{segment}");
                } else if (!hostSetting.Equals ("localhost", StringComparison.OrdinalIgnoreCase)) {
                    prefixes.Add ($"http://{hostSetting}:{port}/{segment}/");
                    prefixes.Add ($"http://{hostSetting}:{port}/{segment}");
                }
            }

            if (_settings.WebSocket.AddPortWidePrefix) {
                prefixes.Add ($"http://+:{port}/");
            }

            foreach (var prefix in prefixes) {
                try {
                    _logger.LogInformation ("Adding listener prefix: {Prefix}", prefix);
                    await VerifyUrlRegistrationAsync (prefix);
                    listener.Prefixes.Add (prefix);
                } catch (Exception ex) {
                    _logger.LogWarning (ex, "Failed to add prefix {Prefix}. Continuing.", prefix);
                }
            }

            _logger.LogInformation ("Listener configured. BasePath={BasePath} Segment={Segment} Port={Port} RegisteredPrefixes={Count} PortWidePrefix={PortWide}", configuredBasePath, segment, port, listener.Prefixes.Count, _settings.WebSocket.AddPortWidePrefix);
        }

        public override async Task StopAsync (CancellationToken cancellationToken) {
            await _lifecycleLock.WaitAsync (cancellationToken);
            try {
                if (_httpListener?.IsListening == true) {
                    _httpListener.Stop ();
                }
                _httpListener?.Close ();
            } finally {
                _lifecycleLock.Release ();
            }

            await base.StopAsync (cancellationToken);
        }

        protected override async Task ExecuteAsync (CancellationToken stoppingToken) {
            try {
                _logger.LogInformation ("PTSWebSocketListenerService ExecuteAsync started");
                if (_settings == null) {
                    _logger.LogWarning ("PTS Service settings not found, WebSocket listener service will not start");
                    return;
                }

                await InitializeListenerAsync (stoppingToken);

                while (!stoppingToken.IsCancellationRequested) {
                    var context = await _httpListener.GetContextAsync ();
                    if (!context.Request.IsWebSocketRequest) {
                        _logger.LogWarning ("Non-WebSocket request received from {RemoteIP}, Protocol: {Protocol}, Path: {Path}", context.Request.RemoteEndPoint,
                            context.Request.Url.Scheme, context.Request.Url.PathAndQuery);

                        // Prepare informative response
                        context.Response.StatusCode = 426; // Upgrade Required
                        context.Response.Headers.Add ("Upgrade", "websocket");
                        context.Response.Headers.Add ("Connection", "Upgrade");

                        // Detailed error message
                        var errorResponse = new {
                            error = "WebSocket Upgrade Required",
                            message = "This endpoint requires a WebSocket connection.",
                            details = new {
                            expectedProtocol = "ws://",
                            currentProtocol = context.Request.Url.Scheme + "://",
                            guidance = "Please use a WebSocket client or modify your connection to use the 'ws://' protocol.",
                            example = $"ws://{context.Request.Url.Host}:{context.Request.Url.Port}{context.Request.Url.PathAndQuery}"
                            }
                        };

                        // Send JSON response
                        var jsonResponse = System.Text.Json.JsonSerializer.Serialize (errorResponse, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });

                        context.Response.ContentType = "application/json";
                        using var writer = new StreamWriter (context.Response.OutputStream);
                        await writer.WriteAsync (jsonResponse);
                        await writer.FlushAsync ();
                    } else {
                        _ = HandleWebSocketConnectionAsync (context, stoppingToken);

                    }
                }
            } catch (Exception ex) {
                _logger.LogError (ex, "Error in WebSocket listener service");
                throw;
            }
        }
        private async Task HandleWebSocketConnectionAsync (HttpListenerContext context, CancellationToken stoppingToken) {

            try {

                _logger.LogDebug ("Beginning WebSocket connection validation sequence...");
                _logger.LogDebug ("Incoming WebSocket request from {RemoteEndPoint}", context.Request.RemoteEndPoint);

                // Raw handshake header logging (sanitizing Authorization)
                try {
                    var headerBuilder = new StringBuilder ();
                    headerBuilder.AppendLine ($"{context.Request.HttpMethod} {context.Request.Url?.AbsolutePath} HTTP/{context.Request.ProtocolVersion}");
                    foreach (var key in context.Request.Headers.AllKeys) {
                        var v = context.Request.Headers[key];
                        if (key.Equals ("Authorization", StringComparison.OrdinalIgnoreCase)) v = "<redacted>";
                        headerBuilder.AppendLine ($"{key}: {v}");
                    }
                    _logger.LogInformation ("Incoming handshake headers:\n{Headers}", headerBuilder.ToString ());
                } catch (Exception exLog) {
                    _logger.LogDebug (exLog, "Failed to log raw headers");
                }

                // Path validation (accept missing trailing slash if port-wide prefix enabled)
                var expectedPath = _settings.WebSocket.BasePath ?? "/ptsWebSocket";
                if (!expectedPath.StartsWith ("/")) expectedPath = "/" + expectedPath;
                var requestPath = context.Request.Url.AbsolutePath ?? string.Empty;
                bool pathOk = requestPath.Equals (expectedPath, StringComparison.OrdinalIgnoreCase) ||
                    requestPath.Equals (expectedPath.TrimEnd ('/'), StringComparison.OrdinalIgnoreCase);
                if (!pathOk) {
                    _logger.LogWarning ("Rejecting request with invalid path {Path}. Expected {Expected}", requestPath, expectedPath);
                    context.Response.StatusCode = 404;
                    context.Response.ContentType = "application/json";
                    var json = System.Text.Json.JsonSerializer.Serialize (new { error = "InvalidPath", expected = expectedPath, received = requestPath });
                    var bytes = Encoding.UTF8.GetBytes (json);
                    await context.Response.OutputStream.WriteAsync (bytes, 0, bytes.Length, stoppingToken);
                    context.Response.Close ();
                    return;
                }

                // Capacity enforcement BEFORE deeper validation
                try {
                    var active = _connectionManager.GetConnectedDevices ()?.Count () ?? 0;
                    if (active >= _settings.WebSocket.MaxConcurrentConnections) {
                        _logger.LogWarning ("Rejecting connection - capacity reached ({Active}/{Limit}) from {Remote}", active, _settings.WebSocket.MaxConcurrentConnections, context.Request.RemoteEndPoint);
                        context.Response.StatusCode = 503; // Service Unavailable
                        context.Response.Headers.Add ("Retry-After", "30");
                        context.Response.ContentType = "application/json";
                        var capJson = System.Text.Json.JsonSerializer.Serialize (new {
                            error = "MaxConnectionsReached",
                            activeConnections = active,
                            limit = _settings.WebSocket.MaxConcurrentConnections
                        });
                        var capBytes = Encoding.UTF8.GetBytes (capJson);
                        await context.Response.OutputStream.WriteAsync (capBytes, 0, capBytes.Length, stoppingToken);
                        context.Response.Close ();
                        return;
                    }
                } catch (Exception exCap) {
                    _logger.LogWarning (exCap, "Error evaluating connection capacity; allowing connection to proceed");
                }

                // 2. Validate WebSocket protocol headers
                if (!ValidateWebSocketProtocolHeaders (context.Request)) {

                    context.Response.StatusCode = 400;
                    context.Response.Close ();
                    return;
                }

                //3.Validate PTS - specific headers
                if (!ValidatePTSHeaders (context.Request)) {

                    context.Response.StatusCode = 400;
                    context.Response.Close ();
                    return;
                }

                //var wsKey = context.Request.Headers["Sec-WebSocket-Key"];
                //var responseKey = ComputeWebSocketAcceptKey(wsKey);

                //let AcceptWebSocketAsync handle the WebSocket handshake
                // Determine subprotocol support
                string selectedSubProtocol = null;
                var clientProtocols = context.Request.Headers["Sec-WebSocket-Protocol"]; // may be comma-separated
                if (!string.IsNullOrWhiteSpace (clientProtocols) && _settings.WebSocket.SubProtocols?.Length > 0) {
                    var offered = clientProtocols.Split (',').Select (p => p.Trim ());
                    selectedSubProtocol = offered.FirstOrDefault (o => _settings.WebSocket.SubProtocols.Contains (o, StringComparer.OrdinalIgnoreCase));
                    if (selectedSubProtocol != null) {
                        _logger.LogInformation ("Client offered subprotocols [{Offered}] -> selecting {Selected}", string.Join (",", offered), selectedSubProtocol);
                    } else {
                        _logger.LogInformation ("Client offered subprotocols [{Offered}] but none matched configured list [{Configured}]", string.Join (",", offered), string.Join (",", _settings.WebSocket.SubProtocols));
                    }
                }

                var webSocketContext = await context.AcceptWebSocketAsync (subProtocol: selectedSubProtocol,
                    keepAliveInterval: TimeSpan.FromSeconds (30),
                    receiveBufferSize: 1024); // Buffer size for receiving frames

                var deviceId = context.Request.Headers["X-Pts-Id"];
                var ipaddress = context.Request.RemoteEndPoint.Address.ToString ();
                _logger.LogInformation ("WebSocket handshake accepted for device {DeviceId} from {IPAddress} Path={Path} SubProtocol={SubProtocol}", deviceId, ipaddress, context.Request.Url.AbsolutePath, selectedSubProtocol ?? "<none>");
                _logger.LogDebug ("Device ID format: '{DeviceId}' (type: {Type}, length: {Length})", deviceId, deviceId.GetType ().Name, deviceId.Length);

                // --- Update Redis State via Tracker ---
                await _connectionTracker.UpdateWebSocketConnection (deviceId, ipaddress);

                var deviceLogger = _loggerFactory.CreateLogger<PTSDeviceConnection> ();
                var deviceConnection = new PTSDeviceConnection (
                    deviceLogger,
                    deviceId,
                    ipaddress,
                    webSocketContext.WebSocket,
                    _bufferManager,
                    _frontendHubContext,
                    _scopeFactory,
                    _connectionTracker
                );

                //Cursor: Re-enable connection registration with PTSConnectionManager for Redis command processing
                _logger.LogInformation ("Registering device {DeviceId} with PTSConnectionManager", deviceId);
                _connectionManager.AddConnection (deviceId, deviceConnection);

                try {
                    await deviceConnection.StartAsync (stoppingToken);
                } finally {
                    //Cursor: Ensure cleanup from both tracking systems when connection ends
                    _logger.LogInformation ("Cleaning up connection for device {DeviceId} from PTSConnectionManager", deviceId);
                    _connectionManager.RemoveConnection (deviceId);
                }

            } catch (Exception ex) {
                _logger.LogError (ex, "Error handling WebSocket connection");
                try {
                    context.Response.StatusCode = 500;
                    context.Response.Close ();
                } catch {
                    // Suppress any errors during error handling
                }

            }

        }

        private async Task VerifyUrlRegistrationAsync (string prefix) {
            _logger.LogDebug ("Verifying URL registration for prefix: {Prefix}", prefix);

            try {
                var identity = WindowsIdentity.GetCurrent ();
                var isAdmin = new WindowsPrincipal (identity)
                    .IsInRole (WindowsBuiltInRole.Administrator);

                _logger.LogDebug ("Security context - User: {User}, IsAdmin: {IsAdmin}",
                    identity.Name, isAdmin);

                var registrations = await GetUrlRegistrationsAsync ();
                var existingRegistration = registrations
                    .FirstOrDefault (r => r.Contains (prefix, StringComparison.OrdinalIgnoreCase));

                if (existingRegistration == null) {
                    // No registration exists
                    var guidance = new StringBuilder ()
                        .AppendLine ($"URL registration required for {prefix}")
                        .AppendLine ("Please run the following commands as administrator:")
                        .AppendLine ($"netsh http add urlacl url={prefix} user=Everyone")
                        .ToString ();

                    //_logger.LogWarning(guidance);
                    throw new InvalidOperationException (guidance);
                }

                // Parse out the user/group from the registration
                var regDetails = await GetDetailedUrlRegistrationAsync (prefix);
                _logger.LogDebug ("URL registration details: {@Details}", regDetails);

                // Instead of throwing, provide guidance
                if (!HasUrlAccess (regDetails, identity.Name, isAdmin)) {
                    var guidance = new StringBuilder ()
                        .AppendLine ($"Current user {identity.Name} does not have access to {prefix}")
                        .AppendLine ("Please either:")
                        .AppendLine ("1. Run the service as an administrator, or")
                        .AppendLine ("2. Update URL registration with:")
                        .AppendLine ($"   netsh http add urlacl url={prefix} user=Everyone")
                        .AppendLine ("   - or -")
                        .AppendLine ($"   netsh http add urlacl url={prefix} user=\"{identity.Name}\"")
                        .ToString ();

                    _logger.LogWarning (guidance);

                    // Log current registration for diagnosis
                    _logger.LogDebug ("Current registration: {Registration}", existingRegistration);

                    throw new UnauthorizedAccessException (guidance);
                }

                _logger.LogInformation ("URL registration verified successfully for {Prefix}", prefix);
            } catch (Exception ex) when (ex is not UnauthorizedAccessException) {
                _logger.LogError (ex, "Error verifying URL registration");
                throw;
            }
        }

        private bool HasUrlAccess (string regDetails, string userName, bool isAdmin) {
            // More permissive checks
            return isAdmin ||
                regDetails.Contains ("Everyone", StringComparison.OrdinalIgnoreCase) ||
                regDetails.Contains (userName, StringComparison.OrdinalIgnoreCase) ||
                regDetails.Contains ("Users", StringComparison.OrdinalIgnoreCase) ||
                regDetails.Contains ("Authenticated Users", StringComparison.OrdinalIgnoreCase);
        }

        private async Task<string> GetDetailedUrlRegistrationAsync (string prefix) {
            using var process = new Process {
                StartInfo = new ProcessStartInfo {
                FileName = "netsh",
                Arguments = $"http show urlacl url={prefix}",
                UseShellExecute = false,
                RedirectStandardOutput = true,
                CreateNoWindow = true
                }
            };

            process.Start ();
            return await process.StandardOutput.ReadToEndAsync ();
        }

        private async Task<string[]> GetUrlRegistrationsAsync () {
            _logger.LogDebug ("Retrieving current URL registrations");

            try {
                using var process = new Process {
                    StartInfo = new ProcessStartInfo {
                    FileName = "netsh",
                    Arguments = "http show urlacl",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    CreateNoWindow = true
                    }
                };

                var registrations = new List<string> ();

                process.Start ();

                // Read output asynchronously
                while (!process.StandardOutput.EndOfStream) {
                    var line = await process.StandardOutput.ReadLineAsync ();
                    if (line?.Contains ("Reserved URL") == true) {
                        registrations.Add (line.Trim ());
                    }
                }

                await process.WaitForExitAsync ();

                if (process.ExitCode != 0) {
                    throw new InvalidOperationException (
                        $"netsh command failed with exit code {process.ExitCode}");
                }

                return registrations.ToArray ();
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to retrieve URL registrations");
                throw;
            }
        }

        private bool ValidateWebSocketProtocolHeaders (HttpListenerRequest request) {
            // Validate WebSocket specific headers as per RFC6455
            if (!request.Headers["Upgrade"]?.Equals ("websocket", StringComparison.OrdinalIgnoreCase) == true) {
                _logger.LogWarning ("Invalid or missing Upgrade header");
                return false;
            }

            if (!request.Headers["Connection"]?.Contains ("Upgrade", StringComparison.OrdinalIgnoreCase) == true) {
                _logger.LogWarning ("Invalid or missing Connection header");
                return false;
            }

            if (string.IsNullOrEmpty (request.Headers["Sec-WebSocket-Key"])) {
                _logger.LogWarning ("Missing Sec-WebSocket-Key header");
                return false;
            }

            if (!request.Headers["Sec-WebSocket-Version"].Equals ("13")) {
                _logger.LogWarning ("Invalid or unsupported Sec-WebSocket-Version");
                return false;
            }

            return true;
        }

        private bool ValidatePTSHeaders (HttpListenerRequest request) {
            var ptsId = request.Headers["X-Pts-Id"];
            if (string.IsNullOrEmpty (ptsId) ||
                ptsId.Length > 24 ||
                !ptsId.All (c => Uri.IsHexDigit (c))) {
                _logger.LogWarning ("Invalid or missing X-Pts-Id header: {PtsId}", ptsId);
                return false;
            }

            // Optional headers validation could be added here if needed
            // For example: X-Pts-Firmware-Version-DateTime, X-Pts-Configuration-Identifier

            return true;
        }

    }
}