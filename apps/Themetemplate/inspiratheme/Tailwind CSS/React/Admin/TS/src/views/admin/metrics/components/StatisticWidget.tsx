import { Fragment } from 'react'
import { statisticsData } from './data'
import StatisticWidgetChartLeft from './StatisticWidgetChartLeft'
import StatisticWidgetChartRight from './StatisticWidgetChartRight'

const StatisticWidget = () => {
  return (
    <>
      <div className="grid xl:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-base mb-5">
        {statisticsData.slice(0, 4).map((item, idx) => (
          <Fragment key={idx}>{idx % 2 === 0 ? <StatisticWidgetChartRight item={item} /> : <StatisticWidgetChartLeft item={item} />}</Fragment>
        ))}
      </div>

      <div className="grid xl:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-base mb-5">
        {statisticsData.slice(4, 8).map((item, idx) => (
          <Fragment key={idx}>{idx % 2 === 0 ? <StatisticWidgetChartLeft item={item} /> : <StatisticWidgetChartRight item={item} />}</Fragment>
        ))}
      </div>

      <div className="grid xl:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-base mb-5">
        {statisticsData.slice(8, 12).map((item, idx) => (
          <Fragment key={idx}>{idx % 2 === 0 ? <StatisticWidgetChartRight item={item} /> : <StatisticWidgetChartLeft item={item} />}</Fragment>
        ))}
      </div>
    </>
  )
}

export default StatisticWidget
