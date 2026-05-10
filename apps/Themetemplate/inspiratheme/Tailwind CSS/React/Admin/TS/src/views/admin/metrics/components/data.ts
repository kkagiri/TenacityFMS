import { generateRandomEChartData, getColor } from '@/utils/helpers'
import { EChartsOption, TooltipComponentFormatterCallbackParams } from 'echarts'
import * as echarts from 'echarts/core'

const colors = [getColor('chart-primary'), getColor('chart-beta'), getColor('chart-secondary'), '#bbcae14d']

export type StatisticCardType = {
  title: string
  badgeColor: string
  badgeText: string
  count: {
    value: number
    prefix?: string
    suffix?: string
  }
  metric: string
}

export const getStatisticChartOptions = (): EChartsOption => {
  const productData = generateRandomEChartData(['A', 'B', 'C'])

  return {
    tooltip: { show: false },
    series: [
      {
        type: 'pie',
        radius: ['65%', '100%'],
        label: { show: false },
        labelLine: { show: false },
        data: productData.map((item, index) => ({
          value: item.value,
          itemStyle: {
            color: index === 0 ? getColor('primary') : index === 1 ? getColor('secondary') : '#bbcae14d',
          },
        })),
      },
    ],
  }
}

export const statisticCardData: StatisticCardType[] = [
  {
    title: 'Total Sales',
    badgeColor: 'bg-success/15 text-success',
    badgeText: 'Monthly',
    count: {
      value: 250,
      prefix: '$',
      suffix: 'K',
    },
    metric: 'Monthly Total Sales',
  },
  {
    title: 'Total Orders',
    badgeColor: 'bg-primary/15 text-primary',
    badgeText: 'Monthly',
    count: {
      value: 180,
    },
    metric: 'Monthly Total Orders',
  },
  {
    title: 'New Customers',
    badgeColor: 'bg-info/15 text-info',
    badgeText: 'Monthly',
    count: {
      value: 50895,
    },
    metric: 'Monthly New Customers',
  },
  {
    title: 'Revenue',
    badgeColor: 'bg-warning/15 text-warning',
    badgeText: 'Monthly',
    count: {
      prefix: '$',
      suffix: 'K',
      value: 50.33,
    },
    metric: 'Monthly Revenue',
  },
]

export type StatisticsWithChartType = {
  title: string
  badge: {
    text: string
    className: string
  }
  count: {
    value: number
    prefix?: string
    suffix?: string
  }
  description: string
  chartOptions: () => EChartsOption
  ChartType: 'line' | 'bar' | 'pie'
  chartHeight: string
  chartWidth: string
}

function generateBarData() {
  const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
  const colors = [getColor('chart-primary'), getColor('chart-secondary'), getColor('chart-alpha'), '#bbcae14d']

  return labels.map((label, index) => ({
    name: label,
    value: Math.floor(Math.random() * 100) + 1,
    color: colors[index % colors.length],
  }))
}

function generateAreaData() {
  const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
  const colors = [getColor('chart-primary'), getColor('chart-beta'), getColor('chart-secondary'), '#bbcae14d']

  return labels.map(() => {
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    return {
      value: Math.floor(Math.random() * 100) + 1,
      color: randomColor,
    }
  })
}

function generateRandomData2() {
  const dataName = ['A', 'B', 'C', 'D']
  const randomData = dataName.map((name) => ({
    name: name,
    value: Math.floor(Math.random() * 100) + 1,
  }))
  return randomData
}

