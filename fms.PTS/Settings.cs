using FMS.PTS.DataStruct.enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.PTS
{
    public class Settings
    {
        private AuthenticationType _authenticationType = AuthenticationType.DIGEST;
        private ProtocolSecurityType _protocolSecurityType = ProtocolSecurityType.HTTPS;
        private TimeSpan _timeout = TimeSpan.FromSeconds(10);
        private string _host = "10.0.14.115"; //change this to get IP from Config file    or from user input
        private short _httpPort = 80;
        private short _httpsPort = 443;
        private string _login = "admin";
        private string _password = "admin";

        /// <summary>
        /// AuthenticationType getter and setter
        /// </summary>
        /// <returns></returns>
        public AuthenticationType AuthenticationType
        {
            get { return _authenticationType; }
            set { _authenticationType = value; }
        }
        /// <summary>
        /// ProtocolSecurityType getter and setter
        /// </summary>
        public ProtocolSecurityType ProtocolSecurityType
        {
            get { return _protocolSecurityType; }
            set { _protocolSecurityType = value; }
        }
        /// <summary>
        /// Timeout getter and setter
        /// </summary>
        public TimeSpan Timeout
        {
            get { return _timeout; }
            set { _timeout = value; }
        }
        /// <summary>
        /// Host getter and setter
        /// </summary>
        public string Host
        {
            get { return _host; }
            set { _host = value; }
        }
        /// <summary>
        /// HttpPort getter and setter
        /// </summary>
        public short HttpPort
        {
            get { return _httpPort; }
            set { _httpPort = value; }
        }
        /// <summary>
        /// HttpsPort getter and setter
        /// </summary>
        public short HttpsPort
        {
            get { return _httpsPort; }
            set { _httpsPort = value; }
        }
        /// <summary>
        /// Login getter and setter
        /// </summary>
        public string Login
        {
            get { return _login; }
            set { _login = value; }
        }
        /// <summary>
        /// Password getter and setter
        /// </summary>
        public string Password
        {
            get { return _password; }
            set { _password = value; }
        }
    }
}
