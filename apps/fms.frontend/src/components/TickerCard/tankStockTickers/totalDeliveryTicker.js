import React from 'react';

import {TickerCard} from './../tickerCard';

const formatLiters = (value) => `${value.toFixed(2)} L`;

export const TotalDeliveryTicker = ({ value }) => (

    <TickerCard
        title="Total Fuel Delivery"
        icon="jerrycan"
        tone="positive"
        value={value}
        formatValue={formatLiters}

        />  
        );
