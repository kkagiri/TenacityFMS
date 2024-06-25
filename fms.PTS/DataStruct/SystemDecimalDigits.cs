namespace FMS.PTS.DataStruct;
public class SystemDecimalDigits
    {
        private short _price;
        private short _amount;
        private short _volume;
        private short _amountTotal;
        private short _volumeTotal;
        /// <summary>
        /// Price getter and setter
        /// </summary>
        public short Price
        {
            get { return _price; }
            set { _price = value; }
        }
        /// <summary>
        /// Amount getter and setter
        /// </summary>
        public short Amount
        {
            get { return _amount; }
            set { _amount = value; }
        }
        /// <summary>
        /// Volume getter and setter
        /// </summary>
        public short Volume
        {
            get { return _volume; }
            set { _volume = value; }
        }
        /// <summary>
        /// AmountTotal getter and setter
        /// </summary>
        public short AmountTotal
        {
            get { return _amountTotal; }
            set { _amountTotal = value; }
        }
        /// <summary>
        /// VolumeTotal getter and setter
        /// </summary>
        public short VolumeTotal
        {
            get { return _volumeTotal; }
            set { _volumeTotal = value; }
        }
    }