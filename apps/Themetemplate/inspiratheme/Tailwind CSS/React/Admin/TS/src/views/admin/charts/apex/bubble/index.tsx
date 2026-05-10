import PageBreadcrumb from '@/components/PageBreadcrumb'
import { BubbleChart, SimpleBubbleCharts, ThreeDBubbleChart } from './components/BubbleChart'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Bubble Apexchart" subtitle="Apex" />

      <div className="container-fluid">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-base">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Simple Bubble Charts</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <SimpleBubbleCharts />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">3D Bubble Charts</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <ThreeDBubbleChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Bubble Charts</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <BubbleChart />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
