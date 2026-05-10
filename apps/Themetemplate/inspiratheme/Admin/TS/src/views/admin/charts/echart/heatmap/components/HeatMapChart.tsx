import EChart from '@/components/wrappers/EChart'
import { RadarChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import { getBasicBasicHeatmapChart, getHeatmapChart, getHeatmapDataChart } from './data'

export const BasicHeatmapChart = () => {
  return <EChart extensions={[RadarChart, CanvasRenderer]} getOptions={getBasicBasicHeatmapChart} style={{ height: '300px' }} />
}

export const HeatmapChart = () => {
  return <EChart extensions={[RadarChart, CanvasRenderer]} getOptions={getHeatmapChart} style={{ height: '300px' }} />
}

export const HeatMapDataChart = () => {
  return <EChart extensions={[RadarChart, CanvasRenderer]} getOptions={getHeatmapDataChart} style={{ height: '300px' }} />
}
