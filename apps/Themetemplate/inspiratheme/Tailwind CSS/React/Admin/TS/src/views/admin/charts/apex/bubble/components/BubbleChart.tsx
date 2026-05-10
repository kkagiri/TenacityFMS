import ApexChart from '@/components/wrappers/ApexChart'
import { getSimpleBubbleChart, getThreeBubbleChart, getThreeDBubbleChart } from './data'

export const SimpleBubbleCharts = () => {
  return <ApexChart getOptions={getSimpleBubbleChart} series={getSimpleBubbleChart().series} type="bubble" height={350} />
}

export const ThreeDBubbleChart = () => {
  return <ApexChart getOptions={getThreeDBubbleChart} series={getThreeDBubbleChart().series} type="bubble" height={350} />
}

export const BubbleChart = () => {
  return <ApexChart getOptions={getThreeBubbleChart} series={getThreeBubbleChart().series} type="bubble" height={350} />
}
