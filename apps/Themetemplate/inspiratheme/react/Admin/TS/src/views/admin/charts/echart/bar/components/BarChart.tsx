import EChart from '@/components/wrappers/EChart'
import { useLayoutContext } from '@/context/useLayoutContext'
import EChartsReact from 'echarts-for-react'
import { BarChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import { useEffect, useMemo } from 'react'
import {
  getBarChartWithSeries,
  getBarRaceChart,
  getBasicBarChart,
  getGradientChart,
  getHorizontalBarChart,
  getHorizontalStackedBarChar,
  getMixedBarChart,
  getNegativeBarChart,
  getProgressBarChart,
  getStackedBar,
  getTimelineBarChart,
  getTwoBarChart,
  setBarRaceChartInstance,
  startBarRaceChart,
} from './data'

export const BasicBarChart = () => {
  return <EChart extensions={[BarChart, CanvasRenderer]} getOptions={getBasicBarChart} style={{ height: '300px' }} />
}

export const TwobarChart = () => {
  return <EChart extensions={[BarChart, CanvasRenderer]} getOptions={getTwoBarChart} style={{ height: '300px' }} />
}

export const ProgressBar = () => {
  return <EChart extensions={[BarChart, CanvasRenderer]} getOptions={getProgressBarChart} style={{ height: '300px' }} />
}

export const HoriBarChart = () => {
  return <EChart extensions={[BarChart, CanvasRenderer]} getOptions={getHorizontalBarChart} style={{ height: '300px' }} />
}

export const NegativeChart = () => {
  return <EChart extensions={[BarChart, CanvasRenderer]} getOptions={getNegativeBarChart} style={{ height: '300px' }} />
}

export const SeriesBarChart = () => {
  return <EChart extensions={[BarChart, CanvasRenderer]} getOptions={getBarChartWithSeries} style={{ height: '300px' }} />
}

export const StackedBarChart = () => {
  return <EChart extensions={[BarChart, CanvasRenderer]} getOptions={getStackedBar} style={{ height: '300px' }} />
}

export const HorizontalStackedBar = () => {
  return <EChart extensions={[BarChart, CanvasRenderer]} getOptions={getHorizontalStackedBarChar} style={{ height: '300px' }} />
}

export const RaceBarChart = () => {
  const { skin, theme } = useLayoutContext()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const options = useMemo(() => getBarRaceChart(), [skin, theme])
  useEffect(() => {
    startBarRaceChart()
  }, [])

  return (
    <EChartsReact
      option={options}
      style={{ height: 300 }}
      onChartReady={setBarRaceChartInstance}
      echarts={{
        use: [BarChart, CanvasRenderer],
      }}
    />
  )
}

export const GradientBarChart = () => {
  return <EChart extensions={[BarChart, CanvasRenderer]} getOptions={getGradientChart} style={{ height: '300px' }} />
}

export const MixdedBarChart = () => {
  return <EChart extensions={[BarChart, CanvasRenderer]} getOptions={getMixedBarChart} style={{ height: '300px' }} />
}

export const TimelineBarChart = () => {
  return <EChart extensions={[BarChart, CanvasRenderer]} getOptions={getTimelineBarChart} style={{ height: '500px' }} />
}
