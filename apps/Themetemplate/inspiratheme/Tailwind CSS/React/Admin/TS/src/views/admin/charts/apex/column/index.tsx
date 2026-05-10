import PageBreadcrumb from '@/components/PageBreadcrumb'
import {
  AnnotationsColumnChart,
  BasicColumnCharts,
  ColumnChartwithDatalabels,
  ColumnChartWithNegative,
  ColumnwithGroupLabel,
  ColumnwithMarkers,
  DistributedColumnCharts,
  DumbbellChart,
  DynamicLoadedChart,
  FullStackedColumnChart,
  GroupedStackedColumnsChart,
  RangeColumnCharts,
  StackedColumnCharts,
} from './components/ColumnChart'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Column Apexchart" subtitle="Charts" />
      <div className="container-fluid">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-base">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Basic Column Charts</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <BasicColumnCharts />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Column Chart with Datalabels</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <ColumnChartwithDatalabels />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Stacked Column Charts</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <StackedColumnCharts />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">100% Stacked Column Chart</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <FullStackedColumnChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Grouped Stacked Columns Chart</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <GroupedStackedColumnsChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Dumbbell Chart</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <DumbbellChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Column with Markers</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <ColumnwithMarkers />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Column with Group Label</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <ColumnwithGroupLabel />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Column Chart with rotated labels &amp; Annotations</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <AnnotationsColumnChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Column Chart with negative values</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <ColumnChartWithNegative />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Distributed Column Charts</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <DistributedColumnCharts />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Range Column Charts</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <RangeColumnCharts />
              </div>
            </div>
          </div>

          <div className="col-span-1 lg:col-span-2">
            <DynamicLoadedChart />
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
