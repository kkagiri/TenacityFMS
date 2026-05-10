import { CountUp } from '@/components/wrappers/CountUp'
import EChart from '@/components/wrappers/EChart'
import { BarChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getOrderChartOptions } from './data'

const OrdersCard = () => {
  return (
    <div className="card">
      <div className="p-5">
        <h3 className="mb-5 text-xl font-bold">
          <CountUp start={0} end={421} duration={1} />
          <span className="text-default-400 ms-1.25 text-sm">Orders</span>
        </h3>
        <p className="mb-0">You have received 421 new orders, indicating a healthy sales trend over the past period.</p>
      </div>

      <EChart extensions={[BarChart, TooltipComponent, CanvasRenderer]} getOptions={getOrderChartOptions} style={{ height: 120 }} className="mb-5" />
    </div>
  )
}
export default OrdersCard
