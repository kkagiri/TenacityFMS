//using Microsoft.AspNetCore.SignalR;
//using System.CodeDom;
//namespace FMS.ATGClient.PTS.FuelDispensing.Hub
//{
//    public class  PtsStatusHub:Hub
//    {

//        private readonly PtsStatusService _statusService;

//        public PtsStatusHub(PtsStatusService statusService)
//        {
//            _statusService = statusService;
//        }
//        public async Task SendStatusUpdate()
//        {

//            var status = _statusService.GetCurrentStatus();
//            await Client.All.SendAsync("ReceiveStatus", status);
//        }



//    }
//}
