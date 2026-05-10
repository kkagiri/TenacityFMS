import marketImg from '@/assets/images/leaflet/marker-icon.png'
import markerShadowImg from '@/assets/images/leaflet/marker-shadow.png'
import L, { LatLngExpression } from 'leaflet'
import { Circle, MapContainer, Marker, Polygon, TileLayer } from 'react-leaflet'

const ShapeMap = () => {
  const center: LatLngExpression = [51.5, -0.09]

  return (
    <MapContainer center={center} zoom={12} scrollWheelZoom={false} style={{ height: '300px', zIndex: 1 }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors' />

      <Marker icon={L.icon({ iconUrl: marketImg, shadowUrl: markerShadowImg.src })} position={center} />

      <Circle center={[51.508, -0.11]} pathOptions={{ color: 'red', fillColor: '#f03', fillOpacity: 0.5 }} radius={500} />

      <Polygon
        pathOptions={{ color: 'blue' }}
        positions={[
          [51.509, -0.08],
          [51.503, -0.06],
          [51.51, -0.047],
        ]}
      />
    </MapContainer>
  )
}
export default ShapeMap
