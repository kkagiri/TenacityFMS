import marketImg from '@/assets/images/leaflet/marker-icon.png'
import markerShadowImg from '@/assets/images/leaflet/marker-shadow.png'
import L, { LatLngExpression } from 'leaflet'
import { useEffect, useState } from 'react'
import { Circle, MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet'

const LocationFinder = () => {
  const [position, setPosition] = useState<LatLngExpression | null>(null)
  const [accuracy, setAccuracy] = useState<number>(0)

  const map = useMapEvents({
    locationfound(e) {
      setPosition(e.latlng)
      setAccuracy(e.accuracy)
      map.setView(e.latlng, 16)
    },
    locationerror() {
      alert('[translate:Location access denied.]')
    },
  })

  useEffect(() => {
    map.locate({ setView: true, maxZoom: 16 })
  }, [map])

  if (!position) return null

  return (
    <>
      <Marker icon={L.icon({ iconUrl: marketImg, shadowUrl: markerShadowImg.src })} position={center}>
        <Popup>[translate:You are somewhere around] {Math.round(accuracy)} [translate:meters from this point]</Popup>
      </Marker>
      <Circle center={position} radius={accuracy} />
    </>
  )
}

const center: LatLngExpression = [42.35, -71.08]
const UserLocationMap = () => (
  <MapContainer center={center} zoom={10} scrollWheelZoom={false} style={{ height: '300px', zIndex: 1 }}>
    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors' />
    <LocationFinder />
  </MapContainer>
)

export default UserLocationMap
