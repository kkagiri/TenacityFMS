/**
 * File: TrackDrawingPlaygroundPopup.js
 * Purpose: Popup for tuning sampled point drawing thresholds and direction arrow display.
 * Dependencies: React, DevExtreme Popup, NumberBox, CheckBox, Button
 * Last Modified: 2026-03-21
 *
 * Key Components:
 * - TrackDrawingPlaygroundPopup: Lets users tune point sampling thresholds and preview reduction stats
 */
import React from 'react';
import Popup from 'devextreme-react/popup';
import NumberBox from 'devextreme-react/number-box';
import CheckBox from 'devextreme-react/check-box';
import { Button } from 'devextreme-react/button';

const TrackDrawingPlaygroundPopup = ({
    visible,
    onHiding,
    drawOptions,
    onDrawOptionsChange,
    drawingStats,
    onRedraw,
}) => {
    const sampledPointCount = drawingStats?.sampledPointCount ?? 0;
    const sourcePointCount = drawingStats?.sourcePointCount ?? 0;
    const reductionPercent = drawingStats?.reductionPercent ?? 0;

    return (
        <Popup
            visible={visible}
            onHiding={onHiding}
            title="Track Drawing Playground"
            showTitle={true}
            dragEnabled={false}
            hideOnOutsideClick={true}
            width={460}
            height="auto"
        >
            <div className="tw-flex tw-flex-col tw-gap-4 tw-bg-[#faf9f8] tw-p-4">
                <div className="tw-rounded-xl tw-border tw-border-[#edebe9] tw-bg-white tw-p-4">
                    <div className="tw-text-[13px] tw-font-semibold tw-text-[#111813]">Point sampling</div>
                    <div className="tw-mt-1 tw-text-[12px] tw-text-[#605e5c]">
                        Keep a point when either the elapsed time or distance from the last shown point crosses the threshold.
                    </div>

                    <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-3 md:tw-grid-cols-2">
                        <div>
                            <label className="tw-mb-1 tw-block tw-text-[12px] tw-font-medium tw-text-[#323130]">Time gap (seconds)</label>
                            <NumberBox
                                value={drawOptions?.pointMinGapSeconds ?? 60}
                                min={0}
                                showSpinButtons={true}
                                stylingMode="outlined"
                                onValueChanged={(e) => onDrawOptionsChange?.({ pointMinGapSeconds: Math.max(0, Number(e.value) || 0) })}
                            />
                        </div>

                        <div>
                            <label className="tw-mb-1 tw-block tw-text-[12px] tw-font-medium tw-text-[#323130]">Distance gap (meters)</label>
                            <NumberBox
                                value={drawOptions?.pointMinDistanceMeters ?? 200}
                                min={0}
                                showSpinButtons={true}
                                stylingMode="outlined"
                                onValueChanged={(e) => onDrawOptionsChange?.({ pointMinDistanceMeters: Math.max(0, Number(e.value) || 0) })}
                            />
                        </div>
                    </div>

                    <div className="tw-mt-4 tw-flex tw-flex-col tw-gap-2">
                        <CheckBox
                            text="Show sampled points"
                            value={drawOptions?.showPoints ?? false}
                            onValueChanged={(e) => onDrawOptionsChange?.({ showPoints: Boolean(e.value) })}
                        />
                        <CheckBox
                            text="Show heading arrows on points"
                            value={drawOptions?.showHeadingArrows ?? true}
                            onValueChanged={(e) => onDrawOptionsChange?.({ showHeadingArrows: Boolean(e.value) })}
                        />
                    </div>
                </div>

                <div className="tw-rounded-xl tw-border tw-border-[#edebe9] tw-bg-white tw-p-4">
                    <div className="tw-text-[13px] tw-font-semibold tw-text-[#111813]">Preview</div>
                    <div className="tw-mt-3 tw-grid tw-grid-cols-3 tw-gap-3">
                        <div className="tw-rounded-lg tw-bg-[#f3f2f1] tw-p-3">
                            <div className="tw-text-[11px] tw-uppercase tw-tracking-[0.08em] tw-text-[#605e5c]">Source</div>
                            <div className="tw-mt-1 tw-text-[20px] tw-font-semibold tw-text-[#111813]">{sourcePointCount}</div>
                        </div>
                        <div className="tw-rounded-lg tw-bg-[#eff6fc] tw-p-3">
                            <div className="tw-text-[11px] tw-uppercase tw-tracking-[0.08em] tw-text-[#004578]">Sampled</div>
                            <div className="tw-mt-1 tw-text-[20px] tw-font-semibold tw-text-[#004578]">{sampledPointCount}</div>
                        </div>
                        <div className="tw-rounded-lg tw-bg-[#fdf3f4] tw-p-3">
                            <div className="tw-text-[11px] tw-uppercase tw-tracking-[0.08em] tw-text-[#a4262c]">Reduced</div>
                            <div className="tw-mt-1 tw-text-[20px] tw-font-semibold tw-text-[#a4262c]">{reductionPercent}%</div>
                        </div>
                    </div>
                </div>

                <div className="tw-flex tw-justify-end tw-gap-2">
                    <Button
                        text="Redraw"
                        icon="fa-light fa-pen-line"
                        stylingMode="contained"
                        type="default"
                        onClick={onRedraw}
                    />
                    <Button
                        text="Close"
                        stylingMode="outlined"
                        onClick={onHiding}
                    />
                </div>
            </div>
        </Popup>
    );
};

export default TrackDrawingPlaygroundPopup;