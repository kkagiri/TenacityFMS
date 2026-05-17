import PageBreadcrumb from '@/components/PageBreadcrumb'
import { AllMixedChart, LineAreaChart, LineColumnMixed, MultipleYaxisMixed } from './components/MixedChart'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Mixed Apexchart" subtitle="Charts" />
      <div className="container-fluid">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-base">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Line &amp; Column Chart</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <LineColumnMixed />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Multiple Y-Axis Chart</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <MultipleYaxisMixed />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Line &amp; Area Chart</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <LineAreaChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Line, Column &amp; Area Chart</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <AllMixedChart />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
