import PageBreadcrumb from '@/components/PageBreadcrumb'
import { BasicFunnel, PyramidFunnel } from './components/FunnelChart'

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Funnel Apexcharts" subtitle="Charts" />
      <div className="container-fluid">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-base">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Basic Funnel</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <BasicFunnel />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Pyramid Funnel</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <PyramidFunnel />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
