import PageBreadcrumb from '@/components/PageBreadcrumb'
import GeoMapWithPieChart from './components/GeoMapWithPieChart'
import GeoSVGScatterMap from './components/GeoSVGScatterMap'
import MorphingMapBarChart from './components/MorphingMapBarChart'
import UsaMap from './components/UsaMap'
import WorldMap from './components/WorldMap'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="GEO Maps" subtitle="Charts" />
      <div className="container-fluid">
        <div className="grid xl:grid-cols-2 gap-base">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">World Map</h4>
            </div>
            <div className="card-body">
              <WorldMap />
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">USA Map</h4>
            </div>
            <div className="card-body">
              <UsaMap />
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Morphing between Map and Bar Chart</h4>
            </div>
            <div className="card-body">
              <MorphingMapBarChart />
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Pie Chart on Geo Map</h4>
            </div>
            <div className="card-body">
              <GeoMapWithPieChart />
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">GEO SVG Scatter</h4>
            </div>
            <div className="card-body">
              <GeoSVGScatterMap />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
