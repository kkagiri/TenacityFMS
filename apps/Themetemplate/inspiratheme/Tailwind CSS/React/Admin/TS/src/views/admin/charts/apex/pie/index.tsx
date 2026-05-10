import PageBreadcrumb from '@/components/PageBreadcrumb'
import { GradientDonutChart, ImagePieChart, MonochromePieChart, PatternedDonutChart, SimpleDonutChart, SimplePieChart, UpdateDonutChart } from './components/PieChart'

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Pie Apexchart" subtitle="Charts" />
      <div className="container-fluid">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-base">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Simple Pie Chart</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <SimplePieChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Simple Donut Chart</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <SimpleDonutChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Monochrome Pie Chart</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <MonochromePieChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Gradient Donut Chart</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <GradientDonutChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Patterned Donut Chart</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <PatternedDonutChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Pie Chart with Image fill</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <ImagePieChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Donut Update</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <UpdateDonutChart />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
