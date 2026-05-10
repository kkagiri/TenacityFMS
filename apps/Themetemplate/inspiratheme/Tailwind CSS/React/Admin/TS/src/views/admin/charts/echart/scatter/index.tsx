import PageBreadcrumb from '@/components/PageBreadcrumb'
import { BubbleEchart, QuartetScatterChart, ScatterEChart, SingleAxisScatterchart } from './components/ScatterChart'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Scatter Echart" subtitle="Charts" />
      <div className="container-fluid">
        <div className="grid xl:grid-cols-2 gap-base">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Scatter Chart</h4>
            </div>
            <div className="card-body">
              <ScatterEChart />
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Bubble Chart</h4>
            </div>
            <div className="card-body">
              <BubbleEchart />
            </div>
          </div>
          <div className="col-span-2">
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Quartet Scatter Chart</h4>
              </div>
              <div className="card-body">
                <QuartetScatterChart />
              </div>
            </div>
          </div>

          <div className="col-span-2">
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Single Axis Scatter chart</h4>
              </div>
              <div className="card-body">
                <SingleAxisScatterchart />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
