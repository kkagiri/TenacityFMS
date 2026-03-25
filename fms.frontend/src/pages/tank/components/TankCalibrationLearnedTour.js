/**
 * File:          TankCalibrationLearnedTour.js
 * Purpose:       Provides an anchored walkthrough for the FMS learned calibration workflow using React Joyride.
 * Dependencies:  React, react-joyride, TankCalibrationLearnedTour.scss
 * Last Modified: 2026-03-24
 *
 * Key Functions:
 * - TankCalibrationLearnedTour: Runs the step-by-step balloon tour and closes when completed or skipped.
 */
import React from "react";
import Joyride, { STATUS } from "react-joyride";
import "./TankCalibrationLearnedTour.scss";

const TOUR_STEPS = [
    {
        target: ".tour-target-learned-hero",
        placement: "bottom-start",
        disableBeacon: true,
        title: "FMS Learned Calibration",
        content: "This workspace turns real tank activity into an FMS-managed calibration curve. Start here when you want to extract data, seed a baseline, generate the learned chart, or compare it to PTS.",
    },
    {
        target: ".tour-target-learned-banner",
        placement: "bottom",
        title: "Recommended Next Action",
        content: "This banner watches the current learned state and suggests the most useful next step, such as extracting first, seeding a baseline, generating the chart, or reviewing comparison results.",
    },
    {
        target: ".tour-target-learned-extract",
        placement: "right",
        title: "Extract Learning Data",
        content: "Use this section to pull dispensing and delivery activity into the learning engine. The result refreshes coverage so you can see whether enough intervals are ready.",
    },
    {
        target: ".tour-target-learned-seed",
        placement: "right",
        title: "Seed From PTS",
        content: "If live observations are still sparse, seed the learning baseline from a trusted PTS manual or automatic snapshot. Seeded intervals act as fallback values until learned evidence replaces them.",
    },
    {
        target: ".tour-target-learned-coverage",
        placement: "top",
        title: "Coverage Map",
        content: "Each block represents a height interval. Ready intervals are strong enough to contribute confidently, sparse intervals need more evidence, and empty intervals still have no usable learned data.",
    },
    {
        target: ".tour-target-learned-chart",
        placement: "top",
        title: "Latest Learned Chart",
        content: "Once generated, the learned chart appears here as both a curve and a row-by-row table. This is the FMS-produced snapshot that you can validate against PTS.",
    },
    {
        target: ".tour-target-learned-compare",
        placement: "top",
        title: "Compare With PTS",
        content: "Run a comparison to inspect interval deviation between the learned chart and a selected PTS chart. Use the threshold field to emphasize rows that need attention.",
    },
    {
        target: ".tour-target-learned-history",
        placement: "top",
        title: "Snapshot History",
        content: "Recent learned snapshots are listed here so you can trace what was generated, when it was recorded, and any notes captured at the time.",
    },
];

const TOUR_STYLES = {
    options: {
        arrowColor: "#ffffff",
        backgroundColor: "#ffffff",
        overlayColor: "rgba(32, 31, 30, 0.32)",
        primaryColor: "#0078d4",
        textColor: "#201f1e",
        zIndex: 2200,
        width: 440,
    },
    spotlight: {
        borderRadius: 12,
    },
};

const LearnedTourTooltip = ({
    backProps,
    closeProps,
    continuous,
    index,
    isLastStep,
    primaryProps,
    size,
    skipProps,
    step,
    tooltipProps,
}) => {
    const {
        ref: tooltipRef,
        style: tooltipStyle,
        className: _tooltipClass,
        ...restTooltipProps
    } = tooltipProps;
    const {
        className: _closeClass, style: _closeStyle,
        ...restCloseProps
    } = closeProps;
    const {
        className: _skipClass, style: _skipStyle,
        ...restSkipProps
    } = skipProps;
    const {
        className: _backClass, style: _backStyle,
        ...restBackProps
    } = backProps;
    const {
        className: _primaryClass, style: _primaryStyle,
        ...restPrimaryProps
    } = primaryProps;

    const headerStyle = {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: 8,
        width: "100%",
        paddingBottom: 8,
        borderBottom: "1px solid #edebe9",
        boxSizing: "border-box",
        flex: "0 0 auto",
        order: 1,
    };

    const bodyStyle = {
        display: "block",
        width: "100%",
        padding: "12px 0 16px",
        boxSizing: "border-box",
        flex: "1 1 auto",
        order: 2,
    };

    const footerStyle = {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        width: "100%",
        paddingTop: 12,
        marginTop: "auto",
        borderTop: "1px solid #edebe9",
        boxSizing: "border-box",
        flex: "0 0 auto",
        order: 3,
    };

    const actionsStyle = {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 8,
        flexWrap: "wrap",
        marginLeft: "auto",
    };

    return (
        <div
            ref={tooltipRef}
            className="m365-learned-tour-tooltip"
            style={{
                ...tooltipStyle,
                minHeight: 220,
                display: "grid",
                gridTemplateRows: "auto 1fr auto",
                alignItems: "start",
                rowGap: 0,
            }}
            {...restTooltipProps}
        >
            <div className="m365-learned-tour-tooltip__header" style={headerStyle}>
                <div className="m365-learned-tour-tooltip__header-meta">
                    <span className="m365-badge m365-badge--info">Walkthrough</span>
                    <span className="m365-learned-tour-tooltip__step-pill">Step {index + 1} of {size}</span>
                </div>
            </div>

            <div className="m365-learned-tour-tooltip__body" style={bodyStyle}>
                <h4>{step.title}</h4>
                <p>{step.content}</p>
            </div>

            <div className="m365-learned-tour-tooltip__footer" style={footerStyle}>
                <div className="m365-learned-tour-tooltip__meta">Guided workflow</div>
                <div className="m365-learned-tour-tooltip__actions" style={actionsStyle}>
                    <button
                        type="button"
                        className="m365-btn m365-btn--text"
                        {...restCloseProps}
                    >
                        Close
                    </button>
                    <button
                        type="button"
                        className="m365-btn m365-btn--text"
                        {...restSkipProps}
                    >
                        Skip
                    </button>
                    {index > 0 && (
                        <button
                            type="button"
                            className="m365-btn m365-btn--ghost"
                            {...restBackProps}
                        >
                            Back
                        </button>
                    )}
                    <button
                        type="button"
                        className="m365-btn m365-btn--primary"
                        {...restPrimaryProps}
                    >
                        {continuous ? (isLastStep ? "Finish" : "Next") : "Close"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const TankCalibrationLearnedTour = ({ run, onFinish }) => {
    const handleCallback = ({ action, status }) => {
        if (status === STATUS.FINISHED || status === STATUS.SKIPPED || action === "close") {
            onFinish?.();
        }
    };

    return (
        <Joyride
            run={run}
            steps={TOUR_STEPS}
            continuous
            showProgress
            showSkipButton
            scrollToFirstStep
            disableScrolling={false}
            spotlightPadding={10}
            callback={handleCallback}
            styles={TOUR_STYLES}
            tooltipComponent={LearnedTourTooltip}
            floaterProps={{
                styles: {
                    floater: {
                        filter: "drop-shadow(0 10px 28px rgba(0, 0, 0, 0.16))",
                        maxWidth: "min(440px, calc(100vw - 24px))",
                        width: "min(440px, calc(100vw - 24px))",
                        padding: 0,
                    },
                },
            }}
            locale={{
                back: "Back",
                close: "Close",
                last: "Finish",
                next: "Next",
                skip: "Skip tour",
            }}
        />
    );
};

export default TankCalibrationLearnedTour;