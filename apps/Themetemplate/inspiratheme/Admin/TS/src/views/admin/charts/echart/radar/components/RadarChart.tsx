import EChart from '@/components/wrappers/EChart'
import { RadarChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import { getBasicBasicRadarChart, getCustomizedRadarChart, getMultipleRadarChart, getProportionOfBrowsersChart } from './data'

export const BasicRadarChart = () => {
  return <EChart extensions={[RadarChart, CanvasRenderer]} getOptions={getBasicBasicRadarChart} style={{ height: '300px' }} />
}

export const ProportionofBrowsers = () => {
  return <EChart extensions={[RadarChart, CanvasRenderer]} getOptions={getProportionOfBrowsersChart} style={{ height: '300px' }} />
}

export const CustomizedRadarChart = () => {
  return <EChart extensions={[RadarChart, CanvasRenderer]} getOptions={getCustomizedRadarChart} style={{ height: '300px' }} />
}

export const MultipleRadarChart = () => {
  return <EChart extensions={[RadarChart, CanvasRenderer]} getOptions={getMultipleRadarChart} style={{ height: '300px' }} />
}
