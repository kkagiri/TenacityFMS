using FMS.PTS.Common;
using FMS.PTS.DataStruct.enums;
using FMS.PTS.Exceptions;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace FMS.PTS
{
    public class ConnectionManager
    {
        private static HttpClient _httpClient = null;
        protected Dictionary<string, string> _requestHeaders = null;
        protected List<IRequest> _requests = new List<IRequest>();
        private Dictionary<string, Delegate> _callbacks = new Dictionary<string, Delegate>();
        protected int _id = 0;
        public Settings _settings;
        private string _url;
        private bool _isOpened = false;
        private static readonly object _lockObject = new object();

        /// <summary>
        /// ConnectionManager constructor
        /// </summary>
        public ConnectionManager()
        {
            //Keep-alive can't be used
            //AddHeader("Connection", "keep-alive");
        }
        /// <summary>
        /// Opens the connection
        /// </summary>
        public void Open()
        {
            lock (_lockObject)
            {
                if (_isOpened)
                {
                    Close();
                }

                _url = GetURLPath();
                _httpClient = CreateConnection();
                _isOpened = true;
            }
        }
        /// <summary>
        /// Closes the connection
        /// </summary>
        public void Close()
        {
            lock (_lockObject)
            {
                if (!_isOpened)
                {
                    return;
                }

                ClearRequestsQueue();
                _httpClient.Dispose();

                _isOpened = false;
            }
        }
        /// <summary>
        /// Settings setter
        /// </summary>
        /// <param name="settings">Settings instance</param>
        public void SetSettings(Settings settings)
        {
            lock (_lockObject)
            {
                _settings = settings;
            }
        }
        /// <summary>
        /// Appends callback to internal callbacks list
        /// </summary>
        /// <param name="requestName">Name of request</param>
        /// <param name="callback">Callback delegate</param>
        public void AddCallback(string requestName, Delegate callback)
        {
            lock (_lockObject)
            {
                if (callback != null)
                {
                    _callbacks.Add(requestName, callback);
                }
                else
                {
                    _callbacks.Remove(requestName);
                }
            }
        }
        /// <summary>
        /// Clears callback from internal callbacks list
        /// </summary>
        /// <param name="requestName">Name of request</param>
        public void RemoveCallback(string requestName)
        {
            lock (_lockObject)
            {
                _callbacks.Remove(requestName);
            }
        }
        /// <summary>
        /// Clears internal callbacks list
        /// </summary>
        public void ClearCallbacks()
        {
            lock (_lockObject)
            {
                _callbacks.Clear();
            }
        }
        /// <summary>
        /// Appends a request to internal requests list
        /// </summary>
        /// <param name="request">request object that inherited from IRequest</param>
        /// <returns>TTResult</returns>
        public int AddRequest(IRequest request)
        {
            lock (_lockObject)
            {
                if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

                _requests.Add(request);

                return (int)TTResult.NO_ERROR;
            }
        }
        /// <summary>
        /// Returns request queue. Can be used for example to check requests states after ExecuteRequestsQueue execution
        /// </summary>
        /// <param name="requestsQueue">List of requests</param>
        /// <returns>TTResult</returns>
        public int GetRequestsQueue(out List<IRequest> requestsQueue)
        {
            lock (_lockObject)
            {
                requestsQueue = null;

                if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

                requestsQueue = _requests;

                return (int)TTResult.NO_ERROR;
            }
        }
        /// <summary>
        /// Cleans internal requests queue
        /// </summary>
        /// <returns>TTResult</returns>
        public int ClearRequestsQueue()
        {
            lock (_lockObject)
            {
                if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

                _requests.Clear();

                return (int)TTResult.NO_ERROR;
            }
        }
        /// <summary>
        /// Executes the request queue
        /// </summary>
        /// <returns>TTResult</returns>
        public int ExecuteRequestsQueue()
        {
            lock (_lockObject)
            {
                if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

                AppendHeaders();

                HttpResponseMessage response = null;
                var content = new StringContent(RequestJSON().ToString(), Encoding.UTF8, "application/json");
                try
                {
                    var task = Task.Run(() => _httpClient.PostAsync(_url, content));
                    task.Wait(_settings.Timeout.Milliseconds);

                    response = task.Result;

                    if (!response.IsSuccessStatusCode)
                    {
                        if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
                        {
                            return (int)TTResult.UNAUTHORIZED_ERROR;
                        }

                        return (int)TTResult.RESPONSE_CODE_ERROR;
                    }

                    if (!(response.Content is object) || response.Content.Headers.ContentType.MediaType != "application/json")
                    {
                        return (int)TTResult.PROTOCOL_ERROR;
                    }

                    var taskReadStream = Task.Run(() => response.Content.ReadAsStringAsync());
                    taskReadStream.Wait(_settings.Timeout.Milliseconds);

                    //Debug line
                    //File.WriteAllText("response.txt", taskReadStream.Result);

                    JObject responseJObject = null;
                    try
                    {
                        responseJObject = JObject.Parse(taskReadStream.Result);
                    }
                    catch (Exception)
                    {
                        return (int)TTResult.JSON_PARSE_ERROR;
                    }

                    TTResult result = ParseJSON(responseJObject);
                    return (int)result;
                }
                catch (HttpRequestException)
                {
                    return (int)TTResult.NETWORK_ERROR;
                }
                catch (TaskCanceledException)
                {
                    return (int)TTResult.TIMEOUT_ERROR;
                }
                catch (AggregateException)
                {
                    return (int)TTResult.TIMEOUT_ERROR;
                }
                catch (TTProtocolErrorException)
                {
                    return (int)TTResult.PROTOCOL_ERROR;
                }
                catch (Exception)
                {
                    return (int)TTResult.UNKNOWN_ERROR;
                }
                finally
                {
                    if (response != null)
                    {
                        response.Dispose();
                    }
                }
            }
        }
        /// <summary>
        /// Creates connection client
        /// </summary>
        /// <returns>HttpClient instance</returns>
        protected HttpClient CreateConnection()
        {
            lock (_lockObject)
            {
                string authType = "";
                switch (_settings.AuthenticationType)
                {
                    case AuthenticationType.BASIC:
                        authType = "Basic";
                        break;
                    case AuthenticationType.DIGEST:
                        authType = "Digest";
                        break;
                }

                var credentialCache = new CredentialCache();
                Uri url = new Uri(_url);
                credentialCache.Add(url, authType, new NetworkCredential(_settings.Login, _settings.Password));

                var httpClientHandler = new HttpClientHandler
                {
                    PreAuthenticate = true,
                    Credentials = credentialCache,
                    ClientCertificateOptions = ClientCertificateOption.Manual,
                    ServerCertificateCustomValidationCallback = (httpRequestMessage, cert, cetChain, policyErrors) => true
                };

                HttpClient httpClient = new HttpClient(httpClientHandler);

                httpClient.Timeout = _settings.Timeout;
                httpClient.DefaultRequestHeaders.ConnectionClose = true;

                return httpClient;
            }
        }
        /// <summary>
        /// Returns full request JSON based on each request in internal requests list
        /// </summary>
        /// <returns>JObject</returns>
        protected JObject RequestJSON()
        {
            lock (_lockObject)
            {
                JObject requestJObject = new JObject();
                requestJObject["Protocol"] = "jsonPTS";

                JArray packetsJArray = new JArray();

                for (int i = 0; i < _requests.Count; ++i)
                {
                    IRequest request = _requests[i];
                    request.SetId(i);

                    packetsJArray.Add(request.RequestJSON());
                }

                requestJObject["Packets"] = packetsJArray;

                return requestJObject;
            }
        }
        /// <summary>
        /// Parse JSON and fill results for each request in internal requests list
        /// </summary>
        /// <param name="jObject">JSON object</param>
        /// <returns>TTResult</returns>
        protected TTResult ParseJSON(JObject jObject)
        {
            lock (_lockObject)
            {
                TTResult result = (int)TTResult.NO_ERROR;

                if (!jObject.ContainsKey("Protocol"))
                {
                    throw new TTProtocolErrorException("Error: response doesn't contain Protocol property");
                }

                if (!String.Equals(jObject["Protocol"]?.ToString(), "jsonPTS"))
                {
                    throw new TTProtocolErrorException("Error: response contains Protocol property that is not jsonPTS");
                }

                if (!jObject.ContainsKey("Packets"))
                {
                    throw new TTProtocolErrorException("Error: response doesn't contain Packets property");
                }

                JArray packetsJArray = JArray.FromObject(jObject["Packets"]);

                if (packetsJArray.Count == 0)
                {
                    throw new TTProtocolErrorException("Error: Packets elements count is 0");
                }

                for (int i = 0; i < packetsJArray.Count; i++)
                {
                    JObject packetJObject = packetsJArray[i].ToObject<JObject>();

                    IRequest request = _requests[i];
                    Type type = request.GetType();

                    try
                    {
                        request.ParseJSON(packetJObject);
                    }
                    catch (Exception exception)
                    {
                        request.SetError(true);
                        request.SetErrorMessage(exception.Message);
                        //at last one request was failed
                        result = TTResult.AT_LAST_ONE_REQUEST_IN_SEQUENCE_FAILED_ERROR;
                        continue;
                    }

                    string key = request.GetKey();
                    if (_callbacks.ContainsKey(key))
                    {
                        MethodInfo getResultMethodInfo = type.GetMethod("GetResult");
                        object resultOfGetResult = getResultMethodInfo.Invoke(request, null);

                        if (request.IsError() == true)
                        {
                            result = TTResult.AT_LAST_ONE_REQUEST_IN_SEQUENCE_FAILED_ERROR;
                        }

                        _callbacks[key].DynamicInvoke(resultOfGetResult, request);
                    }
                }

                return result;
            }
        }
        /// <summary>
        /// Appends headers from internal headers list to connection client
        /// </summary>
        protected void AppendHeaders()
        {
            lock (_lockObject)
            {
                if (_requestHeaders != null)
                {
                    foreach (KeyValuePair<string, string> header in _requestHeaders)
                    {
                        _httpClient.DefaultRequestHeaders.Add(header.Key, header.Value);
                    }
                }
            }
        }
        /// <summary>
        /// Appends header to internal headers list
        /// </summary>
        /// <param name="name">Header name</param>
        /// <param name="value">Header value</param>
        protected void AddHeader(string name, string value)
        {
            lock (_lockObject)
            {
                if (_requestHeaders == null)
                {
                    _requestHeaders = new Dictionary<string, string>();
                }

                if (!_requestHeaders.ContainsKey(name))
                {
                    _requestHeaders.Add(name, value);
                }
            }
        }
        /// <summary>
        /// Returns the URL of PTS2 device
        /// </summary>
        /// <returns>URL string</returns>
        protected string GetURLPath()
        {
            lock (_lockObject)
            {
                string url = "";
                string port = "";
                switch (_settings.ProtocolSecurityType)
                {
                    case ProtocolSecurityType.HTTP:
                        url = "http://";
                        port = _settings.HttpPort.ToString();
                        break;
                    case ProtocolSecurityType.HTTPS:
                        url = "https://";
                        port = _settings.HttpsPort.ToString();
                        break;
                }

                return url + _settings.Host + ":" + port + "/jsonPTS";
            }
        }
    }
}
