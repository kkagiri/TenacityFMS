import { getColor } from '@/utils/helpers'
import { EChartsOption, TooltipComponentFormatterCallbackParams } from 'echarts'
import { CallbackDataParams } from 'echarts/types/dist/shared'

// basic area chart

export const getAreaChart = (): EChartsOption => ({
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
  tooltip: {
    trigger: 'axis',
    padding: [5, 0],
    backgroundColor: getColor('card'),
    borderColor: getColor('default-200'),
    textStyle: { color: getColor('default-600') },
    borderWidth: 1,
    transitionDuration: 0.125,
    axisPointer: { type: 'none' },
    shadowBlur: 2,
    shadowColor: 'rgba(76, 76, 92, 0.15)',
    shadowOffsetX: 0,
    shadowOffsetY: 1,
    formatter: (params: CallbackDataParams | CallbackDataParams[]): string => {
      const list = Array.isArray(params) ? params : [params]

      const title = list[0].name
      let content = `<div style="font-size: 14px; font-weight: 600; text-transform: uppercase;
    border-bottom: 1px solid ${getColor('border-color')};
    margin-bottom: 8px; padding: 3px 10px 8px;">${title}</div>`

      list.forEach((item) => {
        const value = Array.isArray(item.value) ? item.value.join(', ') : item.value
        content += `<div style="margin-top: 4px; padding: 3px 15px;">
      <span style="display:inline-block;margin-right:5px;border-radius:50%;
      width:10px;height:10px;background-color:${item.color};"></span>
      ${item.seriesName} : <strong>${value}</strong>
    </div>`
      })

      return content
    },
  },
  series: [
    {
      data: [150, 180, 120, 190, 110, 170, 130],
      type: 'line',
      areaStyle: {
        opacity: 0.2,
        color: getColor('chart-primary'),
      },
      lineStyle: {
        color: getColor('chart-primary'),
      },
      symbol: 'circle',
      symbolSize: 6,
    },
  ],
  textStyle: {
    fontFamily: getComputedStyle(document.body).fontFamily,
  },
  color: [getColor('chart-primary')],
})

// stacked area charts

export const getStackedAreaChart = (): EChartsOption => ({
  textStyle: {
    fontFamily: getComputedStyle(document.body).fontFamily,
  },
  tooltip: {
    trigger: 'axis',
    padding: [5, 0],
    backgroundColor: getColor('card'),
    borderColor: getColor('default-200'),
    textStyle: { color: getColor('default-600') },
    borderWidth: 1,
    transitionDuration: 0.125,
    axisPointer: { type: 'none' },
    shadowBlur: 2,
    shadowColor: 'rgba(76, 76, 92, 0.15)',
    shadowOffsetX: 0,
    shadowOffsetY: 1,
    formatter: (params: TooltipComponentFormatterCallbackParams) => {
      // Ensure params is an array
      const dataPoints = Array.isArray(params) ? params : [params]
      const title = dataPoints[0].name

      let content = `<div style="font-size: 14px; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid ${getColor('border-color')}; margin-bottom: 8px; padding: 3px 10px 8px;">${title}</div>`

      dataPoints.forEach((item) => {
        const value = Array.isArray(item.value) ? item.value[1] : item.value
        content += `<div style="margin-top: 4px; padding: 3px 15px;">
                    <span style="display:inline-block;margin-right:5px;border-radius:50%;width:10px;height:10px;background-color:${item.color};"></span>
                    ${item.seriesName} : <strong>${value}</strong>
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
        color: getColor('default-200'),
        type: 'dashed',
      },
    },
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
        borderColor: getColor('chart-delta'),
        borderWidth: 2,
      },
      areaStyle: {
        opacity: 0.2,
        color: getColor('chart-delta'),
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
      areaStyle: {
        opacity: 0.2,
        color: getColor('chart-alpha'),
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
        borderColor: getColor('danger'),
        borderWidth: 2,
      },
      areaStyle: {
        opacity: 0.2,
        color: getColor('chart-beta'),
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
      areaStyle: {
        opacity: 0.2,
        color: getColor('chart-beta'),
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

// area chart with marker

export const getAreaWithMarkerChart = (): EChartsOption => ({
  textStyle: {
    fontFamily: getComputedStyle(document.body).fontFamily,
  },
  color: [getColor('chart-primary'), getColor('chart-gamma')],
  tooltip: {
    trigger: 'axis',
    padding: [5, 0],
    backgroundColor: getColor('card'),
    borderColor: getColor('default-200'),
    textStyle: { color: getColor('default-600') },
    borderWidth: 1,
    transitionDuration: 0.125,
    axisPointer: { type: 'none' },
    shadowBlur: 2,
    shadowColor: 'rgba(76, 76, 92, 0.15)',
    shadowOffsetX: 0,
    shadowOffsetY: 1,
    formatter: (params: TooltipComponentFormatterCallbackParams) => {
      const items = Array.isArray(params) ? params : [params]
      const title = items[0].name

      let content = `<div style="font-size: 14px; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid ${getColor('border-color')}; margin-bottom: 8px; padding: 3px 10px 8px;">${title}</div>`

      items.forEach((item) => {
        const value = Array.isArray(item.value) ? item.value[1] : item.value
        content += `<div style="margin-top: 4px; padding: 3px 15px;">
                    <span style="display:inline-block;margin-right:5px;border-radius:50%;width:10px;height:10px;background-color:${item.color};"></span>
                    ${item.seriesName} : <strong>${value}</strong>
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
      color: getColor('default-200'),
      margin: 15,
    },
    splitLine: { show: false },
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: getColor('default-200') } },
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
      areaStyle: {
        opacity: 0.2,
        color: getColor('chart-primary'),
      },
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
      areaStyle: {
        opacity: 0.2,
        color: getColor('chart-alpha'),
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

//step area chart

export const getStepAreaChart = (): EChartsOption => ({
  tooltip: {
    trigger: 'axis',
    padding: [12, 16],
    backgroundColor: getColor('card'),
    borderColor: getColor('default-200'),
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
    top: 0,
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
      areaStyle: {
        opacity: 0.2, // Adjust opacity as needed
      },
      step: 'start',
      data: [120, 132, 101, 134, 90, 230, 210],
    },
    {
      name: 'Step Middle',
      type: 'line',
      areaStyle: {
        opacity: 0.2, // Adjust opacity as needed
      },
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
