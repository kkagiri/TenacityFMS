using System.Net.WebSockets;
using System.Text;

namespace FMS.ATGClient.Util
{
    public class WebSocketService
    {
        public async Task HandleConnectionAsync(WebSocket webSocket, HttpContext context)
        {
            Console.WriteLine(context.Request.ToString());

            var ptsID = context.Request.Headers["X-Pts-Id"];
            var firmwareVersion = context.Request.Headers["X-Pts-Firmware-Version-DateTime"];
            var configId = context.Request.Headers["X-Pts-Configuration-Identifier"];


            if (string.IsNullOrEmpty(ptsID))
            {
                await webSocket.CloseAsync(WebSocketCloseStatus.InvalidPayloadData, "Invalid Headers", CancellationToken.None);
                return;
            }
            //   Console.WriteLine($"Connecting PTS ID: {ptsID} with Firmware: {firmwareVersion} and Config ID: {configId}");
            var compressionHeader = context.Request.Headers["Sec-WebSocket-Extensions"];
            if (compressionHeader.Any(h => h.Contains("permessage-deflate")))
            {
                await webSocket.CloseAsync(WebSocketCloseStatus.InvalidMessageType, "Compression not supported", CancellationToken.None);
                return;
            }
            var pingTask = MonitorConnectionAsync(webSocket);

            await ProcessMessages(webSocket);
        }
        private async Task SendPingAsync(WebSocket webSocket)
        {
            if (webSocket.State == WebSocketState.Open)
            {
                await webSocket.SendAsync(new ArraySegment<byte>(new byte[0]), WebSocketMessageType.Text, true, CancellationToken.None);
                Console.WriteLine("Ping sent.");
            }
        }

        private async Task MonitorConnectionAsync(WebSocket webSocket)
        {
            while (webSocket.State == WebSocketState.Open)
            {
                await Task.Delay(TimeSpan.FromSeconds(30)); // Ping interval
                await SendPingAsync(webSocket);
            }
        }
        private async Task ProcessMessages(WebSocket webSocket)
        {
            var buffer = new byte[1024 * 4];
            try
            {
                while (webSocket.State == WebSocketState.Open)
                {
                    var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
                    if (result.MessageType == WebSocketMessageType.Text)
                    {
                        string receivedMessage = Encoding.UTF8.GetString(buffer, 0, result.Count);
                        Console.WriteLine("Received: " + receivedMessage);

                        // Add detailed logging
                        Console.WriteLine($"Received WebSocket frame:");
                     //   Console.WriteLine($"OpCode: {result.OpCode}");
                        Console.WriteLine($"MessageType: {result.MessageType}");
                        Console.WriteLine($"Count: {result.Count}");
                        Console.WriteLine($"EndOfMessage: {result.EndOfMessage}");
                    }
                    else if (result.MessageType == WebSocketMessageType.Close)
                    {
                        await webSocket.CloseAsync(result.CloseStatus.Value, result.CloseStatusDescription, CancellationToken.None);
                        Console.WriteLine("Connection closing: " + result.CloseStatusDescription);
                    }
                }
            }

            catch (WebSocketException ex) when (ex.WebSocketErrorCode == WebSocketError.InvalidMessageType)
            {
                // Log the exception and additional context
                Console.WriteLine($"WebSocketException: {ex.Message}");
                Console.WriteLine($"Received invalid message type: {ex.WebSocketErrorCode}");

                if (webSocket.State != WebSocketState.Closed)
                {
                    await webSocket.CloseAsync(WebSocketCloseStatus.InvalidMessageType, ex.Message, CancellationToken.None);
                }
            }
            catch (WebSocketException ex)
            {
                // Log the exception and additional context
                Console.WriteLine($"WebSocketException: {ex.Message}");
                Console.WriteLine($"Error code: {ex.WebSocketErrorCode}");
                // You can add more detailed logging or error handling here

                if (webSocket.State != WebSocketState.Closed)
                {
                    await webSocket.CloseAsync(WebSocketCloseStatus.InvalidPayloadData, ex.Message, CancellationToken.None);
                }
            }
            // Add more specific exception handling for other WebSocketError values
            finally
            {
                webSocket?.Dispose();
            }
        }

        private async Task HandleProtocolError(WebSocket webSocket, string errorMessage)
        {
            Console.WriteLine(errorMessage);
            // Close the connection with protocol error status
            if (webSocket.State == WebSocketState.Open)
                await webSocket.CloseAsync(WebSocketCloseStatus.ProtocolError, "Protocol violation", CancellationToken.None);
        }


        private async Task HandleTextMessage(WebSocket webSocket, byte[] buffer, WebSocketReceiveResult result)
        {
            string receivedMessage = Encoding.UTF8.GetString(buffer, 0, result.Count);
            Console.WriteLine("Received: " + receivedMessage);
            // Echo the message back to the client
            await webSocket.SendAsync(new ArraySegment<byte>(buffer, 0, result.Count), result.MessageType, result.EndOfMessage, CancellationToken.None);
        }

        private async Task HandleCloseMessage(WebSocket webSocket)
        {
            await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closed by client", CancellationToken.None);
        }

        private async Task HandleUnexpectedMessageType(WebSocket webSocket, WebSocketReceiveResult result)
        {
            // Log and close connection if non-text message is received without being expected
            Console.WriteLine($"Unexpected message type: {result.MessageType}");
            await webSocket.CloseAsync(WebSocketCloseStatus.InvalidMessageType, "Unexpected message type", CancellationToken.None);
        }
    }
}
