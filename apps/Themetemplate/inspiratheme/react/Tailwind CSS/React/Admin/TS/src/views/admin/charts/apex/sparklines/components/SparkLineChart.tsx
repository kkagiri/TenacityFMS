import ApexChart from '@/components/wrappers/ApexChart'
import { getChart1, getChart2, getChart3, getChart4, getChart5, getChart6, getChart7, getChart8, getSpark1Chart, getSpark2Chart, getSpark3Chart } from './data'

export const Spark1 = () => {
  return <ApexChart getOptions={getSpark1Chart} series={getSpark1Chart().series} type="area" height={160} />
}

export const Spark2 = () => {
  return <ApexChart getOptions={getSpark2Chart} series={getSpark2Chart().series} type="area" height={160} />
}

export const Spark3 = () => {
  return <ApexChart getOptions={getSpark3Chart} series={getSpark3Chart().series} type="area" height={160} />
}

export const Chart1 = () => {
  return <ApexChart getOptions={getChart1} series={getChart1().series} type="line" height={60} width={140} />
}

export const Chart2 = () => {
  return <ApexChart getOptions={getChart2} series={getChart2().series} type="line" height={60} width={140} />
}

export const Chart3 = () => {
  return <ApexChart getOptions={getChart3} series={getChart3().series} type="line" height={60} width={140} />
}

export const Chart4 = () => {
  return <ApexChart getOptions={getChart4} series={getChart4().series} type="line" height={60} width={140} />
}

export const Chart5 = () => {
  return <ApexChart getOptions={getChart5} series={getChart5().series} type="bar" height={60} width={140} />
}

export const Chart6 = () => {
  return <ApexChart getOptions={getChart6} series={getChart6().series} type="bar" height={60} width={140} />
}
export const Chart7 = () => {
  return <ApexChart getOptions={getChart7} series={getChart7().series} type="bar" height={60} width={140} />
}

export const Chart8 = () => {
  return <ApexChart getOptions={getChart8} series={getChart8().series} type="bar" height={60} width={140} />
}
