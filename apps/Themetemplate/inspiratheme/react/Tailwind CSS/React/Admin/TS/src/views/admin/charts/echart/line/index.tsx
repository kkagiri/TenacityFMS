import PageBreadcrumb from '@/components/PageBreadcrumb'
import { ChartLineStacked, DynamicLine, LineChart, LineMarker, LineYCategory, StepLineChart } from './components/LineChart'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Line EChart" subtitle="Chart" />
      <div className="container-fluid">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-base">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Line Chart</h4>
            </div>
            <div className="card-body">
              <LineChart />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Line Stacked Chart</h4>
            </div>
            <div className="card-body">
              <ChartLineStacked />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Line Marker</h4>
            </div>
            <div className="card-body">
              <LineMarker />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Dynamic Line</h4>
            </div>
            <div className="card-body">
              <DynamicLine />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Step Line</h4>
            </div>
            <div className="card-body">
              <StepLineChart />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Line Y Category</h4>
            </div>
            <div className="card-body">
              <LineYCategory />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
