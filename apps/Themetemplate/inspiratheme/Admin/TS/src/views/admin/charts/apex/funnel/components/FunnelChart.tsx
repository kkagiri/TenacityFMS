import ApexChart from '@/components/wrappers/ApexChart'
import { getBasicFunnelChart, getPyramidFunnelChart } from './data'

export const BasicFunnel = () => {
  return <ApexChart getOptions={getBasicFunnelChart} series={getBasicFunnelChart().series} type="bar" height={350} />
}

export const PyramidFunnel = () => {
  return <ApexChart getOptions={getPyramidFunnelChart} series={getPyramidFunnelChart().series} type="bar" height={350} />
}
