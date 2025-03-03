
using System;
using System.Threading.Tasks;
using FMS.Domain.PTSCommon;

namespace FMS.Application.Handlers.Interface
{
    public interface IPTSMessageProcessor
    {
        Task HandleMessageAsync(string deviceId, PTSMessage message);
        Task HandleErrorAsync(string deviceId, Exception exception);

        Task<PTSMessage> ProcessMessageAsync(string deviceId, PTSMessage message);  // New method


    }
}
