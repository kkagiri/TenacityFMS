import BaseVectorMap from '@/components/wrappers/BaseVectorMap'

import 'jsvectormap'
import 'jsvectormap/dist/maps/iraq'
import { getIraqMapOptions } from './data'

const IraqVectorMap = () => {
  return <BaseVectorMap id="iraq-map" options={getIraqMapOptions()} style={{ height: 360 }} />
}

export default IraqVectorMap
