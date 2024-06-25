using FMS.PTS.Common;
using FMS.PTS.DataStruct;
using FMS.PTS.Exceptions;
using Newtonsoft.Json.Linq;

namespace FMS.PTS.Requests
{
  public class GetSystemDecimalDigits : BaseRequest<SystemDecimalDigits>
    {
        public static readonly string REQUEST_NAME = "GetSystemDecimalDigits";
        public static readonly string RESPONSE_NAME = "SystemDecimalDigits";
        public static readonly string KEY = GetKeyStatic(REQUEST_NAME, RESPONSE_NAME);
        /// <summary>
        /// GetSystemDecimalDigits constructor
        /// </summary>
        public GetSystemDecimalDigits()
            : base(REQUEST_NAME, RESPONSE_NAME)
        {
        }
        /// <summary>
        /// RequestJSON overridden method.
        /// </summary>
        /// <param name="data">Data JSON object or array etc.</param>
        /// <returns>JSON object</returns>
        public override JObject RequestJSON(JContainer data = null)
        {
            return base.RequestJSON();
        }
        /// <summary>
        /// ParseJSON overridden method
        /// </summary>
        /// <param name="jObject">JSON object</param>
        public override void ParseJSON(JObject jObject)
        {
            base.ParseJSON(jObject);

            if (IsError())
            {
                return;
            }

            SystemDecimalDigits systemDecimalDigits = new SystemDecimalDigits();

            if (!jObject.ContainsKey("Data"))
            {
                throw new TTProtocolErrorException("Error: response doesn't contain Data property");
            }

            JObject datajObject = jObject["Data"].ToObject<JObject>();

            if (!datajObject.ContainsKey("Price"))
            {
                throw new TTProtocolErrorException("Error: response doesn't contain Price property");
            }

            systemDecimalDigits.Price = Convert.ToInt16(datajObject["Price"]?.ToString());

            if (!datajObject.ContainsKey("Amount"))
            {
                throw new TTProtocolErrorException("Error: response doesn't contain Amount property");
            }

            systemDecimalDigits.Amount = Convert.ToInt16(datajObject["Amount"]?.ToString());

            if (!datajObject.ContainsKey("Volume"))
            {
                throw new TTProtocolErrorException("Error: response doesn't contain Volume property");
            }

            systemDecimalDigits.Volume = Convert.ToInt16(datajObject["Volume"]?.ToString());

            if (!datajObject.ContainsKey("AmountTotal"))
            {
                throw new TTProtocolErrorException("Error: response doesn't contain AmountTotal property");
            }

            systemDecimalDigits.AmountTotal = Convert.ToInt16(datajObject["AmountTotal"]?.ToString());

            if (!datajObject.ContainsKey("VolumeTotal"))
            {
                throw new TTProtocolErrorException("Error: response doesn't contain VolumeTotal property");
            }

            systemDecimalDigits.VolumeTotal = Convert.ToInt16(datajObject["VolumeTotal"]?.ToString());

            _result = systemDecimalDigits;
        }
    }
}