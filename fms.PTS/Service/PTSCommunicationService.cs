using FMS.PTS.Util;
using FMS.Domain.ATGStatus.PumpStatus;
using FMS.PTS;
using FMS.PTS.DataStruct.enums;
using Microsoft.AspNetCore.SignalR.Protocol;
using FMS.PTS.Common;
using FMS.PTS.DataStruct;

namespace FMS.PTS;

public class PTSCommunicationService
{


  private static PTSCommunicationService _instance;

  private Device _ptsDevice = new Device();

  private readonly ThreadHelper _getStatusThreadHelper = new ThreadHelper();

  private readonly int _getStatusThreadInterval = 1000;

  AutoResetEvent _waitFirstStatusRequestHandle;

  private static readonly object _instanceLock = new object();

  private static readonly object _lockObject = new object();

  public string IPAddress { get; set; }

  public short Port { get; set; }

  public string Login { get; set; }

  public string Password { get; set; }

  public ProtocolSecurityType ProtocolSecurityType { get; set; }

  public AuthenticationType AuthenticationType { get; set; }


  public PTSCommunicationService(Device device)
  {
    _ptsDevice = device;
  }


  public TTResultEx Open()
  {
      Close();
    _ptsDevice.settings.Host = IPAddress;
    _ptsDevice.settings.HttpPort = Port;
    _ptsDevice.settings.HttpsPort = Port;
    _ptsDevice.settings.Login = Login;
    _ptsDevice.settings.Password = Password;
    _ptsDevice.settings.ProtocolSecurityType = ProtocolSecurityType;
    _ptsDevice.settings.AuthenticationType = AuthenticationType;


      //add more listeners
    _ptsDevice.SetOnPumpGetTagListener(PumpGetTagCallback);
    _ptsDevice.SetOnPumpAuthorizeListener(PumpAuthorizeCallback);


      //open the device 
    _ptsDevice.Open();

    TTResultEx resultsEX = LoadConfigurations();



      if(resultsEX.Result == TTResult.NO_ERROR)
      {
       Close() ;
       return resultsEX;
        }

      _waitFirstStatusRequestHandle = new AutoResetEvent(false);
      //_getStatusThreadHelper.ThreadFunctionEvent +=(args) => GetStatusThreadCallBack();

      bool bResults = _waitFirstStatusRequestHandle.WaitOne(_ptsDevice.settings.Timeout);
     if(!bResults)
{
  Close();
resultsEX.Result = TTResult.TIMEOUT_ERROR;
return resultsEX;

}
      return resultsEX; 
  }


// private PumpConfiguration _pumpConfiguration;
//  private ProbesConfiguration _probesConfiguration;

// public void GetStatusThreadCallback()
// {
// lock(_lockObject)
// {
//   TTResult result = (TTResult)_ptsDevice.ClearRequestsQueue();

//   for(int i=0;i <_pumpConfiguration.Pumps.Count;i++)
//   {
//     Pump pump = _pumpConfiguration.Pumps[i];
//     if(result == TTResult.NO_ERROR)
//     {
//       result = (TTResult)_ptsDevice.PumpGetStatus(pump.Id);
//     }
   
//   }

//   if (result == TTResult.NO_ERROR)
//                 {
//                     result = (TTResult)_ptsDevice.GetConfigurationIdentifier();
//                 }
// }

// }

  public void Close()
  {
    _getStatusThreadHelper.Clean();
    _ptsDevice.Close();

    if (_waitFirstStatusRequestHandle != null)
    {
      _waitFirstStatusRequestHandle.Close();
    }
    _ptsDevice.ClearListiners();

  }

public TTResultEx LoadConfigurations()
{
  lock (_lockObject)
  {
    TTResultEx resultEx = new TTResultEx();

    resultEx.Result = (TTResult)_ptsDevice.ClearRequestsQueue();

    if (resultEx.Result != TTResult.NO_ERROR)
    {
      resultEx.Result = (TTResult) _ptsDevice.GetSystemDecimalDigits();
    }

    if(resultEx.Result == TTResult.NO_ERROR)
    {
      resultEx = ExecuteRequestsQueue();
    }

    return resultEx;
  }
}


//Commands to be executed by the PTS Device
  public TTResultEx PumpGetTagCommand(int pumpNumber, int nozzleNumber)
  {
    lock (_lockObject)
    {
      TTResultEx resultEx = new TTResultEx();

      resultEx.Result = (TTResult)_ptsDevice.ClearRequestsQueue();

      if (resultEx.Result == TTResult.NO_ERROR)
      {
        resultEx.Result = (TTResult)_ptsDevice.PumpGetTag(pumpNumber, nozzleNumber);
      }

      if (resultEx.Result == TTResult.NO_ERROR)
      {
        resultEx = ExecuteRequestsQueue();
      }

      return resultEx;
    }
  }




  public TTResultEx ExecuteRequestsQueue()
  {
    lock (_lockObject)
    {
      TTResultEx resultEx = new TTResultEx();

      resultEx.Result = (TTResult)_ptsDevice.ExecuteRequestsQueue();

      if (resultEx.Result != TTResult.NO_ERROR)
      {
      //  resultEx.Result = _ptsDevice.GetLastError();
      }

      string message = "Error " + (int)resultEx.Result + " " + EnumerationHelper.GetEnumDescription(resultEx.Result);

      if (resultEx.Result == TTResult.AT_LAST_ONE_REQUEST_IN_SEQUENCE_FAILED_ERROR)

      {
        resultEx.RequestWithErrors = new List<Common.IRequest>();
        List<Common.IRequest> requestQueue;

        _ptsDevice.GetRequestsQueue(out requestQueue);

        for (int i = 0; i < requestQueue.Count; i++)
        {
          if (requestQueue[i].IsError())
          {
            resultEx.RequestWithErrors.Add(requestQueue[i]);
          }
        }

      }
      return resultEx;

    }
  }

  public void PumpGetTagCallback(bool result, IRequest request)
  {
  }

  public void PumpAuthorizeCallback(PumpAuthorizeConfirmation result, IRequest request)
  {
  }

  
}


