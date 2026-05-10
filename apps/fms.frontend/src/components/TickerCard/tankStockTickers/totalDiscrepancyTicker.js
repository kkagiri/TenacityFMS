import React from 'react';

import {TickerCard} from './../tickerCard';

const formatLiters = (value) => `${value.toFixed(2)} L`;

export const TotalDiscrepancyTicker = ({ value }) => (

    <TickerCard
        title="Discrepancy"
        icon="jerrycan"
        tone="warning"
        value={value}
        formatValue={formatLiters}

        />
);
