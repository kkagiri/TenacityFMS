import React from 'react';

import {TickerCard} from '../tickerCard';

export const StockCapacityTicker = ({ currentStock, tankCapacity }) => {
    const percentage = (currentStock / tankCapacity) * 100;
  
    return (
      <TickerCard
        title="Current Stock"
        icon="fa-light fa-tank-water"
        value={currentStock}
        total={tankCapacity}
        percentage={percentage}
        formatValue={(value) => value.toLocaleString()}
      />
    );
  };