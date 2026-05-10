import ApexChart from '@/components/wrappers/ApexChart'
import { getBasicBarChart, getCustomDataLabelsBarChart, getFullStackedBarChart, getGroupedBarChart, getGroupedStackedBarChart, getImageFillBarChart, getMarkersBarChart, getNegativeBarChart, getPatternedBarChart, getReversedBarChart, getStackedBarChart } from './data'

export const BasicBarChart = () => {
  return <ApexChart getOptions={getBasicBarChart} series={getBasicBarChart().series} type="bar" height={350} />
}

export const GroupedBarChart = () => {
  return <ApexChart getOptions={getGroupedBarChart} series={getGroupedBarChart().series} type="bar" height={350} />
}

export const FullStackedBarChart = () => {
  return <ApexChart getOptions={getFullStackedBarChart} series={getFullStackedBarChart().series} type="bar" height={350} />
}

export const StackedBarChart = () => {
  return <ApexChart getOptions={getStackedBarChart} series={getStackedBarChart().series} type="bar" height={350} />
}

export const NegativeBarChart = () => {
  return <ApexChart getOptions={getNegativeBarChart} series={getNegativeBarChart().series} type="bar" height={350} />
}

export const GroupedStackedBarChart = () => {
  return <ApexChart getOptions={getGroupedStackedBarChart} series={getGroupedStackedBarChart().series} type="bar" height={350} />
}

export const ReversedBarChart = () => {
  return <ApexChart getOptions={getReversedBarChart} series={getReversedBarChart().series} type="bar" height={350} />
}

export const ImageFillBarChart = () => {
  return <ApexChart getOptions={getImageFillBarChart} series={getImageFillBarChart().series} type="bar" height={350} />
}

export const CustomDataLabelsBarChart = () => {
  return <ApexChart getOptions={getCustomDataLabelsBarChart} series={getCustomDataLabelsBarChart().series} type="bar" height={350} />
}

export const PatternedBarChart = () => {
  return <ApexChart getOptions={getPatternedBarChart} series={getPatternedBarChart().series} type="bar" height={350} />
}

export const MarkersBarChart = () => {
  return <ApexChart getOptions={getMarkersBarChart} series={getMarkersBarChart().series} type="bar" height={350} />
}
