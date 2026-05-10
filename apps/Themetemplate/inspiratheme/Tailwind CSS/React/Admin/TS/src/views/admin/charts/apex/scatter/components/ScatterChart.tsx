
import ApexChart from '@/components/wrappers/ApexChart'
import { getBasicScatter, getDateTimeScatterChart, getImageScatterChart } from './data'

export const BasicScatte = () => {
  return <ApexChart getOptions={getBasicScatter} series={getBasicScatter().series} type="scatter" height={380} />
}

export const DatetimeScatter = () => {
  return <ApexChart getOptions={getDateTimeScatterChart} series={getDateTimeScatterChart().series} type="scatter" height={380} />
}

export const ScatterImages = () => {
  return <ApexChart getOptions={getImageScatterChart} series={getImageScatterChart().series} type="scatter" height={380} className="apex-charts scatter-images-chart" />
}
