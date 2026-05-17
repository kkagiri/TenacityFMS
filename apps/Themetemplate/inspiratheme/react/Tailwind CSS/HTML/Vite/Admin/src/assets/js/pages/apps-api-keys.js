/**
 * Template Name: Inspinia - Admin & Dashboard Template
 * By (Author): WebAppLayers
 * Module/App (File Name): API keys Js
 */

import { theme } from "../app.js"

import ApexCharts from "apexcharts"
import ClipboardJS from "clipboard"

const sparklineConfig = (data, color) => ({
    chart: {
        type: "area",
        height: 60,
        sparkline: { enabled: true },
    },
    stroke: {
        curve: "smooth",
        width: 2,
    },
    series: [{ data }],
    colors: [color],
    tooltip: {
        enabled: false,
    },
})

const dummyNewUsers = [Math.sin(0) * 50 + 500, Math.sin(1) * 60 + 500, Math.sin(2) * 70 + 500, Math.sin(3) * 80 + 500, Math.sin(4) * 90 + 500, Math.sin(5) * 100 + 500, Math.sin(6) * 110 + 500]

const dummyActiveUsers = [89000 + Math.sin(0) * 500, 89200 + Math.sin(1) * 600, 89700 + Math.sin(2) * 700, 90500 + Math.sin(3) * 800, 91000 + Math.sin(4) * 900, 91300 + Math.sin(5) * 1000, 92000 + Math.sin(6) * 1100]

const dummyBlockedUsers = [2600 + Math.sin(0) * 10, 2605 + Math.sin(1) * 12, 2610 + Math.sin(2) * 15, 2608 + Math.sin(3) * 18, 2612 + Math.sin(4) * 20]

const dummyTables = [7000 + Math.sin(0) * 150, 7100 + Math.sin(1) * 160, 7200 + Math.sin(2) * 170, 7400 + Math.sin(3) * 180, 7850 + Math.sin(4) * 200]

const apiCallsChartElement = document.getElementById("chart-api-calls")
if (apiCallsChartElement) {
    const apiCallsChart = new ApexCharts(apiCallsChartElement, sparklineConfig(dummyNewUsers, theme("chart-secondary")))
    apiCallsChart.render()
} else {
    console.warn("No element found for selector #chart-api-calls")
}

const successfulConversionsChartElement = document.getElementById("chart-successful-conversions")
if (successfulConversionsChartElement) {
    const successfulConversionsChart = new ApexCharts(successfulConversionsChartElement, sparklineConfig(dummyActiveUsers, theme("chart-beta")))
    successfulConversionsChart.render()
} else {
    console.warn("No element found for selector #chart-successful-conversions")
}

const failedRequestsChartElement = document.getElementById("chart-failed-requests")
if (failedRequestsChartElement) {
    const failedRequestsChart = new ApexCharts(failedRequestsChartElement, sparklineConfig(dummyBlockedUsers, theme("chart-delta")))
    failedRequestsChart.render()
} else {
    console.warn("No element found for selector #chart-failed-requests")
}

const activeEndpointsChartElement = document.getElementById("chart-active-endpoints")
if (activeEndpointsChartElement) {
    const activeEndpointsChart = new ApexCharts(activeEndpointsChartElement, sparklineConfig(dummyTables, theme("chart-alpha")))
    activeEndpointsChart.render()
} else {
    console.warn("No element found for selector #chart-active-endpoints")
}

const clipboardTargets = document.querySelectorAll("[data-clipboard-target]")
if (clipboardTargets) {
    new ClipboardJS(clipboardTargets)
} else {
    console.warn("No element found for selector data-clipboard-target")
}

function generateApiKey(length = 27) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let key = ""

    for (let i = 0; i < length; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    return key
}

const inputElement = document.getElementById("apiKeyInput")
const generateApiKeyBtn = document.getElementById("generateApiKey")

if (inputElement && generateApiKeyBtn) {
    generateApiKeyBtn.addEventListener("click", (e) => {
        e.preventDefault()
        inputElement.value = generateApiKey()
    })
}
