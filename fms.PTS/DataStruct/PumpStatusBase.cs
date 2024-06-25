using FMS.PTS.Util;

namespace FMS.PTS.DataStruct
{
     public class PumpStatusBase
    {
 
        public int? Pump { get; set; }
        /// <summary>
        /// User getter and setter
        /// </summary>
        public string? User { get; set; }
        /// <summary>
        /// Virtual Status getter and setter
        /// </summary>
        public virtual PumpStatus Status { get; set; }
        /// <summary>
        /// StatusDescription getter
        /// </summary>
        public string StatusDescription
        {
            get { return EnumerationHelper.GetEnumDescription(Status); }
        }
    }
}