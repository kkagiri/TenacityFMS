import { CountUp } from '@/components/wrappers/CountUp'
import EChart from '@/components/wrappers/EChart'
import { LineChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getProductsChartOptions } from './data'

const ProductsChart = () => {
  return (
    <div className="card bg-secondary">
      <div className="p-5 mb-5">
        <h3 className="mb-5 text-xl font-bold text-white">
          <CountUp end={185} enableScrollSpy scrollSpyOnce />
          <span className="text-white/50 ms-1.25 text-sm">Products</span>
        </h3>
        <p className="text-white/50">You currently have 185 active products available across your store inventory.</p>
      </div>
      <EChart extensions={[LineChart, TooltipComponent, CanvasRenderer]} getOptions={getProductsChartOptions} style={{ height: 120 }} />
    </div>
  )
}

export default ProductsChart
