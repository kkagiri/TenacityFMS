namespace FMS.PTS.DataStruct;

 public class Pump
    {
        private int _id;
        private int _port;
        private int _address;
        /// <summary>
        /// Id getter and setter
        /// </summary>
        public int Id
        {
            get { return _id; }
            set { _id = value; }
        }
        /// <summary>
        /// Port getter and setter
        /// </summary>
        public int Port
        {
            get { return _port; }
            set { _port = value; }
        }
        /// <summary>
        /// Address getter and setter
        /// </summary>
        public int Address
        {
            get { return _address; }
            set { _address = value; }
        }
    }