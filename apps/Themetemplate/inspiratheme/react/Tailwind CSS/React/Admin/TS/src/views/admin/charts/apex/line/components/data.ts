import { getColor } from '@/utils/helpers'
import { ApexOptions } from 'apexcharts'

// Simple line chart

export const getSimpleLineChart = (): ApexOptions => ({
  chart: {
    height: 380,
    type: 'line',
    zoom: { enabled: false },
  },
  dataLabels: {
    enabled: false,
  },
  colors: [getColor('chart-primary')],
  stroke: {
    width: [2],
    curve: 'smooth',
  },
  series: [
    {
      name: 'Revenue',
      data: [12, 28, 18, 34, 42, 39, 48, 55, 63],
    },
  ],
  grid: {
    row: {
      colors: ['transparent', 'transparent'],
      opacity: 0.2,
    },
    borderColor: getColor('chart-order-color'),
  },
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
  xaxis: {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
  },
  responsive: [
    {
      breakpoint: 600,
      options: {
        chart: {
          toolbar: {
            show: false,
          },
        },
        legend: {
          show: false,
        },
      },
    },
  ],
})

export const getLineChart = (): ApexOptions => ({
  chart: {
    height: 380,
    type: 'line',
    zoom: { enabled: false },
    toolbar: { show: false },
  },
  colors: [getColor('chart-delta'), getColor('chart-alpha')],
  dataLabels: {
    enabled: true,
    style: {
      fontSize: '10px',
      fontWeight: 'bold',
      colors: [getColor('chart-delta'), getColor('chart-alpha')],
    },
    background: {
      enabled: true,
      padding: 8,
      borderRadius: 4,
    },
    offsetY: 3,
  },
  stroke: {
    width: [2, 2],
    curve: 'smooth',
  },
  series: [
    {
      name: 'Revenue - 2024',
      data: [45, 52, 48, 58, 63, 72, 80],
    },
    {
      name: 'Expenses - 2024',
      data: [25, 35, 32, 40, 38, 36, 34],
    },
  ],
  grid: {
    row: {
      colors: ['transparent', 'transparent'],
      opacity: 0.2,
    },
    borderColor: getColor('chart-order-color'),
    padding: {
      top: 0,
      right: 20,
      bottom: 0,
      left: 20,
    },
  },
  xaxis: {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
  },
  yaxis: {
    title: {
      text: 'Amount (in K)',
      offsetX: 0,
      style: {
        fontSize: '14px',
        fontWeight: 500,
      },
    },
    labels: {
      offsetX: -7,
    },
  },
  legend: {
    position: 'top',
    horizontalAlign: 'center',
    offsetY: 5,
  },
})

// Zoomable Timeseries

const userGrowthData = [
  [new Date('2024-02-01').getTime(), 4200000],
  [new Date('2024-02-02').getTime(), 4300000],
  [new Date('2024-02-03').getTime(), 4120000],
  [new Date('2024-02-04').getTime(), 4400000],
  [new Date('2024-02-05').getTime(), 4500000],
  [new Date('2024-02-06').getTime(), 4600000],
  [new Date('2024-02-07').getTime(), 4380000],
  [new Date('2024-02-08').getTime(), 4450000],
  [new Date('2024-02-09').getTime(), 4700000],
  [new Date('2024-02-10').getTime(), 4650000],
  [new Date('2024-02-11').getTime(), 4850000],
  [new Date('2024-02-12').getTime(), 4700000],
  [new Date('2024-02-13').getTime(), 4880000],
  [new Date('2024-02-14').getTime(), 4950000],
  [new Date('2024-02-15').getTime(), 5100000],
  [new Date('2024-02-16').getTime(), 5050000],
  [new Date('2024-02-17').getTime(), 4980000],
  [new Date('2024-02-18').getTime(), 5200000],
  [new Date('2024-02-19').getTime(), 5300000],
  [new Date('2024-02-20').getTime(), 5180000],
  [new Date('2024-02-21').getTime(), 5500000],
  [new Date('2024-02-22').getTime(), 5400000],
  [new Date('2024-02-23').getTime(), 5520000],
  [new Date('2024-02-24').getTime(), 5650000],
  [new Date('2024-02-25').getTime(), 5800000],
]

