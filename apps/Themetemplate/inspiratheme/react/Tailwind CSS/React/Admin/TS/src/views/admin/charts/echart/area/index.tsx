import PageBreadcrumb from '@/components/PageBreadcrumb'
import { AreaWithMarkersChart, BasicAreachart, DynamicAreaChart, StackedAreaChart, StepArea } from './components/AreaChart'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Area Echart" subtitle="Charts" />

      <div className="container-fluid">
        <div className="grid xl:grid-cols-2 gap-base">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Area Chart</h4>
            </div>
            <div className="card-body">
              <BasicAreachart />
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Stacked Area Chart</h4>
            </div>
            <div className="card-body">
              <StackedAreaChart />
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Area with Marker</h4>
            </div>
            <div className="card-body">
              <AreaWithMarkersChart />
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Dynamic Area</h4>
            </div>
            <div className="card-body">
              <DynamicAreaChart />
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Step Area</h4>
            </div>
            <div className="card-body">
              <StepArea />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
