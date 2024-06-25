using FMS.PTS.Common;
using FMS.PTS.DataStruct;
using FMS.PTS.DataStruct.enums;
using FMS.PTS.Requests;
using FMS.Services.PTS.Requests;
using System;
using System.Collections.Generic;
using System.Data.SqlTypes;
using System.Linq;
using System.Reflection.Metadata;
using System.Text;
using System.Threading.Tasks;

namespace FMS.PTS
{
    public class Device
    {
        public Settings settings = new Settings();
        public ConnectionManager _connectionManager = new ConnectionManager();
        private bool _isOpened = false;
        private static readonly object _lockObject = new object();
        private bool _isConnected = false;

        /// <summary>
        /// Opens PTS2 device
        /// </summary>
        public void Open()
        {
            lock (_lockObject)
            {
                if (_isOpened)
                {
                    Close();
                }

                _connectionManager.SetSettings(settings);
                _connectionManager.Open();

                _isOpened = true;
            }
        }
        /// <summary>
        /// Closes PTS2 device
        /// </summary>
        public void Close()
        {
            lock (_lockObject)
            {
                if (!_isOpened)
                {
                    return;
                }

                _connectionManager.Close();
                _isOpened = false;
                _isConnected = false;
            }
        }
        /// <summary>
        /// Checks that PTS2 device is opened 
        /// </summary>
        /// <returns>True if opened</returns>
        public bool IsOpened()
        {
            return _isOpened;
        }
        /// <summary>
        /// Checks that PTS2 device is connected
        /// </summary>
        /// <returns>True if connected</returns>
        public bool IsConnected()
        {
            return _isConnected;
        }
        /// <summary>
        /// Executes a requests queue
        /// </summary>
        /// <returns>TTResult</returns>
        public int ExecuteRequestsQueue()
        {
            lock (_lockObject)
            {
                if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

                int result = _connectionManager.ExecuteRequestsQueue();

                _isConnected = ((TTResult)result == TTResult.NO_ERROR);

                return result;
            }
        }
        /// <summary>
        /// Requests queue (List<IRequest>) getter
        /// </summary>
        /// <param name="requests">Requests queue</param>
        /// <returns>TTResult</returns>
        public int GetRequestsQueue(out List<IRequest> requests)
        {
            lock (_lockObject)
            {
                requests = null;

                if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

                int result = _connectionManager.GetRequestsQueue(out requests);
                return result;
            }
        }
        /// <summary>
        /// Clears requests queue
        /// </summary>
        /// <returns>TTResult</returns>
        public int ClearRequestsQueue()
        {
            lock (_lockObject)
            {
                if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

                int result = _connectionManager.ClearRequestsQueue();
                return result;
            }
        }






