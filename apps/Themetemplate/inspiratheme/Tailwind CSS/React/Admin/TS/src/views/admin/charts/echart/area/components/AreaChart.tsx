import EChart from '@/components/wrappers/EChart'
import { getColor } from '@/utils/helpers'
import { EChartsOption } from 'echarts'
import { LineChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import { CallbackDataParams } from 'echarts/types/dist/shared'
import { useEffect, useState } from 'react'
import { getAreaChart, getAreaWithMarkerChart, getStackedAreaChart, getStepAreaChart } from './data'

export const BasicAreachart = () => {
  return <EChart extensions={[LineChart, CanvasRenderer]} getOptions={getAreaChart} style={{ height: '300px' }} />
}

export const StackedAreaChart = () => {
  return <EChart extensions={[LineChart, CanvasRenderer]} getOptions={getStackedAreaChart} style={{ height: '300px' }} />
}

export const AreaWithMarkersChart = () => {
  return <EChart extensions={[LineChart, CanvasRenderer]} getOptions={getAreaWithMarkerChart} style={{ height: '300px' }} />
}

export const StepArea = () => {
  return <EChart extensions={[LineChart, CanvasRenderer]} getOptions={getStepAreaChart} style={{ height: '300px' }} />
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

export const DynamicAreaChart = () => {
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

  const getDynamicAreaChart = (): EChartsOption => ({
    textStyle: {
      fontFamily: getComputedStyle(document.body).fontFamily,
    },
    color: [getColor('chart-zeta')],
    tooltip: {
      trigger: 'axis',
      formatter: (params: CallbackDataParams | CallbackDataParams[]): string => {
        const list = Array.isArray(params) ? params : [params]
        const item = list[0]
        const [dateStr, value] = item.value as [string, number]
        const date = new Date(dateStr)
        const day = date.getDate()
        const month = date.toLocaleString('default', { month: 'long' })
        const year = date.getFullYear()
        return `${day} ${month}, ${year} : ${value}`
      },
      axisPointer: {
        animation: false,
        type: 'none',
      },
      padding: [12, 16],
      backgroundColor: getColor('card'),
      borderColor: getColor('default-200'),
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
        areaStyle: {
          opacity: 0.2,
        },
        lineStyle: {
          width: 3,
        },
      },
    ],
  })

  return <EChart extensions={[LineChart, CanvasRenderer]} getOptions={getDynamicAreaChart} style={{ height: '300px' }} />
}
