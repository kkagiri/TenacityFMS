using FMS.PTS.DataStruct;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.PTS.Common
{
    public abstract class IRequest
    {
        /// <summary>
        /// Creates request JSON.
        /// </summary>
        /// <param name="data">Data JSON object or array etc.</param>
        /// <returns>JSON object</returns>
        public abstract JObject RequestJSON(JContainer data = null);
        /// <summary>
        /// Parse JSON object keys that are common for any request.
        /// Called at the begin of ParseJSON function of each inherited class (request)
        /// </summary>
        /// <param name="jObject">JSON object</param>
        public abstract void ParseJSON(JObject jObject);
        /// <summary>
        /// Answers that response must be confirmation or not
        /// </summary>
        /// <returns>True is response must be confirmation</returns>
        public abstract bool IsConfirmationResponse();
        /// <summary>
        /// Returns a request name
        /// </summary>
        /// <returns>Request name string</returns>
        public abstract string GetRequestName();
        /// <summary>
        /// Returns the possible response names for response
        /// </summary>
        /// <returns>List of possible response names</returns>
        public abstract List<string> GetPossibleResponseNames();
        /// <summary>
        /// Returns a key that could be further used as a key for responses map
        /// </summary>
        /// <returns>Key string</returns>
        public abstract string GetKey();
        /// <summary>
        /// Id setter. Sets a response Id
        /// </summary>
        /// <param name="id">Id ingeter value</param>
        public abstract void SetId(int id);
        /// <summary>
        /// Id getter. Returns a response Id
        /// </summary>
        /// <returns>Id ingeter value</returns>
        public abstract int GetId();
        /// <summary>
        /// Error getter. Answers that error happened or not
        /// </summary>
        /// <returns>True is error, False if not</returns>
        public abstract bool IsError();
        /// <summary>
        /// Error setter. Sets that error happened
        /// </summary>
        /// <param name="error">True is error, False if not</param>
        public abstract void SetError(bool error);
        /// <summary>
        /// ErrorCode getter
        /// </summary>
        /// <returns>ErrorCode integer value</returns>
        public abstract int GetErrorCode();
        /// <summary>
        /// ErrorCode setter
        /// </summary>
        /// <param name="errorCode">ErrorCode integer value</param>
        public abstract void SetErrorCode(int errorCode);
        /// <summary>
        /// ErrorMessage getter
        /// </summary>
        /// <returns>Error message string</returns>
        public abstract string GetErrorMessage();
        /// <summary>
        /// ErrorMessage setter
        /// </summary>
        /// <param name="errorMessage">Error message string</param>
        public abstract void SetErrorMessage(string errorMessage);
        /// <summary>
        /// ErrorData getter
        /// </summary>
        /// <returns>Error data instance</returns>
        public abstract ErrorData GetErrorData();
        /// <summary>
        /// ErrorData setter
        /// </summary>
        /// <param name="errorData">Error data instance</param>
        public abstract void SetErrorData(ErrorData errorData);
    }
}
