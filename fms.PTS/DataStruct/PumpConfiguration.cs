namespace FMS.PTS.DataStruct ;
 public class PumpConfiguration
    {
        private List<Port> _ports;
        private List<Pump> _pumps;
        /// <summary>
        /// List of pump ports getter and setter
        /// </summary>
        public List<Port> Ports
        {
            get { return _ports; }
            set { _ports = value; }
        }
        /// <summary>
        /// List of pumps getter and setter
        /// </summary>
        public List<Pump> Pumps
        {
            get { return _pumps; }
            set { _pumps = value; }
        }
    }