import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { ChartLineStacked, DynamicLine, LineChart, LineMarker, LineYCategory, StepLineChart } from './components/LineChart'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Line Echart" subtitle="Chart" />
      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                Line Chart
              </CardTitle>
            </CardHeader>
            <CardBody>
              <LineChart />
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                Line Stacked Chart
              </CardTitle>
            </CardHeader>
            <CardBody>
              <ChartLineStacked />
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                Line Marker
              </CardTitle>
            </CardHeader>
            <CardBody>
              <LineMarker />
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                Dynamic Line
              </CardTitle>
            </CardHeader>
            <CardBody>
              <DynamicLine />
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                Step Line
              </CardTitle>
            </CardHeader>
            <CardBody>
              <StepLineChart />
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                Line Y Category
              </CardTitle>
            </CardHeader>
            <CardBody>
              <LineYCategory />
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}
export default Page
