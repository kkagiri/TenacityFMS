using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.WebSockets;
using System.Text;
using System.Threading.Tasks;

namespace FMS.PTS.Util
{
    public class WebSocketHandler
    {
        public async Task HandleWebSocketAsync (WebSocket webSocket)
        {
            var buffer = new ArraySegment<byte>(new byte[2048]);

            try
            {
                while(webSocket.State == WebSocketState.Open)
                {
                    var result = await webSocket.ReceiveAsync(buffer, System.Threading.CancellationToken.None);

                    if (result.MessageType == WebSocketMessageType.Text)
                    {
                        string message = Encoding.UTF8.GetString(buffer.Array, buffer.Offset, result.Count);

                        //process message here
                        string response = ProcessMessage(message);

                        byte[] responseData = Encoding.UTF8.GetBytes(response);

                        await webSocket.SendAsync(new ArraySegment<byte>(responseData), WebSocketMessageType.Text, true, System.Threading.CancellationToken.None);
                    }
                    else if (result.MessageType == WebSocketMessageType.Close)
                    {
                        await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, string.Empty,CancellationToken.None);
                    }
                }
            }catch(Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
            }
            finally
            {
                if (webSocket != null)
                {
                    webSocket.Dispose();
                }
            }
        }
    
    
    
     public string ProcessMessage(string message)
        {
            return "";
        }
    
    }
}
