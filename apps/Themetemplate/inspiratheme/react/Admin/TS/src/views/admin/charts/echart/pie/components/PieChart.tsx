import EChart from '@/components/wrappers/EChart'
import { PieChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import { getBasicPieChart, getDoughnutPieChart, getDoughnutRoundedPieChart, getMultiplePieChart, getNightingaleMap, getPieEdgeAlignChart, getPieLabelAlignChart } from './data'

export const BasicPieChart = () => {
  return <EChart extensions={[PieChart, CanvasRenderer]} getOptions={getBasicPieChart} style={{ height: '300px' }} />
}

export const DoughnutPieChart = () => {
  return <EChart extensions={[PieChart, CanvasRenderer]} getOptions={getDoughnutPieChart} style={{ height: '300px' }} />
}

export const DoughnutRoundedPieChart = () => {
  return <EChart extensions={[PieChart, CanvasRenderer]} getOptions={getDoughnutRoundedPieChart} style={{ height: '300px' }} />
}

export const MultiplePieChart = () => {
  return <EChart extensions={[PieChart, CanvasRenderer]} getOptions={getMultiplePieChart} style={{ height: '300px' }} />
}

export const PieLabelAlignChart = () => {
  return <EChart extensions={[PieChart, CanvasRenderer]} getOptions={getPieLabelAlignChart} style={{ height: '300px' }} />
}

export const NightingaleMap = () => {
  return <EChart extensions={[PieChart, CanvasRenderer]} getOptions={getNightingaleMap} style={{ height: '300px' }} />
}

export const PieEdgeAlignChart = () => {
  return <EChart extensions={[PieChart, CanvasRenderer]} getOptions={getPieEdgeAlignChart} style={{ height: '300px' }} />
}
