import PageBreadcrumb from '@/components/PageBreadcrumb'
import { BasicPolarAreaChart, MonochromePolarAreaChart } from './components/PolarAreaChart'

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Polar Area Apexchart" subtitle="Charts" />

      <div className="container-fluid">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-base">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Basic Polar Area Chart</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <BasicPolarAreaChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Monochrome Polar Area</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <MonochromePolarAreaChart />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
