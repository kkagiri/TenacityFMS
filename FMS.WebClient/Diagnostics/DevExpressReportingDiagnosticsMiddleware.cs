// File: DevExpressReportingDiagnosticsMiddleware.cs
// Purpose: Development-only diagnostics for DevExpress Web Reporting endpoints (/DXXRD*, /DXXRDV*, /DXXQB*)
// Dependencies: ASP.NET Core, Serilog
// Last Modified: 2026-01-15

using System.Text;
using Microsoft.AspNetCore.Http;
using Serilog;

namespace FMS.WebClient.Diagnostics;

public sealed class DevExpressReportingDiagnosticsMiddleware
{
    private static readonly PathString[] MonitoredPrefixes =
    [
        new PathString("/DXXRD"),
        new PathString("/DXXRDV"),
        new PathString("/DXXQB")
    ];

    private readonly RequestDelegate _next;

    public DevExpressReportingDiagnosticsMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task Invoke(HttpContext context)
    {
        if (!ShouldMonitor(context.Request.Path))
        {
            await _next(context);
            return;
        }

        var sw = System.Diagnostics.Stopwatch.StartNew();
        string? reportUrl = null;

        // For GetDesignerModel we often post form-urlencoded with reportUrl=...
        if (context.Request.Path.Equals("/DXXRD/GetDesignerModel", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                context.Request.EnableBuffering();
                if (context.Request.HasFormContentType)
                {
                    var form = await context.Request.ReadFormAsync();
                    reportUrl = form["reportUrl"].FirstOrDefault();
                }
                context.Request.Body.Position = 0;
            }
            catch (Exception ex)
            {
                Log.Debug(ex, "DevExpress diagnostics: failed to read GetDesignerModel form data");
            }
        }

        // Tee response body (bounded) so we can log useful error payloads without buffering huge responses.
        var originalBody = context.Response.Body;
        await using var tee = new BoundedTeeStream(originalBody, maxBytesToBuffer: 64 * 1024);
        context.Response.Body = tee;

        try
        {
            Log.Information("DX REQ {Method} {Path}{Query} (reportUrl={ReportUrl})",
                context.Request.Method,
                context.Request.Path,
                context.Request.QueryString,
                reportUrl ?? "-");

            await _next(context);

            sw.Stop();

            if (context.Response.StatusCode >= StatusCodes.Status400BadRequest)
            {
                var bodySnippet = GetTextualBodySnippet(context, tee);
                Log.Warning("DX RES {Status} {Method} {Path} in {Elapsed}ms Body={Body}",
                    context.Response.StatusCode,
                    context.Request.Method,
                    context.Request.Path,
                    sw.ElapsedMilliseconds,
                    bodySnippet ?? "-");
            }
            else
            {
                Log.Information("DX RES {Status} {Method} {Path} in {Elapsed}ms",
                    context.Response.StatusCode,
                    context.Request.Method,
                    context.Request.Path,
                    sw.ElapsedMilliseconds);
            }
        }
        catch (Exception ex)
        {
            sw.Stop();
            var bodySnippet = GetTextualBodySnippet(context, tee);

            Log.Error(ex, "DX EX {Method} {Path} after {Elapsed}ms Status={Status} Body={Body}",
                context.Request.Method,
                context.Request.Path,
                sw.ElapsedMilliseconds,
                context.Response?.StatusCode,
                bodySnippet ?? "-");

            throw;
        }
        finally
        {
            context.Response.Body = originalBody;
        }
    }

    private static bool ShouldMonitor(PathString path)
    {
        foreach (var prefix in MonitoredPrefixes)
        {
            if (path.StartsWithSegments(prefix, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    private static string? GetTextualBodySnippet(HttpContext context, BoundedTeeStream tee)
    {
        var contentType = context.Response.ContentType ?? string.Empty;
        if (!IsLikelyTextual(contentType))
        {
            return null;
        }

        var bytes = tee.GetBufferedBytes();
        if (bytes.Length == 0)
        {
            return null;
        }

        // Avoid throwing on invalid UTF8 from binary payloads.
        return Encoding.UTF8.GetString(bytes);
    }

    private static bool IsLikelyTextual(string contentType)
    {
        contentType = contentType.ToLowerInvariant();
        return contentType.StartsWith("text/")
               || contentType.Contains("json")
               || contentType.Contains("xml")
               || contentType.Contains("problem+");
    }

    private sealed class BoundedTeeStream : Stream
    {
        private readonly Stream _inner;
        private readonly MemoryStream _buffer;
        private readonly long _maxBytesToBuffer;

        public BoundedTeeStream(Stream inner, long maxBytesToBuffer)
        {
            _inner = inner;
            _maxBytesToBuffer = maxBytesToBuffer;
            _buffer = new MemoryStream(capacity: (int)Math.Min(maxBytesToBuffer, 16 * 1024));
        }

        public byte[] GetBufferedBytes() => _buffer.ToArray();

        public override bool CanRead => false;
        public override bool CanSeek => false;
        public override bool CanWrite => true;
        public override long Length => _inner.Length;
        public override long Position
        {
            get => _inner.Position;
            set => throw new NotSupportedException();
        }

        public override void Flush() => _inner.Flush();
        public override Task FlushAsync(CancellationToken cancellationToken) => _inner.FlushAsync(cancellationToken);

        public override int Read(byte[] buffer, int offset, int count) => throw new NotSupportedException();
        public override long Seek(long offset, SeekOrigin origin) => throw new NotSupportedException();
        public override void SetLength(long value) => _inner.SetLength(value);

        public override void Write(byte[] buffer, int offset, int count)
        {
            _inner.Write(buffer, offset, count);
            BufferCopy(buffer.AsSpan(offset, count));
        }

        public override async Task WriteAsync(byte[] buffer, int offset, int count, CancellationToken cancellationToken)
        {
            await _inner.WriteAsync(buffer.AsMemory(offset, count), cancellationToken);
            BufferCopy(buffer.AsSpan(offset, count));
        }

        public override ValueTask WriteAsync(ReadOnlyMemory<byte> buffer, CancellationToken cancellationToken = default)
        {
            var task = _inner.WriteAsync(buffer, cancellationToken);
            BufferCopy(buffer.Span);
            return task;
        }

        public override void Write(ReadOnlySpan<byte> buffer)
        {
            _inner.Write(buffer);
            BufferCopy(buffer);
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                _buffer.Dispose();
            }
            base.Dispose(disposing);
        }

        public override async ValueTask DisposeAsync()
        {
            await _buffer.DisposeAsync();
            await base.DisposeAsync();
        }

        private void BufferCopy(ReadOnlySpan<byte> span)
        {
            var remaining = _maxBytesToBuffer - _buffer.Length;
            if (remaining <= 0)
            {
                return;
            }

            var toCopy = (int)Math.Min(remaining, span.Length);
            _buffer.Write(span[..toCopy]);
        }
    }
}
