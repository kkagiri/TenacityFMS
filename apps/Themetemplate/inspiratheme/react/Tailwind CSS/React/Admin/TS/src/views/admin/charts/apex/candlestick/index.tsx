import PageBreadcrumb from '@/components/PageBreadcrumb'
import { CandlestickWithLine, ComboCandlestickCharts, SimpleCandlestickCharts, XAxisCandlestickChart } from './components/CandleStickChart'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Candlestick Apexchart" subtitle="Charts" />
      <div className="container-fluid">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-base">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Simple Candlestick Charts</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <SimpleCandlestickCharts />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Combo Candlestick Charts</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <ComboCandlestickCharts />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Category X-Axis</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <XAxisCandlestickChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Candlestick with Line</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <CandlestickWithLine />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
