import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { BasicSunburstChart, NestedPieChart, PictorialbarDottedChart } from './components/OthersChart'

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Other Echart" subtitle="Charts" />
      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader className="border-0">
              <CardTitle as="h4" className="mb-0">
                Pictorialbar Dotted Chart
              </CardTitle>
            </CardHeader>
            <CardBody className="p-2 pt-0">
              <PictorialbarDottedChart />
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                Basic Sunburst Chart
              </CardTitle>
            </CardHeader>
            <CardBody className="p-2 pt-0">
              <BasicSunburstChart />
            </CardBody>
          </Card>
        </Col>

        <Col xl={12}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                Nested Pie Chart
              </CardTitle>
            </CardHeader>
            <CardBody>
              <NestedPieChart />
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default Page
