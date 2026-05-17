import BaseVectorMap from '@/components/wrappers/BaseVectorMap'
import { useEffect, useState } from 'react'
import { getIndiaMapOptions } from './data'

import 'jsvectormap'

const IndiaVectorMap = () => {
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    if ((window as any).jsVectorMap?.maps?.in_mill) {
      setMapLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = import.meta.env.VITE_BASE_URL || '' + '/data/in-mill-en.js'
    script.async = true

    script.onload = () => {
      setMapLoaded(true)
    }

    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  if (!mapLoaded) {
    return <div style={{ height: 360 }}>Loading map…</div>
  }

  return <BaseVectorMap id="india-map" options={getIndiaMapOptions()} style={{ height: 360 }} />
}

export default IndiaVectorMap