export const getZoomableTimeSeriesChart = (): ApexOptions => ({
  chart: {
    type: 'area',
    stacked: false,
    height: 360,
    zoom: {
      enabled: true,
    },
    toolbar: { show: true },
  },
  dataLabels: {
    enabled: false,
  },
  stroke: {
    width: [3],
  },
  series: [
    {
      name: 'User Growth',
      data: userGrowthData,
    },
  ],
  markers: {
    size: 0,
    // style: 'full',
  },
  colors: [getColor('chart-alpha')],
  grid: {
    row: {
      colors: ['transparent', 'transparent'],
      opacity: 0.2,
    },
    borderColor: getColor('chart-order-color'),
    padding: {
      right: 20,
    },
  },
  fill: {
    gradient: {
      shadeIntensity: 1,
      inverseColors: false,
      opacityFrom: 0.5,
      opacityTo: 0.1,
      stops: [0, 70, 80, 100],
    },
  },
  yaxis: {
    min: 1000000,
    max: 6000000,
    labels: {
      formatter: function (val: number) {
        return (val / 1000).toFixed(0) + 'K'
      },
    },
    title: {
      text: 'Users',
      offsetX: -5,
      style: {
        fontSize: '14px',
        fontWeight: 500,
      },
    },
  },
  xaxis: {
    type: 'datetime',
  },
  tooltip: {
    shared: false,
    y: {
      formatter: function (val: number) {
        return (val / 1000).toFixed(0) + 'K'
      },
    },
  },
})

// Syncing charts

export const getSyncingCharts = (): ApexOptions => ({
  chart: {
    type: 'line',
    height: 160,
    id: 'fb',
    group: 'social',
    toolbar: { show: false },
  },
  colors: [getColor('chart-primary')],
  stroke: {
    width: [3],
    curve: 'straight',
  },
  fill: {
    opacity: 1,
  },
  tooltip: {
    followCursor: false,
    x: {
      show: false,
    },
    marker: {
      show: false,
    },
    y: {
      formatter: function (val: number) {
        return String(val)
      },
    },
  },
  series: [
    {
      data: [
        [new Date('2024-05-01').getTime(), 28],
        [new Date('2024-05-02').getTime(), 35],
        [new Date('2024-05-03').getTime(), 32],
        [new Date('2024-05-04').getTime(), 30],
        [new Date('2024-05-05').getTime(), 34],
        [new Date('2024-05-06').getTime(), 38],
        [new Date('2024-05-07').getTime(), 36],
        [new Date('2024-05-08').getTime(), 40],
        [new Date('2024-05-09').getTime(), 42],
        [new Date('2024-05-10').getTime(), 39],
      ],
    },
  ],
  xaxis: {
    type: 'datetime',
    labels: {
      datetimeFormatter: {
        day: 'dd MMM',
      },
    },
  },
  grid: {
    row: {
      colors: ['transparent', 'transparent'], // takes an array which will be repeated on columns
      opacity: 0.2,
    },
    borderColor: getColor('chart-order-color'),
    padding: { right: 20 },
  },
})

export const getSyncingCharts2 = (): ApexOptions => ({
  chart: {
    height: 200,
    type: 'line',
    id: 'yt',
    group: 'social',
    toolbar: { show: false },
  },
  colors: [getColor('chart-alpha')],
  dataLabels: {
    enabled: false,
  },
  tooltip: {
    followCursor: false,
    x: {
      show: false,
    },
    marker: {
      show: false,
    },
    y: {
      formatter: function (val: number) {
        return val.toFixed(0)
      },
    },
  },
  stroke: {
    width: [3],
    curve: 'smooth',
  },
  series: [
    {
      data: [
        [new Date('2024-05-01').getTime(), 120],
        [new Date('2024-05-02').getTime(), 160],
        [new Date('2024-05-03').getTime(), 150],
        [new Date('2024-05-04').getTime(), 180],
        [new Date('2024-05-05').getTime(), 170],
        [new Date('2024-05-06').getTime(), 200],
        [new Date('2024-05-07').getTime(), 190],
        [new Date('2024-05-08').getTime(), 210],
        [new Date('2024-05-09').getTime(), 230],
        [new Date('2024-05-10').getTime(), 240],
      ],
    },
  ],
  fill: {
    gradient: {
      // enabled: true,
      opacityFrom: 0.6,
      opacityTo: 0.8,
    },
  },
  legend: {
    position: 'top',
    horizontalAlign: 'left',
  },
  xaxis: {
    type: 'datetime',
    labels: {
      datetimeFormatter: {
        day: 'dd MMM',
      },
    },
  },
  grid: {
    row: {
      colors: ['transparent', 'transparent'],
      opacity: 0.2,
    },
    borderColor: getColor('chart-order-color'),
    padding: { right: 20 },
  },
})

