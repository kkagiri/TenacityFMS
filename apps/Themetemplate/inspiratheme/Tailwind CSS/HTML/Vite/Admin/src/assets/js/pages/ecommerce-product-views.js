/**
 * Template Name: Inspinia - Admin & Dashboard Template
 * By (Author): WebAppLayers
 * Module/App (File Name): ECommerce Product Views
 */

import { CustomApexChart } from "../app.js"

// Function to generate random data
function generateRandomData(count = 15, min = 5, max = 20) {
    return Array.from({ length: count }, () => Math.floor(Math.random() * (max - min + 1)) + min)
}

// Loop through all elements with data-chart="apex"
function generateRandomCharts() {
    const chartElements = document.querySelectorAll('[data-chart="apex"]')
    if (chartElements && chartElements.length > 0) {
        chartElements.forEach(function (el) {
            const chartType = el.getAttribute("data-chart-type") || "bar" // default to 'bar' if not specified

            new CustomApexChart({
                selector: el,
                options: () => ({
                    chart: {
                        type: chartType,
                        height: 30,
                        width: 100,
                        sparkline: {
                            enabled: true,
                        },
                    },
                    stroke: {
                        width: chartType === "line" ? 2 : 0, // only lines have stroke width
                        curve: "smooth",
                    },
                    plotOptions: {
                        bar: {
                            columnWidth: "50%",
                            borderRadius: 2,
                        },
                    },
                    series: [
                        {
                            data: generateRandomData(),
                        },
                    ],
                    colors: ["#3b82f6"],
                    tooltip: {
                        enabled: false,
                    },
                }),
            })
        })
    }
}

generateRandomCharts()
