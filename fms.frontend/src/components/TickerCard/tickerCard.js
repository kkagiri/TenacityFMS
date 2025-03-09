import React, { useEffect } from "react";
import "./TickerCard.scss";

export const TickerCard = (props) => {
  const {
    title,
    icon,
    tone,
    value,
    total,
    percentage,
    formatValue = (value) => `${value.toLocaleString()}`,
  } = props;

  const getPercentageColor = (percentage) => {
    if (percentage < 10) return "red";
    if (percentage < 40) return "amber";
    return "green";
  };

  const tickerColor =
    percentage !== undefined ? getPercentageColor(percentage) : tone;

  return (
    <div className={`ticker ${tickerColor}`}>
      <div className="icon-wrapper">{icon && <i className={icon} />}</div>
      <div className="middle">
        <div className="title">{title}</div>
        <div className="value">{formatValue(value)}</div>
        {total !== undefined && (
          <div className="total">{formatValue(total)}</div>
        )}
      </div>
      {percentage !== undefined && (
        <div className={`percentage ${tickerColor}`}>
          <div className="value">{`${percentage.toFixed(1)}%`}</div>
        </div>
      )}
    </div>
  );
};
