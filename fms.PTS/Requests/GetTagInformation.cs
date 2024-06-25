using FMS.PTS.Common;
using FMS.PTS.DataStruct;
using FMS.PTS.Exceptions;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.PTS.Requests
{
    public class GetTagInformation : BaseRequest<TagInformation>
    {
        public static readonly string REQUEST_NAME = "GetTagInformation";
        public static readonly string RESPONSE_NAME = "TagInformation";
        public static readonly string KEY = GetKeyStatic(REQUEST_NAME, RESPONSE_NAME);

        public string Tag { get; private set; }
        /// <summary>
        /// GetTagInformation constructor
        /// </summary>
        /// <param name="tag">Tag string</param>
        public GetTagInformation(string tag)
            : base(REQUEST_NAME, RESPONSE_NAME)
        {
            Tag = tag;
        }
        /// <summary>
        /// RequestJSON overridden method.
        /// </summary>
        /// <param name="data">Data JSON object or array etc.</param>
        /// <returns>JSON object</returns>
        public override JObject RequestJSON(JContainer data = null)
        {
            JObject dataJObject = new JObject();

            dataJObject["Tag"] = Tag;

            return base.RequestJSON(dataJObject);
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

            TagInformation tagInformation = new TagInformation();

            if (!jObject.ContainsKey("Data"))
            {
                throw new TTProtocolErrorException("Error: response doesn't contain Data property");
            }

            JObject datajObject = jObject["Data"].ToObject<JObject>();

            if (!datajObject.ContainsKey("Tag"))
            {
                throw new TTProtocolErrorException("Error: response doesn't contain Tag property");
            }

            tagInformation.Tag = datajObject["Tag"]?.ToString();

            if (!datajObject.ContainsKey("Name"))
            {
                throw new TTProtocolErrorException("Error: response doesn't contain Name property");
            }

            tagInformation.Name = datajObject["Name"]?.ToString();

            if (!datajObject.ContainsKey("Valid"))
            {
                throw new TTProtocolErrorException("Error: response doesn't contain Valid property");
            }

            tagInformation.Valid = datajObject.Value<bool>("Valid");

            _result = tagInformation;
        }
    }

}
