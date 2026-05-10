import PageBreadcrumb from '@/components/PageBreadcrumb'
import { BasicRangeArea, ComboRangeArea } from './components/RangeChart'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Range Apexcharts" subtitle="Charts" />
      <div className="container-fluid">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-base">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Basic Range Area</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <BasicRangeArea />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Range Area With Line</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <ComboRangeArea />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
