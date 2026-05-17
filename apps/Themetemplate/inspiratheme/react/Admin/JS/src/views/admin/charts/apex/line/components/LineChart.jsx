import ApexChart from '@/components/wrappers/ApexChart'
import { useEffect, useRef, useState } from 'react'
import ReactApexChart from 'react-apexcharts'
import {
  createDailyTimeSeries,
  generateNewPoint,
  getBrushChart,
  getBrushChart2,
  getDashedLineChart,
  getGradientLineChart,
  getLineChart,
  getLineChartWithAnnotations,
  getMissingLineChart,
  getRealTimeChartOptions,
  getSimpleLineChart,
  getStepLineChart,
  getSyncingCharts,
  getSyncingCharts2,
  getZoomableTimeSeriesChart,
} from './data'
export const SimplelineChart = () => {
  return <ApexChart getOptions={getSimpleLineChart} series={getSimpleLineChart().series} type="line" height={380} />
}
export const LineWithDataLabels = () => {
  return <ApexChart getOptions={getLineChart} series={getLineChart().series} type="line" height={380} />
}
export const ZoomableTimeseries = () => {
  return <ApexChart getOptions={getZoomableTimeSeriesChart} series={getZoomableTimeSeriesChart().series} type="area" height={380} />
}
export const LineChartWithAnnotations = () => {
  return <ApexChart getOptions={getLineChartWithAnnotations} series={getLineChartWithAnnotations().series} type="line" height={380} />
}
export const SyncingCharts = () => {
  return (
    <>
      <ApexChart getOptions={getSyncingCharts2} series={getSyncingCharts2().series} type="line" height={200} />
      <ApexChart getOptions={getSyncingCharts} series={getSyncingCharts().series} type="line" height={180} />
    </>
  )
}
export const GradientLineChart = () => {
  return <ApexChart getOptions={getGradientLineChart} series={getGradientLineChart().series} type="line" height={380} />
}
export const NullValuesChart = () => {
  return <ApexChart getOptions={getMissingLineChart} series={getMissingLineChart().series} type="line" height={380} />
}
export const DashedLineChart = () => {
  return <ApexChart getOptions={getDashedLineChart} series={getDashedLineChart().series} type="line" height={380} />
}
export const SteplineChart = () => {
  return <ApexChart getOptions={getStepLineChart} series={getStepLineChart().series} type="line" height={360} />
}
export const BrushChart = () => {
  return (
    <>
      <ApexChart getOptions={getBrushChart} series={getBrushChart().series} type="line" height={230} />
      <ApexChart getOptions={getBrushChart2} series={getBrushChart2().series} type="area" height={130} />
    </>
  )
}
export const RealTimeChart = () => {
  const [series, setSeries] = useState([
    {
      data: [],
    },
  ])
  const [options, setOptions] = useState(() => getRealTimeChartOptions([]))
  const dataRef = useRef([])
  const lastDateRef = useRef(0)
  useEffect(() => {
    const initialData = createDailyTimeSeries(new Date('11 May 2024 GMT').getTime(), 10, {
      min: 10,
      max: 90,
    })
    dataRef.current = initialData
    lastDateRef.current = initialData[initialData.length - 1][0]
    setSeries([
      {
        data: [...initialData],
      },
    ])
    setOptions(getRealTimeChartOptions(initialData))
    const updateInterval = setInterval(() => {
      const newPoint = generateNewPoint(lastDateRef.current, {
        min: 10,
        max: 90,
      })
      lastDateRef.current = newPoint[0]
      dataRef.current.push(newPoint)
      setSeries([
        {
          data: [...dataRef.current],
        },
      ])
    }, 2000)
    const resetInterval = setInterval(() => {
      dataRef.current = dataRef.current.slice(-10)
      setSeries([
        {
          data: [...dataRef.current],
        },
      ])
    }, 60000)
    return () => {
      clearInterval(updateInterval)
      clearInterval(resetInterval)
    }
  }, [])
  return <ReactApexChart options={options} series={series} type="line" height={350} className="apex-charts" />
}
