using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace FMS.PTS.WindowsService.Core.ErrorHandling {
    public class ErrorHandlingMiddleware {
        private readonly RequestDelegate _next;
        private readonly ILogger<ErrorHandlingMiddleware> _logger;

        public ErrorHandlingMiddleware (
            RequestDelegate next,
            ILogger<ErrorHandlingMiddleware> logger
        ) {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync (HttpContext context) {
            try {
                await _next (context);
            } catch (System.Exception ex) {

            }
        }

    }
}