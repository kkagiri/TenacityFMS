import BaseVectorMap from '@/components/maps/BaseVectorMap'
import 'jsvectormap'
import 'jsvectormap/dist/maps/canada'
import { getCanadaMapOptions } from './data'
const CanadaVectorMap = () => {
  return (
    <BaseVectorMap
      id="canada-map"
      options={getCanadaMapOptions()}
      style={{
        height: 360,
      }}
    />
  )
}
export default CanadaVectorMap
