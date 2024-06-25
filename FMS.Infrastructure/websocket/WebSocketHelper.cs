///Intiated:17/04/2024
///Version:1
///kevin.kagiri@hyoung.co.ke


using Org.BouncyCastle.Crypto.Paddings;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Infrastructure.websocket
{
    public class WebSocketHelper
    {
        private ClientWebSocket _clientWebSocket;


        public async Task ConnectAsync (string uri , CancellationToken cancellationToken=default)

        {
            _clientWebSocket = new ClientWebSocket ();
            await _clientWebSocket.ConnectAsync(new Uri(uri), cancellationToken);
        }

        public async Task SentAsync(byte[] data,CancellationToken cancellationToken=default)

        {
            await _clientWebSocket.SendAsync(new ArraySegment<byte>(data), WebSocketMessageType.Binary, true, cancellationToken);
        }


        public async Task<byte[]> ReceiveAsync (CancellationToken cancellationToken=default)
        {
            var buffer = new byte[1024 * 4];

            var result = await _clientWebSocket.ReceiveAsync(new ArraySegment<byte>(buffer), cancellationToken);

            return buffer.AsSpan(0,result.Count).ToArray();
        }

        public void Dispose()
        {
            _clientWebSocket?.Dispose();
        }
    }
}
