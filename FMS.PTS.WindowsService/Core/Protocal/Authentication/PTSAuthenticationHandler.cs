using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace FMS.PTS.WindowsService.Core.Protocal.Authentication
{
    public class PTSAuthenticationHandler : IPTSAuthenticationHandler
    {
        private readonly ILogger<PTSAuthenticationHandler> _logger;
        private readonly AuthenticationMode _authMode;
        private readonly PTSServiceSettings _settings;
        private readonly Dictionary<string, string> _activeNonces = new();
        public PTSAuthenticationHandler(ILogger<PTSAuthenticationHandler> logger, IOptions<PTSServiceSettings> settings)
        {
            _logger = logger;

            _settings = settings.Value;
            _authMode = _settings.Security.RequireAuthentication ?
           settings.Value.Security.AuthMode : AuthenticationMode.Basic;
        }


        private Dictionary<string, string> ParseDigestAuthHeader(string header)
        {
            return header.Substring(7)
                .Split(',')
                .Select(part => part.Trim().Split('='))
                .Where(parts => parts.Length == 2)
                .ToDictionary(
                    parts => parts[0],
                    parts => parts[1].Trim('"')
                );
        }



        public async Task<bool> AuthenticateAsync(HttpListenerContext context)
        {
            try
            {
                var authHeader = context.Request.Headers["Authorization"];

                if (string.IsNullOrEmpty(authHeader))
                {
                    SendAuthenticationChallenge(context);

                    return false;
                }


                return _authMode switch
                {
                    AuthenticationMode.Basic => await ValidateBasicAuthAsync(authHeader),
                    AuthenticationMode.Digest => await ValidateDigestAuthAsync(context, authHeader),
                    _ => throw new NotSupportedException($"Authentication mode {_authMode} not supported")
                };
            }

            catch (Exception ex)
            {
                _logger.LogError(ex, "Error authenticating request");
                return false;
            }

        }

        private async Task<bool> ValidateBasicAuthAsync(string authHeader)
        {
            var credentials = GetBasicAuthCredentials(authHeader);
            return await ValidateCredentialsAsync(credentials.username, credentials.password);
        }

        private bool ValidateDigestAuth(Dictionary<string, string> digestParams, string method)
        {
            var username = digestParams["username"];
            var realm = digestParams["realm"];
            var nonce = digestParams["nonce"];
            var uri = digestParams["uri"];
            var response = digestParams["response"];

            if (!_activeNonces.TryGetValue(nonce, out var storedNonce))
                return false;

            var password = _settings.Security.DefaultUser.Password;
            var ha1 = ComputeMD5($"{username}:{realm}:{password}");
            var ha2 = ComputeMD5($"{method}:{uri}");
            var expectedResponse = ComputeMD5($"{ha1}:{nonce}:{ha2}");

            return response == expectedResponse;
        }

        private string ComputeMD5(string input)
        {
            using var md5 = System.Security.Cryptography.MD5.Create();
            var inputBytes = Encoding.ASCII.GetBytes(input);
            var hashBytes = md5.ComputeHash(inputBytes);
            return Convert.ToHexString(hashBytes).ToLowerInvariant();
        }

        private async Task<bool> ValidateDigestAuthAsync(HttpListenerContext context, string authHeader)
        {
            var digestParams = ParseDigestAuthHeader(authHeader);
            return ValidateDigestAuth(digestParams, context.Request.HttpMethod);
        }
        public async Task<bool> ValidateCredentialsAsync(string username, string password)
        {
            // In a real implementation, validate against user store
            return username == _settings.Security.DefaultUser.Username &&
                   password == _settings.Security.DefaultUser.Password;
        }


        private void SendAuthenticationChallenge(HttpListenerContext context)
        {
            var header = _authMode == AuthenticationMode.Basic
                ? "Basic realm=\"PTS Controller\""
                : $"Digest realm=\"PTS Controller\", nonce=\"{GenerateNonce()}\"";

            context.Response.Headers.Add("WWW-Authenticate", header);
            context.Response.StatusCode = 401;
        }
        private (string username, string password) GetBasicAuthCredentials(string authHeader)
        {
            var token = authHeader.Replace("Basic ", "", StringComparison.OrdinalIgnoreCase).Trim();
            var credentials = Encoding.UTF8.GetString(Convert.FromBase64String(token)).Split(':');
            return (credentials[0], credentials[1]);
        }

        private string GenerateNonce()
        {
            return Convert.ToBase64String(Guid.NewGuid().ToByteArray());
        }
    }
}
