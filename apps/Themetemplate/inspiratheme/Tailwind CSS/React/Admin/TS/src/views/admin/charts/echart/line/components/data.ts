import { getColor } from '@/utils/helpers'
import { EChartsOption } from 'echarts'
import { CallbackDataParams } from 'echarts/types/dist/shared'

// LineChart
export const getLineChart = (): EChartsOption => ({
  grid: {
    left: '0%',
    right: '0%',
    bottom: '0%',
    top: '4%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    axisLine: {
      lineStyle: {
        color: getColor('body-secondary-color'),
      },
    },
  },
  yAxis: {
    type: 'value',
    axisLine: {
      lineStyle: {
        color: '#858d98',
      },
    },
    splitLine: {
      lineStyle: {
        color: 'rgba(133, 141, 152, 0.1)',
      },
    },
  },
  series: [
    {
      data: [150, 180, 120, 190, 110, 170, 130],
      type: 'line',
    },
  ],
  textStyle: {
    fontFamily: getComputedStyle(document.body).fontFamily,
  },
  color: [getColor('chart-primary')],
})

// Stacked Line Chart
export const getStackedLineChart = (): EChartsOption => ({
  textStyle: {
    fontFamily: getComputedStyle(document.body).fontFamily,
  },
  tooltip: {
    trigger: 'axis',
    padding: [5, 0],
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
    formatter: (params) => {
      const list = Array.isArray(params) ? (params as CallbackDataParams[]) : [params as CallbackDataParams]

      const title = list[0].name
      let content = `<div style="font-size: 14px; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid ${getColor('border-color')}; margin-bottom: 8px; padding: 3px 10px 8px;">${title}</div>`

      list.forEach((item) => {
        const val = Array.isArray(item.value) ? (item.value[1] ?? item.value[0]) : item.value
        content += `<div style="margin-top: 4px; padding: 3px 15px;">
                      <span style="display:inline-block;margin-right:5px;border-radius:50%;width:10px;height:10px;background-color:${item.color};"></span>
                      ${item.seriesName} : <strong>${val}</strong>
                    </div>`
      })

      return content
    },
  },
  xAxis: {
    type: 'category',
    data: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    boundaryGap: false,
    axisLine: {
      lineStyle: {
        color: getColor('default-100'),
        type: 'dashed',
      },
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      color: getColor('body-color'),
      margin: 15,
    },
    splitLine: {
      show: false,
    },
  },
  yAxis: {
    type: 'value',
    splitLine: {
      lineStyle: {
        color: getColor('border-color'),
        type: 'dashed',
      },
    },
    boundaryGap: [0, 0],
    axisLabel: {
      show: true,
      color: getColor('body-color'),
      margin: 15,
    },
    axisTick: {
      show: false,
    },
    axisLine: {
      show: false,
    },
  },
  series: [
    {
      name: 'Matcha Latte',
      type: 'line',
      symbolSize: 6,
      itemStyle: {
        color: getColor('chart-delta'),
        borderColor: getColor('info'),
        borderWidth: 2,
      },
      lineStyle: {
        color: getColor('chart-delta'),
      },
      symbol: 'circle',
      stack: 'product',
      data: [120, 132, 101, 134, 90, 230, 210],
    },
    {
      name: 'Milk Tea',
      type: 'line',
      symbolSize: 10,
      itemStyle: {
        color: getColor('chart-alpha'),
        borderColor: getColor('chart-alpha'),
        borderWidth: 2,
      },
      lineStyle: {
        color: getColor('chart-alpha'),
      },
      symbol: 'circle',
      stack: 'product',
      data: [220, 182, 191, 234, 290, 330, 310],
    },
    {
      name: 'Cheese Cocoa',
      type: 'line',
      symbolSize: 10,
      itemStyle: {
        color: getColor('chart-beta'),
        borderColor: getColor('chart-beta'),
        borderWidth: 2,
      },
      lineStyle: {
        color: getColor('chart-beta'),
      },
      symbol: 'circle',
      stack: 'product',
      data: [150, 232, 201, 154, 190, 330, 410],
    },
    {
      name: 'Cheese Brownie',
      type: 'line',
      symbolSize: 10,
      itemStyle: {
        color: getColor('chart-gamma'),
        borderColor: getColor('chart-gamma'),
        borderWidth: 2,
      },
      lineStyle: {
        color: getColor('chart-gamma'),
      },
      symbol: 'circle',
      stack: 'product',
      data: [320, 332, 301, 334, 390, 330, 320],
    },
    {
      name: 'Matcha Cocoa',
      type: 'line',
      symbolSize: 10,
      itemStyle: {
        color: getColor('chart-primary'),
        borderColor: getColor('chart-primary'),
        borderWidth: 2,
      },
      lineStyle: {
        color: getColor('chart-primary'),
      },
      symbol: 'circle',
      stack: 'product',
      data: [820, 932, 901, 934, 1290, 1330, 1320],
    },
  ],
  grid: {
    right: 22,
    left: 5,
    bottom: 5,
    top: 8,
    containLabel: true,
  },
})

