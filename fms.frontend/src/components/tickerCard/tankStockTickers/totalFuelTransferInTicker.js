import React from 'react';
import { TickerCard } from '../tickerCard';
const formatLiters = (value) => `${value.toFixed(2)} L`;

export const TotalFuelTransferInTicker = ({ value }) => {
    return (
        <TickerCard
            title="Total Fuel Transfer in"
            icon="download"
            tone="negative"
            value={value}
            formatValue={formatLiters}
        />
    );
}