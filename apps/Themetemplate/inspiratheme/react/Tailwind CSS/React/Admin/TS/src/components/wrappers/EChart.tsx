import ReactECharts from 'echarts-for-react'
import { type EChartsOption } from 'echarts'
import { EChartsReactProps } from 'echarts-for-react'
import * as echarts from 'echarts/core'
import { useEffect, useState } from 'react'

import { useLayoutContext } from '@/context/useLayoutContext'



type EChartClientProps = {
  getOptions: () => EChartsOption
  extensions: any[]
} & Omit<EChartsReactProps, 'option'>

let extensionsRegistered = false

const EChart = ({ getOptions, extensions, ...props }: EChartClientProps) => {
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
