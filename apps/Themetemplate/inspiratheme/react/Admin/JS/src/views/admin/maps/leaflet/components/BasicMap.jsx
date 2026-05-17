import { MapContainer, TileLayer } from 'react-leaflet'
const BasicMap = () => {
  const center = [42.35, -71.08]
  return (
    <>
      <MapContainer
        center={center}
        zoom={10}
        scrollWheelZoom={false}
        style={{
          height: '300px',
        }}
      >
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      </MapContainer>
    </>
  )
}
export default BasicMap
