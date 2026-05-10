import ApexChart from '@/components/wrappers/ApexChart'
import { useState } from 'react'
import { Button } from 'react-bootstrap'
import { generateRandomSeries, getBasicRadarChart, getRadarMultiPleSeriesChart, getRadarPolygonChart } from './data'
export const BasicRadarChart = () => {
  return <ApexChart getOptions={getBasicRadarChart} series={getBasicRadarChart().series} type="radar" height={350} />
}
export const RadarPolygonChart = () => {
  return <ApexChart getOptions={getRadarPolygonChart} series={getRadarPolygonChart().series} type="radar" height={350} />
}
export const RadarMultipleSeriesChart = () => {
  const [series, setSeries] = useState(generateRandomSeries)
  const handleUpdate = () => {
    setSeries(generateRandomSeries())
  }
  return (
    <>
      <ApexChart
        getOptions={() => ({
          ...getRadarMultiPleSeriesChart(),
          series,
        })}
        series={series}
        type="radar"
        height={350}
      />
      <div className="text-center mt-2">
        <Button size="sm" variant="primary" onClick={handleUpdate}>
          Update
        </Button>
      </div>
    </>
  )
}
