import PageBreadcrumb from '@/components/PageBreadcrumb'
import { BasicBarChart, CustomDataLabelsBarChart, FullStackedBarChart, GroupedBarChart, GroupedStackedBarChart, ImageFillBarChart, MarkersBarChart, NegativeBarChart, PatternedBarChart, ReversedBarChart, StackedBarChart } from './components/BarChart'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Bar Apexchart" subtitle="Apex" />

      <div className="container-fluid">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-base">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Basic Bar Charts</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <BasicBarChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Grouped Bar Chart</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <GroupedBarChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Stacked Bar Chart</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <StackedBarChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">100% Stacked Bar Chart</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <FullStackedBarChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Grouped Stacked Bars</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <GroupedStackedBarChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Bar with Negative Values</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <NegativeBarChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Reversed Bar Chart</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <ReversedBarChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Bar with Image Fill</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <ImageFillBarChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Custom DataLabels Bar</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <CustomDataLabelsBarChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Patterned Bar Chart</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <PatternedBarChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Bar with Markers</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <MarkersBarChart />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
