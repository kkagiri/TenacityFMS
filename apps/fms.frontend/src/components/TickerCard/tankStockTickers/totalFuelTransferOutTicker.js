import React from 'react';
import {TickerCard} from './../tickerCard';

const formatLiters = (value) => `${value.toFixed(2)} L`;

export const TotalFuelTransferOutTicker = ({ value }) => {
    return (
        <TickerCard
            title="Total Fuel Transfer Out"
            icon="upload"
            tone="warning"
            value={value}
            formatValue={formatLiters}
        />
    );
}