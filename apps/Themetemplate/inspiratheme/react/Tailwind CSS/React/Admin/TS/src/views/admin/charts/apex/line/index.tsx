import PageBreadcrumb from '@/components/PageBreadcrumb'
import { BrushChart, DashedLineChart, LineWithDataLabels, NullValuesChart, RealTimeChart, SimplelineChart, SteplineChart, SyncingCharts, ZoomableTimeseries } from './components/LineChart'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Line Apexchart" subtitle="Charts" />

      <div className="container-fluid">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-base">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Simple line chart</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <SimplelineChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Line with Data Labels</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <LineWithDataLabels />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Zoomable Timeseries</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <ZoomableTimeseries />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Syncing charts</h4>
            </div>
            <div className="card-body">
              <div id="line-chart-syncing2" />
              <div dir="ltr">
                <SyncingCharts />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Missing / Null values</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <NullValuesChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Dashed Line Chart</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <DashedLineChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Stepline Chart</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <SteplineChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Brush Chart</h4>
            </div>
            <div className="card-body">
              <BrushChart />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Realtime Chart</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <RealTimeChart />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
