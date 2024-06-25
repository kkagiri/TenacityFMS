using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class CashwinReceipt
{
    /// <summary>
    /// record id
    /// </summary>
    public long Id { get; set; }

    /// <summary>
    /// actual amount
    /// </summary>
    public double Amount { get; set; }

    /// <summary>
    /// receipt number
    /// </summary>
    public long BillNum { get; set; }

    /// <summary>
    /// card info
    /// </summary>
    public string? CardData { get; set; }

    /// <summary>
    /// cash flag
    /// </summary>
    public int CashFlag { get; set; }

    /// <summary>
    /// discount in %
    /// </summary>
    public double Discount { get; set; }

    /// <summary>
    /// text info
    /// </summary>
    public string? DocNo { get; set; }

    /// <summary>
    /// data flag
    /// </summary>
    public int Flags { get; set; }

    /// <summary>
    /// product name
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// payed
    /// </summary>
    public double Payment { get; set; }

    /// <summary>
    /// preordered amount
    /// </summary>
    public double PreAmount { get; set; }

    /// <summary>
    /// product price
    /// </summary>
    public double Price { get; set; }

    /// <summary>
    /// product group
    /// </summary>
    public int ProductGroup { get; set; }

    /// <summary>
    /// product id
    /// </summary>
    public long ProductId { get; set; }

    /// <summary>
    /// product section
    /// </summary>
    public int Section { get; set; }

    /// <summary>
    /// sale tag
    /// </summary>
    public long Tag { get; set; }

    /// <summary>
    /// tank number
    /// </summary>
    public int Tank { get; set; }

    /// <summary>
    /// tax group
    /// </summary>
    public int TaxGroup { get; set; }

    /// <summary>
    /// pump number
    /// </summary>
    public int Trk { get; set; }

    /// <summary>
    /// cash
    /// </summary>
    public double Cash { get; set; }

    /// <summary>
    /// Cashier Name
    /// </summary>
    public string? Cashier { get; set; }

    /// <summary>
    /// change
    /// </summary>
    public double Change { get; set; }

    /// <summary>
    /// date
    /// </summary>
    public string? Date { get; set; }

    /// <summary>
    /// entry
    /// </summary>
    public double Entry { get; set; }

    /// <summary>
    /// linked record id
    /// </summary>
    public int InfoId { get; set; }

    /// <summary>
    /// actual sum
    /// </summary>
    public double MPCost { get; set; }

    /// <summary>
    /// pump counter
    /// </summary>
    public double MPCounters { get; set; }

    /// <summary>
    /// data multiplier
    /// </summary>
    public int MPMultiplier { get; set; }

    /// <summary>
    /// nozzle number
    /// </summary>
    public int MPNozzleNo { get; set; }

    /// <summary>
    /// preordered sum
    /// </summary>
    public double MPPresetCost { get; set; }

    /// <summary>
    /// service info
    /// </summary>
    public string? MPService { get; set; }

    /// <summary>
    /// trk status
    /// </summary>
    public int MPTrkstatus { get; set; }

    /// <summary>
    /// nds_perc
    /// </summary>
    public double NdsPerc { get; set; }

    /// <summary>
    /// type of printed receipt
    /// </summary>
    public int RecType { get; set; }

    /// <summary>
    /// time
    /// </summary>
    public string? Time { get; set; }

    /// <summary>
    /// total
    /// </summary>
    public double Total { get; set; }

    /// <summary>
    /// money totalizers on begin
    /// </summary>
    public double TotalMBegin { get; set; }

    /// <summary>
    /// money totalizers on end
    /// </summary>
    public double TotalMEnd { get; set; }

    /// <summary>
    /// volume totalizers on begin
    /// </summary>
    public double TotalVBegin { get; set; }

    /// <summary>
    /// volume totalizers on end
    /// </summary>
    public double TotalVEnd { get; set; }
}
