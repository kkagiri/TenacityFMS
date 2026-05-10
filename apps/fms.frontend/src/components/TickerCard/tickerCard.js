import React, { useEffect, useState } from "react";
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

  // Cursor - Add animation state for value changes
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);

  // Cursor - Animate value changes
  useEffect(() => {
    if (displayValue !== value) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setDisplayValue(value);
        setIsAnimating(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [value, displayValue]);

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

  // Cursor - Enhanced color scheme for different tones
  const getGradientClass = (tone) => {
    switch (tone) {
      case 'success':
        return 'tw-from-green-400 tw-to-green-600';
      case 'negative':
        return 'tw-from-red-400 tw-to-red-600';
      case 'warning':
        return 'tw-from-yellow-400 tw-to-yellow-600';
      case 'delivery':
        return 'tw-from-blue-400 tw-to-blue-600';
      case 'info':
        return 'tw-from-indigo-400 tw-to-indigo-600';
      default:
        return 'tw-from-gray-400 tw-to-gray-600';
    }
  };

  return (
    <div className={`ticker ${tickerColor} tw-relative tw-bg-white tw-rounded-xl tw-shadow-lg tw-border tw-border-gray-200 tw-overflow-hidden tw-transition-all tw-duration-300 tw-hover:shadow-xl tw-hover:scale-105`}>
      {/* Cursor - Background gradient overlay */}
      <div className={`tw-absolute tw-top-0 tw-right-0 tw-w-20 tw-h-20 tw-bg-gradient-to-br ${getGradientClass(tickerColor)} tw-opacity-10 tw-rounded-bl-full`}></div>

      <div className="tw-flex tw-items-center tw-p-4">
        <div className={`icon-wrapper tw-flex tw-items-center tw-justify-center tw-w-12 tw-h-12 tw-rounded-full tw-bg-gradient-to-br ${getGradientClass(tickerColor)} tw-text-white tw-shadow-md`}>
          {isFontAwesome ? (
            <i className={`${icon} tw-text-lg`}></i>
          ) : (
            <i className={`dx-icon-${icon} tw-text-lg`}></i>
          )}
        </div>

        <div className="middle tw-flex-1 tw-ml-4">
          <div className="tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wide tw-mb-1">{title}</div>
          <div className={`tw-text-2xl tw-font-bold tw-text-gray-800 tw-transition-all tw-duration-300 ${isAnimating ? 'tw-scale-110' : ''}`}>
            {formatValue(displayValue)}
            {unit && <span className="tw-text-sm tw-font-normal tw-text-gray-500 tw-ml-1">{unit}</span>}
          </div>
          {total !== undefined && (
            <div className="tw-text-sm tw-text-gray-400 tw-mt-1">
              of {formatValue(total)}
            </div>
          )}
        </div>

        {percentage !== undefined && (
          <div className={`tw-flex tw-flex-col tw-items-center tw-justify-center tw-w-16 tw-h-16 tw-rounded-full tw-bg-gradient-to-br ${getGradientClass(tickerColor)} tw-text-white tw-shadow-md`}>
            <div className="tw-text-lg tw-font-bold">{`${percentage.toFixed(1)}%`}</div>
            <div className="tw-text-xs tw-opacity-80">Fill</div>
          </div>
        )}
      </div>

      {/* Cursor - Subtle bottom accent line */}
      <div className={`tw-h-1 tw-bg-gradient-to-r ${getGradientClass(tickerColor)}`}></div>
    </div>
  );
};
