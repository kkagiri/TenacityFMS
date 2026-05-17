import ApexChart from '@/components/wrappers/ApexChart'
import Icon from '@/components/wrappers/Icon'
import { getColor } from '@/utils/helpers'
import { type ApexOptions } from 'apexcharts'
import { Card, CardBody } from 'react-bootstrap'
import { ApiStatisticsType } from './data'

const sparklineConfig = (data: number[], color: string): ApexOptions => ({
  chart: {
    type: 'area',
    height: 60,
    sparkline: { enabled: true },
  },
  stroke: {
    curve: 'smooth',
    width: 2,
  },
  series: [{ data }],
  colors: [color],
  tooltip: {
    enabled: false,
  },
})

const ApiWidget = ({ item }: { item: ApiStatisticsType }) => {
  const options = sparklineConfig(item.chartData, getColor(item.color))
  return (
    <>
      <Card>
        <CardBody>
          <div className="d-flex align-items-center gap-3">
            <div className="avatar-xl text-bg-light rounded-circle">
              <span className="avatar-title">
                <Icon icon={item.icon} className="fs-xxl" />
              </span>
            </div>
            <div className="flex-grow-1">
              <h6 className="mb-2 text-muted text-uppercase fs-xs">{item.title}</h6>
              <h4 className="mb-0 fw-bold">{item.value}</h4>
            </div>
          </div>
          <ApexChart type="area" height={60} className="mt-3" getOptions={() => options} series={options.series ?? []} />
        </CardBody>
      </Card>
    </>
  )
}

export default ApiWidget
