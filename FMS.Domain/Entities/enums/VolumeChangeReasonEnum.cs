using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities.enums {
    public enum VolumeChangeReasonEnum {
        OpeningStock,
        ClosingStock,
        Delivery,
        TransferIn,
        TransferOut,
        Adjustment,
        Dispensing,
        AutomatedDispensing, // For automated PTS pump transactions
        Reconciliation,
        AutomatedReconciliation, // For automated policy-driven reconciliation
        InTankDelivery // For PTS auto-detected in-tank deliveries
    }
}