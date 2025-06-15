using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities.PTS.PTSStatus.PumpStatus {
    /// <summary>
    /// Base class for transaction-related pump statuses (Filling and EndOfTransaction),
    /// reducing duplication of common fields.
    /// </summary>
    public class IdleStatus : BaseStatus {
        public List<int> ? NozzlesUp { get; set; }
        public List<int> ? LastNozzles { get; set; }
        public List<int> ? LastTransactions { get; set; }
        public List<decimal> ? LastVolumes { get; set; }
        public List<decimal> ? LastAmounts { get; set; }
        public List<decimal> ? LastPrices { get; set; }
        public List<string> ? Requests { get; set; }
        public List<string> ? Tags { get; set; }

    }

    /// <summary>
    /// Status representing pumps currently filling.
    /// Inherits from PumpTransactionBaseStatus to reduce duplication.
    /// </summary>
    public class FillingStatus : BaseStatus {
        /// <summary>
        /// Array of integers indicating active nozzle numbers.
        /// Each element must be in range 1-6.
        /// Array index corresponds to Ids array index.
        /// </summary>
        public List<int> ? Nozzles { get; set; }

        /// <summary>
        /// Array of integers indicating fuel grade identifiers.
        /// Each element must be in range 1-20.
        /// Array index corresponds to Ids array index.
        /// </summary>
        public List<int> ? FuelGradeIds { get; set; }

        /// <summary>
        /// Array of strings representing fuel grade names.
        /// Each element must be up to 20 ASCII characters.
        /// Array index corresponds to Ids array index.
        /// </summary>
        public List<string> ? FuelGradeNames { get; set; }

        /// <summary>
        /// Array of integers representing transaction numbers.
        /// Each element must be in range 1-65535.
        /// Array index corresponds to Ids array index.
        /// </summary>
        public List<int> ? Transactions { get; set; }

        /// <summary>
        /// Array of floats representing dispensed volumes.
        /// Up to 3 digits after decimal point.
        /// Array index corresponds to Ids array index.
        /// </summary>
        public List<decimal> ? Volumes { get; set; }

        /// <summary>
        /// Array of floats representing dispensed amounts.
        /// Up to 3 digits after decimal point.
        /// Array index corresponds to Ids array index.
        /// </summary>
        public List<decimal> ? Amounts { get; set; }

        /// <summary>
        /// Array of floats representing product prices.
        /// Up to 3 digits after decimal point.
        /// Array index corresponds to Ids array index.
        /// </summary>
        public List<decimal> ? Prices { get; set; }

        /// <summary>
        /// Array of strings representing tag identifiers used for authorization.
        /// Each element must be up to 48 hexadecimal symbols.
        /// Array index corresponds to Ids array index.
        /// </summary>
        public List<string> ? Tags { get; set; }
    }

    /// <summary>
    /// Status representing pumps that have just completed a transaction.
    /// Contains the same transaction data as FillingStatus but for completed transactions.
    /// </summary>
    public class EndOfTransactionStatus : BaseStatus {
        /// <summary>
        /// Array of integers indicating nozzle numbers used in transactions.
        /// Each element must be in range 1-6.
        /// Array index corresponds to Ids array index.
        /// </summary>
        public List<int> ? Nozzles { get; set; }

        /// <summary>
        /// Array of integers indicating fuel grade identifiers.
        /// Each element must be in range 1-20.
        /// Array index corresponds to Ids array index.
        /// </summary>
        public List<int> ? FuelGradeIds { get; set; }

        /// <summary>
        /// Array of strings representing fuel grade names.
        /// Each element must be up to 20 ASCII characters.
        /// Array index corresponds to Ids array index.
        /// </summary>
        public List<string> ? FuelGradeNames { get; set; }

        /// <summary>
        /// Array of integers representing transaction numbers.
        /// Each element must be in range 1-65535.
        /// Array index corresponds to Ids array index.
        /// </summary>
        public List<int> ? Transactions { get; set; }

        /// <summary>
        /// Array of floats representing dispensed volumes.
        /// Up to 3 digits after decimal point.
        /// Array index corresponds to Ids array index.
        /// </summary>
        public List<decimal> ? Volumes { get; set; }

        /// <summary>
        /// Array of floats representing dispensed amounts.
        /// Up to 3 digits after decimal point.
        /// Array index corresponds to Ids array index.
        /// </summary>
        public List<decimal> ? Amounts { get; set; }

        /// <summary>
        /// Array of floats representing product prices.
        /// Up to 3 digits after decimal point.
        /// Array index corresponds to Ids array index.
        /// </summary>
        public List<decimal> ? Prices { get; set; }

        /// <summary>
        /// Array of strings representing tag identifiers used for authorization.
        /// Each element must be up to 48 hexadecimal symbols.
        /// Array index corresponds to Ids array index.
        /// </summary>
        public List<string> ? Tags { get; set; }

        /// <summary>
        /// Array of integers representing payment form identifiers.
        /// Each element must be in range 1-10.
        /// Array index corresponds to Ids array index.
        /// </summary>
        public List<int?> ? PaymentFormIds { get; set; }
    }
}