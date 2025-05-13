using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Communication.webSocket {
    public class BufferManager {
        private readonly int _bufferSize;
        private readonly ConcurrentBag<byte[]> _availableBuffers;
        private readonly int _maxBuffers;

        public BufferManager (int bufferSize = 4096, int maxBuffers = 1000) {
            if (bufferSize <= 0)
                throw new ArgumentException ("Buffer size must be positive", nameof (bufferSize));
            if (maxBuffers <= 0)
                throw new ArgumentException ("Max buffers must be positive", nameof (maxBuffers));

            _bufferSize = bufferSize;
            _maxBuffers = maxBuffers;
            _availableBuffers = new ConcurrentBag<byte[]> ();
        }

        public byte[] TakeBuffer () {
            if (_availableBuffers.TryTake (out var buffer))
                return buffer;

            return new byte[_bufferSize];
        }

        public void ReturnBuffer (byte[] buffer) {
            if (buffer == null || buffer.Length != _bufferSize)
                return;

            if (_availableBuffers.Count < _maxBuffers)
                _availableBuffers.Add (buffer);
        }
    }
}