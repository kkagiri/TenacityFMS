import { getColor } from '@/utils/helpers'
import { EChartsOption, MarkLineComponentOption, ScatterSeriesOption } from 'echarts'
import { CallbackDataParams } from 'echarts/types/dist/shared'

// basic scatter chart

export const getScatterChart = (): EChartsOption => ({
  tooltip: {
    trigger: 'item',
    padding: [5, 10],
    backgroundColor: getColor('card'),
    borderColor: getColor('default-300'),
    textStyle: { color: getColor('default-600') },
    borderWidth: 1,
    transitionDuration: 0.125,
    axisPointer: { type: 'none' },
    shadowBlur: 2,
    shadowColor: 'rgba(76, 76, 92, 0.15)',
    shadowOffsetX: 0,
    shadowOffsetY: 1,
  },
  xAxis: {
    axisLine: {
      lineStyle: {
        type: 'dashed',
        color: getColor('light'),
      },
    },
    axisLabel: {
      show: true,
      color: getColor('body-color'),
    },
    splitLine: {
      lineStyle: {
        color: 'rgba(133, 141, 152, 0.1)',
        type: 'dashed',
      },
    },
  },
  yAxis: {
    axisLine: {
      lineStyle: {
        type: 'dashed',
        color: getColor('light'),
      },
    },
    axisLabel: {
      show: true,
      color: getColor('body-color'),
    },
    splitLine: {
      lineStyle: {
        color: 'rgba(133, 141, 152, 0.1)',
        type: 'dashed',
      },
    },
  },
  textStyle: {
    fontFamily: getComputedStyle(document.body).fontFamily,
  },
  series: [
    {
      data: [
        [10, 8.04],
        [8.07, 6.95],
        [13, 7.58],
        [9.05, 8.81],
        [11, 8.33],
        [14, 7.66],
        [13.4, 6.81],
        [10, 6.33],
        [14, 8.96],
        [12.5, 6.82],
        [9.15, 7.2],
        [11.5, 7.2],
        [3.03, 4.23],
        [12.2, 7.83],
        [2.02, 4.47],
        [1.05, 3.33],
        [4.05, 4.96],
        [6.03, 7.24],
        [12, 6.26],
        [12, 8.84],
        [7.08, 5.82],
        [5.02, 5.68],
      ],
      type: 'scatter',
      itemStyle: {
        color: getColor('chart-beta'),
      },
    },
  ],
  grid: {
    right: 8,
    left: 5,
    bottom: 5,
    top: 8,
    containLabel: true,
  },
})

// bubble chart

const countries: string[] = ['Australia', 'Canada', 'China', 'Finland', 'France', 'Germany', 'India', 'Japan', 'South Korea', 'New Zealand', 'Norway', 'Poland', 'Russia', 'United Kingdom', 'United States']

// Each data element: [GDP per capita, Life expectancy, Population, Country, Year]
type BubbleData = [number, number, number, string, number]

const generateRandomData = (year: number): BubbleData[] =>
  countries.map((country) => [
    Math.floor(Math.random() * 50000 + 5000), // GDP per capita
    Math.floor(Math.random() * 30 + 60), // Life expectancy
    Math.floor(Math.random() * 1_000_000_000 + 5_000_000), // Population
    country,
    year,
  ])

const data1: [BubbleData[], BubbleData[]] = [generateRandomData(1990), generateRandomData(2015)]

export const getBubbleChart = (): EChartsOption => ({
  title: {
    text: '1990 and 2015 GDP vs Life Expectancy',
    left: 0,
    top: 0,
    textStyle: {
      color: getColor('body-color'),
      fontWeight: 500,
      fontSize: 12,
    },
  },
  legend: {
    right: '10px',
    top: '0',
    data: ['1990', '2015'],
    textStyle: {
      color: getColor('body-color'),
    },
  },
  xAxis: {
    axisLine: {
      lineStyle: {
        type: 'dashed',
        color: getColor('light'),
      },
    },
    axisLabel: {
      show: true,
      formatter: (value: number) => value / 1000 + 'k',
      color: getColor('body-color'),
    },
    splitLine: {
      lineStyle: {
        color: 'rgba(133, 141, 152, 0.1)',
        type: 'dashed',
      },
    },
  },
  yAxis: {
    scale: true,
    axisLine: {
      lineStyle: {
        type: 'dashed',
        color: getColor('light'),
      },
    },
    axisLabel: {
      show: true,
      color: getColor('body-color'),
    },
    splitLine: {
      lineStyle: {
        color: 'rgba(133, 141, 152, 0.1)',
        type: 'dashed',
      },
    },
  },
  textStyle: {
    fontFamily: getComputedStyle(document.body).fontFamily,
  },
  series: [
    {
      name: '1990',
      data: data1[0],
      type: 'scatter',
      symbolSize: (val: BubbleData) => Math.sqrt(val[2]) / 500,
      emphasis: {
        focus: 'series',
        label: {
          color: getColor('default-400'),
          show: true,
          formatter: (param: CallbackDataParams) => (Array.isArray(param.data) ? (param.data as BubbleData)[3] : ''),
          position: 'top',
        },
      },
      itemStyle: {
        color: getColor('chart-primary', 0.7),
      },
    } as ScatterSeriesOption,
    {
      name: '2015',
      data: data1[1],
      type: 'scatter',
      symbolSize: (val: BubbleData) => Math.sqrt(val[2]) / 700,
      emphasis: {
        focus: 'series',
        label: {
          color: getColor('body-color'),
          show: true,
          formatter: (param: CallbackDataParams) => (Array.isArray(param.data) ? (param.data as BubbleData)[3] : ''),
          position: 'top',
        },
      },
      itemStyle: {
        color: getColor('chart-gamma', 0.7),
      },
    } as ScatterSeriesOption,
  ],
  grid: {
    left: 5,
    right: 10,
    bottom: 5,
    top: '15%',
    containLabel: true,
  },
})

