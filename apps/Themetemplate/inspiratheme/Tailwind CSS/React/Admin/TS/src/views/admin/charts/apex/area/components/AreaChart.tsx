import ApexChart from '@/components/wrappers/ApexChart'
import { META_DATA } from '@/config/constants'
import { useState } from 'react'
import { datetimeData, getAreaChartDateTimeChart, getAreaChartWithNullValues, getAreaTimeSeriesChart, getAreaWithNegativeChart, getBasicAreaChart, getSplineAreaChart, getStackedAreaChart } from './data'

export const BasicAreaChart = () => {
  return <ApexChart getOptions={getBasicAreaChart} series={getBasicAreaChart().series} type="area" height={380} />
}

export const SplineAreaChart = () => {
  return <ApexChart getOptions={getSplineAreaChart} series={getSplineAreaChart().series} type="area" height={380} />
}

export const AreaChartDatetime = () => {
  const [filteredData, setFilteredData] = useState(datetimeData)
  const [activeRange, setActiveRange] = useState('1Y')

  const filterChartRange = (range: string) => {
    const now = new Date(datetimeData[datetimeData.length - 1][0])
    let fromDate

    switch (range) {
      case '1M':
        fromDate = new Date(now)
        fromDate.setMonth(now.getMonth() - 1)
        break
      case '6M':
        fromDate = new Date(now)
        fromDate.setMonth(now.getMonth() - 6)
        break
      case '1Y':
        fromDate = new Date(now)
        fromDate.setFullYear(now.getFullYear() - 1)
        break
      case 'YTD':
        fromDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        fromDate = new Date(datetimeData[0][0])
    }

    const filtered = datetimeData.filter((point) => point[0] >= fromDate.getTime())
    setFilteredData(filtered)
    setActiveRange(range)
  }
  return (
    <>
      <div className="toolbar apex-toolbar" style={{ display: 'flex', gap: '4px' }}>
        {['1M', '6M', '1Y', 'YTD', 'ALL'].map((range) => (
          <button key={range} className={`btn btn-sm bg-default-100 ${activeRange === range ? 'bg-primary text-white' : ''}`} onClick={() => filterChartRange(range)}>
            {range}
          </button>
        ))}
      </div>
      <ApexChart getOptions={() => getAreaChartDateTimeChart(filteredData)} series={[{ name: META_DATA.name, data: filteredData }]} type="area" height={350} />
    </>
  )
}

export const AreawithNegativeValues = () => {
  return <ApexChart getOptions={getAreaWithNegativeChart} series={getAreaWithNegativeChart().series} type="area" height={380} />
}

export const StackedAreaChart = () => {
  return <ApexChart getOptions={getStackedAreaChart} series={getStackedAreaChart().series} type="area" height={422} />
}

export const IrregularTimeSeries = () => {
  return <ApexChart getOptions={getAreaTimeSeriesChart} series={getAreaTimeSeriesChart().series} type="area" height={350} />
}
export const AreaWithNullValues = () => {
  return <ApexChart getOptions={getAreaChartWithNullValues} series={getAreaChartWithNullValues().series} type="area" height={350} />
}
