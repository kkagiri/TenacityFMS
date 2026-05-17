import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { BubbleEchart, QuartetScatterChart, ScatterEChart, SingleAxisScatterchart } from './components/ScatterChart'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Scatter Echart" subtitle="Charts" />
      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                Scatter Chart
              </CardTitle>
            </CardHeader>
            <CardBody>
              <ScatterEChart />
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                Bubble Chart
              </CardTitle>
            </CardHeader>
            <CardBody>
              <BubbleEchart />
            </CardBody>
          </Card>
        </Col>

        <Col xl={12}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                Quartet Scatter Chart
              </CardTitle>
            </CardHeader>
            <CardBody>
              <QuartetScatterChart />
            </CardBody>
          </Card>
        </Col>

        <Col xl={12}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                Single Axis Scatter chart
              </CardTitle>
            </CardHeader>
            <CardBody>
              <SingleAxisScatterchart />
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default Page
