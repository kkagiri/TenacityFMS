import React from 'react';

import {TickerCard} from './../tickerCard';

const formatLiters = (value) => `${value.toFixed(2)} L`;

export const ClosingStockTicker = ({ value }) => (

    <TickerCard
        title="Closing Stock"
        icon="jerrycan"
        tone="positive"
        value={value}
        formatValue={formatLiters}

        />
);
