import PageBreadcrumb from '@/components/PageBreadcrumb'
import { BasicPieChart, DoughnutPieChart, DoughnutRoundedPieChart, MultiplePieChart, NightingaleMap, PieEdgeAlignChart, PieLabelAlignChart } from './components/PieChart'


const Page = () => {
  return (
    <>
      <PageBreadcrumb subtitle="Charts" title="Pie Echarts" />
      <div className="container-fluid">
        <div className="grid grid-cols-2 gap-base">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Basic Pie Chart</h4>
            </div>
            <div className="card-body">
              <BasicPieChart />
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Doughnut Pie Chart</h4>
            </div>
            <div className="card-body">
              <DoughnutPieChart />
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Doughnut Rounded Pie Chart</h4>
            </div>
            <div className="card-body">
              <DoughnutRoundedPieChart />
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Multiple Pie Chart</h4>
            </div>
            <div className="card-body">
              <MultiplePieChart />
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Pie Label Align Chart</h4>
            </div>
            <div className="card-body">
              <PieLabelAlignChart />
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Nightingale Map</h4>
            </div>
            <div className="card-body">
              <NightingaleMap />
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Pie Edge Align Chart</h4>
            </div>
            <div className="card-body">
              <PieEdgeAlignChart />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
