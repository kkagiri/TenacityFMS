using FMS.PTS.DataStruct;
using FMS.PTS.Exceptions;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.PTS.Common
{
    public class BaseRequest<T> : IRequest
    {
        protected string _requestName = null;
        protected string _receivedResponseName = null;
        protected List<string> _possibleResponseNames = null;
        protected int _id;
        protected T _result;
        protected bool _isError;
        protected int _errorCode;
        protected string _errorMessage;
        protected ErrorData _errorData = null;

        public delegate void Callback(T result, BaseRequest<T> request);

        /// <summary>
        /// BaseRequest constructor
        /// </summary>
        /// <param name="requestName">Request name</param>
        /// <param name="responseNames">Response names that can be received from PTS2 device</param>
        public BaseRequest(string requestName, string[] responseNames = null)
        {
            Clear();
            _requestName = requestName;

            if (responseNames != null)
            {
                _possibleResponseNames = new List<string>(responseNames);
            }
        }
        /// <summary>
        /// BaseRequest constructor
        /// </summary>
        /// <param name="requestName">Request name</param>
        /// <param name="responseName">Response name name</param>
        public BaseRequest(string requestName, string responseName = null)
        {
            Clear();
            _requestName = requestName;

            if (responseName != null && !String.IsNullOrEmpty(responseName))
            {
                _possibleResponseNames = new List<string> { responseName };
            }
        }
        /// <summary>
        /// Clears request
        /// </summary>
        private void Clear()
        {
            _result = default(T);
            _id = 0;
            _isError = false;
        }
        /// <summary>
        /// Creates request JSON.
        /// Called at the end of RequestJSON function of each inherited class (request)
        /// </summary>
        /// <param name="data">Data JSON object or array etc.</param>
        /// <returns>JSON object</returns>
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
        /// <summary>
        /// Parse JSON object keys that are common for any request.
        /// Called at the begin of ParseJSON function of each inherited class (request)
        /// </summary>
        /// <param name="jObject">JSON object</param>
        public override void ParseJSON(JObject jObject)
        {
            if (!jObject.ContainsKey("Id"))
            {
                throw new TTProtocolErrorException("Error: response doesn't contain Id property");
            }

            int id = Convert.ToInt32(jObject["Id"]?.ToString());

            if (GetId() != id)
            {
                throw new TTProtocolErrorException("Error: wrong packet sequence in response");
            }

            if (jObject.ContainsKey("Error"))
            {
                string error = jObject["Error"]?.ToString();
                if (!String.Equals(error, "false"))
                {
                    _isError = true;
                    if (jObject.ContainsKey("Message"))
                    {
                        _errorMessage = jObject["Message"]?.ToString();
                    }

                    if (jObject.ContainsKey("Data"))
                    {
                        _errorData = new ErrorData();

                        JObject errorDataJObject = jObject["Data"].ToObject<JObject>();

                        if (errorDataJObject.ContainsKey("Pump"))
                        {
                            _errorData.Pump = Convert.ToInt32(errorDataJObject["Pump"]?.ToString());
                        }

                        if (errorDataJObject.ContainsKey("User"))
                        {
                            _errorData.User = errorDataJObject["User"]?.ToString();
                        }

                        if (errorDataJObject.ContainsKey("Request"))
                        {
                            _errorData.Request = errorDataJObject["Request"]?.ToString();
                        }
                    }
                }
            }

            //for "Confirmation" request (request without Type property) result value is bool
            if (IsConfirmationResponse())
            {
                _result = (T)(object)!_isError;
            }
            else
            {
                if (jObject.ContainsKey("Type"))
                {
                    string responseName = jObject["Type"]?.ToString();

                    if ((GetPossibleResponseNames() != null && GetPossibleResponseNames().Contains(responseName))
                        || _requestName.Equals(responseName))
                    {
                        SetReceivedResponseName(responseName);
                    }
                    else
                    {
                        throw new TTProtocolErrorException("Error: returned Type value does not fit the request");
                    }
                }
            }
        }
        /// <summary>
        /// Returns a request name
        /// </summary>
        /// <returns>Request name string</returns>
        public override string GetRequestName()
        {
            return _requestName;
        }
        /// <summary>
        /// Returns a received response name
        /// </summary>
        /// <returns>Received response name string</returns>
        public string GetReceivedResponseName()
        {
            return _receivedResponseName;
        }
        /// <summary>
        /// Setter for a response name
        /// </summary>
        /// <param name="responseNameReceived"></param>
        public void SetReceivedResponseName(string responseNameReceived)
        {
            _receivedResponseName = responseNameReceived;
        }
        /// <summary>
        /// Returns the possible response names for response
        /// </summary>
        /// <returns>List of possible response names</returns>
        public override List<string> GetPossibleResponseNames()
        {
            return _possibleResponseNames;
        }
        /// <summary>
        /// Returns a key that could be further used as a key for responses map
        /// </summary>
        /// <returns>Key string</returns>
        public override string GetKey()
        {
            if (!String.IsNullOrEmpty(_receivedResponseName) && _requestName.Equals(_receivedResponseName) && !IsConfirmationResponse())
            {
                return _possibleResponseNames.Count > 0 ? _possibleResponseNames[0] : "";
            }

            if (!String.IsNullOrEmpty(_receivedResponseName))
            {
                return _receivedResponseName;
            }

            string responseName = "";
            List<string> possibleResponseNames = GetPossibleResponseNames();
            if (possibleResponseNames != null && possibleResponseNames.Count > 0)
            {
                responseName = possibleResponseNames[0];
            }

            return GetKeyStatic(GetRequestName(), responseName);
        }
        /// <summary>
        /// Answers that response must be confirmation or not
        /// </summary>
        /// <returns>True is response must be confirmation</returns>
        public override bool IsConfirmationResponse()
        {
            return (GetPossibleResponseNames() == null || GetPossibleResponseNames().Count == 0);
        }
        /// <summary>
        /// Returns a static key that could be further used as a key for responses map
        /// </summary>
        /// <param name="requestName">Request name</param>
        /// <param name="responseName">Response name</param>
        /// <returns>Key string</returns>
        public static string GetKeyStatic(string requestName, string responseName)
        {
            return String.IsNullOrEmpty(responseName) ? requestName : responseName;
        }
        /// <summary>
        /// Id getter. Returns a response Id
        /// </summary>
        /// <returns>Id ingeter value</returns>
        public override int GetId()
        {
            return _id;
        }
        /// <summary>
        /// Id setter. Sets a response Id
        /// </summary>
        /// <param name="id">Id ingeter value</param>
        public override void SetId(int id)
        {
            _id = id;
        }
        /// <summary>
        /// Return result of response. 
        /// </summary>
        /// <returns>Generic type T that defined by each inherited response</returns>
        public T GetResult()
        {
            return _result;
        }
        /// <summary>
        /// Error getter. Answers that error happened or not
        /// </summary>
        /// <returns>True is error, False if not</returns>
        public override bool IsError()
        {
            return _isError;
        }
        /// <summary>
        /// Error setter. Sets that error happened
        /// </summary>
        /// <param name="error">True is error, False if not</param>
        public override void SetError(bool error)
        {
            _isError = error;
        }
        /// <summary>
        /// ErrorCode getter
        /// </summary>
        /// <returns>ErrorCode integer value</returns>
        public override int GetErrorCode()
        {
            return _errorCode;
        }
        /// <summary>
        /// ErrorCode setter
        /// </summary>
        /// <param name="errorCode">ErrorCode integer value</param>
        public override void SetErrorCode(int errorCode)
        {
            _errorCode = errorCode;
        }
        /// <summary>
        /// ErrorMessage getter
        /// </summary>
        /// <returns>Error message string</returns>
        public override string GetErrorMessage()
        {
            return _errorMessage;
        }
        /// <summary>
        /// ErrorMessage setter
        /// </summary>
        /// <param name="errorMessage">Error message string</param>
        public override void SetErrorMessage(string errorMessage)
        {
            _errorMessage = errorMessage;
        }
        /// <summary>
        /// ErrorData getter
        /// </summary>
        /// <returns>Error data instance</returns>
        public override ErrorData GetErrorData()
        {
            return _errorData;
        }
        /// <summary>
        /// ErrorData setter
        /// </summary>
        /// <param name="errorData">Error data instance</param>
        public override void SetErrorData(ErrorData errorData)
        {
            _errorData = errorData;
        }
    }
}
