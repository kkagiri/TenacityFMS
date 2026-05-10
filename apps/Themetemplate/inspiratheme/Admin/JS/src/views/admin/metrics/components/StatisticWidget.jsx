import { Col, Row } from 'react-bootstrap'
import { statisticsData } from './data'
import StatisticWidgetChartLeft from './StatisticWidgetChartLeft'
import StatisticWidgetChartRight from './StatisticWidgetChartRight'
const StatisticWidget = () => {
  return (
    <>
      <Row className="row-cols-xxl-4 row-cols-md-2 row-cols-1">
        {statisticsData.slice(0, 4).map((item, idx) => (
          <Col key={idx}>{idx % 2 === 0 ? <StatisticWidgetChartRight item={item} /> : <StatisticWidgetChartLeft item={item} />}</Col>
        ))}
      </Row>

      <Row className="row-cols-xxl-4 row-cols-md-2 row-cols-1">
        {statisticsData.slice(4, 8).map((item, idx) => (
          <Col key={idx}>{idx % 2 === 0 ? <StatisticWidgetChartRight item={item} /> : <StatisticWidgetChartLeft item={item} />}</Col>
        ))}
      </Row>

      <Row className="row-cols-xxl-4 row-cols-md-2 row-cols-1">
        {statisticsData.slice(8, 12).map((item, idx) => (
          <Col key={idx}>{idx % 2 === 0 ? <StatisticWidgetChartRight item={item} /> : <StatisticWidgetChartLeft item={item} />}</Col>
        ))}
      </Row>
    </>
  )
}
export default StatisticWidget
