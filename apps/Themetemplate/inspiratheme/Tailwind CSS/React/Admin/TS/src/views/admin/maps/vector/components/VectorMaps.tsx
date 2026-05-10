import BaseVectorMap from '@/components/wrappers/BaseVectorMap'
import WorldMapMarkerLine from './WorldMapMarkerLine'
import USAVectorMap from './USAVectorMap'
import CanadaVectorMap from './CanadaVectorMap'
import RussiaVectorMap from './RussiaVectorMap'
import IraqVectorMap from './IraqVectorMap'
import SpainVectorMap from './SpainVectorMap'
import IndiaVectorMap from './IndiaVectorMap'
import { getWorldMapOptions } from './data'










const VectorMaps = () => {
  return (
    <>
      <div className="card">
        <div className="card-header block">
          <h4 className="card-title mb-1.75">World Vector Map</h4>
          <p className="text-default-400">A global map showing countries with interactive markers.</p>
        </div>
        <div className="card-body">
          <BaseVectorMap id="world-map" options={getWorldMapOptions()} style={{ height: 360 }} />
        </div>
      </div>

      <div className="card">
        <div className="card-header block">
          <h4 className="card-title mb-1.75">World Vector Map</h4>
          <p className="text-default-400">Live dynamic vector representation of the world with real-time features.</p>
        </div>
        <div className="card-body">
          <WorldMapMarkerLine />
        </div>
      </div>

      <div className="card">
        <div className="card-header block">
          <h4 className="card-title mb-1.75">India Vector Map</h4>
          <p className="text-default-400">Interactive vector map of the India with state-level details.</p>
        </div>
        <div className="card-body">
          <IndiaVectorMap />
        </div>
      </div>

      <div className="card">
        <div className="card-header block">
          <h4 className="card-title mb-1.75">Canada Vector Map</h4>
          <p className="text-default-400">Detailed vector map of India with region highlights.</p>
        </div>
        <div className="card-body">
          <CanadaVectorMap />
        </div>
      </div>

      <div className="card">
        <div className="card-header block">
          <h4 className="card-title mb-1.75">Russia Vector Map</h4>
          <p className="text-default-400">Vector visualization of Iraq highlighting provinces and regions.</p>
        </div>
        <div className="card-body">
          <RussiaVectorMap />
        </div>
      </div>

      <div className="card">
        <div className="card-header block">
          <h4 className="card-title mb-1.75">US Vector Map</h4>
          <p className="text-default-400">Geographical map of Spain with region-based interaction.</p>
        </div>
        <div className="card-body">
          <USAVectorMap />
        </div>
      </div>

      <div className="card">
        <div className="card-header block">
          <h4 className="card-title mb-1.75">Iraq Vector Map</h4>
        </div>
        <div className="card-body">
          <IraqVectorMap />
        </div>
      </div>

      <div className="card">
        <div className="card-header block">
          <h4 className="card-title mb-1.75">Spain Vector Map</h4>
        </div>
        <div className="card-body">
          <SpainVectorMap />
        </div>
      </div>
    </>
  )
}

export default VectorMaps
