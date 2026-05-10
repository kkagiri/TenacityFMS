import ApexChart from '@/components/wrappers/ApexChart'
import { getBasicTreemapChart, getColorRangeTreemapChart, getDistributedTreemapChart, getTreemapMultipleChart } from './data'

export const BasicTreemap = () => {
  return <ApexChart getOptions={getBasicTreemapChart} series={getBasicTreemapChart().series} type="treemap" height={350} />
}

export const MultipleTreemap = () => {
  return <ApexChart getOptions={getTreemapMultipleChart} series={getTreemapMultipleChart().series} type="treemap" height={350} />
}

export const DistributedTreemap = () => {
  return <ApexChart getOptions={getDistributedTreemapChart} series={getDistributedTreemapChart().series} type="treemap" height={350} />
}

export const ColorRangeTreemap = () => {
  return <ApexChart getOptions={getColorRangeTreemapChart} series={getColorRangeTreemapChart().series} type="treemap" height={350} />
}
