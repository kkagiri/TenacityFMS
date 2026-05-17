import EChart from '@/components/wrappers/EChart'
import { PictorialBarChart, SunburstChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import { getBasicSunburstChart, getNestedPieChart, getPictorialBarDottedChart } from './data'

export const PictorialbarDottedChart = () => {
  return <EChart extensions={[PictorialBarChart, CanvasRenderer]} getOptions={getPictorialBarDottedChart} style={{ height: '400px' }} className='rounded-3 overflow-hidden"' />
}

export const BasicSunburstChart = () => {
  return <EChart extensions={[SunburstChart, CanvasRenderer]} getOptions={getBasicSunburstChart} style={{ height: '400px' }} />
}

export const NestedPieChart = () => {
  return <EChart extensions={[SunburstChart, CanvasRenderer]} getOptions={getNestedPieChart} style={{ height: '600px' }} />
}