// quartet scatter chart

const datasets = [
  [
    [10, 8.04],
    [8, 6.95],
    [13, 7.58],
    [9, 8.81],
    [11, 8.33],
    [14, 9.96],
    [6, 7.24],
    [4, 4.26],
    [12, 10.84],
    [7, 4.82],
    [5, 5.68],
  ],
  [
    [10, 9.14],
    [8, 8.14],
    [13, 8.74],
    [9, 8.77],
    [11, 9.26],
    [14, 8.1],
    [6, 6.13],
    [4, 3.1],
    [12, 9.13],
    [7, 7.26],
    [5, 4.74],
  ],
  [
    [10, 7.46],
    [8, 6.77],
    [13, 12.74],
    [9, 7.11],
    [11, 7.81],
    [14, 8.84],
    [6, 6.08],
    [4, 5.39],
    [12, 8.15],
    [7, 6.42],
    [5, 5.73],
  ],
  [
    [8, 6.58],
    [8, 5.76],
    [8, 7.71],
    [8, 8.84],
    [8, 8.47],
    [8, 7.04],
    [8, 5.25],
    [19, 12.5],
    [8, 5.56],
    [8, 7.91],
    [8, 6.89],
  ],
]

const xAxisStyle = () => ({
  axisLabel: { color: getColor('body-color') },
  axisLine: {
    show: true,
    lineStyle: { color: getColor('border-color'), type: 'dashed' as const },
  },
  splitLine: {
    show: true,
    lineStyle: { color: getColor('border-color'), type: 'dashed' as const },
  },
})

const yAxisStyle = () => ({
  axisLabel: { color: getColor('body-color') },
  splitLine: {
    show: true,
    lineStyle: { color: getColor('border-color'), type: 'dashed' as const },
  },
  axisLine: {
    show: true,
    lineStyle: { color: getColor('border-bg'), type: 'dashed' as const },
  },
})

const markLine: MarkLineComponentOption = {
  animation: false,
  label: {
    formatter: 'y = 0.5 * x + 3',
    align: 'right',
    color: getColor('body-color'),
    fontWeight: 600,
  },
  lineStyle: { type: 'solid' },
  tooltip: {
    formatter: 'y = 0.5 * x + 3',
  },
  data: [
    [
      { coord: [0, 3], symbol: 'none' },
      { coord: [20, 13], symbol: 'none' },
    ],
  ],
}

const gridLarge = [
  { left: '7%', top: '10%', width: '38%', height: '38%' },
  {
    right: '7%',
    top: '10%',
    width: '38%',
    height: '38%',
  },
  { left: '7%', bottom: '7%', width: '38%', height: '38%' },
  {
    right: '7%',
    bottom: '7%',
    width: '38%',
    height: '38%',
  },
]

const gridSmall = [
  { left: 6, right: 7, top: '4%', height: '20%' },
  {
    left: 6,
    right: 7,
    top: '29%',
    height: '20%',
  },
  { left: 6, right: 7, bottom: '26%', height: '20%' },
  { left: 6, right: 7, bottom: 25, height: '20%' },
]