export const statisticsData: StatisticsWithChartType[] = [
  {
    title: 'Project A - Sales',
    badge: { text: 'Monthly', className: 'bg-success/15 text-success' },
    count: { value: 320, prefix: '$', suffix: 'K' },
    description: 'Monthly Sales for Project A',
    chartHeight: '40px',
    chartWidth: '80px',
    chartOptions: () => ({
      grid: { top: 0, bottom: 0, left: 0, right: 0 },
      xAxis: { type: 'category', data: generateBarData().map((d) => d.name), show: false },
      yAxis: { type: 'value', show: false },
      tooltip: { show: false },
      series: [
        {
          type: 'bar',
          data: generateBarData().map((item) => ({
            value: item.value,
            itemStyle: { color: item.color },
          })),
          barWidth: '50%',
          itemStyle: { borderRadius: 3 },
        },
      ],
    }),
    ChartType: 'bar',
  },
  {
    title: 'Project B - Revenue',
    badge: { text: 'Monthly', className: 'bg-info/15 text-info' },
    count: { value: 450, prefix: '$', suffix: 'K' },
    description: 'Monthly Revenue for Project B',
    chartHeight: '40px',
    chartWidth: '80px',
    chartOptions: () => ({
      grid: { top: 0, bottom: 0, left: 0, right: 0 },
      xAxis: { type: 'category', data: generateBarData().map((d) => d.name), show: false },
      yAxis: { type: 'value', show: false },
      tooltip: { show: false },
      series: [
        {
          type: 'bar',
          data: generateBarData().map((item) => ({
            value: item.value,
            itemStyle: { color: item.color },
          })),
          barWidth: '50%',
          itemStyle: { borderRadius: 3 },
        },
      ],
    }),
    ChartType: 'bar',
  },
  {
    title: 'Project C - Engagement',
    badge: { text: 'Monthly', className: 'bg-warning/15 text-warning' },
    count: { value: 580, prefix: '$', suffix: 'K' },
    description: 'Monthly Engagement for Project C',
    chartHeight: '40px',
    chartWidth: '80px',
    chartOptions: () => ({
      grid: { top: 0, bottom: 0, left: 0, right: 0 },
      xAxis: { type: 'category', data: generateBarData().map((d) => d.name), show: false },
      yAxis: { type: 'value', show: false },
      tooltip: { show: false },
      series: [
        {
          type: 'bar',
          data: generateBarData().map((item) => ({
            value: item.value,
            itemStyle: { color: item.color },
          })),
          barWidth: '50%',
          itemStyle: { borderRadius: 3 },
        },
      ],
    }),
    ChartType: 'bar',
  },
  {
    title: 'Project D - Expenses',
    badge: { text: 'Monthly', className: 'bg-danger/15 text-danger' },
    count: { value: 700, prefix: '$', suffix: 'K' },
    description: 'Monthly Expenses for Project D',
    chartHeight: '40px',
    chartWidth: '80px',
    chartOptions: () => ({
      grid: { top: 0, bottom: 0, left: 0, right: 0 },
      xAxis: { type: 'category', data: generateBarData().map((d) => d.name), show: false },
      yAxis: { type: 'value', show: false },
      tooltip: { show: false },
      series: [
        {
          type: 'bar',
          data: generateBarData().map((item) => ({
            value: item.value,
            itemStyle: { color: item.color },
          })),
          barWidth: '50%',
          itemStyle: { borderRadius: 3 },
        },
      ],
    }),
    ChartType: 'bar',
  },
  {
    title: 'Greenfield Towers - Sales',
    badge: { text: '+$40K', className: 'bg-success/15 text-success' },
    count: { value: 550, prefix: '$', suffix: 'K' },
    description: 'Sales Change (Prev.)',
    chartHeight: '60px',
    chartWidth: '140px',
    chartOptions: () => {
      const productData = generateAreaData()
      return {
        grid: { top: 0, bottom: 0, left: 0, right: 0 },
        xAxis: {
          type: 'category',
          data: productData.map((_, index) => `Label ${index + 1}`), // Use dynamic labels
          show: false,
        },
        yAxis: {
          type: 'value',
          show: false,
        },
        tooltip: { show: false },
        series: [
          {
            type: 'line',
            data: productData.map((item) => item.value),
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: productData[0].color },
                { offset: 1, color: 'rgba(255, 255, 255, 0)' },
              ]),
            },
            lineStyle: {
              color: productData[0].color,
              width: 2,
            },
            symbol: 'none',
            smooth: true,
          },
        ],
      }
    },
    ChartType: 'line',
  },
  {
    title: 'Oceanview Residences - Sales',
    badge: { text: '-$20K', className: 'bg-danger/15 text-danger' },
    count: { value: 230, prefix: '$', suffix: 'K' },
    description: 'Sales Change (Prev.)',
    chartHeight: '60px',
    chartWidth: '140px',
    chartOptions: () => {
      const productData = generateAreaData()
      return {
        grid: { top: 0, bottom: 0, left: 0, right: 0 },
        xAxis: {
          type: 'category',
          data: productData.map((_, index) => `Label ${index + 1}`), // Use dynamic labels
          show: false,
        },
        yAxis: {
          type: 'value',
          show: false,
        },
        tooltip: { show: false },
        series: [
          {
            type: 'line',
            data: productData.map((item) => item.value),
            areaStyle: {
              // Apply a gradient color dynamically based on the randomly selected color
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: productData[0].color },
                { offset: 1, color: 'rgba(255, 255, 255, 0)' },
              ]),
            },
            lineStyle: {
              color: productData[0].color,
              width: 2,
            },
            symbol: 'none',
            smooth: true,
          },
        ],
      }
    },
    ChartType: 'line',
  },
  {
    title: 'Sunset Bay Villas - Sales',
    badge: { text: '+$50K', className: 'bg-warning/15 text-warning' },
    count: { value: 650, prefix: '$', suffix: 'K' },
    description: 'Sales Change (Prev.)',
    chartHeight: '60px',
    chartWidth: '140px',
    chartOptions: () => {
      const productData = generateAreaData()
      return {
        grid: { top: 0, bottom: 0, left: 0, right: 0 },
        xAxis: {
          type: 'category',
          data: productData.map((_, index) => `Label ${index + 1}`), // Use dynamic labels
          show: false,
        },
        yAxis: {
          type: 'value',
          show: false,
        },
        tooltip: { show: false },
        series: [
          {
            type: 'line',
            data: productData.map((item) => item.value),
            areaStyle: {
              // Apply a gradient color dynamically based on the randomly selected color
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: productData[0].color },
                { offset: 1, color: 'rgba(255, 255, 255, 0)' },
              ]),
            },
            lineStyle: {
              color: productData[0].color,
              width: 2,
            },
            symbol: 'none',
            smooth: true,
          },
        ],
      }
    },
    ChartType: 'line',
  },
  {
    title: 'Maple Grove Homes - Sales',
    badge: { text: '+$30K', className: 'bg-success/15 text-success' },
    count: { value: 480, prefix: '$', suffix: 'K' },
    description: 'Sales Change (Prev.)',
    chartHeight: '60px',
    chartWidth: '140px',
    chartOptions: () => {
      const productData = generateAreaData()
      return {
        grid: { top: 0, bottom: 0, left: 0, right: 0 },
        xAxis: {
          type: 'category',
          data: productData.map((_, index) => `Label ${index + 1}`), // Use dynamic labels
          show: false,
        },
        yAxis: {
          type: 'value',
          show: false,
        },
        tooltip: { show: false },
        series: [
          {
            type: 'line',
            data: productData.map((item) => item.value),
            areaStyle: {
              // Apply a gradient color dynamically based on the randomly selected color
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: productData[0].color },
                { offset: 1, color: 'rgba(255, 255, 255, 0)' },
              ]),
            },
            lineStyle: {
              color: productData[0].color,
              width: 2,
            },
            symbol: 'none',
            smooth: true,
          },
        ],
      }
    },
    ChartType: 'line',
  },
  {
    title: 'Total Revenue',
    badge: { text: '+8.2%', className: 'bg-success/15 text-success' },
    count: { value: 1240, prefix: '$', suffix: 'K' },
    description: 'This Quarter',
    chartHeight: '70px',
    chartWidth: '70px',
    chartOptions: () => ({
      tooltip: { show: false },
      series: [
        {
          type: 'pie',
          radius: '90%',
          hoverAnimation: false,
          label: { show: false },
          labelLine: { show: false },
          data: generateRandomData2().map((item, index) => ({
            value: item.value,
            name: item.name,
            itemStyle: {
              color: colors[index % colors.length],
            },
          })),
        },
      ],
    }),
    ChartType: 'pie',
  },
  {
    title: 'Total Expenses',
    badge: { text: '-2.1%', className: 'bg-danger/15 text-danger' },
    count: { value: 840, prefix: '$', suffix: 'K' },
    description: 'This Quarter',
    chartHeight: '70px',
    chartWidth: '70px',
    chartOptions: () => ({
      tooltip: { show: false },
      series: [
        {
          type: 'pie',
          radius: '90%',
          hoverAnimation: false,
          label: { show: false },
          labelLine: { show: false },
          data: generateRandomData2().map((item, index) => ({
            value: item.value,
            name: item.name,
            itemStyle: {
              color: colors[index % colors.length],
            },
          })),
        },
      ],
    }),
    ChartType: 'pie',
  },
  {
    title: 'Net Profit',
    badge: { text: 'Stable', className: 'bg-info/15 text-info' },
    count: { value: 400, prefix: '$', suffix: 'K' },
    description: 'This Quarter',
    chartHeight: '70px',
    chartWidth: '70px',
    chartOptions: () => ({
      tooltip: { show: false },
      series: [
        {
          type: 'pie',
          radius: '90%',
          hoverAnimation: false,
          label: { show: false },
          labelLine: { show: false },
          data: generateRandomData2().map((item, index) => ({
            value: item.value,
            name: item.name,
            itemStyle: {
              color: colors[index % colors.length],
            },
          })),
        },
      ],
    }),
    ChartType: 'pie',
  },
  {
    title: 'Cash Flow',
    badge: { text: '+5.6%', className: 'bg-warning/15 text-warning' },
    count: { value: 720, prefix: '$', suffix: 'K' },
    description: 'This Quarter',
    chartHeight: '70px',
    chartWidth: '70px',
    chartOptions: () => ({
      tooltip: { show: false },
      series: [
        {
          type: 'pie',
          radius: '90%',
          hoverAnimation: false,
          label: { show: false },
          labelLine: { show: false },
          data: generateRandomData2().map((item, index) => ({
            value: item.value,
            name: item.name,
            itemStyle: {
              color: colors[index % colors.length],
            },
          })),
        },
      ],
    }),
    ChartType: 'pie',
  },
]

