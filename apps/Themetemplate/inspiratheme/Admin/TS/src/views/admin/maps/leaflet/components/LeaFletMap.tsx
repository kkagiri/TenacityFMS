import { Col, Row } from 'react-bootstrap'
import BasicMap from './BasicMap'
import CustomIcon from './CustomIcons'
import DraggableMarker from './DraggableMarker'
import { InteractiveChoroplethMap } from './InteractiveChoroplethMap'
import LayerControl from './LayerControl'
import ShapeMap from './ShapeMap'
import UserLocationMap from './UserLocationMap'

const LeaFletMap = () => {
  return (
    <>
      <Row className="g-3">
        <Col lg={4}>
          <h5 className="mb-1">Basic Map</h5>
          <p className="text-muted mb-0">A simple Leaflet map centered with default tile layer and controls.</p>
        </Col>
        <Col lg={8}>
          <BasicMap />
        </Col>
      </Row>
      <div className="my-4 border-top border-dashed" />

      <Row className="g-3">
        <Col lg={4}>
          <h5 className="mb-1">Marker, Circle & Polygon</h5>
          <p className="text-muted mb-0">Shows how to add interactive markers, circles, and polygons on the map.</p>
        </Col>
        <Col lg={8}>
          <ShapeMap />
        </Col>
      </Row>
      <div className="my-4 border-top border-dashed" />

      <Row className="g-3">
        <Col lg={4}>
          <h5 className="mb-1">Draggable Marker with Popup</h5>
          <p className="text-muted mb-0">Allows dragging a marker with a popup that displays dynamic content.</p>
        </Col>
        <Col lg={8}>
          <DraggableMarker />
        </Col>
      </Row>
      <div className="my-4 border-top border-dashed" />

      <Row className="g-3">
        <Col lg={4}>
          <h5 className="mb-1">User Location</h5>
          <p className="text-muted mb-0">Uses the browser&apos;s geolocation API to show the user&apos; current location.</p>
        </Col>
        <Col lg={8}>
          <UserLocationMap />
        </Col>
      </Row>
      <div className="my-4 border-top border-dashed" />

      <Row className="g-3">
        <Col lg={4}>
          <h5 className="mb-1">Custom Icons</h5>
          <p className="text-muted mb-0">Demonstrates using custom image icons for Leaflet map markers.</p>
        </Col>
        <Col lg={8}>
          <CustomIcon />
        </Col>
      </Row>
      <div className="my-4 border-top border-dashed" />

      <Row className="g-3">
        <Col lg={4}>
          <h5 className="mb-1">Layer Control</h5>
          <p className="text-muted mb-0">Toggles between multiple map layers or overlays using Leaflet’s layer control.</p>
        </Col>
        <Col lg={8}>
          <LayerControl />
        </Col>
      </Row>
      <div className="my-4 border-top border-dashed" />

      <Row className="g-3">
        <Col lg={4}>
          <h5 className="mb-1">Interactive Choropleth Map</h5>
          <p className="text-muted mb-0">Displays region-based data using GeoJSON and interactive color scales.</p>
        </Col>
        <Col lg={8}>
          <InteractiveChoroplethMap />
        </Col>
      </Row>
    </>
  )
}

export default LeaFletMap
