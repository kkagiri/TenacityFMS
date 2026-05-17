import marketImg from '@/assets/images/leaflet/marker-icon.png'
import markerShadowImg from '@/assets/images/leaflet/marker-shadow.png'
import L, { LatLngExpression } from 'leaflet'
import { useMemo, useRef, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'

const DraggableMarker = () => {
  const center: LatLngExpression = [51.5, -0.09]

  const [position, setPosition] = useState(center)
  const markerRef = useRef(null)
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current
        if (marker !== null) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          setPosition(marker.getLatLng())
        }
      },
    }),
    []
  )
  return (
    <MapContainer center={center} zoom={12} scrollWheelZoom={false} style={{ height: '300px', zIndex: 1 }}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker icon={L.icon({ iconUrl: marketImg, shadowUrl: markerShadowImg.src })} position={position} draggable={true} eventHandlers={eventHandlers} ref={markerRef}>
        <Popup>
          <b>You&apos;re here!</b>
        </Popup>
      </Marker>
    </MapContainer>
  )
}

export default DraggableMarker
