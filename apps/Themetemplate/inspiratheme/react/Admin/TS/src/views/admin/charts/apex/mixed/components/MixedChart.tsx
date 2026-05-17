import ApexChart from '@/components/wrappers/ApexChart'
import { getAllMixedChart, getLineAreaChart, getLineColumnChart, getMultipleYaxisMixedChart } from './data'

export const LineColumnMixed = () => {
  return <ApexChart getOptions={getLineColumnChart} series={getLineColumnChart().series} type="line" height={380} />
}

export const MultipleYaxisMixed = () => {
  return <ApexChart getOptions={getMultipleYaxisMixedChart} series={getMultipleYaxisMixedChart().series} type="line" height={380} />
}

export const LineAreaChart = () => {
  return <ApexChart getOptions={getLineAreaChart} series={getLineAreaChart().series} type="line" height={380} />
}

export const AllMixedChart = () => {
  return <ApexChart getOptions={getAllMixedChart} series={getAllMixedChart().series} type="line" height={380} />
}
