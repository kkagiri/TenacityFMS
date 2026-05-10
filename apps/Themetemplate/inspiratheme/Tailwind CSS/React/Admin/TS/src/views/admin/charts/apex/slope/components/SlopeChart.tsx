import ApexChart from '@/components/wrappers/ApexChart'
import { getBasicSlopeChart, getMultiSlopeChart } from './data'

export const BasicSlope = () => {
  return <ApexChart getOptions={getBasicSlopeChart} series={getBasicSlopeChart().series} type="line" height={350} />
}

export const MultiSlope = () => {
  return <ApexChart getOptions={getMultiSlopeChart} series={getMultiSlopeChart().series} type="line" height={350} className="apex-chart" />
}
