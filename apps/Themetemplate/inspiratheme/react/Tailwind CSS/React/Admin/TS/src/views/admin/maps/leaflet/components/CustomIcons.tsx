import leafGreen from '@/assets/images/leaflet/leaf-green.png'
import leafOrange from '@/assets/images/leaflet/leaf-orange.png'
import leafRed from '@/assets/images/leaflet/leaf-red.png'
import leafShadow from '@/assets/images/leaflet/leaf-shadow.png'
import L, { LatLngExpression } from 'leaflet'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'

const CustomIcon = () => {
  const center: LatLngExpression = [51.5, -0.09]

  return (
    <MapContainer center={center} zoom={10} scrollWheelZoom={false} style={{ height: '300px', zIndex: 1 }}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker
        icon={L.icon({
          iconUrl: leafRed,
          shadowUrl: leafShadow,
          iconSize: [38, 95],
          shadowSize: [50, 64],
          iconAnchor: [22, 94],
          shadowAnchor: [4, 62],
          popupAnchor: [-3, -76],
        })}
        position={[51.5, -0.09]}
      />
      <Marker
        icon={L.icon({
          iconUrl: leafGreen,
          shadowUrl: leafShadow,
          iconSize: [38, 95],
          shadowSize: [50, 64],
          iconAnchor: [22, 94],
          shadowAnchor: [4, 62],
          popupAnchor: [-3, -76],
        })}
        position={[51.4, -0.51]}
      />
      <Marker
        icon={L.icon({
          iconUrl: leafOrange,
          shadowUrl: leafShadow,
          iconSize: [38, 95],
          shadowSize: [50, 64],
          iconAnchor: [22, 94],
          shadowAnchor: [4, 62],
          popupAnchor: [-3, -76],
        })}
        position={[51.49, -0.45]}
      />
    </MapContainer>
  )
}

export default CustomIcon
