import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import { statisticCardData } from './components/data'
import OrdersCard from './components/OrdersCard'
import ProductsChart from './components/ProductsChart'
import ProfitOverviewChart from './components/ProfitOverviewChart'
import QuarterlyReports from './components/QuarterlyReports'
import StatisticCard from './components/StatisticCard'
import StatisticWidget from './components/StatisticWidget'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Metrics" subtitle="Pages" />

      <Row className="row-cols-xxl-4 row-cols-md-2 row-cols-1">
        {statisticCardData.map((item, idx) => (
          <Col key={idx}>
            <StatisticCard item={item} />
          </Col>
        ))}
      </Row>

      <StatisticWidget />

      <Row>
        <Col xxl={4}>
          <QuarterlyReports />
        </Col>
        <Col xxl={8}>
          <Row>
            <Col xl={4}>
              <OrdersCard />
            </Col>

            <Col xl={4}>
              <ProductsChart />
            </Col>

            <Col xl={4}>
              <ProfitOverviewChart />
            </Col>
          </Row>
        </Col>
      </Row>
    </>
  )
}
export default Page
