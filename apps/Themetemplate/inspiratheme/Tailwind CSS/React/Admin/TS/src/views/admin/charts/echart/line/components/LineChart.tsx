import EChart from '@/components/wrappers/EChart'
import { getColor } from '@/utils/helpers'
import { EChartsOption } from 'echarts'
import { LinesChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import { useEffect, useState } from 'react'
import { getLineChart, getLineMarkerChart, getLineYCategory, getStackedLineChart, getStepLine } from './data'

export const LineChart = () => {
  return <EChart extensions={[LinesChart, CanvasRenderer]} getOptions={getLineChart} style={{ minHeight: '300px' }} />
}

export const ChartLineStacked = () => {
  return <EChart extensions={[LinesChart, CanvasRenderer]} getOptions={getStackedLineChart} style={{ height: '300px' }} />
}

export const LineMarker = () => {
  return <EChart extensions={[LinesChart, CanvasRenderer]} getOptions={getLineMarkerChart} style={{ height: '280px' }} />
}

export const StepLineChart = () => {
  return <EChart extensions={[LinesChart, CanvasRenderer]} getOptions={getStepLine} style={{ height: '300px' }} />
}

export const LineYCategory = () => {
  return <EChart extensions={[LinesChart, CanvasRenderer]} getOptions={getLineYCategory} style={{ height: '300px' }} />
}

type DataPoint = [string, number]

let now = new Date(2023, 9, 3)
let value = Math.random() * 100
const oneDay = 24 * 3600 * 1000

function generateRandomPoint(): DataPoint {
  now = new Date(+now + oneDay)
  value = value + Math.random() * 21 - 10
  return [[now.getFullYear(), now.getMonth() + 1, now.getDate()].join('/'), Math.round(value)]
}

function createInitialData(count = 1000): DataPoint[] {
  const d: DataPoint[] = []
  for (let i = 0; i < count; i++) d.push(generateRandomPoint())
  return d
}

export const DynamicLine = () => {
  const [data, setData] = useState<DataPoint[]>(() => createInitialData(1000))

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => {
        const newData = [...prev.slice(5), ...Array.from({ length: 5 }, generateRandomPoint)]
        return newData
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const getDynamicLineChart = (): EChartsOption => ({
    color: [getColor('chart-zeta')],
    textStyle: {
      fontFamily: getComputedStyle(document.body).fontFamily,
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const items = Array.isArray(params) ? (params as echarts.DefaultLabelFormatterCallbackParams[]) : [params as echarts.DefaultLabelFormatterCallbackParams]

        const item = items[0]
        const date = new Date(item.name as string)
        const day = date.getDate()
        const month = date.toLocaleString('default', { month: 'long' })
        const year = date.getFullYear()
        const value = Array.isArray(item.value) ? item.value[1] : item.value

        return `${day} ${month}, ${year} : ${value}`
      },
      axisPointer: {
        type: 'none',
        animation: false,
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
      splitLine: { show: false },
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
        lineStyle: { color: 'rgba(133, 141, 152, 0.1)' },
      },
    },
    grid: {
      left: '7%',
      right: '5%',
      bottom: '10%',
      top: '5%',
    },
    series: [
      {
        name: 'Fake Data',
        type: 'line',
        showSymbol: false,
        data,
        lineStyle: { width: 3 },
      },
    ],
  })

  return <EChart extensions={[LineChart, CanvasRenderer]} getOptions={getDynamicLineChart} style={{ height: '300px' }} />
}
