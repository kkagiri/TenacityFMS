import { CountUp } from '@/components/wrappers/CountUp'
import EChart from '@/components/wrappers/EChart'
import { LineChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { profitChartOptions } from './data'

const ProfitOverviewChart = () => {
  return (
    <div className="card">
      <div className="card-body">
        <h3 className="mb-5 font-bold text-xl">
          <CountUp end={12.5} decimals={2} prefix={'$'} suffix={'k'} enableScrollSpy scrollSpyOnce />
          <span className="text-default-400 ms-1.25 text-sm">Profit</span>
        </h3>
        <p className="mb-5">Your total profit reached $12,500 this month, showing stable and positive business growth.</p>
        <EChart extensions={[LineChart, TooltipComponent, CanvasRenderer]} getOptions={profitChartOptions} style={{ height: 120 }} />
      </div>
    </div>
  )
}

export default ProfitOverviewChart
