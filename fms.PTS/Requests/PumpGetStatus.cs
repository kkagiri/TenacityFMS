using FMS.PTS.Common;
using FMS.PTS.DataStruct;
using FMS.PTS.Exceptions;
using Newtonsoft.Json.Linq;

namespace FMS.PTS.Requests
{
    
    /// <summary>
    /// PumpGetStatus request.
    /// Gets pump status, active nozzle, currently executed request, user locking the pump.
    /// Depending on pump status response can be:
    /// PumpIdleStatus response - in case if the pump is in idle state
    /// PumpFillingStatus response - in case if the pump is in filling state
    /// PumpEndOfTransactionStatus response - in case if the pump finished filling
    /// PumpOfflineStatus response - in case if the pump is not connected or not responding
    /// PumpTotals response - in case if total counters were received from the pump
    /// PumpPrices response – in case if prices were sent to or received from the pump
    /// PumpTag response – in case if tag ID was received from the pump
    /// PumpDisplayData response – in case if pump display data was received from the pump
    /// </summary>
   
    public class PumpGetStatus : BaseRequest<PumpStatusBase>
    {

           public static readonly string REQUEST_NAME = "PumpGetStatus";
        public static readonly string PUMP_IDLE_STATUS = "PumpIdleStatus";
        public static readonly string PUMP_FILLING_STATUS = "PumpFillingStatus";
        public static readonly string PUMP_END_OF_TRANSACTION_STATUS = "PumpEndOfTransactionStatus";
        public static readonly string PUMP_OFFLINE_STATUS = "PumpOfflineStatus";
        public static readonly string PUMP_TOTALS = "PumpTotals";
        public static readonly string PUMP_PRICES = "PumpPrices";
        public static readonly string PUMP_TAG = "PumpTag";
        public static readonly string PUMP_DISPLAY_DATA = "­PumpDisplayData";
        public static readonly string[] RESPONSE_NAMES = { PUMP_IDLE_STATUS,
                                                           PUMP_FILLING_STATUS,
                                                           PUMP_END_OF_TRANSACTION_STATUS,
                                                           PUMP_OFFLINE_STATUS,
                                                           PUMP_TOTALS,
                                                           PUMP_PRICES,
                                                           PUMP_TAG,
                                                           PUMP_DISPLAY_DATA };

  public delegate void PumpIdleStatusCallback(PumpIdleStatus result, BaseRequest<PumpStatusBase> request);
      public delegate void PumpFillingStatusCallback(PumpFillingStatus result, BaseRequest<PumpStatusBase> request);
        public delegate void PumpEndOfTransactionStatusCallback(PumpEndOfTransactionStatus result, BaseRequest<PumpStatusBase> request);
        public delegate void PumpOfflineStatusCallback(PumpOfflineStatus result, BaseRequest<PumpStatusBase> request);
        public delegate void PumpTotalsCallback(PumpTotals result, BaseRequest<PumpStatusBase> request);
        public delegate void PumpPricesCallback(PumpPrices result, BaseRequest<PumpStatusBase> request);
        public delegate void PumpTagCallback(PumpTag result, BaseRequest<PumpStatusBase> request);
        public delegate void PumpDisplayDataCallback(PumpDisplayData result, BaseRequest<PumpStatusBase> request); 



      public int Pump { get; private set; }

        public PumpGetStatus(int pump)
            : base(REQUEST_NAME, RESPONSE_NAMES)
        {
            Pump = pump;
        }

         public override JObject RequestJSON(JContainer data = null)
        {
            JObject dataJObject = new JObject();
            dataJObject["Pump"] = Pump;

            return base.RequestJSON(dataJObject);
        }

