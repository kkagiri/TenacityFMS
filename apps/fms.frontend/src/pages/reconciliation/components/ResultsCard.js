import React from 'react';

/**
 * Results Card Component
 * Displays summary of reconciliation results
 */
const ResultsCard = ({ result, type = 'check' }) => {
  if (!result) return null;

  const getStatusColor = (discrepancyCount) => {
    if (discrepancyCount === 0) return 'tw-bg-green-100 tw-border-green-300 tw-text-green-800';
    if (discrepancyCount <= 3) return 'tw-bg-yellow-100 tw-border-yellow-300 tw-text-yellow-800';
    return 'tw-bg-red-100 tw-border-red-300 tw-text-red-800';
  };

  const getStatusIcon = (discrepancyCount) => {
    if (discrepancyCount === 0) return 'fa-light fa-circle-check tw-text-green-600';
    if (discrepancyCount <= 3) return 'fa-light fa-triangle-exclamation tw-text-yellow-600';
    return 'fa-light fa-circle-xmark tw-text-red-600';
  };

  // For check results
  if (type === 'check' && result.data) {
    const { tankId, date, discrepanciesFound, discrepancies } = result.data;
    const statusColor = getStatusColor(discrepanciesFound);
    const statusIcon = getStatusIcon(discrepanciesFound);

    return (
      <div className={`tw-border-2 tw-rounded-lg tw-p-6 ${statusColor}`}>
        <div className="tw-flex tw-items-start tw-justify-between tw-mb-4">
          <div>
            <h3 className="tw-text-lg tw-font-bold tw-mb-1">Reconciliation Check Complete</h3>
            <p className="tw-text-sm tw-opacity-75">
              Tank {tankId} • {new Date(date).toLocaleDateString()}
            </p>
          </div>
          <i className={`${statusIcon} tw-text-4xl`}></i>
        </div>

        <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-mt-4">
          <div className="tw-bg-white tw-bg-opacity-60 tw-rounded tw-p-3">
            <div className="tw-text-2xl tw-font-bold">{discrepanciesFound}</div>
            <div className="tw-text-sm tw-opacity-75">Discrepancies Found</div>
          </div>
          <div className="tw-bg-white tw-bg-opacity-60 tw-rounded tw-p-3">
            <div className="tw-text-2xl tw-font-bold">{discrepancies?.length || 0}</div>
            <div className="tw-text-sm tw-opacity-75">Fields Affected</div>
          </div>
        </div>

        {discrepanciesFound > 0 && (
          <div className="tw-mt-4 tw-text-sm tw-font-medium">
            <i className="fa-light fa-lightbulb tw-mr-2"></i>
            Click "Apply Fix" to update Volume History to match Tank Stock values
          </div>
        )}
      </div>
    );
  }

  // For fix results
  if (type === 'fix' && result.data) {
    const { status, message, recordsFixed, fixedBy, fixedAt } = result.data;
    const isSuccess = status === 'SUCCESS';
    const statusColor = isSuccess
      ? 'tw-bg-green-100 tw-border-green-300 tw-text-green-800'
      : 'tw-bg-red-100 tw-border-red-300 tw-text-red-800';
    const statusIcon = isSuccess
      ? 'fa-light fa-circle-check tw-text-green-600'
      : 'fa-light fa-circle-xmark tw-text-red-600';

    return (
      <div className={`tw-border-2 tw-rounded-lg tw-p-6 ${statusColor}`}>
        <div className="tw-flex tw-items-start tw-justify-between tw-mb-4">
          <div>
            <h3 className="tw-text-lg tw-font-bold tw-mb-1">
              {isSuccess ? 'Fix Applied Successfully' : 'Fix Failed'}
            </h3>
            <p className="tw-text-sm tw-opacity-75">{message}</p>
          </div>
          <i className={`${statusIcon} tw-text-4xl`}></i>
        </div>

        {isSuccess && (
          <>
            <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-mt-4">
              <div className="tw-bg-white tw-bg-opacity-60 tw-rounded tw-p-3">
                <div className="tw-text-2xl tw-font-bold">{recordsFixed}</div>
                <div className="tw-text-sm tw-opacity-75">Records Updated</div>
              </div>
              <div className="tw-bg-white tw-bg-opacity-60 tw-rounded tw-p-3">
                <div className="tw-text-sm tw-font-medium tw-truncate">{fixedBy}</div>
                <div className="tw-text-sm tw-opacity-75">Fixed By</div>
              </div>
            </div>
            <div className="tw-mt-4 tw-text-xs tw-opacity-75">
              <i className="fa-light fa-clock tw-mr-1"></i>
              {new Date(fixedAt).toLocaleString()}
            </div>
          </>
        )}
      </div>
    );
  }

  // For batch results
  if (type === 'batch' && result.data) {
    const {
      tankId,
      startDate,
      endDate,
      totalDaysProcessed,
      daysWithDiscrepancies,
      totalDiscrepancies
    } = result.data;

    const qualityPercent = totalDaysProcessed > 0
      ? ((totalDaysProcessed - daysWithDiscrepancies) / totalDaysProcessed * 100).toFixed(1)
      : 100;

    const statusColor = getStatusColor(daysWithDiscrepancies);
    const statusIcon = getStatusIcon(daysWithDiscrepancies);

    return (
      <div className={`tw-border-2 tw-rounded-lg tw-p-6 ${statusColor}`}>
        <div className="tw-flex tw-items-start tw-justify-between tw-mb-4">
          <div>
            <h3 className="tw-text-lg tw-font-bold tw-mb-1">Batch Reconciliation Complete</h3>
            <p className="tw-text-sm tw-opacity-75">
              Tank {tankId} • {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
            </p>
          </div>
          <i className={`${statusIcon} tw-text-4xl`}></i>
        </div>

        <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-4 tw-mt-4">
          <div className="tw-bg-white tw-bg-opacity-60 tw-rounded tw-p-3">
            <div className="tw-text-2xl tw-font-bold">{totalDaysProcessed}</div>
            <div className="tw-text-sm tw-opacity-75">Days Processed</div>
          </div>
          <div className="tw-bg-white tw-bg-opacity-60 tw-rounded tw-p-3">
            <div className="tw-text-2xl tw-font-bold">{daysWithDiscrepancies}</div>
            <div className="tw-text-sm tw-opacity-75">Days with Issues</div>
          </div>
          <div className="tw-bg-white tw-bg-opacity-60 tw-rounded tw-p-3">
            <div className="tw-text-2xl tw-font-bold">{totalDiscrepancies}</div>
            <div className="tw-text-sm tw-opacity-75">Total Issues</div>
          </div>
          <div className="tw-bg-white tw-bg-opacity-60 tw-rounded tw-p-3">
            <div className="tw-text-2xl tw-font-bold">{qualityPercent}%</div>
            <div className="tw-text-sm tw-opacity-75">Quality Score</div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ResultsCard;
