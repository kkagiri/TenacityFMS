import BaseVectorMap from '@/components/wrappers/BaseVectorMap'
import 'jsvectormap'
import 'jsvectormap/dist/maps/russia'
import { getRussiaMapOptions } from './data'

const RussiaVectorMap = () => {
  return <BaseVectorMap id="russia-map" options={getRussiaMapOptions()} style={{ height: 360 }} />
}

export default RussiaVectorMap
