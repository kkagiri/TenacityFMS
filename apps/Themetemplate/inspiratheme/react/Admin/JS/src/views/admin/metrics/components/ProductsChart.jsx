import { CountUp } from '@/components/wrappers/CountUp'
import EChart from '@/components/wrappers/EChart'
import { LineChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { Card, CardBody } from 'react-bootstrap'
import { getProductsChartOptions } from './data'
const ProductsChart = () => {
  return (
    <Card className="text-bg-secondary border-0">
      <CardBody className="p-0">
        <div className="p-3 mb-3">
          <h3 className="mb-3 fw-bold">
            <span>
              <CountUp end={185} enableScrollSpy scrollSpyOnce />
            </span>
            <span className="text-white-50 ms-1 fs-sm">Products</span>
          </h3>
          <p className="mb-0 text-white-50">You currently have 185 active products available across your store inventory.</p>
        </div>
        <EChart
          extensions={[LineChart, TooltipComponent, CanvasRenderer]}
          getOptions={getProductsChartOptions}
          style={{
            height: 120,
          }}
        />
      </CardBody>
    </Card>
  )
}
export default ProductsChart
