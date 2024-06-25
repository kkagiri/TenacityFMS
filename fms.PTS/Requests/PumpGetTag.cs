using FMS.PTS.Common;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.PTS.Requests
{
    public class PumpGetTag : BaseRequest<bool>
    {
        public static readonly string REQUEST_NAME = "PumpGetTag";
        public static readonly string RESPONSE_NAME = "";
        public static readonly string KEY = GetKeyStatic(REQUEST_NAME, RESPONSE_NAME);

        public int Pump { get; private set; }
        public int Nozzle { get; private set; }
        /// <summary>
        /// PumpGetTag constructor
        /// </summary>
        /// <param name="pump">Pump number</param>
        /// <param name="nozzle">Nozzle number</param>
        public PumpGetTag(int pump, int nozzle)
            : base(REQUEST_NAME, RESPONSE_NAME)
        {
            Pump = pump;
            Nozzle = nozzle;
        }
        /// <summary>
        /// RequestJSON overridden method.
        /// </summary>
        /// <param name="data">Data JSON object or array etc.</param>
        /// <returns>JSON object</returns>
        public override JObject RequestJSON(JContainer data = null)
        {
            JObject dataJObject = new JObject();
            dataJObject["Pump"] = Pump;
            dataJObject["Nozzle"] = Nozzle;

            return base.RequestJSON(dataJObject);
        }
        /// <summary>
        /// ParseJSON overridden method
        /// </summary>
        /// <param name="jObject">JSON object</param>
        public override void ParseJSON(JObject jObject)
        {
            base.ParseJSON(jObject);
        }
    }
}