export const getOrderChartOptions = (): EChartsOption => ({
  legend: { show: false },
  tooltip: {
    borderColor: getColor('border-color'),
    textStyle: {
      color: getColor('light-text-emphasis'),
    },
    trigger: 'axis',
    padding: [5, 0],
    backgroundColor: getColor('secondary-bg'),
    borderWidth: 1,
    transitionDuration: 0.125,
    axisPointer: {
      type: 'none',
    },
    shadowBlur: 2,
    shadowColor: 'rgba(76, 76, 92, 0.15)',
    shadowOffsetX: 0,
    shadowOffsetY: 1,
    formatter: (params: TooltipComponentFormatterCallbackParams) => {
      const items = Array.isArray(params) ? params : [params]
      const title = items[0].name
      let content = `<div style="font-size: 14px; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid ${getColor('border-color')}; margin-bottom: 8px; padding: 3px 10px 8px;">${title}</div>`
      items.forEach((item) => {
        content += `<div style="margin-top: 4px; padding: 3px 15px;">
          <span style="display:inline-block;margin-right:5px;border-radius:50%;width:10px;height:10px;background-color:${item.color};"></span>
          ${item.seriesName} : <strong>${item.value}</strong>
        </div>`
      })
      return content
    },
  },
  textStyle: {
    fontFamily: getComputedStyle(document.body).fontFamily,
  },
  grid: {
    left: '-6%',
    right: '2%',
    bottom: '2%',
    top: '0%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    data: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7'],
    axisLine: { show: false },
    axisTick: { show: false },
  },
  yAxis: {
    show: false,
  },
  series: [
    {
      name: 'Product A',
      type: 'bar',
      stack: 'total',
      barWidth: '40%',
      itemStyle: {
        color: getColor('primary'),
      },
      data: [120, 132, 101, 134, 98, 145, 160],
    },
    {
      name: 'Product B',
      type: 'bar',
      stack: 'total',
      itemStyle: {
        color: getColor('secondary'),
      },
      data: [220, 182, 191, 234, 210, 198, 176],
    },
    {
      name: 'Product C',
      type: 'bar',
      stack: 'total',
      itemStyle: {
        color: '#bbcae14d',
      },
      data: [150, 232, 201, 154, 189, 165, 140],
    },
  ],
})