// Line Marker Chart
export const getLineMarkerChart = (): EChartsOption => ({
  textStyle: {
    fontFamily: getComputedStyle(document.body).fontFamily,
  },
  color: [getColor('primary'), getColor('chart-gamma')],
  tooltip: {
    trigger: 'axis',
    padding: [5, 0],
    backgroundColor: getColor('card'),
    borderColor: getColor('default-300'),
    textStyle: { color: getColor('default-600') },
    borderWidth: 1,
    transitionDuration: 0.125,
    axisPointer: { type: 'none' },
    shadowBlur: 2,
    shadowColor: 'rgba(76, 76, 92, 0.15)',
    shadowOffsetX: 0,
    shadowOffsetY: 1, // Custom HTML formatter
    formatter: (params) => {
      const list = Array.isArray(params) ? (params as CallbackDataParams[]) : [params as CallbackDataParams]

      const title = list[0].name
      let content = `<div style="font-size: 14px; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid ${getColor('border-color')}; margin-bottom: 8px; padding: 3px 10px 8px;">${title}</div>`

      list.forEach((item) => {
        const val = Array.isArray(item.value) ? item.value.join(', ') : item.value
        content += `<div style="margin-top: 4px; padding: 3px 15px;">
                      <span style="display:inline-block;margin-right:5px;border-radius:50%;width:10px;height:10px;background-color:${item.color};"></span>
                      ${item.seriesName} : <strong>${val}</strong>
                    </div>`
      })
      return content
    },
  },
  xAxis: {
    type: 'category',
    data: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    boundaryGap: false,
    axisLine: {
      lineStyle: { color: getColor('default-100'), type: 'solid' },
    },
    axisTick: { show: false },
    axisLabel: {
      color: getColor('body-color'),
      margin: 15,
    },
    splitLine: { show: false },
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: getColor('border-color') } },
    boundaryGap: [0, 0],
    axisLabel: {
      show: true,
      color: getColor('body-color'),
      margin: 15,
    },
    axisTick: { show: false },
    axisLine: { show: false },
  },
  series: [
    {
      name: 'Max',
      type: 'line',
      data: [10, 11, 13, 11, 12, 9, 12],
      symbolSize: 10,
      lineStyle: { color: getColor('chart-primary') },
      symbol: 'circle',
      markPoint: {
        itemStyle: { color: getColor('chart-primary') },
        label: { color: '#fff' },
        data: [
          { type: 'max', name: 'Max' },
          { type: 'min', name: 'Min' },
        ],
      },
      markLine: {
        lineStyle: { color: getColor('chart-primary') },
        label: { color: getColor('body-color') },
        data: [{ type: 'average', name: 'average' }],
      },
    },
    {
      name: 'Min',
      type: 'line',
      data: [1, -2, 2, 5, 3, 2, 0],
      symbolSize: 10,
      itemStyle: {
        color: getColor('chart-beta'),
        borderColor: getColor('chart-beta'),
        borderWidth: 2,
      },
      lineStyle: { color: getColor('chart-beta') },
      symbol: 'circle',
      markPoint: {
        itemStyle: { color: getColor('chart-beta') },
        label: { color: '#fff' },
        data: [{ name: 'Weekly lowest', value: -2, xAxis: 1, yAxis: -1.5 }],
      },
      markLine: {
        lineStyle: { color: getColor('chart-beta') },
        label: { color: getColor('body-color') },
        data: [
          { type: 'average', name: 'average' },
          [
            { symbol: 'none', x: '90%', yAxis: 'max' },
            {
              symbol: 'circle',
              label: { position: 'start', formatter: 'Max' },
              type: 'max',
              name: 'Highest point',
            },
          ],
        ],
      },
    },
  ],
  grid: {
    right: '5%',
    left: '5%',
    bottom: '10%',
    top: '15%',
  },
})

// Dynamic Chart
function randomData(): DataPoint {
  now = new Date(+now + oneDay)
  value = value + Math.random() * 21 - 10
  return {
    name: now.toString(),
    value: [[now.getFullYear(), now.getMonth() + 1, now.getDate()].join('/'), Math.round(value)] as [string, number],
  }
}

interface DataPoint {
  name: string
  value: [string, number]
}

const data: DataPoint[] = []
let now = new Date(2023, 9, 3)
const oneDay = 24 * 3600 * 1000
let value = Math.random() * 100

for (let i = 0; i < 1000; i++) {
  data.push(randomData())
}