// Missing Data

export const getMissingLineChart = (): ApexOptions => ({
  chart: {
    height: 380,
    type: 'line',
    zoom: {
      enabled: false,
    },
    animations: {
      enabled: false,
    },
    toolbar: { show: false },
  },
  stroke: {
    width: [5, 5, 4],
    curve: 'straight',
  },
  series: [
    {
      name: 'Slack',
      data: [45, 50, 48, 60, 42, 55, null, 56, null, 60, null, 66, 50, 69, 75, 71],
    },
    {
      name: 'Zoom',
      data: [30, 28, 35, null, 25, 42, 39, null, 47, 32, 50, 41, null, 53, 45, 55],
    },
    {
      name: 'Notion',
      data: [null, 25, 35, 20, 30, 22, 38, null, 34, 29, 37, 39, 45, 41, 33, 44],
    },
  ],
  labels: ['01 Jan', '02 Jan', '03 Jan', '04 Jan', '05 Jan', '06 Jan', '07 Jan', '08 Jan', '09 Jan', '10 Jan', '11 Jan', '12 Jan', '13 Jan', '14 Jan', '15 Jan', '16 Jan'],
  colors: [getColor('chart-secondary'), getColor('chart-beta'), getColor('chart-delta')],
  grid: {
    row: {
      colors: ['transparent', 'transparent'], // takes an array which will be repeated on columns
      opacity: 0.2,
    },
    borderColor: getColor('chart-order-color'),
    padding: {
      bottom: 5,
    },
  },
  legend: {
    offsetY: 5,
  },
})

// Dashed line chart

export const getDashedLineChart = (): ApexOptions => ({
  chart: {
    height: 380,
    type: 'line',
    zoom: {
      enabled: false,
    },
    toolbar: { show: false },
  },
  dataLabels: {
    enabled: false,
  },
  stroke: {
    width: [3, 5, 3],
    curve: 'straight',
    dashArray: [0, 8, 5],
  },
  series: [
    {
      name: 'Charging Time',
      data: [30, 45, 28, 20, 36, 25, 22, 18, 10, 12, 20, 15],
    },
    {
      name: 'Energy Delivered',
      data: [22, 35, 55, 38, 16, 21, 33, 40, 39, 53, 30, 34],
    },
    {
      name: 'Sessions Completed',
      data: [60, 50, 65, 85, 58, 40, 70, 60, 90, 63, 48, 52],
    },
  ],
  markers: {
    size: 0,
  },
  xaxis: {
    categories: ['01 Mar', '02 Mar', '03 Mar', '04 Mar', '05 Mar', '06 Mar', '07 Mar', '08 Mar', '09 Mar', '10 Mar', '11 Mar', '12 Mar'],
  },
  colors: [getColor('chart-primary'), getColor('chart-secondary'), getColor('gray')],
  tooltip: {
    y: {
      title: {
        formatter: function (seriesName: string) {
          if (seriesName === 'Charging Time') return 'Charging Time (mins)'
          else if (seriesName === 'Energy Delivered') return 'Energy Delivered (kWh)'
          else if (seriesName === 'Sessions Completed') return 'Sessions'
          return seriesName
        },
      },
    },
  },
  grid: {
    borderColor: getColor('chart-order-color'),
  },
  legend: {
    offsetY: 7,
  },
})

// Stepline Charts

export const getStepLineChart = (): ApexOptions => ({
  chart: {
    type: 'line',
    height: 360,
    toolbar: { show: false },
  },
  stroke: {
    curve: 'stepline',
  },
  dataLabels: {
    enabled: false,
  },
  series: [
    {
      data: [120, 115, 130, 90, 70, 95, 85, 75, 140, 140, 125],
    },
  ],
  colors: [getColor('chart-zeta')],
  markers: {
    hover: {
      sizeOffset: 4,
    },
  },
  grid: {
    padding: { right: 20 },
  },
})

