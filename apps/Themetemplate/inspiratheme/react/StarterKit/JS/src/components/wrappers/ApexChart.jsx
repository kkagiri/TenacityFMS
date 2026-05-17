import { useLayoutContext } from '@/context/useLayoutContext'
import { useMemo } from 'react'
import ReactApexCharts from 'react-apexcharts'
const ApexChart = ({ type, height, width = '100%', getOptions, series, className }) => {
  const { skin, theme } = useLayoutContext()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const options = useMemo(() => getOptions(), [skin, theme, getOptions])
  return <ReactApexCharts key={`${theme}-${skin}`} type={type} height={height} width={width} options={options} series={series} className={`apex-charts ${className ?? ''}`} />
}
export default ApexChart
