import ApexChart from '@/components/wrappers/ApexChart'
import { getSalesChartOptions } from './data'

const SalesChart = () => {
  return <ApexChart getOptions={getSalesChartOptions} series={getSalesChartOptions().series} type="line" height={400} />
}
export default SalesChart