// Brush Chart

type YRange = {
  min: number
  max: number
}

function generateDayWiseTimeSeries(baseval: Date, count: number, yrange: YRange): [number, number][] {
  let i = 0
  const series: [number, number][] = []
  while (i < count) {
    const x = new Date(baseval.getTime())
    const y = Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min

    series.push([x.getTime(), y])
    baseval.setDate(baseval.getDate() + 1)
    i++
  }
  return series
}
const common = generateDayWiseTimeSeries(new Date('01 Jan 2024'), 185, {
  min: 40,
  max: 90,
})

export const getBrushChart = (): ApexOptions => ({
  series: [
    {
      data: common,
    },
  ],
  chart: {
    id: 'chart2',
    type: 'line',
    height: 230,
    toolbar: {
      autoSelected: 'pan',
      show: false,
    },
  },
  colors: [getColor('chart-secondary')],
  stroke: {
    width: 3,
  },
  dataLabels: {
    enabled: false,
  },
  fill: {
    opacity: 1,
  },
  markers: {
    size: 0,
  },
  xaxis: {
    type: 'datetime',
  },
})

export const getBrushChart2 = (): ApexOptions => ({
  series: [
    {
      data: common,
    },
  ],
  chart: {
    id: 'chart1',
    height: 130,
    type: 'area',
    brush: {
      target: 'chart2',
      enabled: true,
    },
    selection: {
      enabled: true,
      xaxis: {
        min: new Date('15 Mar 2024').getTime(),
        max: new Date('15 May 2024').getTime(),
      },
    },
  },
  colors: [getColor('chart-secondary')],
  fill: {
    type: 'gradient',
    gradient: {
      opacityFrom: 0.91,
      opacityTo: 0.1,
    },
  },
  xaxis: {
    type: 'datetime',
    tooltip: {
      enabled: false,
    },
  },
  yaxis: {
    tickAmount: 2,
  },
})

// Realtime chart

export function createDailyTimeSeries(
  baseval: number,
  count: number,
  yrange: {
    min: number
    max: number
  }
): [number, number][] {
  const series: [number, number][] = []
  for (let i = 0; i < count; i++) {
    const x = baseval
    const y = Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min
    series.push([x, y])
    baseval += 86400000 // 1 day in ms
  }
  return series
}

export function generateNewPoint(baseval: number, yrange: { min: number; max: number }): [number, number] {
  const newDate = baseval + 86400000
  const y = Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min
  return [newDate, y]
}

export const getRealTimeChartOptions = (baseval: [number, number][]): ApexOptions => ({
  chart: {
    height: 350,
    type: 'line',
    animations: {
      enabled: true,
      dynamicAnimation: {
        speed: 2000,
      },
    },
    toolbar: { show: false },
    zoom: { enabled: false },
  },
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 3 },
  colors: [getColor('chart-primary')],
  markers: { size: 0 },
  xaxis: {
    type: 'datetime',
    range: 86400000 * 9,
  },
  yaxis: { max: 100 },
  legend: { show: false },
  grid: {
    borderColor: '#e0e0e0',
  },
})

