import { useLayoutContext } from '@/context/useLayoutContext'
import { useMemo } from 'react'
import ReactApexCharts from 'react-apexcharts'
const ApexChart = ({ type, height, width = '100%', getOptions, series, className }) => {
  const { skin, theme } = useLayoutContext()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const options = useMemo(() => getOptions(), [skin, theme, getOptions])
  return <ReactApexCharts type={type ?? options.chart?.type} height={height ?? options.chart?.height} width={width ?? options.chart?.width} options={options} series={series ?? options.series} className={`apex-charts ${className || ''}`} />
}
