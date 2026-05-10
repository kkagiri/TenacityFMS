import React, { useMemo } from 'react';
import { TickerCard } from '../../../../components/TickerCard/tickerCard';

const VolumeTotalsTickers = ({ data, isLoading }) => {
  // Calculate totals based on reference type
  const totals = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return {
        Dispense: 0,
        Delivery: 0,
        TransferIn: 0,
        TransferOut: 0,
        ManualRefill: 0,
        Adjustment: 0,
        OpeningStock: 0,
        ClosingStock: 0
      };
    }

    const groupedTotals = data.reduce((acc, transaction) => {
      const referenceType = transaction.referenceType || 'Unknown';
      const volumeChange = parseFloat(transaction.volumeChange) || 0;

      if (!acc[referenceType]) {
        acc[referenceType] = 0;
      }
      acc[referenceType] += volumeChange;

      return acc;
    }, {});

    // Return with default values for any missing types
    return {
      Dispense: groupedTotals.Dispense || 0,
      Delivery: groupedTotals.Delivery || 0,
      TransferIn: groupedTotals.TransferIn || 0,
      TransferOut: groupedTotals.TransferOut || 0,
      ManualRefill: groupedTotals.ManualRefill || 0,
      Adjustment: groupedTotals.Adjustment || 0,
      OpeningStock: groupedTotals.OpeningStock || 0,
      ClosingStock: groupedTotals.ClosingStock || 0,
      ...groupedTotals // Include any other reference types
    };
  }, [data]);

  // Get the main transaction types for display
  const mainTypes = [
    {
      key: 'Dispense',
      title: 'Total Dispensed',
      icon: 'fa-light fa-gas-pump',
      tone: 'negative',
      unit: 'L'
    },
    {
      key: 'Delivery',
      title: 'Total Delivered',
      icon: 'fa-light fa-truck',
      tone: 'success',
      unit: 'L'
    },
    {
      key: 'TransferIn',
      title: 'Transfer In',
      icon: 'fa-light fa-arrow-down',
      tone: 'info',
      unit: 'L'
    },
    {
      key: 'TransferOut',
      title: 'Transfer Out',
      icon: 'fa-light fa-arrow-up',
      tone: 'warning',
      unit: 'L'
    },
    {
      key: 'ManualRefill',
      title: 'Manual Refill',
      icon: 'fa-light fa-hand-holding-droplet',
      tone: 'delivery',
      unit: 'L'
    },
    {
      key: 'Adjustment',
      title: 'Adjustments',
      icon: 'fa-light fa-sliders',
      tone: 'info',
      unit: 'L'
    }
  ];

  const formatValue = (value) => {
    if (value === 0) return '0';
    return Math.abs(value).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  if (isLoading) {
    return (
      <div className="tw-mt-6 tw-p-4 tw-bg-white tw-rounded-lg tw-border tw-border-gray-200">
        <div className="tw-flex tw-items-center tw-justify-center tw-py-8">
          <div className="tw-text-center">
            <i className="fa-light fa-spinner tw-animate-spin tw-text-2xl tw-text-blue-600 tw-mb-3"></i>
            <p className="tw-text-gray-600">Calculating totals...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tw-mt-6 tw-p-4 tw-bg-white tw-rounded-lg tw-border tw-border-gray-200">
      {/* Header */}
      <div className="tw-mb-4">
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-flex tw-items-center">
          <i className="fa-light fa-chart-pie tw-mr-2 tw-text-blue-600"></i>
          Volume Totals by Transaction Type
        </h3>
        <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
          Summary of volume changes grouped by reference type
        </p>
      </div>

      {/* Tickers Grid - Mobile Responsive */}
      <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-grid-cols-6 tw-gap-4">
        {mainTypes.map((type) => {
          const value = totals[type.key] || 0;
          return (
            <TickerCard
              key={type.key}
              title={type.title}
              icon={type.icon}
              tone={type.tone}
              value={value}
              formatValue={formatValue}
              unit={type.unit}
            />
          );
        })}
      </div>

      {/* Additional Types - Show if there are any other reference types not in main list */}
      {Object.keys(totals).some(key => !mainTypes.find(type => type.key === key) && totals[key] !== 0) && (
        <div className="tw-mt-6">
          <h4 className="tw-text-md tw-font-medium tw-text-gray-700 tw-mb-3 tw-flex tw-items-center">
            <i className="fa-light fa-ellipsis-h tw-mr-2 tw-text-gray-500"></i>
            Other Transaction Types
          </h4>
          <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-grid-cols-4 tw-gap-3">
            {Object.keys(totals)
              .filter(key => !mainTypes.find(type => type.key === key) && totals[key] !== 0)
              .map((key) => (
                <TickerCard
                  key={key}
                  title={key}
                  icon="fa-light fa-exchange-alt"
                  tone="info"
                  value={totals[key]}
                  formatValue={formatValue}
                  unit="L"
                />
              ))}
          </div>
        </div>
      )}

      {/* Net Change Summary */}
      <div className="tw-mt-6 tw-pt-4 tw-border-t tw-border-gray-200">
        <div className="tw-flex tw-flex-col sm:tw-flex-row tw-justify-between tw-items-start sm:tw-items-center tw-gap-4">
          <div>
            <h4 className="tw-text-md tw-font-medium tw-text-gray-700 tw-mb-1">
              Net Volume Change
            </h4>
            <p className="tw-text-sm tw-text-gray-500">
              Total of all volume changes in the current filter period
            </p>
          </div>
          <div className="tw-text-right">
            {(() => {
              const netChange = Object.values(totals).reduce((sum, value) => sum + value, 0);
              const isPositive = netChange >= 0;
              return (
                <div className={`tw-text-2xl tw-font-bold ${isPositive ? 'tw-text-green-600' : 'tw-text-red-600'}`}>
                  {isPositive ? '+' : ''}{formatValue(netChange)} L
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolumeTotalsTickers;
