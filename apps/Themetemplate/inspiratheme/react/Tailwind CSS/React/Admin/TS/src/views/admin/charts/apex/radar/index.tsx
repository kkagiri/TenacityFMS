import PageBreadcrumb from '@/components/PageBreadcrumb'
import { BasicRadarChart, RadarMultipleSeriesChart, RadarPolygonChart } from './components/RadarChart'

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Radar Apexchart" subtitle="Charts" />
      <div className="container-fluid">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-base">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Basic Radar Chart</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <BasicRadarChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Radar with Polygon-fill</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <RadarPolygonChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Radar – Multiple Series</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <RadarMultipleSeriesChart />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
