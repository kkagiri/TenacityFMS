//using AutoMapper;
//using FMS.Application.Common;
//using FMS.Application.Common.PTSResponse;
//using FMS.Application.ModelsDTOs.ATG;
//using FMS.Application.ModelsDTOs.ATG.Common;
//using FMS.Domain.Entities;
//using FMS.Persistence.DataAccess;
//using MediatR;
//using System;
//using System.Collections.Generic;
//using System.Linq;
//using System.Text;
//using System.Threading;
//using System.Threading.Tasks;

//namespace FMS.Application.Command.DatabaseCommand.ATGCommands.PumpTransactoinCommand
//{
//    public record CreateUploadPumpTransactionCommand (PumpTransactionDto PumpTransactionDto) : IRequest<FMSResponseMessage>;

//    public class CreateUploadPumpTransactionCommandHandler : IRequestHandler<CreateUploadPumpTransactionCommand, FMSResponseMessage>
//    {
//        private readonly GpsdataContext _context;

//        public CreateUploadPumpTransactionCommandHandler(GpsdataContext context)
//        {
//            _context = context;

//        }

//        public  async Task<FMSResponseMessage> Handle(CreateUploadPumpTransactionCommand request, CancellationToken cancellationToken)
//        {


//            try
//            {
//                     var pumptransactiondata = new Pumptransaction
//                        {
//                            PacketId = request.PumpTransactionDto.PacketId,

//                            PtsId = request.PumpTransactionDto.PtsId,
//                            DateTime =request.PumpTransactionDto.DateTime,
//                            DateTimeStart = request.PumpTransactionDto.DateTimeStart,
//                            FuelGradeId = request.PumpTransactionDto.FuelGradeId,
//                            FuelGradeName = request.PumpTransactionDto.FuelGradeName,
//                            Nozzle = request.PumpTransactionDto.Nozzle,
//                            Price = request.PumpTransactionDto.Price,
//                            Pump = request.PumpTransactionDto.Pump,
//                            Tag = request.PumpTransactionDto.Tag,
//                            Tcvolume = request.PumpTransactionDto.TCVolume,
//                            TotalAmount = request.PumpTransactionDto.TotalAmount,
//                            TotalVolume = request.PumpTransactionDto.TotalVolume,
//                            Transaction = request.PumpTransactionDto.Transaction,
//                            UserId = request.PumpTransactionDto.UserId,
//                            Volume = request.PumpTransactionDto.Volume,
//                            ConfigurationId = request.PumpTransactionDto.ConfigurationId
//                        };

//                        _context.Pumptransactions.Add(pumptransactiondata);
//                  await _context.SaveChangesAsync(cancellationToken);

//                return new FMSResponseMessage(true, "OK");

//            }

//            catch (Exception ex)
//            {
//                throw; 

//            }
//        }

//    }

//}
