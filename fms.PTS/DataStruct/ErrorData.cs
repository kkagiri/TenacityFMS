using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.PTS.DataStruct
{
    /// <summary>
    /// Error data class
    /// </summary>
    public class ErrorData
    {
        private int _pump;
        private string _user;
        private string _request;

        /// <summary>
        /// Pump getter and setter
        /// </summary>
        public int Pump
        {
            get { return _pump; }
            set { _pump = value; }
        }
        /// <summary>
        /// User getter and setter
        /// </summary>
        public string User
        {
            get { return _user; }
            set { _user = value; }
        }
        /// <summary>
        /// Request getter and setter
        /// </summary>
        public string Request
        {
            get { return _request; }
            set { _request = value; }
        }
    }
}