export const getQuartetScatterChart = (): EChartsOption => ({
  color: [getColor('chart-primary'), getColor('chart-alpha'), getColor('chart-gamma'), getColor('chart-beta')],
  tooltip: {
    trigger: 'item',
    padding: [5, 10],
    backgroundColor: getColor('card'),
    borderColor: getColor('default-300'),
    textStyle: { color: getColor('default-600') },
    borderWidth: 1,
    transitionDuration: 0.125,
    axisPointer: { type: 'none' },
    shadowBlur: 2,
    shadowColor: 'rgba(76, 76, 92, 0.15)',
    shadowOffsetX: 0,
    shadowOffsetY: 1,
    formatter: 'Group {a}: ({c})',
  },
  title: {
    text: "Anscombe's quartet",
    left: 'center',
    top: 0,
    textStyle: { color: getColor('body-color'), fontSize: 14 },
  },
  textStyle: {
    fontFamily: getComputedStyle(document.body).fontFamily,
  },
  grid: window.innerWidth < 768 ? gridSmall : gridLarge,
  xAxis: [
    { gridIndex: 0, min: 0, max: 20, ...xAxisStyle() },
    {
      gridIndex: 1,
      min: 0,
      max: 20,
      ...xAxisStyle(),
    },
    { gridIndex: 2, min: 0, max: 20, ...xAxisStyle() },
    { gridIndex: 3, min: 0, max: 20, ...xAxisStyle() },
  ],
  yAxis: [
    { gridIndex: 0, min: 0, max: 15, ...yAxisStyle() },
    {
      gridIndex: 1,
      min: 0,
      max: 15,
      ...yAxisStyle(),
    },
    { gridIndex: 2, min: 0, max: 15, ...yAxisStyle() },
    { gridIndex: 3, min: 0, max: 15, ...yAxisStyle() },
  ],
  series: [
    {
      name: 'I',
      type: 'scatter',
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: datasets[0],
      markLine,
    },
    {
      name: 'II',
      type: 'scatter',
      xAxisIndex: 1,
      yAxisIndex: 1,
      data: datasets[1],
      markLine,
    },
    {
      name: 'III',
      type: 'scatter',
      xAxisIndex: 2,
      yAxisIndex: 2,
      data: datasets[2],
      markLine,
    },
    {
      name: 'IV',
      type: 'scatter',
      xAxisIndex: 3,
      yAxisIndex: 3,
      data: datasets[3],
      markLine,
    },
  ],
  xs: { grid: gridSmall },
  md: { grid: gridLarge },
})

// single axis scatter chart

const hours: string[] = ['12am', '1am', '2am', '3am', '4am', '5am', '6am', '7am', '8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm', '10pm', '11pm']

const days: string[] = ['Saturday', 'Friday', 'Thursday', 'Wednesday', 'Tuesday', 'Monday', 'Sunday']

type ScatterPoint = [number, number, number]
const data: ScatterPoint[] = []

for (let day = 0; day < 7; day++) {
  for (let hour = 0; hour < 24; hour++) {
    const value = Math.floor(Math.random() * 10)
    data.push([hour, day, value])
  }
}

export const getSingleAxisScatterChart = (): EChartsOption => ({
  tooltip: {
    trigger: 'item',
    padding: [5, 10],
    backgroundColor: getColor('card'),
    borderColor: getColor('default-300'),
    textStyle: { color: getColor('default-600') },
    borderWidth: 1,
    transitionDuration: 0.125,
    axisPointer: { type: 'none' },
    shadowBlur: 2,
    shadowColor: 'rgba(76, 76, 92, 0.15)',
    shadowOffsetX: 0,
    shadowOffsetY: 1,
    position: 'top',
    formatter: (params: CallbackDataParams | CallbackDataParams[]): string => {
      const list = Array.isArray(params) ? (params as CallbackDataParams[]) : [params as CallbackDataParams]

      const val = list[0].value as [number, number, number]
      return `${days[val[1]]}<br/>${hours[val[0]]} : ${val[2]}`
    },
  },
  xAxis: {
    type: 'category',
    data: hours,
    boundaryGap: false,
    splitLine: {
      show: true,
      lineStyle: { color: getColor('default-300'), type: 'dashed' },
    },
    axisLine: { show: false },
    axisTick: {
      lineStyle: { color: getColor('default-300'), type: 'dashed' },
    },
  },
  yAxis: {
    type: 'category',
    data: days,
    axisLine: { show: false },
    axisTick: {
      lineStyle: { color: getColor('default-300'), type: 'dashed' },
    },
    axisLabel: { margin: 15, color: getColor('body-color') },
  },
  textStyle: {
    fontFamily: getComputedStyle(document.body).fontFamily,
  },
  series: [
    {
      name: 'Punch Card',
      type: 'scatter',
      symbolSize: (val: ScatterPoint) => 2 * val[2],
      data,
      animationDelay: (idx: number) => 5 * idx,
      itemStyle: { color: getColor('chart-primary') },
    },
  ],
  grid: {
    right: 12,
    left: 5,
    bottom: 5,
    top: 5,
    containLabel: true,
  },
})