export const getLineChartWithAnnotations = (): ApexOptions => ({
  annotations: {
    yaxis: [
      {
        y: 4200,
        borderColor: getColor('chart-primary'),
        label: {
          borderColor: getColor('chart-primary'),
          style: {
            color: '#ffffff',
            background: getColor('chart-primary'),
            fontWeight: 'bold',
          },
          text: 'Support Level',
        },
      },
    ],
    xaxis: [
      {
        x: new Date('2024-09-07').getTime(),
        borderColor: getColor('chart-zeta'),
        label: {
          borderColor: getColor('chart-zeta'),
          style: {
            color: '#ffffff',
            background: getColor('chart-zeta'),
            fontWeight: 'bold',
          },
          text: 'Launch Event',
        },
      },
      {
        x: new Date('2024-10-01').getTime(),
        borderColor: getColor('chart-beta'),
        label: {
          borderColor: getColor('chart-beta'),
          style: {
            color: '#ffffff',
            background: getColor('chart-beta'),
            fontWeight: 'bold',
          },
          orientation: 'horizontal',
          text: 'Campaign Start',
        },
      },
    ],
    points: [
      {
        x: new Date('2024-09-20').getTime(),
        y: 4800,
        marker: {
          size: 8,
          fillColor: '#ffffff',
          strokeColor: getColor('chart-alpha'),
          // radius: 2,
        },
        label: {
          borderColor: getColor('chart-alpha'),
          offsetY: 0,
          style: {
            color: '#ffffff',
            background: getColor('chart-alpha'),
            fontWeight: 'bold',
          },
          text: 'Peak Point',
        },
      },
    ],
  },
  chart: {
    height: 380,
    type: 'line',
    id: 'custom-line-chart',
    toolbar: { show: false },
  },
  colors: [getColor('chart-secondary')],
  dataLabels: {
    enabled: false,
  },
  stroke: {
    width: 3,
    curve: 'smooth',
  },
  series: [
    {
      name: 'Visitors',
      data: [
        { x: new Date('2024-09-01').getTime(), y: 4100 },
        { x: new Date('2024-09-05').getTime(), y: 4300 },
        { x: new Date('2024-09-10').getTime(), y: 4500 },
        { x: new Date('2024-09-15').getTime(), y: 4700 },
        { x: new Date('2024-09-20').getTime(), y: 4800 },
        { x: new Date('2024-09-25').getTime(), y: 4600 },
        { x: new Date('2024-10-01').getTime(), y: 4400 },
        { x: new Date('2024-10-10').getTime(), y: 4200 },
        { x: new Date('2024-10-15').getTime(), y: 4000 },
      ],
    },
  ],
  xaxis: {
    type: 'datetime',
  },
  yaxis: {
    title: {
      text: 'Unique Visitors',
      offsetX: -5,
      style: {
        fontSize: '14px',
        fontWeight: 500,
      },
    },
  },
  grid: {
    row: {
      colors: ['transparent', 'transparent'],
      opacity: 0.2,
    },
    borderColor: '#dee2e6',
    padding: {
      right: 20,
    },
  },
  responsive: [
    {
      breakpoint: 600,
      options: {
        chart: {
          toolbar: {
            show: false,
          },
        },
        legend: {
          show: false,
        },
      },
    },
  ],
})

export const getGradientLineChart = (): ApexOptions => ({
  chart: {
    height: 374,
    type: 'line',
    toolbar: { show: false },
  },
  forecastDataPoints: {
    count: 7,
  },
  stroke: {
    width: 5,
    curve: 'smooth',
  },
  series: [
    {
      name: 'Followers',
      data: [3, 5, 9, 12, 18, 25, 21, 17, 13, 19, 23, 16, 20, 22, 19, 15, 11, 14],
    },
  ],
  xaxis: {
    type: 'datetime',
    categories: ['01/01/2000', '02/01/2000', '03/01/2000', '04/01/2000', '05/01/2000', '06/01/2000', '07/01/2000', '08/01/2000', '09/01/2000', '10/01/2000', '11/01/2000', '12/01/2000', '01/01/2001', '02/01/2001', '03/01/2001', '04/01/2001', '05/01/2001', '06/01/2001'],
  },
  fill: {
    type: 'gradient',
    gradient: {
      shade: 'dark',
      gradientToColors: ['#007bff'],
      shadeIntensity: 1,
      type: 'vertical',
      opacityFrom: 0.8,
      opacityTo: 1,
      stops: [0, 100],
    },
  },
  markers: {
    size: 4,
    // opacity: 0.9,
    colors: ['#ffbc00'],
    // strokeColor: '#fff',
    strokeWidth: 2,
    // style: 'inverted',
    hover: {
      size: 7,
    },
  },
  yaxis: {
    min: -10,
    max: 40,
    title: {
      text: 'Followers Count',
      offsetX: -5,
      style: {
        fontSize: '14px',
        fontWeight: 500,
      },
    },
  },
  grid: {
    row: {
      colors: ['transparent', 'transparent'], // takes an array which will be repeated on columns
      opacity: 0.2,
    },
    borderColor: getColor('chart-order-color'),
    padding: { right: 20 },
  },
  responsive: [
    {
      breakpoint: 600,
      options: {
        chart: {
          toolbar: {
            show: false,
          },
        },
        legend: {
          show: false,
        },
      },
    },
  ],
})