        /// <summary>
        /// GetBatteryVoltage request
        /// </summary>
        /// <returns>TTResult</returns>
        //public int GetBatteryVoltage()
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new GetBatteryVoltage();
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// GetCpuTemperature request
        ///// </summary>
        ///// <returns>TTResult</returns>
        //public int GetCpuTemperature()
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new GetCpuTemperature();
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// GetUniqueIdentifier request
        ///// </summary>
        ///// <returns>TTResult</returns>
        //public int GetUniqueIdentifier()
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new GetUniqueIdentifier();
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// GetFirmwareInformation request
        ///// </summary>
        ///// <returns>TTResult</returns>
        //public int GetFirmwareInformation()
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new GetFirmwareInformation();
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// GetMeasurementUnits request
        ///// </summary>
        ///// <returns>TTResult</returns>
        //public int GetMeasurementUnits()
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new GetMeasurementUnits();
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// Restart request
        ///// </summary>
        ///// <returns>TTResult</returns>
        //public int Restart()
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new Restart();
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// GetConfigurationIdentifier request
        ///// </summary>
        ///// <returns>TTResult</returns>
        //public int GetConfigurationIdentifier()
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new GetConfigurationIdentifier();
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// GetDateTime request
        ///// </summary>
        ///// <returns>TTResult</returns>
        //public int GetDateTime()
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new GetDateTime();
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// SetDateTime request
        ///// </summary>
        ///// <param name="dateTimeSettings">Date and time</param>
        ///// <returns>TTResult</returns>
        //public int SetDateTime(DateTimeSettings dateTimeSettings)
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new SetDateTime(dateTimeSettings);
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// GetPtsNetworkSettings request
        ///// </summary>
        ///// <returns>TTResult</returns>
        //public int GetPtsNetworkSettings()
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new GetPtsNetworkSettings();
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// SetPtsNetworkSettings request
        ///// </summary>
        ///// <param name="ptsNetworkSettings">Network settings</param>
        ///// <returns>TTResult</returns>
        //public int SetPtsNetworkSettings(PtsNetworkSettings ptsNetworkSettings)
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new SetPtsNetworkSettings(ptsNetworkSettings);
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        /// <summary>
        /// GetSystemDecimalDigits request
        /// </summary>
        /// <returns>TTResult</returns>
        public int GetSystemDecimalDigits()
        {
           lock (_lockObject)
           {
               if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

               var request = new GetSystemDecimalDigits();
               int result = _connectionManager.AddRequest(request);
               return result;
           }
        }
        ///// <summary>
        ///// SetSystemDecimalDigits request
        ///// </summary>
        ///// <param name="systemDecimalDigits">Decimal digits configuration</param>
        ///// <returns>TTResult</returns>
        //public int SetSystemDecimalDigits(SystemDecimalDigits systemDecimalDigits)
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new SetSystemDecimalDigits(systemDecimalDigits);
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// GetParameter request
        ///// </summary>
        ///// <param name="parameter">Parameter</param>
        ///// <returns>TTResult</returns>
        //public int GetParameter(Parameter parameter)
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new GetParameter(parameter);
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// SetParameter request
        ///// </summary>
        ///// <param name="parameter">Parameter</param>
        ///// <returns>TTResult</returns>
        //public int SetParameter(Parameter parameter)
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new SetParameter(parameter);
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// GetPumpsConfiguration request
        ///// </summary>
        ///// <returns>TTResult</returns>
        //public int GetPumpsConfiguration()
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new GetPumpsConfiguration();
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// SetPumpsConfiguration request
        ///// </summary>
        ///// <param name="pumpsConfiguration">Pumps configuration</param>
        ///// <returns>TTResult</returns>
        //public int SetPumpsConfiguration(PumpsConfiguration pumpsConfiguration)
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new SetPumpsConfiguration(pumpsConfiguration);
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// GetProbesConfiguration request
        ///// </summary>
        ///// <returns>TTResult</returns>
        //public int GetProbesConfiguration()
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new GetProbesConfiguration();
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// SetProbesConfiguration request
        ///// </summary>
        ///// <param name="probesConfiguration">Probes configuration</param>
        ///// <returns>TTResult</returns>
        //public int SetProbesConfiguration(ProbesConfiguration probesConfiguration)
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new SetProbesConfiguration(probesConfiguration);
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// GetReadersConfiguration request
        ///// </summary>
        ///// <returns>TTResult</returns>
        //public int GetReadersConfiguration()
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new GetReadersConfiguration();
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// SetReadersConfiguration request
        ///// </summary>
        ///// <param name="readersConfiguration">Readers configuration</param>
        ///// <returns>TTResult</returns>
        //public int SetReadersConfiguration(ReadersConfiguration readersConfiguration)
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new SetReadersConfiguration(readersConfiguration);
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// GetPriceBoardsConfiguration request
        ///// </summary>
        ///// <returns>TTResult</returns>
        //public int GetPriceBoardsConfiguration()
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new GetPriceBoardsConfiguration();
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// SetPriceBoardsConfiguration request
        ///// </summary>
        ///// <param name="priceBoardsConfiguration">Proce boards configuration</param>
        ///// <returns>TTResult</returns>
        //public int SetPriceBoardsConfiguration(PriceBoardsConfiguration priceBoardsConfiguration)
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new SetPriceBoardsConfiguration(priceBoardsConfiguration);
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// SetFuelGradesConfiguration request
        ///// </summary>
        ///// <param name="fuelGrades">List of fuel grades</param>
        ///// <returns>TTResult</returns>
        //public int SetFuelGradesConfiguration(List<FuelGrade> fuelGrades)
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new SetFuelGradesConfiguration(fuelGrades);
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// GetFuelGradesConfiguration request
        ///// </summary>
        ///// <returns>TTResult</returns>
        //public int GetFuelGradesConfiguration()
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new GetFuelGradesConfiguration();
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// GetPumpNozzlesConfiguration request
        ///// </summary>
        ///// <returns>TTResult</returns>
        //public int GetPumpNozzlesConfiguration()
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new GetPumpNozzlesConfiguration();
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// SetPumpNozzlesConfiguration request
        ///// </summary>
        ///// <param name="pumpNozzlesConfiguration">Pump nozzled configuration</param>
        ///// <returns>TTResult</returns>
        //public int SetPumpNozzlesConfiguration(List<PumpNozzles> pumpNozzlesConfiguration)
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new SetPumpNozzlesConfiguration(pumpNozzlesConfiguration);
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// GetTanksConfiguration request
        ///// </summary>
        ///// <returns>TTResult</returns>
        //public int GetTanksConfiguration()
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new GetTanksConfiguration();
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// SetTanksConfiguration request
        ///// </summary>
        ///// <param name="tanks">List of tank configurations</param>
        ///// <returns>TTResult</returns>
        //public int SetTanksConfiguration(List<Tank> tanks)
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new SetTanksConfiguration(tanks);
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// GetUsersConfiguration request
        ///// </summary>
        ///// <returns>TTResult</returns>
        //public int GetUsersConfiguration()
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new GetUsersConfiguration();
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// SetUsersConfiguration request
        ///// </summary>
        ///// <param name="users">List of user configurations</param>
        ///// <returns>TTResult</returns>
        //public int SetUsersConfiguration(List<User> users)
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new SetUsersConfiguration(users);
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        /// <summary>
        /// PumpGetStatus request
        /// </summary>
        /// <param name="pump">Pump number</param>
        /// <returns>TTResult</returns>
        public int PumpGetStatus(int pump)
        {
           lock (_lockObject)
           {
               if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

               var request = new PumpGetStatus(pump);
               int result = _connectionManager.AddRequest(request);
               return result;
           }
        }
        /// <summary>
        /// PumpAuthorize request
        /// </summary>
        /// <param name="pumpAuthorizeData">Pump authorization data</param>
        /// <returns>TTResult</returns>
        public int PumpAuthorize(PumpAuthorizeData pumpAuthorizeData)
        {
            lock (_lockObject)
            {
                if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

                var request = new PumpAuthorization(pumpAuthorizeData);
                int result = _connectionManager.AddRequest(request);
                return result;
            }
        }
        ///// <summary>
        ///// PumpGetTransactionInformation request
        ///// </summary>
        ///// <param name="pump">Pump number</param>
        ///// <param name="transaction">Transaction number</param>
        ///// <returns>TTResult</returns>
        //public int PumpGetTransactionInformation(int pump, int transaction)
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new PumpGetTransactionInformation(pump, transaction);
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// PumpStop request
        ///// </summary>
        ///// <param name="pump">Pump number</param>
        ///// <returns>TTResult</returns>
        //public int PumpStop(int pump)
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new PumpStop(pump);
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// PumpEmergencyStop request
        ///// </summary>
        ///// <param name="pump">Pump number</param>
        ///// <returns>TTResult</returns>
        //public int PumpEmergencyStop(int pump)
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new PumpEmergencyStop(pump);
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// PumpSuspend request
        ///// </summary>
        ///// <param name="pump">Pump number</param>
        ///// <returns>TTResult</returns>
        //public int PumpSuspend(int pump)
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new PumpSuspend(pump);
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// PumpResume request
        ///// </summary>
        ///// <param name="pump">Pump number</param>
        ///// <returns>TTResult</returns>
        //public int PumpResume(int pump)
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new PumpResume(pump);
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// PumpCloseTransaction request
        ///// </summary>
        ///// <param name="pump">Pump number</param>
        ///// <param name="transaction">Transaction number</param>
        ///// <returns>TTResult</returns>
        //public int PumpCloseTransaction(int pump, int transaction)
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new PumpCloseTransaction(pump, transaction);
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// PumpGetTotals request
        ///// </summary>
        ///// <param name="pump">Pump number</param>
        ///// <param name="nozzle">Nozzle number</param>
        ///// <param name="fuelGradeId">Fuel grade Id</param>
        ///// <param name="nozzleOrFielIdSelector">Nozzle or fielId selector. Determines field that will be used</param>
        ///// <returns>TTResult</returns>
        //public int PumpGetTotals(int pump, int nozzle, int fuelGradeId, NozzleOrFuelIdSelector nozzleOrFielIdSelector)
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new PumpGetTotals(pump, nozzle, fuelGradeId, nozzleOrFielIdSelector);
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// PumpGetPrices request
        ///// </summary>
        ///// <param name="pump">Pump number</param>
        ///// <returns>TTResult</returns>
        //public int PumpGetPrices(int pump)
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new PumpGetPrices(pump);
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// PumpSetPrices request
        ///// </summary>
        ///// <param name="pump">Pump number</param>
        ///// <param name="prices">List of prices for each nozzle</param>
        ///// <returns>TTResult</returns>
        //public int PumpSetPrices(int pump, List<double> prices)
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new PumpSetPrices(pump, prices);
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// PumpGetDisplayData request
        ///// </summary>
        ///// <param name="pump">Pump number</param>
        ///// <returns>TTResult</returns>
        //public int PumpGetDisplayData(int pump)
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new PumpGetDisplayData(pump);
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        /// <summary>
        /// PumpGetTag request
        /// </summary>
        /// <param name="pump">Pump number</param>
        /// <param name="nozzle">Nozzle number</param>
        /// <returns>TTResult</returns>
        public int PumpGetTag(int pump, int nozzle)
        {
            lock (_lockObject)
            {
                if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

                var request = new PumpGetTag(pump, nozzle);
                int result = _connectionManager.AddRequest(request);
                return result;
            }
        }
        ///// <summary>
        ///// GetTagInformation request
        ///// </summary>
        ///// <param name="tag">Tag</param>
        ///// <returns>TTResult</returns>
        //public int GetTagInformation(string tag)
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new GetTagInformation(tag);
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// GetTagsList request
        ///// </summary>
        ///// <returns>TTResult</returns>
        //public int GetTagsList()
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new GetTagsList();
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// SetTagsList request
        ///// </summary>
        ///// <param name="tagsList">List of TagInformation instances</param>
        ///// <returns>TTResult</returns>
        //public int SetTagsList(List<TagInformation> tagsList)
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new SetTagsList(tagsList);
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// ReaderGetTag request
        ///// </summary>
        ///// <param name="reader">Reader number</param>
        ///// <returns>TTResult</returns>
        //public int ReaderGetTag(int reader)
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new ReaderGetTag(reader);
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// PumpSetLights request
        ///// </summary>
        ///// <param name="pump">Pump number</param>
        ///// <param name="lightsEnabled">True to enable, False to disable</param>
        ///// <returns>TTResult</returns>
        //public int PumpSetLights(int pump, bool lightsEnabled)
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new PumpSetLights(pump, lightsEnabled);
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// PumpGetAutomaticOperation request
        ///// </summary>
        ///// <param name="pump">Pump number</param>
        ///// <returns>TTResult</returns>
        //public int PumpGetAutomaticOperation(int pump)
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new PumpGetAutomaticOperation(pump);
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// PumpSetAutomaticOperation request
        ///// </summary>
        ///// <param name="pump">Pump number</param>
        ///// <param name="automaticPumpAuthorization">True for automatic authorization, False for via CloseTransaction</param>
        ///// <returns>TTResult</returns>
        //public int PumpSetAutomaticOperation(int pump, bool automaticPumpAuthorization)
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new PumpSetAutomaticOperation(pump, automaticPumpAuthorization);
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// ProbeGetMeasurements request
        ///// </summary>
        ///// <param name="probe">Probe number</param>
        ///// <returns>TTResult</returns>
        //public int ProbeGetMeasurements(int probe)
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new ProbeGetMeasurements(probe);
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// ProbeGetTankVolumeForHeight request
        ///// </summary>
        ///// <param name="probe">Probe number</param>
        ///// <param name="height">Height</param>
        ///// <returns>TTResult</returns>
        //public int ProbeGetTankVolumeForHeight(int probe, int height)
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new ProbeGetTankVolumeForHeight(probe, height);
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// GetGpsData request
        ///// </summary>
        ///// <returns>TTResult</returns>
        //public int GetGpsData()
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new GetGpsData();
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// ReportGetPumpTransactions request
        ///// </summary>
        ///// <param name="pump">Pump number</param>
        ///// <param name="dateTimeStart">Date and time as a start point to search</param>
        ///// <param name="dateTimeEnd">Date and time as a finish point to search</param>
        ///// <returns>TTResult</returns>
        //public int ReportGetPumpTransactions(int pump, DateTime dateTimeStart, DateTime dateTimeEnd)
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new ReportGetPumpTransactions(pump, dateTimeStart, dateTimeEnd);
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        ///// <summary>
        ///// ReportGetTankMeasurements request
        ///// </summary>
        ///// <param name="tank">Tank number</param>
        ///// <param name="dateTimeStart">Date and time as a start point to search</param>
        ///// <param name="dateTimeEnd">Date and time as a finish point to search</param>
        ///// <returns>TTResult</returns>
        //public int ReportGetTankMeasurements(int tank, DateTime dateTimeStart, DateTime dateTimeEnd)
        //{
        //    lock (_lockObject)
        //    {
        //        if (!_isOpened) { return (int)TTResult.INIT_ERROR; }

