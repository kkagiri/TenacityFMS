import BasicMap from './BasicMap'
import CustomIcon from './CustomIcons'
import DraggableMarker from './DraggableMarker'
import { GeoJsonMap } from './GeoJsonMap'
import LayerControl from './LayerControl'
import ShapeMap from './ShapeMap'
import UserLocationMap from './UserLocationMap'

const LeaFletMap = () => {
  return (
    <>
      <div className="card">
        <div className="card-header block">
          <h4 className="card-title mb-1.25">Basic Map</h4>
          <p className="text-default-400">A simple Leaflet map centered with default tile layer and controls.</p>
        </div>
        <div className="card-body">
          <BasicMap />
        </div>
      </div>

      <div className="card">
        <div className="card-header block">
          <h4 className="card-title mb-1.25">Marker Circle &amp; Polygon</h4>
          <p className="text-default-400">Shows how to add interactive markers, circles, and polygons on the map.</p>
        </div>
        <div className="card-body">
          <ShapeMap />
        </div>
      </div>

      <div className="card">
        <div className="card-header block">
          <h4 className="card-title mb-1.25">Draggable Marker With Popup</h4>
          <p className="text-default-400">Allows dragging a marker with a popup that displays dynamic content.</p>
        </div>
        <div className="card-body">
          <DraggableMarker />
        </div>
      </div>

      <div className="card">
        <div className="card-header block">
          <h4 className="card-title mb-1.25">User Location</h4>
          <p className="text-default-400">Uses the browser&apos;s geolocation API to show the user&apos;s current location.</p>
        </div>
        <div className="card-body">
          <UserLocationMap />
        </div>
      </div>

      <div className="card">
        <div className="card-header block">
          <h4 className="card-title mb-1.25">Custom Icons</h4>
          <p className="text-default-400">Demonstrates using custom image icons for Leaflet map markers.</p>
        </div>
        <div className="card-body">
          <CustomIcon />
        </div>
      </div>

      <div className="card">
        <div className="card-header block">
          <h4 className="card-title mb-1.25">Layer Control</h4>
          <p className="text-default-400">Toggles between multiple map layers or overlays using Leaflet’s layer control.</p>
        </div>
        <div className="card-body">
          <LayerControl />
        </div>
      </div>

      <div className="card">
        <div className="card-header block">
          <h4 className="card-title mb-1.25">Interactive Choropleth Map</h4>
          <p className="text-default-400">Displays region-based data using GeoJSON and interactive color scales.</p>
        </div>
        <div className="card-body">
          <GeoJsonMap />
        </div>
      </div>
    </>
  )
}

export default LeaFletMap
