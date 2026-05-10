import ApexChart from '@/components/wrappers/ApexChart'
import { getHeatmapColorRange, getHeatmapSingleSeriesChart, getMultipleSeries, getRangeWithoutShades } from './data'

export const HeatmapSingleSeries = () => {
  return <ApexChart getOptions={getHeatmapSingleSeriesChart} series={getHeatmapSingleSeriesChart().series} type="heatmap" height={350} />
}

export const HeatmapMultipleSeries = () => {
  return <ApexChart getOptions={getMultipleSeries} series={getMultipleSeries().series} type="heatmap" height={350} />
}

export const HeatmapColorRange = () => {
  return <ApexChart getOptions={getHeatmapColorRange} series={getHeatmapColorRange().series} type="heatmap" height={350} />
}

export const HeatmapRangeWithoutShades = () => {
  return <ApexChart getOptions={getRangeWithoutShades} series={getRangeWithoutShades().series} type="heatmap" height={350} />
}
