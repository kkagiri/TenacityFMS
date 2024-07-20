using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Application.Common
{
    public record FMSResponseMessage(bool Success, string Message);
    public record FMSResponseMessage<T>(bool Success, string Message, T Data ): FMSResponseMessage(Success, Message);

}
