using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.PTS.WindowsService.Core.ErrorHandling.ErrorModel
{
    public abstract class BaseError
    {
        public int ErrorCode { get; set; }
        public string Message { get; set; } = string.Empty;

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    public class ErrorResponse : BaseError
    {

        public int ErrorCodeID { get; set; }
        public string Path { get; set; } = string.Empty;
        public object Details { get; set; } = new object();
    }

    public class DeviceError : BaseError
    {
        public string DeviceId { get; set; } = string.Empty;
    }
}
