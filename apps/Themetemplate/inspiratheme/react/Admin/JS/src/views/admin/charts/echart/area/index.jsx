import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { AreaWithMarkersChart, BasicAreachart, DynamicAreaChart, StackedAreaChart, StepArea } from './components/AreaChart'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Area Echart" subtitle="Charts" />
      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                Area Chart
              </CardTitle>
            </CardHeader>
            <CardBody>
              <BasicAreachart />
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                Stacked Area Chart
              </CardTitle>
            </CardHeader>
            <CardBody>
              <StackedAreaChart />
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                Area with Marker
              </CardTitle>
            </CardHeader>
            <CardBody>
              <AreaWithMarkersChart />
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                Dynamic Area
              </CardTitle>
            </CardHeader>
            <CardBody>
              <DynamicAreaChart />
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                Step Area
              </CardTitle>
            </CardHeader>
            <CardBody>
              <StepArea />
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}
export default Page
