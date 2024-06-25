using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.PTS.Exceptions
{
    public class TTException : Exception
    {
        /// <summary>
        /// TTException constructor
        /// </summary>
        public TTException()
        {
        }
        /// <summary>
        /// TTException constructor
        /// </summary>
        /// <param name="message">Message string</param>
        public TTException(string message) : base(message)
        {
        }
        /// <summary>
        /// TTException constructor
        /// </summary>
        /// <param name="message">Message string</param>
        /// <param name="inner">Inner exception</param>
        public TTException(string message, Exception inner) : base(message, inner)
        {
        }
    }
}
