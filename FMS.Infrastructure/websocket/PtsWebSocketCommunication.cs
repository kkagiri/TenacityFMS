///Intiated:17/04/2024
///Version:1
///kevin.kagiri@hyoung.co.ke


using FMS.Infrastructure.websocket.Errors;
using Google.Protobuf.WellKnownTypes;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;
using Org.BouncyCastle.Asn1.Ocsp;
using Org.BouncyCastle.Crypto.Engines;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;


namespace FMS.Infrastructure.websocket
{
    public abstract class PtsWebSocketCommunication<T> : IPTSRequest
    {


        protected string _requestName =null;
        protected string _receivedResponseName = null;

        protected List<string> _possibleResponseNames = null;
        protected int _id;
        protected T _result;
        protected bool _isError;
        protected int _errorCode;
        protected string _errorMessage;
        protected ErrorData _errorData = null;

        private readonly WebSocketHelper _webSocketHelper;
        private readonly ILogger<IPTSRequest> _logger;
        private void Clear()
        {
            _result = default(T);
            _id = 0;
            _isError = false;
        }
        public PtsWebSocketCommunication(string requestName, string[] responseNames = null)
        {
            Clear();
            _requestName = requestName;

            if (responseNames != null)
            {
                _possibleResponseNames = new List<string>(responseNames);
            }
        }
        public PtsWebSocketCommunication(string requestName, string responseName = null)
        {
            Clear();
            _requestName = requestName;

            if (responseName != null && !String.IsNullOrEmpty(responseName))
            {
                _possibleResponseNames = new List<string> { responseName };
            }
        }
        public delegate void Callback(T result, PtsWebSocketCommunication<T> request);

        public override JObject RequestJSON(JContainer data = null)
        {

            JObject jObject = new JObject();
            jObject["Id"] = _id;
            jObject["Type"] = _requestName;

            if (data != null)
            {
                jObject["Data"] = data;
            }

            return jObject;
        }
        public override void ParseJSON(JObject jObject)
        {
          if(!jObject.ContainsKey("Id"))
           {
                throw new Exception("Error: Response does not contain Id property");

            }

          int id = Convert.ToInt32(jObject["Id"]?.ToString());


            if(GetId () != id)
            {
                throw new Exception("Error:Wrong packet sequence in response");
            }


            if (jObject.ContainsKey("Error"))
            {
                string error = jObject["Error"]?.ToString();
                if (!string.Equals(error, "false"))
                {
                    _isError = true;

                    if (jObject.ContainsKey("Message"))
                    {
                        _errorMessage = jObject["Message"]?.ToString();
                    }
                }
            }
            if(jObject.ContainsKey("Type"))
            {
                string responseName = jObject["Type"]?.ToString();
                if(GetPossibleResponseName().Contains(responseName) || _requestName.Equals(responseName))
                {
                    SetReceivedResponseName(responseName);
                }
                else
                {
                    throw new Exception("Error: returned Type value does not fit the request");
                }
            }




        }


        public override string GetRequestName()
        {
            return _requestName;
        }   
      
        public string GetReceivedResponseName()
        {
            return _receivedResponseName;
        }

        public void SetReceivedResponseName(string responseNameReceived)
        {
            _receivedResponseName = responseNameReceived;
        }


        public List<string> GetPossibleResponseName()
        {
            return _possibleResponseNames;
        }



        public override bool IsConfirmationResponse()
        {
            return (GetPossibleResponseNames() == null || GetPossibleResponseNames().Count == 0);

        }
        public override string GetKey()
        {
            if(!string.IsNullOrEmpty(_receivedResponseName) && _requestName.Equals(_receivedResponseName)&& !IsConfirmationResponse())
            {
                return _possibleResponseNames.Count > 0 ? _possibleResponseNames[0]:"";
            }

            if(!string.IsNullOrEmpty(_receivedResponseName))
            {
                return _receivedResponseName;
            }

            string responseName = "";

            List<string> possibleResponseNames = GetPossibleResponseName();

            if(possibleResponseNames !=null &&   possibleResponseNames.Count > 0)
            {
                responseName = possibleResponseNames[0];
            }

            return GetKeyStatic(GetRequestName(),responseName);


        }


        public static string GetKeyStatic(string requestName, string responseName)
        {
            return string.IsNullOrEmpty(responseName) ? requestName : responseName;
        }


        public override int GetId()
        {
            return _id;
        }


        public override void SetId(int id)
        {
            _id = id;
        }


        public T GetResult()
        {
            return _result;
        }

    


        public override bool  IsError()
        {
            return _isError;
        }

        public override void SetError(bool isError)
        {
            _isError = isError;
        }

        /// <summary>
        /// Get Error Data
        /// </summary>
        /// <returns></returns>
        public override ErrorData GetErrorData()
        {
            return _errorData;
        }


       public override void SetErrorData(ErrorData errorData)
        {
            _errorData = errorData;
        }


        public override  string GetErrorMessage()
        {
            return _errorMessage;
        }

        public override void SetErrorMessage(string errorMessage)
        {
            _errorMessage = errorMessage;
        }


        protected async Task<T> SendRequestAndReceiveResponseAsync<T>(object request, Func<JsonElement, T> deserializeResponse)
        {
            try
            {
                var requestJson = JsonSerializer.Serialize(request);
                await _webSocketHelper.SentAsync(Encoding.UTF8.GetBytes(requestJson));


                var responseBytes = await _webSocketHelper.ReceiveAsync();
                var responseJson = Encoding.UTF8.GetString(responseBytes);


                var response = JsonDocument.Parse(responseJson).RootElement;

                ParseJSON(JObject.Parse(responseJson));

                if(IsError())
                {
                    _logger.LogError("Error Received From PTS Controller.Code:{ErrorCode},Message:{ErrorMessage}", GetErrorCode(), GetErrorMessage());
                    throw new Exception($"Error received from PTS controller: {GetErrorMessage()} (Code: {GetErrorCode()})");
                }

                return deserializeResponse(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during WebSocket communication with PTS controller");
                throw;
            }



        }
   
    }
}
