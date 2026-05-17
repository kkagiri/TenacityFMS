import PageBreadcrumb from '@/components/PageBreadcrumb'
import { BasicBoxplot, HorizontalBoxPlot, ScatterBoxplot } from './components/BoxPlotChart'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Boxplot Apexchart" subtitle="Charts" />
      <div className="container-fluid">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-base">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Basic Boxplot</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <BasicBoxplot />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Scatter Boxplot</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <ScatterBoxplot />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Horizontal BoxPlot</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <HorizontalBoxPlot />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
