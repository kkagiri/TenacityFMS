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
    unit,
  } = props;

  const getPercentageColor = (percentage) => {
    if (percentage < 10) return "red";
    if (percentage < 40) return "amber";
    return "green";
  };

  const tickerColor =
    percentage !== undefined ? getPercentageColor(percentage) : tone;

  // Determine if this is a Font Awesome icon (starts with fa-)
  // or a DevExtreme icon
  const isFontAwesome = icon && icon.startsWith("fa-");

  return (
    <div className={`ticker ${tickerColor}`}>
      <div className="icon-wrapper">
        {isFontAwesome ? (
          <i className={icon}></i>
        ) : (
          <i className={`dx-icon-${icon}`}></i>
        )}
      </div>
      <div className="middle">
        <div className="title">{title}</div>
        <div className="value">
          {formatValue(value)} <span className="ticker-unit">{unit}</span>
        </div>
        {total !== undefined && (
          <div className="total">{formatValue(total)}</div>
        )}
        {/* <div className="ticker-change">
          <span
            className={
              change.startsWith("+")
                ? "positive"
                : change.startsWith("-")
                ? "negative"
                : "neutral"
            }
          >
            {change}
          </span>
        </div> */}
      </div>
      {percentage !== undefined && (
        <div className={`percentage ${tickerColor}`}>
          <div className="value">{`${percentage.toFixed(1)}%`}</div>
        </div>
      )}
    </div>
  );
};
