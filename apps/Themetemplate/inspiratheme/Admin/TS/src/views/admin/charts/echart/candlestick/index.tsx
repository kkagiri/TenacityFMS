import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { BasicCandlestick, MixedCandlestick } from './components/Candlestick'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Candlestick Echart" subtitle="Charts" />
      <Row>
        <Col xl={12}>
          <Card>
            <CardHeader>
              <CardTitle className="mb-0">Basic Candlestick Chart</CardTitle>
            </CardHeader>
            <CardBody>
              <BasicCandlestick />
            </CardBody>
          </Card>
        </Col>

        <Col xl={12}>
          <Card>
            <CardHeader>
              <CardTitle className="mb-0">Mixed Candlestick Chart</CardTitle>
            </CardHeader>
            <CardBody>
              <MixedCandlestick />
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default Page
