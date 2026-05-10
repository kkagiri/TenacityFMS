/**
 * File: AutomaticTankStockMain.js
 * Purpose: Hosts automatic (PTS-driven) tank stock tabs with URL-based navigation.
 * Dependencies: React, react-router-dom, DevExtreme Tabs, StockFilterContext, PumpTransactionManager, InTankDeliveryManager
 * Last Modified: 2026-02-12
 *
 * Key Components:
 * - AutomaticTankStockMain(): Renders URL-driven tabs under /tankstock/automatic-tank-stock/<tab>
 */
import React, { useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Tabs from "devextreme-react/tabs";
import LoadIndicator from "devextreme-react/load-indicator";
import { useStockFilters } from "../shared/context/StockFilterContext";
import { useStockData } from "../shared/hooks/useStockDataOptimized";
import PumpTransactionManager from "../management/components/PumpTransactionManager";
import InTankDeliveryManager from "./components/InTankDeliveryManager/InTankDeliveryManager";
import TankMeasurementHistory from "./components/TankMeasurementHistory/TankMeasurementHistory";

const AUTOMATIC_STOCK_BASE_PATH = "/tankstock/automatic-tank-stock";

const AutomaticTankStockMain = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const { dateRange } = useStockFilters();

    const selectedSite = useMemo(() => {
        const storedSite = localStorage.getItem("selectedSite");
        return storedSite && storedSite !== "null" ? storedSite : "all";
    }, []);

    const { isLoading } = useStockData(selectedSite, dateRange);

    const tabData = useMemo(
        () => [
            {
                key: "pumpTransactions",
                text: "Pump Transactions",
                icon: "fa-light fa-gas-pump",
                path: "pump-transactions",
            },
            {
                key: "inTankDeliveries",
                text: "In-Tank Deliveries",
                icon: "fa-light fa-truck-ramp-box",
                path: "in-tank-deliveries",
            },
            {
                key: "tankMeasurements",
                text: "Tank Measurements",
                icon: "fa-light fa-chart-area",
                path: "tank-measurements",
            },
        ],
        []
    );

    const activeTabIndex = useMemo(() => {
        const matchIndex = tabData.findIndex(
            (tab) => location.pathname === `${AUTOMATIC_STOCK_BASE_PATH}/${tab.path}`
        );
        return matchIndex >= 0 ? matchIndex : 0;
    }, [location.pathname, tabData]);

    const activeTab = tabData[activeTabIndex];

    useEffect(() => {
        if (tabData.length === 0) return;

        const isBasePath =
            location.pathname === AUTOMATIC_STOCK_BASE_PATH ||
            location.pathname === `${AUTOMATIC_STOCK_BASE_PATH}/`;

        const isValidTabPath = tabData.some(
            (tab) => location.pathname === `${AUTOMATIC_STOCK_BASE_PATH}/${tab.path}`
        );

        if (isBasePath || !isValidTabPath) {
            navigate(`${AUTOMATIC_STOCK_BASE_PATH}/${tabData[0].path}`, {
                replace: true,
            });
        }
    }, [location.pathname, navigate, tabData]);

    const renderTabItem = (item) => (
        <div className="tw-flex tw-items-center tw-gap-2">
            <i className={item.icon}></i>
            <span>{item.text}</span>
        </div>
    );

    const handleTabSelectionChange = (e) => {
        const selectedTab = tabData[e.itemIndex];
        if (selectedTab) {
            navigate(`${AUTOMATIC_STOCK_BASE_PATH}/${selectedTab.path}`);
        }
    };

    const renderContent = () => {
        switch (activeTab?.key) {
            case "pumpTransactions":
                return (
                    <PumpTransactionManager selectedSite={selectedSite} dateRange={dateRange} />
                );
            case "inTankDeliveries":
                return <InTankDeliveryManager />;
            case "tankMeasurements":
                return <TankMeasurementHistory />;
            default:
                return null;
        }
    };

    return (
        <div className="tw-relative tw-bg-gray-50 tw-min-h-screen">
            {isLoading && (
                <div className="tw-absolute tw-top-0 tw-left-0 tw-right-0 tw-bottom-0 tw-bg-white tw-bg-opacity-75 tw-flex tw-justify-center tw-items-center tw-z-40">
                    <div className="tw-text-center tw-bg-white tw-p-6 tw-rounded-lg tw-shadow-lg">
                        <LoadIndicator width={"48px"} height={"48px"} visible={true} />
                        <div className="tw-mt-4 tw-text-gray-600 tw-font-medium">
                            Loading automatic stock dashboard...
                        </div>
                    </div>
                </div>
            )}

            <div className="tw-overflow-y-auto tw-h-full tw-p-4">
                <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-overflow-hidden">
                    <Tabs
                        dataSource={tabData}
                        selectedIndex={activeTabIndex}
                        onItemClick={handleTabSelectionChange}
                        width="100%"
                        className="tw-mb-0"
                        itemRender={renderTabItem}
                    />

                    <div className="tw-p-4">{renderContent()}</div>
                </div>
            </div>
        </div>
    );
};

export default AutomaticTankStockMain;
