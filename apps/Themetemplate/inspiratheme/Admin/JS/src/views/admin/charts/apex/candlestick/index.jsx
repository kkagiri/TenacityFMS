import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { CandlestickWithLine, ComboCandlestickCharts, SimpleCandlestickCharts, XAxisCandlestickChart } from './components/CandleStickChart'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Candlestick Apexchart" subtitle="Charts" />
      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Simple Candlestick Charts</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <SimpleCandlestickCharts />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Combo Candlestick Charts</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <ComboCandlestickCharts />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Category X-Axis</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <XAxisCandlestickChart />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Candlestick with Line</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <CandlestickWithLine />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}
export default Page
