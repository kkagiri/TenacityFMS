import PageBreadcrumb from '@/components/PageBreadcrumb'
import { BasicHeatmapChart, HeatmapChart, HeatMapDataChart } from './components/HeatMapChart'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Heatmap Echart" subtitle="EChart" />
      <div className="container-fluid">
        <div className="grid xl:grid-cols-2 gap-base">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Heatmap Echart</h4>
            </div>
            <div className="card-body">
              <BasicHeatmapChart />
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Heatmap Chart</h4>
            </div>
            <div className="card-body">
              <HeatmapChart />
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Heatmap - 20K Data Chart</h4>
            </div>
            <div className="card-body">
              <HeatMapDataChart />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
