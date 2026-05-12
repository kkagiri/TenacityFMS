using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Common.PTSResponse;
using FMS.Application.Features.PTS;
using FMS.Domain.Entities;
using FMS.Domain.Entities.PTS;

namespace FMS.Application.PTSServices.PumpService {
    public interface IPumpService {
        /// <summary>
        /// Authorizes a pump transaction : Basically allows the pump to start filling
        /// </summary>
        /// <param name="pTSDeviceId">The PTS device ID</param>
        /// <param name="pumpAuthorizeData">The pump authorize data</param>
        /// <returns>The pump authorize confirmation</returns>

        Task<PumpAuthorizeConfirmation> PumpAuthorizeAsync (string pTSDeviceId, PumpAuthorizeData pumpAuthorizeData);

        Task<FMSResponseMessage<object>> GetPumpStatusAsync (string pTSDeviceId, int pumpId);

        Task<Pumptransaction> GetPumpTransactionInfoAsync (string pTSDeviceId, int pumpId, int? transactionId); //Use PumpTransactionInformationResponse

        Task<FMSResponseMessage> StopPumpAsync (string pTSDeviceId, int pumpId);
        Task<FMSResponseMessage> EmergencyStopPumpAsync (string pTSDeviceId, int pumpId);
        Task<FMSResponseMessage> SuspendPumpAsync (string pTSDeviceId, int pumpId);
        Task<FMSResponseMessage> ResumePumpAsync (string pTSDeviceId, int pumpId);
        Task<FMSResponseMessage> ClosePumpTransactionAsync (string pTSDeviceId, int pumpId, int transactionId);
        Task<FMSResponseMessage> GetPumpTotalsAsync (string pTSDeviceId, int pumpId, int? nozzle, int? fuelGradeId);
        Task<FMSResponseMessage> GetPumpPricesAsync (string pTSDeviceId, int pumpId);
        Task<FMSResponseMessage> SetPumpPricesAsync (string pTSDeviceId, int pumpId, double[] prices);
        Task<FMSResponseMessage> GetPumpDisplayDataAsync (string pTSDeviceId, int pumpId);
        Task<FMSResponseMessage<PumpTagResponseDTO>> GetPumpTagAsync (string pTSDeviceId, int pumpId, int nozzle);
        Task<FMSResponseMessage> GetPumpAdditionalMeasurementsAsync (string pTSDeviceId, int pumpId);
        Task<FMSResponseMessage> SetPumpLightsAsync (string pTSDeviceId, int pumpId, string state);
        Task<PumpAutomaticOperation> GetPumpAutomaticOperationAsync (string pTSDeviceId, int pumpId);
        Task<FMSResponseMessage> SetPumpAutomaticOperationAsync (string pTSDeviceId, int pumpId, string state);
        Task<FMSResponseMessage> SetSimulateFillingOnDartInputAsync (string pTSDeviceId, int pumpId, string state, int nozzleUp);

        void InitializePumpState (string pTSDeviceId, int pumpId);
    }
}