import marketImg from '@/assets/images/leaflet/marker-icon.png'
import markerShadowImg from '@/assets/images/leaflet/marker-shadow.png'
import L, { LatLngExpression } from 'leaflet'
import { LayerGroup, LayersControl, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'

const LayerControl = () => {
  const center: LatLngExpression = [39.73, -104.99]

  const customIcon = new L.Icon({
    iconUrl: marketImg,
    shadowUrl: markerShadowImg,
  })

  return (
    <MapContainer center={center} zoom={9} scrollWheelZoom={false} style={{ height: '300px', zIndex: 1 }}>
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Street">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="CartoDB Dark">
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://carto.com/">CARTO</a>' />
        </LayersControl.BaseLayer>

        <LayersControl.Overlay checked name="Cities">
          <LayerGroup>
            <Marker position={[39.61, -105.02]} icon={customIcon}>
              <Popup>This is Littleton, CO.</Popup>
            </Marker>
            <Marker position={[39.74, -104.99]} icon={customIcon}>
              <Popup>This is Denver, CO.</Popup>
            </Marker>
            <Marker position={[39.73, -104.8]} icon={customIcon}>
              <Popup>This is Aurora, CO.</Popup>
            </Marker>
            <Marker position={[39.77, -105.23]} icon={customIcon}>
              <Popup>This is Golden, CO.</Popup>
            </Marker>
          </LayerGroup>
        </LayersControl.Overlay>
      </LayersControl>
    </MapContainer>
  )
}

export default LayerControl
