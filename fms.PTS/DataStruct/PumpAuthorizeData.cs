using FMS.PTS.DataStruct.enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.PTS.DataStruct
{
    public class PumpAuthorizeData
    {
        private int _pump;
        public NozzleOrFuelIdSelector _nozzleOrFuelIdSelector;
        private int _nozzle;
        private List<int> _nozzles;
        private int _fuelGradeId;
        private List<int> _fuelGradeIds;
        private PumpAuthorizeType _type;
        private double _dose;
        private bool _autoCloseTransaction;
        private string _tag;

        private bool _transactionEnabled;
        public bool TransactionEnabled
        {
            get { return _transactionEnabled; }
            set { _transactionEnabled = value; }
        }
        public int Transaction { get;set; }
        
        public string Tag { get; set; }

        /// <summary>
        /// Pump number getter and setter
        /// </summary>
        public int Pump
        {
            get { return _pump; }
            set { _pump = value; }
        }
        /// <summary>
        /// NozzleOrFielIdSelector getter and setter
        /// </summary>
        public NozzleOrFuelIdSelector NozzleOrFuelIdSelector
        {
            get { return _nozzleOrFuelIdSelector; }
            set { _nozzleOrFuelIdSelector = value; }
        }
        /// <summary>
        /// Nozzle number getter and setter
        /// </summary>
        public int Nozzle
        {
            get { return _nozzle; }
            set { _nozzle = value; }
        }
        /// <summary>
        /// Nozzles getter and setter
        /// </summary>
        public List<int> Nozzles
        {
            get { return _nozzles; }
            set { _nozzles = value; }
        }
        /// <summary>
        /// FuelGradeId getter and setter
        /// </summary>
        public int FuelGradeId
        {
            get { return _fuelGradeId; }
            set { _fuelGradeId = value; }
        }
        /// <summary>
        /// FuelGradeIds getter and setter
        /// </summary>
        public List<int> FuelGradeIds
        {
            get { return _fuelGradeIds; }
            set { _fuelGradeIds = value; }
        }
        /// <summary>
        /// Type getter and setter
        /// </summary>
        public PumpAuthorizeType Type
        {
            get { return _type; }
            set { _type = value; }
        }
        /// <summary>
        /// Dose getter and setter
        /// </summary>
        public double Dose
        {
            get { return _dose; }
            set { _dose = value; }
        }
 
        
        /// <summary>
        /// AutoCloseTransaction getter and setter
        /// </summary>
        public bool AutoCloseTransaction
        {
            get { return _autoCloseTransaction; }
            set { _autoCloseTransaction = value; }
        }
    }
}
