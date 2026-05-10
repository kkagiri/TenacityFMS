import ApexChart from '@/components/wrappers/ApexChart'
import { getAdvanceTimelineChart, getDistributedTimelineChart, getGroupRowTimelineChart, getMultiSeriesTimelineChart, getTimelineChart } from './data'

export const TimeLineChart = () => {
  return <ApexChart getOptions={getTimelineChart} series={getTimelineChart().series} type="rangeBar" height={350} />
}

export const DistributedTimelineChart = () => {
  return <ApexChart getOptions={getDistributedTimelineChart} series={getDistributedTimelineChart().series} type="rangeBar" height={350} />
}

export const MultiSeriesTimelineChart = () => {
  return <ApexChart getOptions={getMultiSeriesTimelineChart} series={getMultiSeriesTimelineChart().series} type="rangeBar" height={350} />
}

export const AdvanceTimeLineChart = () => {
  return <ApexChart getOptions={getAdvanceTimelineChart} series={getAdvanceTimelineChart().series} type="rangeBar" height={350} />
}

export const GroupRowTimelineChart = () => {
  return <ApexChart getOptions={getGroupRowTimelineChart} series={getGroupRowTimelineChart().series} type="rangeBar" height={350} />
}
