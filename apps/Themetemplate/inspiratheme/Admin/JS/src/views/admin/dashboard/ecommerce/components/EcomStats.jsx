import { CountUp } from '@/components/wrappers/CountUp'
import EChart from '@/components/wrappers/EChart'
import { generateRandomEChartData, getColor } from '@/utils/helpers'
import { PieChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { Badge, Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap'
export const getEchartOptions = () => {
  const productData = generateRandomEChartData(['A', 'B', 'C'])
  return {
    tooltip: {
      show: false,
    },
    series: [
      {
        type: 'pie',
        radius: ['65%', '100%'],
        label: {
          show: false,
        },
        labelLine: {
          show: false,
        },
        data: productData.map((item, index) => ({
          value: item.value,
          itemStyle: {
            color: index === 0 ? getColor('primary') : index === 1 ? getColor('secondary') : '#bbcae14d',
          },
        })),
      },
    ],
  }
}
const EcomStats = ({ item }) => {
  return (
    <Card>
      <CardHeader className="d-flex border-dashed justify-content-between align-items-center">
        <CardTitle as="h5">{item.title}</CardTitle>
        <Badge bg={item.badgeColor} text={item.badgeColor} className={`bg-opacity-10`}>
          {item.badgeText}
        </Badge>
      </CardHeader>
      <CardBody>
        <div className="d-flex justify-content-between align-items-center text-nowrap">
          <div className="flex-grow-1">
            <EChart
              extensions={[PieChart, TooltipComponent, CanvasRenderer]}
              getOptions={getEchartOptions}
              style={{
                height: 60,
                width: 60,
              }}
            />
          </div>

          <div className="text-end">
            <h3 className="mb-2 fw-normal">
              {item?.prefix}
              <CountUp duration={1} decimals={Number.isInteger(item.targetValue) ? 0 : 2} end={item.targetValue} enableScrollSpy scrollSpyOnce />
              {item?.suffix}
            </h3>
            <p className="mb-0 text-muted">
              <span>{item.metric}</span>
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
export default EcomStats
