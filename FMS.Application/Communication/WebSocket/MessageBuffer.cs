using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Application.Communication.webSocket
{
    internal class MessageBuffer
    {
        private readonly StringBuilder _buffer = new StringBuilder();
        private int _depth = 0;
        private bool _inString = false;
        private char _lastChar = '\0';
        private bool _hasStarted = false;
        private readonly ILogger _logger;

        public MessageBuffer(ILogger logger)
        {
            _logger = logger;
        }

        private bool IsPartialMessageStart(string chunk)
        {
            // Check for any common fragments that indicate we're mid-message
            return chunk.Contains("Protocol") ||
                   chunk.Contains("PtsId") ||
                   chunk.Contains("Packets") ||
                   chunk.Contains("Data") ||
                   chunk.Contains("Type");
        }

        public void Append(string chunk)
        {
            _logger.LogDebug("Processing chunk: Size={Size}, Content={Preview}",
                chunk.Length,
                chunk.Length > 50 ? chunk.Substring(0, 50) + "..." : chunk);

            // If we're starting fresh and see a partial message
            if (!_hasStarted && _buffer.Length == 0)
            {
                if (chunk.TrimStart().StartsWith("{"))
                {
                    _hasStarted = true;
                    _depth = 0;  // Will be incremented when we process the '{'
                    _logger.LogDebug("Found clean JSON start");
                }
                else if (IsPartialMessageStart(chunk))
                {
                    _logger.LogDebug("Detected partial message, reconstructing wrapper");
                    _buffer.Append("{\n");
                    _hasStarted = true;
                    _depth = 1;
                }
            }

            foreach (char c in chunk)
            {
                // Handle string context to avoid counting braces in strings
                if (c == '"' && _lastChar != '\\')
                    _inString = !_inString;

                // Only count braces when not in a string
                if (!_inString)
                {
                    if (c == '{')
                    {
                        _depth++;
                        _logger.LogDebug("Open brace, depth now: {Depth}", _depth);
                    }
                    else if (c == '}')
                    {
                        _depth--;
                        _logger.LogDebug("Close brace, depth now: {Depth}", _depth);
                    }
                }

                _buffer.Append(c);
                _lastChar = c;
            }

            _logger.LogDebug("Buffer state: Length={Length}, Depth={Depth}, Content={Preview}",
                _buffer.Length, _depth,
                _buffer.Length > 50 ? _buffer.ToString().Substring(0, 50) + "..." : _buffer.ToString());
        }

        public bool TryExtractMessage(out string message)
        {
            message = null;

            // We need a started message and balanced braces
            if (!_hasStarted || _depth > 0)
            {
                _logger.LogDebug("Message not complete: Started={Started}, Depth={Depth}",
                    _hasStarted, _depth);
                return false;
            }

            var content = _buffer.ToString().Trim();

            // Validate basic JSON structure
            if (!content.StartsWith("{") || !content.EndsWith("}"))
            {
                _logger.LogWarning("Invalid JSON structure detected: {Preview}",
                    content.Length > 100 ? content.Substring(0, 100) + "..." : content);
                return false;
            }

            try
            {
                // Basic structure validation
                if (!content.Contains("\"Protocol\"") ||
                    !content.Contains("\"PtsId\"") ||
                    !content.Contains("\"Packets\""))
                {
                    _logger.LogWarning("Missing required fields in message");
                    return false;
                }

                message = content;
                _logger.LogDebug("Successfully extracted message: Length={Length}", content.Length);

                // Reset state
                _buffer.Clear();
                _depth = 0;
                _inString = false;
                _lastChar = '\0';
                _hasStarted = false;
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating message structure");
                return false;
            }
        }

        public void Clear()
        {
            _buffer.Clear();
            _depth = 0;
            _inString = false;
            _lastChar = '\0';
            _hasStarted = false;
            _logger.LogDebug("Buffer state cleared");
        }


    }
}