export const getDynamicLineChart = (): EChartsOption => ({
  textStyle: {
    fontFamily: getComputedStyle(document.body).fontFamily,
  },
  color: [getColor('chart-zeta')],
  tooltip: {
    trigger: 'axis',
    formatter: (params) => {
      const p = Array.isArray(params) ? params[0] : params
      const date = new Date(p.name as string)
      const day = date.getDate()
      const month = date.toLocaleString('default', { month: 'long' })
      const year = date.getFullYear()
      const value = Array.isArray(p.value) ? p.value[1] : p.value
      return `${day} ${month}, ${year} : ${value}`
    },
    axisPointer: {
      animation: false,
      type: 'none',
    },

    padding: [12, 16],
    backgroundColor: getColor('card'),
    borderColor: getColor('default-300'),
    textStyle: { color: getColor('default-600') },
    borderWidth: 1,
    transitionDuration: 0.125,
    shadowBlur: 2,
    shadowColor: 'rgba(76, 76, 92, 0.15)',
    shadowOffsetX: 0,
    shadowOffsetY: 1,
  },
  xAxis: {
    type: 'time',
    splitLine: {
      show: false,
    },
    axisLine: {
      lineStyle: { color: getColor('default-100'), type: 'solid' },
    },
    axisLabel: {
      color: getColor('body-color'),
      margin: 15,
    },
  },
  yAxis: {
    type: 'value',
    boundaryGap: [0, '100%'],
    axisLabel: {
      show: true,
      color: getColor('body-color'),
      margin: 15,
    },
    splitLine: {
      lineStyle: {
        color: 'rgba(133, 141, 152, 0.1)',
      },
    },
  },
  grid: {
    right: '5%',
    left: '7%',
    bottom: '10%',
    top: '5%',
  },
  series: [
    {
      name: 'Fake Data',
      type: 'line',
      showSymbol: false,
      data: data,
      lineStyle: {
        width: 3, // <-- Set line thickness here
      },
    },
  ],
})

// setInterval(function () {
//     for (let i = 0; i < 5; i++) {
//         data.shift();
//         data.push(randomData());
//     }
//     getDynamicLineChart.chart.setOption({
//         series: [{
//             data: data
//         }]
//     });
// }, 1000);

// step line chart

export const getStepLine = (): EChartsOption => ({
  tooltip: {
    trigger: 'axis',
    padding: [12, 16],
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
  legend: {
    data: ['Step Start', 'Step Middle', 'Step End'],
    textStyle: {
      //The style of the legend text
      color: '#858d98',
    },
    top: 0, // or 'top'
    left: 'center',
  },
  grid: {
    left: '0%',
    right: '0%',
    bottom: '0%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    axisLine: {
      lineStyle: { color: getColor('default-100'), type: 'dashed' },
    },
    axisLabel: {
      color: getColor('body-color'),
      margin: 15,
    },
  },
  yAxis: {
    type: 'value',
    axisLine: {
      lineStyle: {
        color: '#858d98',
      },
    },
    splitLine: {
      lineStyle: {
        color: 'rgba(133, 141, 152, 0.1)',
      },
    },
  },
  textStyle: {
    fontFamily: getComputedStyle(document.body).fontFamily,
  },
  color: [getColor('chart-zeta'), getColor('chart-beta'), getColor('chart-alpha')],
  series: [
    {
      name: 'Step Start',
      type: 'line',
      step: 'start',
      data: [120, 132, 101, 134, 90, 230, 210],
    },
    {
      name: 'Step Middle',
      type: 'line',
      step: 'middle',
      data: [220, 282, 201, 234, 290, 430, 410],
    },
    {
      name: 'Step End',
      type: 'line',
      step: 'end',
      data: [450, 432, 401, 454, 590, 530, 510],
    },
  ],
})

// line y category chart
export const getLineYCategory = (): EChartsOption => ({
  legend: {
    data: ['Altitude (km) vs. temperature (°C)'],
    textStyle: {
      //The style of the legend text
      color: '#858d98',
    },
    top: 0, // or 'top'
    left: 'center',
  },
  tooltip: {
    trigger: 'axis',
    formatter: 'Temperature : <br/>{b}km : {c}°C',
    padding: [12, 16],
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
  grid: {
    left: '1%',
    right: '0%',
    bottom: '0%',
    containLabel: true,
  },
  xAxis: {
    type: 'value',
    axisLabel: {
      formatter: '{value} °C',
      color: getColor('body-color'),
      margin: 15,
    },
    axisLine: {
      lineStyle: { color: getColor('default-100'), type: 'solid' },
    },
    splitLine: {
      lineStyle: {
        color: 'rgba(133, 141, 152, 0.1)',
      },
    },
  },
  yAxis: {
    type: 'category',
    axisLine: {
      onZero: false,
      lineStyle: { color: getColor('default-400'), type: 'dashed' },
    },
    axisLabel: {
      formatter: '{value} km',
    },
    boundaryGap: false,
    data: ['0', '10', '20', '30', '40', '50', '60', '70', '80'],
    splitLine: {
      lineStyle: {
        color: 'rgba(133, 141, 152, 0.1)',
      },
    },
  },
  textStyle: {
    fontFamily: getComputedStyle(document.body).fontFamily,
  },
  series: [
    {
      name: 'Altitude (km) vs. temperature (°C)',
      type: 'line',
      symbolSize: 10,
      symbol: 'circle',
      smooth: true,
      itemStyle: {
        color: getColor('primary'),
        borderColor: getColor('primary'),
        borderWidth: 2,
      },
      lineStyle: {
        width: 3,
        color: getColor('primary'),
        shadowColor: 'rgba(0,0,0,0.3)',
        shadowBlur: 10,
        shadowOffsetY: 8,
      },
      data: [15, -50, -56.5, -46.5, -22.1, -2.5, -27.7, -55.7, -76.5],
    },
  ],
})
