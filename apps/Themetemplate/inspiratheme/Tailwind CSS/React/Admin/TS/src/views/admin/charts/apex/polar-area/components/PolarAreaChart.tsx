import ApexChart from '@/components/wrappers/ApexChart'
import { getBasicPolarAreaChart, getMonochromePolarAreaChart } from './data'

export const BasicPolarAreaChart = () => {
  return <ApexChart getOptions={getBasicPolarAreaChart} series={getBasicPolarAreaChart().series} type="polarArea" height={380} />
}

export const MonochromePolarAreaChart = () => {
  return <ApexChart getOptions={getMonochromePolarAreaChart} series={getMonochromePolarAreaChart().series} type="polarArea" height={380} />
}