        //        var request = new ReportGetTankMeasurements(tank, dateTimeStart, dateTimeEnd);
        //        int result = _connectionManager.AddRequest(request);
        //        return result;
        //    }
        //}
        /// <summary>
        /// Clears the listiners request
        /// </summary>
        public void ClearListiners()
        {
            lock (_lockObject)
                _connectionManager.ClearCallbacks();
        }
        /// <summary>
        /// GetBatteryVoltage callback setter
        /// </summary>
        /// <param name="callback">Callback function</param>
        //public void SetOnGetBatteryVoltageListener(GetBatteryVoltage.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.GetBatteryVoltage.KEY, callback);
        //}
        ///// <summary>
        ///// GetCpuTemperature callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnGetCpuTemperatureListener(GetCpuTemperature.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.GetCpuTemperature.KEY, callback);
        //}
        ///// <summary>
        ///// GetUniqueIdentifier callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnGetUniqueIdentifierListener(GetUniqueIdentifier.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.GetUniqueIdentifier.KEY, callback);
        //}
        ///// <summary>
        ///// GetFirmwareInformation callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnGetFirmwareInformationListener(GetFirmwareInformation.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.GetFirmwareInformation.KEY, callback);
        //}
        ///// <summary>
        ///// GetMeasurementUnits callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnGetMeasurementUnitsListener(GetMeasurementUnits.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.GetMeasurementUnits.KEY, callback);
        //}
        ///// <summary>
        ///// Restart callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnRestartListener(Restart.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.Restart.KEY, callback);
        //}
        ///// <summary>
        ///// GetConfigurationIdentifier callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnGetConfigurationIdentifierListener(GetConfigurationIdentifier.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.GetConfigurationIdentifier.KEY, callback);
        //}
        ///// <summary>
        ///// GetDateTime callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnGetDateTimeListener(GetDateTime.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.GetDateTime.KEY, callback);
        //}
        ///// <summary>
        ///// SetDateTime callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnSetDateTimeListener(SetDateTime.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.SetDateTime.KEY, callback);
        //}
        ///// <summary>
        ///// GetPtsNetworkSettings callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnGetPtsNetworkSettingsListener(GetPtsNetworkSettings.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.GetPtsNetworkSettings.KEY, callback);
        //}
        ///// <summary>
        ///// SetPtsNetworkSettings callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnSetPtsNetworkSettingsListener(SetPtsNetworkSettings.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.SetPtsNetworkSettings.KEY, callback);
        //}
        ///// <summary>
        ///// GetSystemDecimalDigits callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnGetSystemDecimalDigitsListener(GetSystemDecimalDigits.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.GetSystemDecimalDigits.KEY, callback);
        //}
        ///// <summary>
        ///// SetSystemDecimalDigits callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnSetSystemDecimalDigitsListener(SetSystemDecimalDigits.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.SetSystemDecimalDigits.KEY, callback);
        //}
        ///// <summary>
        ///// GetParameter callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnGetParameterListener(GetParameter.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.GetParameter.KEY, callback);
        //}
        ///// <summary>
        ///// SetParameter callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnSetParameterListener(SetParameter.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.SetParameter.KEY, callback);
        //}
        ///// <summary>
        ///// GetPumpsConfiguration callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnGetPumpsConfigurationListener(GetPumpsConfiguration.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.GetPumpsConfiguration.KEY, callback);
        //}
        ///// <summary>
        ///// SetPumpsConfiguration callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnSetPumpsConfigurationListener(SetPumpsConfiguration.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.SetPumpsConfiguration.KEY, callback);
        //}
        ///// <summary>
        ///// GetProbesConfiguration callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnGetProbesConfigurationListener(GetProbesConfiguration.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.GetProbesConfiguration.KEY, callback);
        //}
        ///// <summary>
        ///// SetProbesConfiguration callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnSetProbesConfigurationListener(SetProbesConfiguration.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.SetProbesConfiguration.KEY, callback);
        //}
        ///// <summary>
        ///// GetReadersConfiguration callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnGetReadersConfigurationListener(GetReadersConfiguration.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.GetReadersConfiguration.KEY, callback);
        //}
        ///// <summary>
        ///// SetReadersConfiguration callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnSetReadersConfigurationListener(SetReadersConfiguration.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.SetReadersConfiguration.KEY, callback);
        //}
        /// <summary>
        /// GetPriceBoardsConfiguration callback setter
        /// </summary>
        /// <param name="callback">Callback function</param>
        //public void SetOnGetPriceBoardsConfigurationListener(GetPriceBoardsConfiguration.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.GetPriceBoardsConfiguration.KEY, callback);
        //}
        ///// <summary>
        ///// SetPriceBoardsConfiguration callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnSetPriceBoardsConfigurationListener(SetPriceBoardsConfiguration.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.SetPriceBoardsConfiguration.KEY, callback);
        //}
        ///// <summary>
        ///// SetFuelGradesConfiguration callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnSetFuelGradesConfigurationListener(SetFuelGradesConfiguration.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.SetFuelGradesConfiguration.KEY, callback);
        //}
        ///// <summary>
        ///// GetFuelGradesConfiguration callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnGetFuelGradesConfigurationListener(GetFuelGradesConfiguration.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.GetFuelGradesConfiguration.KEY, callback);
        //}
        ///// <summary>
        ///// GetPumpNozzlesConfiguration callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnGetPumpNozzlesConfigurationListener(GetPumpNozzlesConfiguration.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.GetPumpNozzlesConfiguration.KEY, callback);
        //}
        ///// <summary>
        ///// SetPumpNozzlesConfiguration callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnSetPumpNozzlesConfigurationListener(SetPumpNozzlesConfiguration.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.SetPumpNozzlesConfiguration.KEY, callback);
        //}
        ///// <summary>
        ///// GetTanksConfiguration callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnGetTanksConfigurationListener(GetTanksConfiguration.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.GetTanksConfiguration.KEY, callback);
        //}
        ///// <summary>
        ///// SetTanksConfiguration callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnSetTanksConfigurationListener(SetTanksConfiguration.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.SetTanksConfiguration.KEY, callback);
        //}
        /// <summary>
        /// GetUsersConfiguration callback setter
        /// </summary>
        /// <param name="callback">Callback function</param>
        //     public void SetOnGetUsersConfigurationListener(GetUsersConfiguration.Callback callback)
        //  {
        //     lock (_lockObject)
        ///         _connectionManager.AddCallback(Technotrade.PTS2.NETCore.GetUsersConfiguration.KEY, callback);
        // }
        /// <summary>
        /// SetUsersConfiguration callback setter
        /// </summary>
        /// <param name="callback">Callback function</param>
        //public void SetOnSetUsersConfigurationListener(SetUsersConfiguration.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.SetUsersConfiguration.KEY, callback);
        //}
        ///// <summary>
        ///// PumpIdleStatus callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnPumpIdleStatusListener(PumpGetStatus.PumpIdleStatusCallback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.PumpGetStatus.PUMP_IDLE_STATUS, callback);
        //}
        ///// <summary>
        ///// PumpFillingStatus callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnPumpFillingStatusListener(PumpGetStatus.PumpFillingStatusCallback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.PumpGetStatus.PUMP_FILLING_STATUS, callback);
        //}
        ///// <summary>
        ///// PumpEndOfTransactionStatus callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnPumpEndOfTransactionStatusListener(PumpGetStatus.PumpEndOfTransactionStatusCallback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.PumpGetStatus.PUMP_END_OF_TRANSACTION_STATUS, callback);
        //}
        ///// <summary>
        ///// PumpOfflineStatus callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnPumpOfflineStatusListener(PumpGetStatus.PumpOfflineStatusCallback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.PumpGetStatus.PUMP_OFFLINE_STATUS, callback);
        //}
        ///// <summary>
        ///// PumpTotals callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnPumpTotalsListener(PumpGetStatus.PumpTotalsCallback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.PumpGetStatus.PUMP_TOTALS, callback);
        //}
        ///// <summary>
        ///// PumpPrices callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnPumpPricesListener(PumpGetStatus.PumpPricesCallback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.PumpGetStatus.PUMP_PRICES, callback);
        //}
        ///// <summary>
        ///// PumpTag callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnPumpTagListiner(PumpGetStatus.PumpTagCallback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.PumpGetStatus.PUMP_TAG, callback);
        //}
        ///// <summary>
        ///// PumpDisplayData callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnPumpDisplayDataListener(PumpGetStatus.PumpDisplayDataCallback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.PumpGetStatus.PUMP_DISPLAY_DATA, callback);
        //}
        ///// <summary>
        /// PumpAuthorize callback setter
        /// </summary>
        /// <param name="callback">Callback function</param>
        public void SetOnPumpAuthorizeListener(PumpAuthorization.Callback callback)
        {
            lock (_lockObject)
                _connectionManager.AddCallback(PumpAuthorization.Key, callback);
        }
        ///// <summary>
        ///// PumpGetTransactionInformation callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnPumpGetTransactionInformationListener(PumpGetTransactionInformation.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.PumpGetTransactionInformation.KEY, callback);
        //}
        ///// <summary>
        ///// PumpStop callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnPumpStopListener(PumpStop.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.PumpStop.KEY, callback);
        //}
        ///// <summary>
        ///// PumpEmergencyStop callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnPumpEmergencyStopListener(PumpEmergencyStop.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.PumpEmergencyStop.KEY, callback);
        //}
        ///// <summary>
        ///// PumpSuspend callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnPumpSuspendListener(PumpSuspend.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.PumpSuspend.KEY, callback);
        //}
        ///// <summary>
        ///// PumpResume callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnPumpResumeListener(PumpResume.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.PumpResume.KEY, callback);
        //}
        ///// <summary>
        ///// PumpCloseTransaction callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnPumpCloseTransactionListener(PumpCloseTransaction.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.PumpCloseTransaction.KEY, callback);
        //}
        ///// <summary>
        ///// PumpGetTotals callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnPumpGetTotalsListener(PumpGetTotals.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.PumpGetTotals.KEY, callback);
        //}
        ///// <summary>
        ///// PumpGetPrices callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnPumpGetPricesListener(PumpGetPrices.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.PumpGetPrices.KEY, callback);
        //}
        ///// <summary>
        ///// PumpSetPrices callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnPumpSetPricesListener(PumpSetPrices.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.PumpSetPrices.KEY, callback);
        //}
        ///// <summary>
        ///// PumpGetDisplayData callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnPumpGetDisplayDataListener(PumpGetDisplayData.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.PumpGetDisplayData.KEY, callback);
        //}
        /// <summary>
        /// PumpGetTag callback setter
        /// </summary>
        /// <param name="callback">Callback function</param>
        public void SetOnPumpGetTagListener(PumpGetTag.Callback callback)
        {
            lock (_lockObject)
                _connectionManager.AddCallback(FMS.PTS.Requests.PumpGetTag.KEY, callback);
        }
        ///// <summary>
        ///// GetTagInformation callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnGetTagInformationListener(GetTagInformation.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.GetTagInformation.KEY, callback);
        //}
        ///// <summary>
        ///// GetTagsList callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnGetTagsListListener(GetTagsList.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.GetTagsList.KEY, callback);
        //}
        ///// <summary>
        ///// SetTagsList callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnSetTagsListListener(SetTagsList.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.SetTagsList.KEY, callback);
        //}
        ///// <summary>
        ///// ReaderGetTag callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnReaderGetTagListener(ReaderGetTag.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.ReaderGetTag.KEY, callback);
        //}
        ///// <summary>
        ///// PumpSetLights callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnPumpSetLightsListener(PumpSetLights.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.PumpSetLights.KEY, callback);
        //}
        ///// <summary>
        ///// PumpGetAutomaticOperation callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnPumpGetAutomaticOperationListener(PumpGetAutomaticOperation.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.PumpGetAutomaticOperation.KEY, callback);
        //}
        ///// <summary>
        ///// PumpSetAutomaticOperation callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnPumpSetAutomaticOperationListener(PumpSetAutomaticOperation.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.PumpSetAutomaticOperation.KEY, callback);
        //}
        ///// <summary>
        ///// ProbeGetMeasurements callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnProbeGetMeasurementsListener(ProbeGetMeasurements.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.ProbeGetMeasurements.KEY, callback);
        //}
        ///// <summary>
        ///// ProbeGetTankVolumeForHeight callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnProbeGetTankVolumeForHeightListener(ProbeGetTankVolumeForHeight.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.ProbeGetTankVolumeForHeight.KEY, callback);
        //}
        ///// <summary>
        ///// GetGpsData callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnGetGpsDataListener(GetGpsData.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.GetGpsData.KEY, callback);
        //}
        ///// <summary>
        ///// ReportGetPumpTransactions callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnReportGetPumpTransactionsListener(ReportGetPumpTransactions.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.ReportGetPumpTransactions.KEY, callback);
        //}
        ///// <summary>
        ///// ReportGetTankMeasurements callback setter
        ///// </summary>
        ///// <param name="callback">Callback function</param>
        //public void SetOnReportGetTankMeasurementsListener(ReportGetTankMeasurements.Callback callback)
        //{
        //    lock (_lockObject)
        //        _connectionManager.AddCallback(Technotrade.PTS2.NETCore.ReportGetTankMeasurements.KEY, callback);
        //}
    }
}
