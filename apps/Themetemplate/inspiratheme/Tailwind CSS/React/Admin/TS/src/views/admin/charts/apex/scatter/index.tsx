import PageBreadcrumb from '@/components/PageBreadcrumb'
import { BasicScatte, DatetimeScatter, ScatterImages } from './components/ScatterChart'

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Scatter Apexchart" subtitle="Charts" />
      <div className="container-fluid">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-base">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Scatter (XY) Chart</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <BasicScatte />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Scatter Chart - Datetime</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <DatetimeScatter />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Scatter - Images</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <ScatterImages />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
