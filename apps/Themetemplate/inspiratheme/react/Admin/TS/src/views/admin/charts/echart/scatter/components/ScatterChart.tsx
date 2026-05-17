import EChart from '@/components/wrappers/EChart'
import { ScatterChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import { getBubbleChart, getQuartetScatterChart, getScatterChart, getSingleAxisScatterChart } from './data'

export const ScatterEChart = () => {
  return <EChart extensions={[ScatterChart, CanvasRenderer]} getOptions={getScatterChart} style={{ height: '300px' }} />
}

export const BubbleEchart = () => {
  return <EChart extensions={[ScatterChart, CanvasRenderer]} getOptions={getBubbleChart} style={{ height: '300px' }} />
}

export const QuartetScatterChart = () => {
  return <EChart extensions={[ScatterChart, CanvasRenderer]} getOptions={getQuartetScatterChart} style={{ height: '600px' }} />
}

export const SingleAxisScatterchart = () => {
  return <EChart extensions={[ScatterChart, CanvasRenderer]} getOptions={getSingleAxisScatterChart} style={{ height: '450px' }} />
}
