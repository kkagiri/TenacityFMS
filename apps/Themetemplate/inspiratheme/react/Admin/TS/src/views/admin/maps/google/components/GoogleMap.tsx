import { AdvancedMarker, APIProvider, Map, Pin } from '@vis.gl/react-google-maps'
import { CardBody, Col, Row } from 'react-bootstrap'

const GoogleMap = () => {
  return (
    <>
      <CardBody>
        <BasicGoogleMap />

        <div className="my-4 border-top border-dashed" />

        <StreetViewGoogleMap />

        <div className="my-4 border-top border-dashed" />

        <DarkGoogleMap />
      </CardBody>
    </>
  )
}

export default GoogleMap

export const BasicGoogleMap = () => {
  return (
    <Row className="g-3">
      <Col lg={4}>
        <h5 className="mb-1">Basic Google Map</h5>
        <p className="text-muted mb-0">Displays a basic embedded Google Map.</p>
      </Col>
      <Col lg={8}>
        <APIProvider apiKey={''}>
          <Map defaultCenter={{ lat: 37.8, lng: -122.4 }} defaultZoom={14} style={{ width: '100%', height: '360px' }} />
        </APIProvider>
      </Col>
    </Row>
  )
}

export const StreetViewGoogleMap = () => {
  return (
    <Row className="g-3">
      <Col lg={4}>
        <h5 className="mb-1">Street View Google Map</h5>
        <p className="text-muted mb-0">Displays a satellite-styled view of the map.</p>
      </Col>
      <Col lg={8}>
        <APIProvider apiKey={''}>
          <Map mapId="bf51a910020fa25b" style={{ width: '100%', height: '360px' }} defaultCenter={{ lat: 37.8, lng: -122.4 }} defaultZoom={10}>
            <AdvancedMarker position={{ lat: 37.8, lng: -122.4 }} title="AdvancedMarker with customized pin.">
              <Pin />
            </AdvancedMarker>
            <AdvancedMarker position={{ lat: 37.7, lng: -122.48 }} title="AdvancedMarker with custom html content.">
              <div
                style={{
                  width: 20,
                  height: 20,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  background: '#1dbe80',
                  border: '2px solid #0e6443',
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              ></div>
            </AdvancedMarker>
          </Map>
        </APIProvider>
      </Col>
    </Row>
  )
}

export const DarkGoogleMap = () => {
  return (
    <Row className="g-3">
      <Col lg={4}>
        <h5 className="mb-1">Dark Google Map</h5>
        <p className="text-muted mb-0">A dark-mode styled map using CSS filters.</p>
      </Col>
      <Col lg={8}>
        <APIProvider apiKey={''}>
          <Map defaultCenter={{ lat: 37.8, lng: -122.4 }} defaultZoom={14} mapId="49ae42fed52588c3" mapTypeId="hybrid" gestureHandling="greedy" disableDefaultUI={true} style={{ width: '100%', height: '360px' }} />
        </APIProvider>
      </Col>
    </Row>
  )
}
