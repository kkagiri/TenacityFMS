import React, { useState, useEffect, useMemo ,useCallback} from 'react';
import { Chart, Series, ArgumentAxis,CommonSeriesSettings, ValueAxis,SeriesTemplate,Size,Grid, Legend, Tooltip ,Column} from 'devextreme-react/chart';
import { CardAnalytics } from '../library/cardMenu/cardAnalystics/cardAnalytics';
import { useSelector } from 'react-redux';
import { DatePeriods } from '../Shared/datePeriods';
import LoadIndicator from 'devextreme-react/load-indicator';
import { VolumeChangeReasonEnum } from '../../utils/enums';
import DropDownBox from 'devextreme-react/drop-down-box';

import DataGrid, { Selection} from 'devextreme-react/data-grid';

const TankVolumeHistoryCard = ({ selectedPeriod, onRangeChanged ,selectedSite }) => {
    const [selectedTanks, setSelectedTanks] = useState([]);
  const tankVolumeHistory = useSelector((state) => state.tankVolumeHistory.tankVolumeHistory);
  const tanks = useSelector((state) => state.tank.tanks);

  const datePeriods = useMemo(() => DatePeriods(), []);
  const currentPeriod = datePeriods[selectedPeriod];
  const safeSelectedTanks = Array.isArray(selectedTanks) ? selectedTanks : [];
  const [isGridBoxOpened, setIsGridBoxOpened] = useState(false);

  const filteredData = useMemo(() => {
    if (!Array.isArray(tankVolumeHistory)) {
        console.error('tankVolumeHistory is not an array');
        return [];
    }
    return tankVolumeHistory.filter(record => 
        (selectedSite === 'all' || record.site === selectedSite) &&
        (selectedTanks.includes('all') || selectedTanks.includes(record.tankId.toString()))
            );
}, [tankVolumeHistory, selectedSite, selectedTanks]);


// Filter tanks based on selected site
const siteTanks = useMemo(() => {
    return tanks.filter(tank => tank.siteId === selectedSite);
  }, [tanks, selectedSite]);

  // Calculate total capacity for selected tanks
  const totalCapacity = useMemo(() => {
    return selectedTanks.reduce((sum, tankId) => {
      const tank = siteTanks.find(t => t.id === tankId);

      return sum + (tank ? tank.tankVolume : 0);
    }, 0);
  }, [selectedTanks, siteTanks]);

 // Filter and process data for selected tanks and date range
 const chartData = useMemo(() => {
    if (!Array.isArray(filteredData) || !Array.isArray(tanks)) {
        console.error('filteredData or tanks is not an array');
        return [];
    }
    return filteredData.map(record => ({
        tankId: record.tankId,
        tankName: tanks.find(tank => tank.id === record.tankId)?.name || `Tank ${record.tankId}`,
        datetime: new Date(record.timestamp),
        volume: record.newVolume,
        changeReason: record.changeReason,
        volumeChange: record.volumeChange
    })).sort((a, b) => a.datetime - b.datetime);
}, [filteredData, tanks]);

  // Determine time format and interval based on selected period
  const getTimeSettings = () => {
    switch (selectedPeriod) {
      case 'Today':
      case 'yesterday':
        return { format: 'HH:mm', interval: { hours: 1 } };
      case 'This Week':
      case 'Last Week':
        return { format: 'EEE', interval: { days: 1 } };
      case 'This Month':
      case 'Last Month':
        return { format: 'MMM d', interval: { days: 1 } };
      case 'This Year':
        return { format: 'MMM', interval: { months: 1 } };
      default:
        return { format: 'yyyy-MM-dd', interval: { days: 1 } };
    }
  };

  const timeSettings = getTimeSettings();

  const customizeTooltip = (pointInfo) => {
    const { originalArgument, originalValue, series } = pointInfo;
    const record = chartData.find(r => 
        r.datetime.getTime() === originalArgument.getTime() && 
        r.tankName === series.name
    );
    if (!record) return { text: '' };

    let tooltipText = `<b>${record.tankName}</b><br/>`;
    tooltipText += `Time: ${originalArgument.toLocaleString()}<br/>`;
    tooltipText += `Volume: ${originalValue.toFixed(2)} L<br/>`;
    tooltipText += `Change: ${record.volumeChange.toFixed(2)} L<br/>`;

    switch (record.changeReason) {
        case VolumeChangeReasonEnum.OpeningStock: tooltipText += 'Opening Stock'; break;
        case VolumeChangeReasonEnum.ClosingStock: tooltipText += 'Closing Stock'; break;
        case VolumeChangeReasonEnum.Delivery: tooltipText += 'Delivery'; break;
        case VolumeChangeReasonEnum.TransferIn: tooltipText += 'Transfer In'; break;
        case VolumeChangeReasonEnum.TransferOut: tooltipText += 'Transfer Out'; break;
        case VolumeChangeReasonEnum.Adjustment: tooltipText += 'Adjustment'; break;
        case VolumeChangeReasonEnum.Dispensing: tooltipText += 'Dispensing'; break;
    }

    // TODO: Add vehicle information for dispensing events if available

    return { text: tooltipText };
  };
    // // Added tankOptions for the SelectBox
 const tankOptions = useMemo(() => {
        if (!Array.isArray(tanks)) {
            console.error('tanks is not an array');
            return [];
        }
        return [
            { id: 'all', name: 'All Tanks', site: 'All Sites' },
            ...tanks
                .filter(tank => selectedSite === 'all' || tank.site === selectedSite)
                .map(tank => ({ id: tank.id, name: tank.name, site: tank.site }))
        ];
    }, [tanks, selectedSite]);

    const handleTankSelection = useCallback((e) => {

        const newSelectedTanks = e.selectedRowKeys;
        if (newSelectedTanks.includes('all')) {
            setSelectedTanks(['all']);
        } else {
            setSelectedTanks(e.selectedRowKeys.length && e.selectedRowKeys);
        }
        setIsGridBoxOpened(false);
    }, []);

    const gridBox_displayExpr = (item) => {
        return item ? `${item.name} (${item.site})` : '';
    };
const onGridBoxSelectionChanged = useCallback((e) => {
    const selectedRowKeys = e.selectedRowKeys;
    if (selectedRowKeys.includes('all')) {
        e.component.selectRows(['all'], false);
    } else if (selectedTanks.includes('all') && selectedRowKeys.length > 0) {
        e.component.deselectRows(['all']);
    }
}, [selectedTanks]);


const dataGridRender = useCallback(() => {
    <DataGrid
    dataSource={tankOptions}
    columns={['name', 'site']}
    hoverStateEnabled={true}
    selectedRowKeys={selectedTanks}
    onSelectionChanged={handleTankSelection}
    height="100%"
>
    <Selection mode="multiple" />
    <Column dataField="name" caption="Tank Name" />
    <Column dataField="site" caption="Site" />
</DataGrid>
});

    return (
        <CardAnalytics
        title='Tank Volume History'
        contentClass='tank-volume-history-card'
        menuVisible={true}
        additionalHeaderContent={
            <DropDownBox
                dataSource={tankOptions}
                valueExpr="id"
                displayExpr={gridBox_displayExpr}
                placeholder="Select a tank"
                showClearButton={true}
                onValueChanged={handleTankSelection}
                value={selectedTanks}
                opened={isGridBoxOpened}
                onSelectionChanged={onGridBoxSelectionChanged} 
                onOptionChanged={(e) => {
                    if (e.name === 'opened') setIsGridBoxOpened(e.value);
                }}
                contentRender={ dataGridRender }
            />
        }
    >
        {/* {chartData.length > 0 ? ( */}
            <Chart
                dataSource={chartData}
                id='TankVolumeHistoryChart'
                animation={{ enabled: false }}
            >
                <ArgumentAxis
                    argumentType='datetime'
                    visualRange={[new Date(chartData[0].datetime), new Date(chartData[chartData.length - 1].datetime)]}
                    valueMarginsEnabled={false}
                    tickInterval={timeSettings.interval}
                    label={{ format: timeSettings.format }}
                />
                <ValueAxis
                    title={{ text: 'Volume (L)' }}
                />
                {Array.from(new Set(chartData.map(item => item.tankName))).map((tankName) => (
                    <Series
                        key={tankName}
                        name={tankName}
                        argumentField='datetime'
                        valueField='volume'
                        type='line'
                    />
                ))}
                <Legend visible={true} verticalAlignment='bottom' horizontalAlignment='center' />
                {/* <Tooltip
                    enabled={true}
                    customizeTooltip={customizeTooltip}
                /> */}
        <LoadIndicator enabled={true} />
            </Chart>
        {/* ) : (
            <div>No data available for the selected tanks and time period.</div>
        )} */}

    </CardAnalytics>
  );
};
export default TankVolumeHistoryCard;

