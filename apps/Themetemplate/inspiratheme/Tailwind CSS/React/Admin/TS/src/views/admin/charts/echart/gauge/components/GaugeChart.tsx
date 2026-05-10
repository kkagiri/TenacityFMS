import EChartsReact from 'echarts-for-react'
import EChart from '@/components/wrappers/EChart'
import { useLayoutContext } from '@/context/useLayoutContext'
import { GaugeChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import { useEffect, useMemo } from 'react'
import { getGaugeChart, getMultiGaugeChart, getMultiRingGaugeChart, getRingGaugeChart, getSpeedStageGaugeChart, getTemperatureChart, setGaugeChartInstance, setTemperatureChartInstance, startGaugeAnimation, startTemperatureAnimation } from './data'



export const BasicGaugeEChart = () => {
  return <EChart extensions={[GaugeChart, CanvasRenderer]} getOptions={getGaugeChart} style={{ height: '300px' }} />
}

export const SpeedStageGaugeChart = () => {
  return <EChart extensions={[GaugeChart, CanvasRenderer]} getOptions={getSpeedStageGaugeChart} style={{ height: '300px' }} />
}
export const RingGaugeChart = () => {
  return <EChart extensions={[GaugeChart, CanvasRenderer]} getOptions={getRingGaugeChart} style={{ height: '300px' }} />
}

export const TemperatureChart = () => {
  const { skin, theme } = useLayoutContext()

  const options = useMemo(() => getTemperatureChart(), [skin, theme])

  useEffect(() => {
    startTemperatureAnimation()
  }, [])

  return <EChartsReact option={options} style={{ height: 300 }} onChartReady={setTemperatureChartInstance} echarts={{ use: [GaugeChart, CanvasRenderer] }} />
}

export const MultiRingGaugeChart = () => {
  return <EChart extensions={[GaugeChart, CanvasRenderer]} getOptions={getMultiRingGaugeChart} style={{ height: '300px' }} />
}

export const MultiGaugeChart = () => {
  const { skin, theme } = useLayoutContext()
  const options = useMemo(() => getMultiGaugeChart(), [skin, theme])

  useEffect(() => {
    startGaugeAnimation()
  }, [])

  return <EChartsReact option={options} style={{ height: 300 }} onChartReady={setGaugeChartInstance} echarts={{ use: [GaugeChart, CanvasRenderer] }} />
}
