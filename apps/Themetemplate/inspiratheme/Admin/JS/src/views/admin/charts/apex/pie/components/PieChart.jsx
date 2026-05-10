import ApexChart from '@/components/wrappers/ApexChart'
import { useState } from 'react'
import { Button } from 'react-bootstrap'
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
  const [series, setSeries] = useState(initialSeries)
  return (
    <>
      <ApexChart getOptions={() => getDonutOptions(series)} series={series} type="donut" height={320} />
      <div className="text-center mt-2 d-flex justify-content-center gap-2 flex-wrap">
        <Button variant="primary" size="sm" onClick={() => setSeries(randomize(series))}>
          RANDOMIZE
        </Button>
        <Button variant="primary" size="sm" onClick={() => setSeries(appendData(series))}>
          ADD
        </Button>
        <Button variant="primary" size="sm" onClick={() => setSeries(removeData(series))}>
          REMOVE
        </Button>
        <Button variant="primary" size="sm" onClick={() => setSeries(initialSeries)}>
          RESET
        </Button>
      </div>
    </>
  )
}
