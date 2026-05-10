import PageBreadcrumb from '@/components/PageBreadcrumb'
import { HeatmapColorRange, HeatmapMultipleSeries, HeatmapRangeWithoutShades, HeatmapSingleSeries } from './components/HeatMap'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Heatmap Apexchart" subtitle="Charts" />

      <div className="container-fluid">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-base">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Heatmap - Single Series</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <HeatmapSingleSeries />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Multiple Series</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <HeatmapMultipleSeries />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Heatmap - Color Range</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <HeatmapColorRange />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Heatmap - Range without Shades</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <HeatmapRangeWithoutShades />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
