import ApexChart from '@/components/wrappers/ApexChart'
import Icon from '@/components/wrappers/Icon'
import { getColor } from '@/utils/helpers'
import { ApexOptions } from 'apexcharts'
import { Link } from 'react-router'
import { useState } from 'react'

function generateRandomData(count: number, min: number, max: number): number[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * (max - min + 1)) + min)
}

function generateSessionAndPageViewData(count: number) {
  const sessions = generateRandomData(count, 250, 450)
  const pageViews = sessions.map((session) => Math.floor(session * (2 + Math.random() * 0.5)))

  return { sessions, pageViews }
}

const AnalyticsOverview = () => {
  const getFinancialOverviewChart = (): ApexOptions => ({
    series: [
      {
        name: 'Sessions',
        data: sessions,
      },
      {
        name: 'Page Views',
        data: pageViews,
      },
    ],
    chart: {
      height: 326,
      type: 'area',
      toolbar: { show: false },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: 2,
      curve: 'smooth',
    },
    colors: [getColor('chart-primary'), getColor('chart-secondary')],
    legend: {
      offsetY: 5,
    },
    xaxis: {
      categories: ['', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM', '9 PM', '10 PM', '11 PM', '12 AM', ''],
      axisBorder: { show: false },
      axisTicks: { show: false },
      tickAmount: 6,
      labels: {
        style: { fontSize: '12px' },
      },
    },
    tooltip: {
      shared: true,
      y: {
        formatter: (val: number) => (val === 0 ? `${val} Sessions` : `${val} Page Views`),
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.2,
        stops: [15, 120, 100],
      },
    },
    grid: {
      borderColor: getColor('border-color'),
      padding: { bottom: 5 },
    },
  })
  const [{ sessions, pageViews }] = useState(() => generateSessionAndPageViewData(19))

  return (
    <>
      <div className="card-header">
        <h4 className="card-title">Analytics Overview</h4>
        <div>
          <Link to="" className="btn btn-sm bg-primary text-white">
            {' '}
            <Icon icon="download" className="me-1" /> Export CSV{' '}
          </Link>
        </div>
      </div>
      <div className="card-body">
        <div dir="ltr">
          <ApexChart getOptions={getFinancialOverviewChart} series={getFinancialOverviewChart().series} type="area" height={326} />
        </div>
      </div>
    </>
  )
}

export default AnalyticsOverview
