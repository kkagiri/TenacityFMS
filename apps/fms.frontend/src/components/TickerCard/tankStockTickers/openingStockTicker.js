import React from 'react';

import {TickerCard} from './../tickerCard';

const formatLiters = (value) => `${value.toFixed(2)} L`;

export const OpeningStockTicker = ({ value, percentage = 20 }) => {
    console.log('OpeningStockTicker rendering with:', { value, percentage });
    return (
      <TickerCard
        title="Opening Stock"
        icon="fa-light fa-cube"
        tone="info"
        value={value}
        percentage={percentage}
        formatValue={formatLiters}
      />
    );
  };
  