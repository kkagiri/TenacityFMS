using FMS.PTS.DataStruct;
namespace FMS.PTS.DataStruct;

public class PumpFillingStatus : PumpStatusBase
    {
        private int _nozzle;
        private double _volume;
        private double _tCVolume;
        private double _price;
        private double _amount;
        private int _transaction;
        /// <summary>
        /// Status getter
        /// </summary>
        public override PumpStatus Status
        {
            get
            {
                base.Status = PumpStatus.PUMP_FILLING_STATUS;
                return base.Status;
            }
        }
        /// <summary>
        /// Nozzle getter and setter
        /// </summary>
        public int Nozzle
        {
            get { return _nozzle; }
            set { _nozzle = value; }
        }
        /// <summary>
        /// Volume getter and setter
        /// </summary>
        public double Volume
        {
            get { return _volume; }
            set { _volume = value; }
        }
        /// <summary>
        /// TCVolume getter and setter
        /// </summary>
        public double TCVolume
        {
            get { return _tCVolume; }
            set { _tCVolume = value; }
        }
        /// <summary>
        /// Price getter and setter
        /// </summary>
        public double Price
        {
            get { return _price; }
            set { _price = value; }
        }
        /// <summary>
        /// Amount getter and setter
        /// </summary>
        public double Amount
        {
            get { return _amount; }
            set { _amount = value; }
        }
        /// <summary>
        /// Transaction getter and setter
        /// </summary>
        public int Transaction
        {
            get { return _transaction; }
            set { _transaction = value; }
        }
    }