
const GoogleMap = () => {
  return (
    <>
      <BasicGoogleMap />
      <StreetViewGoogleMap />
      <DarkGoogleMap />
    </>
  )
}

export default GoogleMap

export const BasicGoogleMap = () => {
  return (
    <div className="card">
      <div className="card-header block">
        <h5 className="card-title mb-1.25">Basic Google Map</h5>
        <p className="text-default-400">Displays a basic embedded Google Map.</p>
      </div>
      <div className="card-body">
        <iframe src="https://www.google.com/maps/embed/v1/place?q=Eiffel+Tower&key=AIzaSyBSFRN6WWGYwmFi498qXXsD2UwkbmD74v4" style={{ width: '100%', height: 360, overflow: 'hidden', border: 0 }} />
      </div>
    </div>
  )
}

export const StreetViewGoogleMap = () => {
  return (
    <div className="card">
      <div className="card-header block">
        <h5 className="card-title mb-1.25">Street View Google Map</h5>
        <p className="text-default-400">Displays a satellite-styled view of the map.</p>
      </div>
      <div className="card-body">
        <iframe src="https://www.google.com/maps/embed/v1/place?q=Statue+of+Liberty&key=AIzaSyBSFRN6WWGYwmFi498qXXsD2UwkbmD74v4&zoom=18&maptype=satellite" style={{ width: '100%', height: 360, overflow: 'hidden', border: 0 }} />
      </div>
    </div>
  )
}

export const DarkGoogleMap = () => {
  return (
    <div className="card">
      <div className="card-header block">
        <h5 className="card-title mb-1.25">Dark Google Map</h5>
        <p className="text-default-400">A dark-mode styled map using CSS filters.</p>
      </div>
      <div className="card-body">
        <iframe src="https://www.google.com/maps/embed/v1/place?q=Sydney+Opera+House&key=AIzaSyBSFRN6WWGYwmFi498qXXsD2UwkbmD74v4" style={{ width: '100%', height: 360, overflow: 'hidden', border: 0, filter: 'invert(100%) hue-rotate(180deg)' }} />
      </div>
    </div>
  )
}
