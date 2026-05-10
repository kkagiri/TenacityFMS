import PageBreadcrumb from '@/components/PageBreadcrumb'
import { BasicSlope, MultiSlope } from './components/SlopeChart'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Slope Apexcharts" subtitle="Charts" />
      <div className="container-fluid">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-base">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Basic Slope</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <BasicSlope />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Multi Slope</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <MultiSlope />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
