import React from 'react';

import {TickerCard} from './../tickerCard';

const formatLiters = (value) => `${value.toFixed(2)} L`;

export const TotalFuelDispenseTicker = ({ value }) => (

    <TickerCard
        title="Total Fuel Dispensed"
        icon="jerrycan"
        tone="positive"
        value={value}
        formatValue={formatLiters}

        />
);
