import { useLayoutContext } from '@/context/useLayoutContext'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts/core'
import { useEffect, useState } from 'react'
let extensionsRegistered = false
const EChart = ({ getOptions, extensions, ...props }) => {
  if (!extensionsRegistered) {
    echarts.use(extensions)
    extensionsRegistered = true
  }
  const { skin, theme } = useLayoutContext()
  const [options, setOptions] = useState(getOptions())
  useEffect(() => {
    setTimeout(() => {
      setOptions(getOptions())
    })
  }, [skin, theme])
  return <ReactECharts echarts={echarts} {...props} option={options} />
}
export default EChart
