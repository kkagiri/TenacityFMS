namespace FMS.PTS.DataStruct
{
    public class Port
    {
        private int _id;
        private int _protocol;
        private int _baudRate;
        /// <summary>
        /// Id getter and setter
        /// </summary>
        public int Id
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