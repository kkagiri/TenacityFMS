import EChart from '@/components/wrappers/EChart'
import { CandlestickChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import { getBasicCandlestickChart, getMixedCandlestickChart } from './data'

export const BasicCandlestick = () => {
  return <EChart extensions={[CandlestickChart, CanvasRenderer]} getOptions={getBasicCandlestickChart} style={{ height: '400px' }} />
}

export const MixedCandlestick = () => {
  return <EChart extensions={[CandlestickChart, CanvasRenderer]} getOptions={getMixedCandlestickChart} style={{ height: '400px' }} />
}
