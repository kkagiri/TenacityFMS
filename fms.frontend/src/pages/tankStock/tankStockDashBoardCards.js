import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { TickerCard } from '../../components/TickerCard/tickerCard';
import { StockCapacityTicker } from '../../components/TickerCard/tankStockTickers/StockCapacityTicker';
import StockReconciliationDashboard  from '../../components/tankStock/StockReconciliationDashboard';
import StockReportDashboard  from '../../components/tankStock/StockReportDashboard';


const VolumeChangeReasonEnum = {
    OpeningStock: 0,
    ClosingStock: 1,
    Delivery: 2,
    TransferIn: 3,
    TransferOut: 4,
    Adjustment: 5,
    Dispensing: 6
  };


  const TankStockDashBoardCards = ({ selectedSite, selectedPeriod, currentStock, totalCapacity }) =>  {
    const tankVolumeHistory = useSelector((state) => state.tankVolumeHistory.tankVolumeHistory);

    const aggregatedData = useMemo(() => {
      return tankVolumeHistory.reduce((acc, record) => {
        if (!record || typeof record.siteId === 'undefined') return acc;
        if (selectedSite === 'all' || record.siteId === selectedSite) {
          switch (record.changeReason) {
            case VolumeChangeReasonEnum.OpeningStock:
              acc.openingStock += record.newVolume;
              break;
            case VolumeChangeReasonEnum.ClosingStock:
              acc.closingStock += record.newVolume;
              break;
            case VolumeChangeReasonEnum.Delivery:
              acc.totalDelivery += record.volumeChange;
              break;
            case VolumeChangeReasonEnum.Dispensing:
              acc.totalDispense += Math.abs(record.volumeChange);
              break;
            case VolumeChangeReasonEnum.TransferIn:
              acc.totalTransferIn += record.volumeChange;
              break;
            case VolumeChangeReasonEnum.TransferOut:
              acc.totalTransferOut += Math.abs(record.volumeChange);
              break;
          }
        }
        return acc;
      }, {
        openingStock: 0,
        closingStock: 0,
        totalDelivery: 0,
        totalDispense: 0,
        totalTransferIn: 0,
        totalTransferOut: 0
      });
    }, [tankVolumeHistory, selectedSite]);




      return (
        <>
          <div className="cards compact">

          <StockCapacityTicker currentStock={currentStock} tankCapacity={totalCapacity} />

            <TickerCard title="Total Delivery" icon ={"fa-light fa-arrow-down-to-square"}  tone ={"delivery"} value={aggregatedData.totalDelivery} />
            <TickerCard title="Opening Stock" icon ={"fa-light fa-tank-water"} tone={"info"} value={aggregatedData.openingStock} />
            <TickerCard title="Closing Stock"  icon ={"fa-light fa-tank-water"} tone={"info"} value={aggregatedData.closingStock} />
            <TickerCard title="Total Fuel Dispense"  icon ={"fa-light fa-gas-pump"} tone={"negative"} value={aggregatedData.totalDispense} />
            <TickerCard title="Total Transfer In" icon ={"fa-light fa-arrow-turn-down"} tone={"success"} value={aggregatedData.totalTransferIn} />
            <TickerCard title="Total Transfer Out" icon ={"fa-light fa-arrow-turn-up"} tone={"success"} value={aggregatedData.totalTransferOut} />


          </div>
          <div className="cards wide">
          {/* //TODO placeholder - Stock Reconciliation Dashboard and Stock Reporting System to be added here */}
              <StockReconciliationDashboard selectedSite={selectedSite} />
              <StockReportDashboard selectedSite={selectedSite} />

          {/* <TankVolumeHistoryCard
                    selectedPeriod={selectedPeriod}
                    onRangeChanged={onRangeChanged}<FontAwesomeIcon icon="fa-sharp fa-light fa-arrow-up-right-from-square" />
                    selectedSite={selectedSite}
                /> */}
          </div>
        </>
      );
    };

    export default TankStockDashBoardCards ;