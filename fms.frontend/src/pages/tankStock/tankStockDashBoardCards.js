import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { TickerCard } from '../../components/TickerCard/tickerCard';
import { Tick } from 'devextreme-react/chart';

const VolumeChangeReasonEnum = {
    OpeningStock: 0,
    ClosingStock: 1,
    Delivery: 2,
    TransferIn: 3,
    TransferOut: 4,
    Adjustment: 5,
    Dispensing: 6
  };
  

const TankStockDashBoardCards = ({selectedSite,selectedPeriod}) => {
    const tankVolumeHistory = useSelector((state) => state.tankVolumeHistory.tankVolumeHistory);
    const tanks = useSelector((state) => state.tank.tanks);

    const aggregatedData = useMemo(() => {
        return tankVolumeHistory.reduce((acc, record) => {
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
          return acc;
        }, {
          openingStock: 0,
          closingStock: 0,
          totalDelivery: 0,
          totalDispense: 0,
          totalTransferIn: 0,
          totalTransferOut: 0
        });
      }, [tankVolumeHistory]);

const currentStock = useMemo(()=>{
  if(selectedPeriod ==='Today')
    {
      return tanks.reduce ((total,tank) =>{
        if(selectedSite ==='all' || tank.siteId.toString() ===selectedSite)
          {
            return total + tank.currentStock;
          }
          return total;
      },0);
    }
    return null;
},[tanks,selectedSite,selectedPeriod])


      return (
        <>
          <div className="cards compact">
          {selectedPeriod ==='Today' && (
              <TickerCard title ="Current Stock" icon="fa-light fa-tank-water" tone ="success" value ={currentStock} />
            )}
            <TickerCard title="Total Delivery" icon ={"fa-light fa-arrow-down-to-square"} value={aggregatedData.totalDelivery} />
            <TickerCard title="Opening Stock" icon ={"fa-light fa-tank-water"} tone={"info"} value={aggregatedData.openingStock} />
            <TickerCard title="Closing Stock"  icon ={"fa-light fa-tank-water"} value={aggregatedData.closingStock} />
            <TickerCard title="Total Fuel Dispense"  icon ={"fa-light fa-gas-pump"}value={aggregatedData.totalDispense} />
            <TickerCard title="Total Transfer In" icon ={"fa-light fa-arrow-turn-down"} value={aggregatedData.totalTransferIn} />
            <TickerCard title="Total Transfer Out" icon ={"fa-light fa-arrow-turn-up"} value={aggregatedData.totalTransferOut} />

          
          </div>
          <div className="cards wide">
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