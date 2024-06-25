
//using FMS.PTS;

//namespace FMS.ATGClient.Listener
//{
//    public class PTSListener : BackgroundService
//    {
//        private readonly ILogger<PTSListener> _logger;
//        private readonly PTSCommunicationService _ptsService;

//        public PTSListener(ILogger<PTSListener> logger, PTSCommunicationService ptsService)
//        {
//            _logger = logger;
//            _ptsService = ptsService;
//        }

//        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
//        {
//           try 
//           {
//          //  var _openResult = await OpenPTSDeviceAsync(stoppingToken);

//         //   if(!_openResult.Success)
//          //  {
//          //      //handle error 
//          //      _logger.LogError("Failed to open PTS Device");
//        //    }
//               // SetupEventHandlers();
//          //  
//            //listening for PTS event or Commands 
//            while(!stoppingToken.IsCancellationRequested)
//            {
//                await Task.Delay(1000, stoppingToken);
//                //check for any new events or commands
//            }


//           }catch (Exception ex)
//           {
//                _logger.LogError(ex.Message);
//           }
//           finally
//           {
//          //  await ClosePTSDeviceAsync();

//           }
           
           
//        }



//        private void SetupEventHandlers()
//        {
//            _ptsService.PumpGetTagResponsedReceived += HandlePumpGetTagResponse;

//        }

//        private void HandlePumpGetTagResponse(object sender, PumpGetTagResponseEventArgs e)
//        {
//            if(e.Success)
//            {
//                var tagData = e.TagData;
//            }
//            else
//            {
//                _logger.LogError(e.ErrorMessage);
//            }
            
//        }

//    }
//}