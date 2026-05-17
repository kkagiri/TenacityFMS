import ApexChart from '@/components/wrappers/ApexChart'
import { getBasicBoxplotChart, getHorizontalBoxplotChart, getScatterBoxplotChart } from './data'

export const BasicBoxplot = () => {
  return <ApexChart getOptions={getBasicBoxplotChart} series={getBasicBoxplotChart().series} type="boxPlot" height={350} />
}

export const ScatterBoxplot = () => {
  return <ApexChart getOptions={getScatterBoxplotChart} series={getScatterBoxplotChart().series} type="boxPlot" height={350} />
}

export const HorizontalBoxPlot = () => {
  return <ApexChart getOptions={getHorizontalBoxplotChart} series={getHorizontalBoxplotChart().series} type="boxPlot" height={350} />
}
