using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.PTS.DataStruct
{
    public class PumpAuthorizeConfirmation
    {
        private int _pump;
        private int _transaction;
        /// <summary>
        /// Pump number getter and setter
        /// </summary>
        public int Pump
        {
            get { return _pump; }
            set { _pump = value; }
        }
        /// <summary>
        /// Transaction number getter and setter
        /// </summary>
        public int Transaction
        {
            get { return _transaction; }
            set { _transaction = value; }
        }
    }
}