         public override void ParseJSON(JObject jObject)
        {
            base.ParseJSON(jObject);

            if (IsError())
            {
                return;
            }

            if (!jObject.ContainsKey("Data"))
            {
                throw new TTProtocolErrorException("Error: response doesn't contain Data property");
            }

            JObject datajObject = jObject["Data"].ToObject<JObject>();

            PumpStatusBase pumpStatus = null;

            string receivedResponseName = GetReceivedResponseName();
          
            if (receivedResponseName.Equals(PUMP_IDLE_STATUS))
            {
                PumpIdleStatus pumpIdleStatus = new PumpIdleStatus();

                if (datajObject.ContainsKey("NozzleUp"))
                {
                    pumpIdleStatus.NozzleUp = Convert.ToInt32(datajObject["NozzleUp"]?.ToString());
                }

                if (datajObject.ContainsKey("LastNozzle"))
                {
                    pumpIdleStatus.LastNozzle = Convert.ToInt32(datajObject["LastNozzle"]?.ToString());
                }

                if (datajObject.ContainsKey("LastVolume"))
                {
                    pumpIdleStatus.LastVolume = Convert.ToDouble(datajObject["LastVolume"]?.ToString());
                }

                if (datajObject.ContainsKey("LastPrice"))
                {
                    pumpIdleStatus.LastPrice = Convert.ToDouble(datajObject["LastPrice"]?.ToString());
                }

                if (datajObject.ContainsKey("LastAmount"))
                {
                    pumpIdleStatus.LastAmount = Convert.ToDouble(datajObject["LastAmount"]?.ToString());
                }

                if (datajObject.ContainsKey("LastTransaction"))
                {
                    pumpIdleStatus.LastTransaction = Convert.ToInt32(datajObject["LastTransaction"]?.ToString());
                }

                if (datajObject.ContainsKey("Request"))
                {
                    pumpIdleStatus.Request = datajObject["Request"]?.ToString();
                }

                pumpStatus = pumpIdleStatus;
            }
            else if (receivedResponseName.Equals(PUMP_FILLING_STATUS))
            {
                PumpFillingStatus pumpFillingStatus = new PumpFillingStatus();

                if (datajObject.ContainsKey("Nozzle"))
                {
                    pumpFillingStatus.Nozzle = Convert.ToInt32(datajObject["Nozzle"]?.ToString());
                }

                if (datajObject.ContainsKey("Volume"))
                {
                    pumpFillingStatus.Volume = Convert.ToDouble(datajObject["Volume"]?.ToString());
                }

                if (datajObject.ContainsKey("TCVolume"))
                {
                    pumpFillingStatus.TCVolume = Convert.ToDouble(datajObject["TCVolume"]?.ToString());
                }

                if (datajObject.ContainsKey("Price"))
                {
                    pumpFillingStatus.Price = Convert.ToDouble(datajObject["Price"]?.ToString());
                }

                if (datajObject.ContainsKey("Amount"))
                {
                    pumpFillingStatus.Amount = Convert.ToDouble(datajObject["Amount"]?.ToString());
                }

                if (datajObject.ContainsKey("Transaction"))
                {
                    pumpFillingStatus.Transaction = Convert.ToInt32(datajObject["Transaction"]?.ToString());
                }

                pumpStatus = pumpFillingStatus;
            }
            else if (receivedResponseName.Equals(PUMP_END_OF_TRANSACTION_STATUS))
            {
                PumpEndOfTransactionStatus pumpEndOfTransactionStatus = new PumpEndOfTransactionStatus();

                if (datajObject.ContainsKey("Nozzle"))
                {
                    pumpEndOfTransactionStatus.Nozzle = Convert.ToInt32(datajObject["Nozzle"]?.ToString());
                }

                if (datajObject.ContainsKey("Volume"))
                {
                    pumpEndOfTransactionStatus.Volume = Convert.ToDouble(datajObject["Volume"]?.ToString());
                }

                if (datajObject.ContainsKey("TCVolume"))
                {
                    pumpEndOfTransactionStatus.TCVolume = Convert.ToDouble(datajObject["TCVolume"]?.ToString());
                }

                if (datajObject.ContainsKey("Price"))
                {
                    pumpEndOfTransactionStatus.Price = Convert.ToDouble(datajObject["Price"]?.ToString());
                }

                if (datajObject.ContainsKey("Amount"))
                {
                    pumpEndOfTransactionStatus.Amount = Convert.ToDouble(datajObject["Amount"]?.ToString());
                }

                if (datajObject.ContainsKey("Transaction"))
                {
                    pumpEndOfTransactionStatus.Transaction = Convert.ToInt32(datajObject["Transaction"]?.ToString());
                }

                pumpStatus = pumpEndOfTransactionStatus;
            }
            else if (receivedResponseName.Equals(PUMP_OFFLINE_STATUS))
            {
                PumpOfflineStatus pumpOfflineStatus = new PumpOfflineStatus();
                pumpStatus = pumpOfflineStatus;
            }
            else if (receivedResponseName.Equals(PUMP_TOTALS))
            {
                PumpTotals pumpTotals = new PumpTotals();

                if (datajObject.ContainsKey("Nozzle"))
                {
                    pumpTotals.Nozzle = Convert.ToInt32(datajObject["Nozzle"]?.ToString());
                }

                if (datajObject.ContainsKey("Volume"))
                {
                    pumpTotals.Volume = Convert.ToDouble(datajObject["Volume"]?.ToString());
                }

                if (datajObject.ContainsKey("Amount"))
                {
                    pumpTotals.Amount = Convert.ToDouble(datajObject["Amount"]?.ToString());
                }

                if (datajObject.ContainsKey("Transaction"))
                {
                    pumpTotals.Transaction = Convert.ToInt32(datajObject["Transaction"]?.ToString());
                }

                pumpStatus = pumpTotals;
            }
            else if (receivedResponseName.Equals(PUMP_PRICES))
            {
                PumpPrices pumpPrices = new PumpPrices();

                pumpPrices.Prices = new List<double>();
                JArray pricesJArray = JArray.FromObject(datajObject["Prices"]);
                for (int i = 0; i < pricesJArray.Count; i++)
                {
                    pumpPrices.Prices.Add(Convert.ToDouble(pricesJArray[i].ToString()));
                }

                pumpStatus = pumpPrices;
            }
            else if (receivedResponseName.Equals(PUMP_TAG))
            {
                PumpTag pumpTag = new PumpTag();

                if (datajObject.ContainsKey("Nozzle"))
                {
                    pumpTag.Nozzle = Convert.ToInt32(datajObject["Nozzle"]?.ToString());
                }

                if (datajObject.ContainsKey("Tag"))
                {
                    pumpTag.Tag = datajObject["Tag"]?.ToString();
                }

                pumpStatus = pumpTag;
            }
            else if (receivedResponseName.Equals(PUMP_DISPLAY_DATA))
            {
                PumpDisplayData pumpDisplayData = new PumpDisplayData();

                if (datajObject.ContainsKey("LastNozzle"))
                {
                    pumpDisplayData.LastNozzle = Convert.ToInt32(datajObject["LastNozzle"]?.ToString());
                }

                if (datajObject.ContainsKey("LastTransaction"))
                {
                    pumpDisplayData.LastTransaction = Convert.ToInt32(datajObject["LastTransaction"]?.ToString());
                }

                if (datajObject.ContainsKey("Volume"))
                {
                    pumpDisplayData.Volume = Convert.ToDouble(datajObject["Volume"]?.ToString());
                }

                if (datajObject.ContainsKey("Amount"))
                {
                    pumpDisplayData.Amount = Convert.ToDouble(datajObject["Amount"]?.ToString());
                }

                pumpStatus = pumpDisplayData;
            }
            else
            {
                throw new TTProtocolErrorException("Error: response doesn't contain correct Type property");
            }

            if(pumpStatus != null)
            {
                if (datajObject.ContainsKey("Pump"))
                {
                    pumpStatus.Pump = Convert.ToInt32(datajObject["Pump"]?.ToString());
                }

                if (datajObject.ContainsKey("User"))
                {
                    pumpStatus.User = datajObject["User"]?.ToString();
                }
            }

            _result = pumpStatus;
        }

    }
}