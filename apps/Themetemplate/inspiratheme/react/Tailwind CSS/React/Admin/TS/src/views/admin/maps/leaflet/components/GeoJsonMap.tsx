import type { Feature, FeatureCollection, Geometry } from 'geojson'
import { LatLngExpression } from 'leaflet'
import { GeoJSON, MapContainer, TileLayer } from 'react-leaflet'
import { statesData } from './data'

const getColor = (d: number): string => {
  return d > 1000 ? '#800026' : d > 500 ? '#BD0026' : d > 200 ? '#E31A1C' : d > 100 ? '#FC4E2A' : d > 50 ? '#FD8D3C' : d > 20 ? '#FEB24C' : d > 10 ? '#FED976' : '#FFEDA0'
}

const style = (feature?: Feature<Geometry, { density: number }>) => ({
  fillColor: getColor(feature?.properties?.density ?? 0),
  weight: 2,
  opacity: 1,
  color: 'white',
  dashArray: '3',
  fillOpacity: 0.7,
})

export const GeoJsonMap = () => {
  const center: LatLngExpression = [44.2669, -72.576]

  return (
    <MapContainer center={center} zoom={3} scrollWheelZoom={false} style={{ height: '300px', zIndex: 1 }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      <GeoJSON data={statesData as FeatureCollection<Geometry, { density: number }>} style={style} />
    </MapContainer>
  )
}
