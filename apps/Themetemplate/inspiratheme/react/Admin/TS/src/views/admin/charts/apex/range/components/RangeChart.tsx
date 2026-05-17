import ApexChart from '@/components/wrappers/ApexChart'
import { getBasicRangeArea, getComboRangeArea } from './data'

export const BasicRangeArea = () => {
  return <ApexChart getOptions={getBasicRangeArea} series={getBasicRangeArea().series} type="rangeArea" height={350} />
}

export const ComboRangeArea = () => {
  return <ApexChart getOptions={getComboRangeArea} series={getComboRangeArea().series} type="rangeArea" height={350} />
}
