/**
 * Template Name: Inspinia - Admin & Dashboard Template
 * By (Author): WebAppLayers
 * Module/App (File Name): Analytics Dashboard
*/

function generateRandomData(count, min, max) {
    return Array.from({ length: count }, () => Math.floor(Math.random() * (max - min + 1)) + min)
}

function generateSessionAndPageViewData(count) {
    const sessions = generateRandomData(count, 250, 450)
    const pageViews = sessions.map(
        (session) => Math.floor(session * (2 + Math.random() * 0.1)) // Page Views are 2x to 2.5x of Sessions
    )
    return { sessions, pageViews }
}

const { sessions, pageViews } = generateSessionAndPageViewData(19)

new CustomApexChart({
    selector: "#analytics-overview-chart",
    options: () => ({
        chart: {
            height: 326,
            type: "area",
            toolbar: { show: false },
        },
        dataLabels: {
            enabled: false,
        },
        stroke: {
            width: 2,
            curve: "smooth",
        },
        colors: [theme("chart-primary"), theme("chart-secondary")],
        series: [
            {
                name: "Sessions",
                data: sessions,
            },
            {
                name: "Page Views",
                data: pageViews,
            },
        ],
        legend: {
            offsetY: 5,
        },
        xaxis: {
            categories: ["", "8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM", "12 AM", ""],
            axisBorder: { show: false },
            axisTicks: { show: false },
            tickAmount: 6,
            labels: {
                style: {
                    fontSize: "12px",
                },
            },
        },
        tooltip: {
            shared: true,
            y: {
                formatter: function (val, { seriesIndex }) {
                    if (seriesIndex === 0) {
                        return val + " Sessions"
                    } else if (seriesIndex === 1) {
                        return val + " Page Views"
                    }
                    return val
                },
            },
        },
        fill: {
            type: "gradient",
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.4,
                opacityTo: 0.2,
                stops: [15, 120, 100],
            },
        },
        grid: {
            borderColor: [theme("border-color")],
            padding: {
                bottom: 5,
            },
        },
    }),
})

function generateRandomDeviceData(name, minY, maxY, count = 10) {
    const data = []
    for (let i = 1; i <= count; i++) {
        const y = Math.floor(Math.random() * (maxY - minY + 1)) + minY
        const z = Math.floor(Math.random() * (35 - 15 + 1)) + 15
        data.push({ x: i, y: y, z: z })
    }
    return { name, data }
}

new CustomApexChart({
    selector: "#devices-chart",
    options: () => ({
        chart: {
            height: 208, // Increased height for spacing
            type: "bubble",
            toolbar: {
                show: false,
            },
        },
        dataLabels: {
            enabled: false,
        },
        series: [generateRandomDeviceData("Desktop", 20, 150), generateRandomDeviceData("Mobile", 20, 120), generateRandomDeviceData("Tablet", 20, 60)],
        fill: {
            opacity: 0.8,
            gradient: {
                enabled: false,
            },
        },
        colors: [theme("chart-primary"), theme("chart-secondary"), theme("chart-beta")],
        xaxis: {
            min: 0,
            max: 11,
            show: false,
            labels: { show: false },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            min: 0,
            max: 170,
            show: false,
            labels: { show: false },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },

        grid: {
            padding: {
                top: -20,
                right: 20,
                bottom: 0,
                left: 20,
            },
            borderColor: theme("border-color"),
        },

        legend: {
            show: true,
            position: "top",
            horizontalAlign: "center",
        },
    }),
})