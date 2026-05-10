import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, Col, Row } from 'react-bootstrap'
import AnalyticsOverview from './components/AnalyticsOverview'
import { statsData } from './components/data'
import ExtraSideData from './components/ExtraSideData'
import SessionsDevice from './components/SessionsDevice'
import Stat from './components/Stat'
import TopCountries from './components/TopCountries'
import TopPerformance from './components/TopPerformance'
import TrafficSources from './components/TrafficSources'
export const dynamic = 'force-dynamic'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Analytics" subtitle="Dashboard" />

      <Row>
        <Col md={12}>
          <Card>
            <CardBody className="p-0">
              <Row className="g-0">
                <Col xxl={3} className="order-2 order-xxl-1">
                  <Row className="g-0">
                    {statsData.map((item, idx) => (
                      <Col lg={6} xl={6} xxl={12} key={idx}>
                        <Stat item={item} idx={idx} />
                      </Col>
                    ))}
                  </Row>
                </Col>
                <Col xxl={9} className="order-1 order-xxl-2 border-start border-dashed">
                  <AnalyticsOverview />
                </Col>
              </Row>
            </CardBody>
          </Card>

          <Row>
            <Col xxl={4}>
              <SessionsDevice />
            </Col>
            <Col xxl={4} lg={6}>
              <TrafficSources />
            </Col>
            <Col xxl={4} lg={6}>
              <TopCountries />
            </Col>
          </Row>

          <Row>
            <Col xs={12}>
              <TopPerformance />
            </Col>
          </Row>
        </Col>
      </Row>

      <ExtraSideData />
    </>
  )
}
export default Page
