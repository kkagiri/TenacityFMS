using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.PTS.Exceptions
{
    public class TTProtocolErrorException : TTException
    {
        /// <summary>
        /// TTProtocolErrorException constructor
        /// </summary>
        public TTProtocolErrorException()
        {
        }
        /// <summary>
        /// TTProtocolErrorException constructor
        /// </summary>
        /// <param name="message">Message string</param>
        public TTProtocolErrorException(string message) : base(message)
        {
        }
        /// <summary>
        /// TTProtocolErrorException constructor
        /// </summary>
        /// <param name="message">Message string</param>
        /// <param name="inner">Inner exception</param>
        public TTProtocolErrorException(string message, Exception inner) : base(message, inner)
        {
        }
    }
}
