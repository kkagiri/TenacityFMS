import ApexChart from '@/components/wrappers/ApexChart'
import { getBasicRadialBarChart, getCircleAngleChart, getGuageCircularRadialChart, getImageRadialBarChart, getMultipleRadialBarChart, getSemiCircleGuageRadialChart, getStrokedGuageRadialChart } from './data'

export const BasicRadialBarChart = () => {
  return <ApexChart getOptions={getBasicRadialBarChart} series={getBasicRadialBarChart().series} type="radialBar" height={320} />
}
export const MultipleRadialBars = () => {
  return <ApexChart getOptions={getMultipleRadialBarChart} series={getMultipleRadialBarChart().series} type="radialBar" height={320} />
}
export const CircleAngleRadialBarChart = () => {
  return <ApexChart getOptions={getCircleAngleChart} series={getCircleAngleChart().series} type="radialBar" height={380} />
}

export const ImageRadialBarChart = () => {
  return <ApexChart getOptions={getImageRadialBarChart} series={getImageRadialBarChart().series} type="radialBar" height={360} />
}

export const StrokedRadialBarChart = () => {
  return <ApexChart getOptions={getStrokedGuageRadialChart} series={getStrokedGuageRadialChart().series} type="radialBar" height={380} />
}

export const GradientRadialBarChart = () => {
  return <ApexChart getOptions={getGuageCircularRadialChart} series={getGuageCircularRadialChart().series} type="radialBar" height={330} />
}

export const SemiCircleGaugeChart = () => {
  return <ApexChart getOptions={getSemiCircleGuageRadialChart} series={getSemiCircleGuageRadialChart().series} type="radialBar" />
}
