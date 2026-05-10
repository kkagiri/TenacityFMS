import ApexChart from '@/components/wrappers/ApexChart'
import { getCandlestickChart, getCandlestickWithLineChart, getComboBarCandlestickChart, getComboCandlestickCharts, getXAxisCandlestickChart } from './data'

export const SimpleCandlestickCharts = () => {
  return <ApexChart getOptions={getCandlestickChart} series={getCandlestickChart().series} type="candlestick" height={350} />
}
export const ComboCandlestickCharts = () => {
  return (
    <>
      <ApexChart getOptions={getComboCandlestickCharts} series={getComboCandlestickCharts().series} type="candlestick" height={220} />
      <ApexChart getOptions={getComboBarCandlestickChart} series={getComboBarCandlestickChart().series} type="bar" height={130} />
    </>
  )
}

export const XAxisCandlestickChart = () => {
  return <ApexChart getOptions={getXAxisCandlestickChart} series={getXAxisCandlestickChart().series} type="candlestick" height={380} />
}

export const CandlestickWithLine = () => {
  return <ApexChart getOptions={getCandlestickWithLineChart} series={getCandlestickWithLineChart().series} type="candlestick" height={380} />
}
