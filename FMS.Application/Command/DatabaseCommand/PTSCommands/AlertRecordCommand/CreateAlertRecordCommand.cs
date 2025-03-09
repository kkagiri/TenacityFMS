//using System;
//using System.Threading;
//using System.Threading.Tasks;
//using AutoMapper;
//using FMS.Application.Common;
//using FMS.Application.Common.PTSResponse;
//using FMS.Application.ModelsDTOs.ATG;
//using FMS.Application.ModelsDTOs.ATG.Common;
//using FMS.Domain.Entities;
//using FMS.Persistence.DataAccess;
//using MediatR;

//namespace FMS.Application.Command.DatabaseCommand.ATGCommands.AlertRecordCommand
//{

//    public class CreateAlertRecordCommand : IRequest<CommandResult>
//    {
//        public PtsBaseRequest PtsRequestDto { get; set; }

//    }

//    public class CreateAlertRecordCommandHandler : IRequestHandler<CreateAlertRecordCommand, CommandResult>
//    {

//        private readonly GpsdataContext _context;
//        private readonly IMapper _mapper;


//        public CreateAlertRecordCommandHandler( GpsdataContext context, IMapper mapper)
//        {
//            _context = context;
//            _mapper = mapper;
//        }


//        /// <summary>
//        /// Handles the creation of an alert record.
//        /// </summary>
//        /// <param name="request">The command request.</param>
//        /// <param name="cancellationToken">The cancellation token.</param>
//        /// <returns>A task representing the asynchronous operation. The task result contains a string representing the result of the operation.</returns>
//        public  async Task <CommandResult> Handle(CreateAlertRecordCommand request, CancellationToken cancellationToken)
//        {
//           int requetsid = 0;
//            try
//            {
//                foreach(var packet in request.PtsRequestDto.Packets)
//                {

//                        var alertrecorddata = packet.Data.ToObject<AlertRecordDTO>();
//                        if (alertrecorddata == null) continue;

//                        var alertrecord = _mapper.Map<Alertrecord>(alertrecorddata);
//                        alertrecord.PacketId = packet.Id;
//                        alertrecord.Ptsid = request.PtsRequestDto.PtsId;

//                        _context.Alertrecords.Add(alertrecord);
//                        requetsid = alertrecord.AlertId;

//                }
//                await _context.SaveChangesAsync(cancellationToken);
//                return CommandResult.Succeeded("UploadAlertRecord",null);
//            }
//            catch (Exception ex)
//            {
//                throw;
//            }

//        }
//    }

//}