export const getProductsChartOptions = (): EChartsOption => {
  return {
    tooltip: {
      trigger: 'axis',
      padding: [5, 0],
      backgroundColor: getColor('secondary-bg'),
      borderColor: getColor('border-color'),
      textStyle: { color: getColor('light-text-emphasis') },
      borderWidth: 1,
      transitionDuration: 0.125,
      axisPointer: { type: 'none' },
      shadowBlur: 2,
      shadowColor: 'rgba(76, 76, 92, 0.15)',
      shadowOffsetX: 0,
      shadowOffsetY: 1,
      formatter: (params: TooltipComponentFormatterCallbackParams) => {
        const items = Array.isArray(params) ? params : [params]
        const title = items[0]?.name ?? ''
        let content = `<div style="font-size: 14px; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid ${getColor('border-color')}; margin-bottom: 8px; padding: 3px 10px 8px;">${title}</div>`

        for (const item of items) {
          content += `<div style="margin-top: 4px; padding: 3px 15px;">
          <span style="display:inline-block;margin-right:5px;border-radius:50%;width:10px;height:10px;background-color:${item.color};"></span>
          ${item.seriesName} : <strong>${item.value}</strong>
        </div>`
        }

        return content
      },
    },
    textStyle: {
      fontFamily: getComputedStyle(document.body).fontFamily,
    },
    legend: { show: false },
    grid: { left: 0, right: 0, top: 10, bottom: 0, containLabel: false },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
    },
    yAxis: {
      type: 'value',
      show: false,
    },
    series: [
      {
        name: 'Data 1',
        type: 'line',
        data: [120, 132, 101, 134, 90, 230, 210],
        smooth: true,
        areaStyle: { color: getColor('white-rgb', 0.5) },
        lineStyle: { width: 0 },
        symbol: 'none',
      },
      {
        name: 'Data 2',
        type: 'line',
        data: [220, 182, 191, 234, 290, 330, 310],
        smooth: true,
        areaStyle: { color: getColor('white-rgb', 0.5) },
        lineStyle: { width: 0 },
        symbol: 'none',
      },
    ],
  }
}

