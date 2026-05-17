import PageBreadcrumb from '@/components/PageBreadcrumb'
import { BasicRadarChart, CustomizedRadarChart, MultipleRadarChart, ProportionofBrowsers } from './components/RadarChart'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Radar Echart" subtitle="Charts" />
      <div className="container-fluid">
        <div className="grid xl:grid-cols-2 gap-base">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Basic Radar Chart</h4>
            </div>
            <div className="card-body">
              <BasicRadarChart />
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Proportion of Browsers</h4>
            </div>
            <div className="card-body">
              <ProportionofBrowsers />
            </div>
          </div>
          <div className="col-span-2">
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Customized Radar Chart</h4>
              </div>
              <div className="card-body">
                <CustomizedRadarChart />
              </div>
            </div>
          </div>

          <div className="col-span-2">
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Multiple Radar Chart</h4>
              </div>
              <div className="card-body">
                <MultipleRadarChart />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
