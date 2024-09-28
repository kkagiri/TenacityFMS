import React, { useMemo } from 'react';
import { Chart, Series, ArgumentAxis,LoadingIndicator, ValueAxis, Legend, Tooltip } from 'devextreme-react/chart';
import { CardAnalytics } from '../library/cardMenu/cardAnalystics/cardAnalytics';
import { groupBy, sumBy } from 'lodash';

const TankVolumeHistoryCard = ({ tankHistory }) => {
	const customizeTooltip = (pointInfo) => {
		const { argument, value, point } = pointInfo;
		const { referenceType, vehicleName, tankId } = point.data;
		const date = new Date(argument);
		const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
		const formattedTime = date.toLocaleTimeString();
		
		let tooltipHtml = `
			<div style="text-align: left;">
				<span><strong>Date:</strong> ${formattedDate}</span><br/>
				<span><strong>Time:</strong> ${formattedTime}</span><br/>
				<span><strong>Total Volume:</strong> ${value.toFixed(2)} L</span><br/>
				<span><strong>Tank ID:</strong> ${tankId}</span><br/>
				<span><strong>Reference Type:</strong> ${referenceType}</span>
		`;
		
		if (referenceType === "Dispense" && vehicleName) {
			tooltipHtml += `<br/><span><strong>Vehicle:</strong> ${vehicleName}</span>`;
		}
		
		tooltipHtml += '</div>';
		
		return { html: tooltipHtml };
	};

	const chartData = useMemo(() => {
		const sortedHistory = [...tankHistory].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
		
		const latestVolumeByTank = {};
		return sortedHistory.map(entry => {
			latestVolumeByTank[entry.tankId] = entry.newVolume;
			const totalVolume = Object.values(latestVolumeByTank).reduce((sum, volume) => sum + volume, 0);
			return {
				timestamp: new Date(entry.timestamp),
				volume: totalVolume,
				tankId: entry.tankId,
				referenceType: entry.referenceType,
				vehicleName: entry.vehicleName
			};
		});
	}, [tankHistory]);

	return (
		<CardAnalytics
			title='Total Site Volume History'
			contentClass='tank-volume-history-card'
			menuVisible={true}
		>
			<Chart
				dataSource={chartData}
				id='TankVolumeHistoryChart'
				animation={{ enabled: false }}
			>
				<ArgumentAxis
					argumentType='datetime'
					valueMarginsEnabled={false}
				/>
				<ValueAxis
					title={{ text: 'Total Site Volume (L)' }}
				/>
				<Series
					type="line"
					argumentField="timestamp"
					valueField="volume"
					name="Total Site Volume"
				/>
				<Legend visible={false} />
				<Tooltip
					enabled={true}
					customizeTooltip={customizeTooltip}
				/>
				<LoadingIndicator  enabled={true} />
			</Chart>
		</CardAnalytics>
	);
};

export default TankVolumeHistoryCard;

