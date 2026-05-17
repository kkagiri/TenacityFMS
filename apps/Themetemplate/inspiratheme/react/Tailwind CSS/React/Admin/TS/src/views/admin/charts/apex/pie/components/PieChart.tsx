import ApexChart from '@/components/wrappers/ApexChart'
import { useState } from 'react'

import { appendData, getDonutOptions, getGradientDonutChart, getImagePieChart, getMonochromeChart, getPatternedDonutChart, getSimpleDonutChart, getSimplePieChart, initialSeries, randomize, removeData } from './data'

export const SimplePieChart = () => {
  return <ApexChart getOptions={getSimplePieChart} series={getSimplePieChart().series} type="pie" height={320} />
}

export const SimpleDonutChart = () => {
  return <ApexChart getOptions={getSimpleDonutChart} series={getSimpleDonutChart().series} type="donut" height={320} />
}

export const MonochromePieChart = () => {
  return <ApexChart getOptions={getMonochromeChart} series={getMonochromeChart().series} type="pie" height={320} />
}

export const GradientDonutChart = () => {
  return <ApexChart getOptions={getGradientDonutChart} series={getGradientDonutChart().series} type="donut" height={320} />
}

export const PatternedDonutChart = () => {
  return <ApexChart getOptions={getPatternedDonutChart} series={getPatternedDonutChart().series} type="donut" height={320} />
}

export const ImagePieChart = () => {
  return <ApexChart getOptions={getImagePieChart} series={getImagePieChart().series} type="pie" height={320} />
}

export const UpdateDonutChart = () => {
  const [series, setSeries] = useState<number[]>(initialSeries)

  return (
    <>
      <ApexChart getOptions={() => getDonutOptions(series)} series={series} type="donut" height={320} />
      <div className="mt-2 text-center flex gap-1 justify-center">
        <button className="btn btn-sm bg-primary text-white hover:bg-primary-hover" onClick={() => setSeries(randomize(series))}>
          RANDOMIZE
        </button>
        <button className="btn btn-sm bg-primary text-white hover:bg-primary-hover" onClick={() => setSeries(appendData(series))}>
          ADD
        </button>
        <button className="btn btn-sm bg-primary text-white hover:bg-primary-hover" onClick={() => setSeries(removeData(series))}>
          REMOVE
        </button>
        <button className="btn btn-sm bg-primary text-white hover:bg-primary-hover" onClick={() => setSeries(initialSeries)}>
          RESET
        </button>
      </div>
    </>
  )
}
