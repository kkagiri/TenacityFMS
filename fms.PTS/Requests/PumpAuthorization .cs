using FMS.PTS.Common;
using FMS.PTS.DataStruct;
using FMS.PTS.DataStruct.enums;
using FMS.PTS.Util;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Services.PTS.Requests
{
    public class PumpAuthorization : BaseRequest<PumpAuthorizeConfirmation>
    {

        public static readonly string _requestName = "PumpAuthorize";
         public static readonly string _responseName = "PumpAuthorizeConfirmation";
        public static readonly string Key = GetKeyStatic(_requestName, _responseName);

        public PumpAuthorizeData PumpAuthorizeData { get; private set; }  

        public  PumpAuthorization (PumpAuthorizeData pumpAuthorizeData) : base(_requestName, _responseName)
        {
            PumpAuthorizeData = pumpAuthorizeData;
        }


        public override JObject RequestJSON(JContainer data = null)
        {
            JObject dataJObject = new JObject();

            dataJObject["Pump"] = PumpAuthorizeData.Pump;

            dataJObject["Tag"] = PumpAuthorizeData.Tag;

            switch(PumpAuthorizeData.NozzleOrFuelIdSelector)
            {
                case NozzleOrFuelIdSelector.NOZZLE:
                    dataJObject["Nozzle"] = PumpAuthorizeData.Nozzle;
                    break;
                case NozzleOrFuelIdSelector.NOZZLES:
                    JArray nozzles = new JArray();
                    for(int i = 0;i<PumpAuthorizeData.Nozzles.Count;i++)
                    {
                        nozzles.Add(PumpAuthorizeData.Nozzles[i]);
                    }
                    dataJObject["Nozzles"] = nozzles;
                    break;
                case NozzleOrFuelIdSelector.FUELGRADEID:
                    dataJObject["FuelGradeId"] = PumpAuthorizeData.FuelGradeId;
                    break;
                case NozzleOrFuelIdSelector.FUELGRADEIDS:
                    JArray fuelGradeIds = new JArray();
                    for(int i = 0;i<PumpAuthorizeData.FuelGradeIds.Count;i++)
                    {
                        fuelGradeIds.Add(PumpAuthorizeData.FuelGradeIds[i]);
                    }
                    dataJObject["FuelGradeIds"] = fuelGradeIds;
                    break;
                case NozzleOrFuelIdSelector.NONE:
                default:
                     break;

            }

            dataJObject["Type"] = EnumerationHelper.GetEnumDescription(PumpAuthorizeData.Type);

            if (PumpAuthorizeData.Type != PumpAuthorizeType.FULLTANK)
            {
                dataJObject["Dose"] = PumpAuthorizeData.Dose;
            }

          
            if (PumpAuthorizeData.TransactionEnabled)
            {
                dataJObject["Transaction"] = PumpAuthorizeData.Transaction;
            }
            dataJObject["AutoCloseTransaction"] = PumpAuthorizeData.AutoCloseTransaction.ToString().ToLower();




            return base.RequestJSON(dataJObject);
        }


        public override void ParseJSON(JObject jObject)
        {
            base.ParseJSON(jObject);
            if(IsError())
            {
                return;
            }
            if(!jObject.ContainsKey("Data"))
            {
                throw new Exception("Error: response doesn't contain Data property");
            }

            JObject data = jObject["Data"].ToObject<JObject>();
            PumpAuthorizeConfirmation pumpAuthorizeConfirmation = new PumpAuthorizeConfirmation();

            if(!data.ContainsKey("Pump"))
            {
                throw new Exception("Error: response doesn't contain Pump property");
            }

            pumpAuthorizeConfirmation.Pump = Convert.ToInt32(data["Pump"]?.ToString());

            if(!data.ContainsKey("Transaction"))
            {
                throw new Exception("Error: response doesn't contain Transaction property");
            } 
            pumpAuthorizeConfirmation.Transaction = Convert.ToInt32(data["Transaction"]?.ToString());

      


            _result = pumpAuthorizeConfirmation;
        }

        public override int GetErrorCode()
        {
            throw new NotImplementedException();
        }

        public override List<string> GetPossibleResponseNames()
        {
            throw new NotImplementedException();
        }


        public override void SetErrorCode(int errorCode)
        {
            throw new NotImplementedException();
        }
    }
}
