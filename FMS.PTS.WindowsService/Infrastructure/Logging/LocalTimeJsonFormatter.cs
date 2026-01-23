using System;
using System.IO;
using Serilog.Events;
using Serilog.Formatting;
using Serilog.Formatting.Json;

namespace FMS.PTS.WindowsService.Infrastructure.Logging
{
    /// <summary>
    /// A JSON formatter that outputs timestamps in local time (East Africa Time, UTC+3)
    /// instead of UTC. This ensures consistent log timestamps across all FMS services.
    /// </summary>
    public class LocalTimeJsonFormatter : ITextFormatter
    {
        private readonly JsonValueFormatter _valueFormatter;

        // East Africa Time is UTC+3
        private static readonly TimeZoneInfo EastAfricaTimeZone = TimeZoneInfo.CreateCustomTimeZone(
            "East Africa Time",
            TimeSpan.FromHours(3),
            "East Africa Time",
            "EAT");

        public LocalTimeJsonFormatter()
        {
            _valueFormatter = new JsonValueFormatter();
        }

        public void Format(LogEvent logEvent, TextWriter output)
        {
            if (logEvent == null) throw new ArgumentNullException(nameof(logEvent));
            if (output == null) throw new ArgumentNullException(nameof(output));

            output.Write("{\"@t\":\"");

            // Convert UTC timestamp to East Africa Time (UTC+3)
            var localTime = TimeZoneInfo.ConvertTimeFromUtc(logEvent.Timestamp.UtcDateTime, EastAfricaTimeZone);
            output.Write(localTime.ToString("yyyy-MM-ddTHH:mm:ss.fffffffzzz"));

            output.Write("\",\"@mt\":");
            JsonValueFormatter.WriteQuotedJsonString(logEvent.MessageTemplate.Text, output);

            if (logEvent.Level != LogEventLevel.Information)
            {
                output.Write(",\"@l\":\"");
                output.Write(logEvent.Level);
                output.Write('"');
            }

            if (logEvent.Exception != null)
            {
                output.Write(",\"@x\":");
                JsonValueFormatter.WriteQuotedJsonString(logEvent.Exception.ToString(), output);
            }

            foreach (var property in logEvent.Properties)
            {
                var name = property.Key;
                if (name.Length > 0 && name[0] == '@')
                {
                    // Escape @ prefix
                    name = "@" + name;
                }

                output.Write(',');
                JsonValueFormatter.WriteQuotedJsonString(name, output);
                output.Write(':');
                _valueFormatter.Format(property.Value, output);
            }

            output.Write('}');
            output.WriteLine();
        }
    }
}
