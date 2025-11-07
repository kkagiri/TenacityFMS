//TODO: For the time being: this handler works wrong with our system architecture. this is used by the PTS to request the tags information from the FMS.

// using System;
// using System.Threading.Tasks;
// using FMS.Application.Handlers.Interface;
// using FMS.Domain.PTSCommon;
// using MediatR;
// using Microsoft.Extensions.Logging;

// namespace FMS.Application.Handlers {
//     [PacketType ("RequestTagsInformation")]
//     public class RequestTagsInformationHandler : IPacketHandler {
//         public string PacketType => "RequestTagsInformation";
//         private readonly ILogger<RequestTagsInformationHandler> _logger;

//         private readonly IMediator _mediator;

//         public RequestTagsInformationHandler(ILogger<RequestTagsInformationHandler> logger, IMediator mediator)
//         {
//             _logger = logger ?? throw new ArgumentNullException(nameof(logger));
//             _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
//         }

//         Task<Packet> IPacketHandler.HandlePacketAsync (string deviceId, Packet packet) {
//            try
//            {
//             var originalPacketId = packet.Id;
//             var responsePacket = new Packet
//             {
//                 Id = originalPacketId,
//                 Type = packet.Type
//             };

//             var requestTagsInformation = packet.Data?.ToObject<RequestTagsInformation>();
//             if (requestTagsInformation == null)
//             {
//                 responsePacket.Error = true;
//                 responsePacket.Code = 400;
//                 responsePacket.Message = "Invalid or missing request tags information data";
//             }

//         }
//     }
// }