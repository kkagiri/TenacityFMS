import PageBreadcrumb from '@/components/PageBreadcrumb'
import { BasicSunburstChart, NestedPieChart, PictorialbarDottedChart } from './components/OthersChart'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Other Echart" subtitle="Charts" />
      <div className="container-fluid">
        <div className="grid xl:grid-cols-2 gap-base">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Pictorialbar Dotted Chart</h4>
            </div>
            <div className="card-body p-2 pt-0">
              <PictorialbarDottedChart />
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Basic Sunburst Chart</h4>
            </div>
            <div className="card-body p-2 pt-0">
              <BasicSunburstChart />
            </div>
          </div>
          <div className="col-span-2">
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Nested Pie Chart</h4>
              </div>
              <div className="card-body">
                <NestedPieChart />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
