namespace FMS.PTS.DataStruct
{
    /// <summary>
    /// ProbePort class
    /// </summary>
public class ProbePort
    {
        private string _id;
        private int _protocol;
        private int _baudRate;
        /// <summary>
        /// Id getter and setter
        /// </summary>
        public string Id
        {
            get { return _id; }
            set { _id = value; }
        }
        /// <summary>
        /// Protocol getter and setter
        /// </summary>
        public int Protocol
        {
            get { return _protocol; }
            set { _protocol = value; }
        }
        /// <summary>
        /// BaudRate getter and setter
        /// </summary>
        public int BaudRate
        {
            get { return _baudRate; }
            set { _baudRate = value; }
        }
    }
}