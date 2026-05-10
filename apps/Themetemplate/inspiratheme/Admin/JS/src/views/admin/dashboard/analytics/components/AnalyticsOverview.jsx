import ApexChart from '@/components/wrappers/ApexChart'
import Icon from '@/components/wrappers/Icon'
import { getColor } from '@/utils/helpers'
import { useState } from 'react'
import { Button, CardBody, CardHeader, CardTitle } from 'react-bootstrap'
function generateRandomData(count, min, max) {
  return Array.from(
    {
      length: count,
    },
    () => Math.floor(Math.random() * (max - min + 1)) + min
  )
}
function generateSessionAndPageViewData(count) {
  const sessions = generateRandomData(count, 250, 450)
  const pageViews = sessions.map((session) => Math.floor(session * (2 + Math.random() * 0.5)))
  return {
    sessions,
    pageViews,
  }
}
const AnalyticsOverview = () => {
  const getFinancialOverviewChart = () => ({
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
      toolbar: {
        show: false,
      },
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
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      tickAmount: 6,
      labels: {
        style: {
          fontSize: '12px',
        },
      },
    },
    tooltip: {
      shared: true,
      y: {
        formatter: (val, { seriesIndex }) => (seriesIndex === 0 ? `${val} Sessions` : `${val} Page Views`),
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
      padding: {
        bottom: 5,
      },
    },
  })
  const [{ sessions, pageViews }] = useState(() => generateSessionAndPageViewData(19))
  return (
    <>
      <CardHeader className="justify-content-between border-dashed">
        <CardTitle as="h4" className="mb-0">
          Analytics Overview
        </CardTitle>
        <div className="d-flex flex-wrap gap-1">
          <Button variant="primary" size="sm">
            <Icon icon="download" className="me-1" />
            Export CSV
          </Button>
        </div>
      </CardHeader>

      <CardBody>
        <div dir="ltr">
          <ApexChart getOptions={getFinancialOverviewChart} series={getFinancialOverviewChart().series} type="area" height={326} />
        </div>
      </CardBody>
    </>
  )
}
export default AnalyticsOverview