export const profitChartOptions = (): EChartsOption => ({
  tooltip: {
    trigger: 'axis',
    padding: [5, 0],
    backgroundColor: getColor('secondary-bg'),
    borderColor: getColor('border-color'),
    textStyle: { color: getColor('light-text-emphasis') },
    borderWidth: 1,
    transitionDuration: 0.125,
    axisPointer: { type: 'none' },
    shadowBlur: 2,
    shadowColor: 'rgba(76, 76, 92, 0.15)',
    shadowOffsetX: 0,
    shadowOffsetY: 1,
    formatter: function (params: any) {
      const title = params[0]?.name || ''
      let content = `<div style="font-size: 14px; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid ${getColor('border-color')}; margin-bottom: 8px; padding: 3px 10px 8px;">${title}</div>`
      params.forEach((item: any) => {
        content += `<div style="margin-top: 4px; padding: 3px 15px;">
                  <span style="display:inline-block;margin-right:5px;border-radius:50%;width:10px;height:10px;background-color:${item.color};"></span>
                  ${item.seriesName} : <strong>${item.value}</strong>
                </div>`
      })
      return content
    },
  },
  textStyle: {
    fontFamily: getComputedStyle(document.body).fontFamily,
  },
  legend: { show: false },
  grid: { left: 0, right: 0, top: 10, bottom: 0, containLabel: false },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: Array.from({ length: 17 }, (_, i) => `Day ${i + 1}`),
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { show: false },
  },
  yAxis: {
    type: 'value',
    show: false,
  },
  series: [
    {
      name: 'Data',
      type: 'line',
      data: [4, 8, 5, 10, 4, 16, 5, 11, 6, 11, 30, 10, 13, 4, 6, 3, 6],
      smooth: true,
      lineStyle: {
        color: getColor('primary'),
        width: 2,
      },
      symbol: 'none',
    },
  ],
})

export const getPieEchartOptions = (): EChartsOption => {
  const charityData = generateRandomEChartData(['Charity A', 'Charity B', 'Charity C'])
  return {
    tooltip: { show: false },
    series: [
      {
        type: 'pie',
        radius: ['60%', '100%'],
        // @ts-expect-error hoverAnimation is a valid property
        hoverAnimation: false,
        label: { show: false },
        labelLine: { show: false },
        data: charityData.map((item, index) => ({
          value: item.value,
          itemStyle: {
            color: index === 0 ? getColor('primary') : index === 1 ? getColor('secondary') : '#bbcae14d',
          },
        })),
      },
    ],
  }
}

export type QuarterlyReport = {
  id: number
  quarter: string
  period: string
  revenue: string
  expense: string
  margin: string
}

export const quarterlyReports: QuarterlyReport[] = [
  {
    id: 1,
    quarter: 'Quarter 1',
    period: 'January - March 2024',
    revenue: '$210k',
    expense: '$165k',
    margin: '$45k',
  },
  {
    id: 2,
    quarter: 'Quarter 2',
    period: 'April - June 2024',
    revenue: '$225k',
    expense: '$175k',
    margin: '$50k',
  },
  {
    id: 3,
    quarter: 'Quarter 3',
    period: 'July - September 2024',
    revenue: '$240k',
    expense: '$190k',
    margin: '$50k',
  },
]
