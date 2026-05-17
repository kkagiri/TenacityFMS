import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { BrushChart, DashedLineChart, LineWithDataLabels, NullValuesChart, RealTimeChart, SimplelineChart, SteplineChart, SyncingCharts, ZoomableTimeseries } from './components/LineChart'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Line Apexchart" subtitle="Charts" />
      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Simple line chart</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <SimplelineChart />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Line with Data Labels</CardTitle>
            </CardHeader>

            <CardBody>
              <div dir="ltr">
                <LineWithDataLabels />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Zoomable Timeseries</CardTitle>
            </CardHeader>

            <CardBody>
              <div dir="ltr">
                <ZoomableTimeseries />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Syncing charts</CardTitle>
            </CardHeader>

            <CardBody>
              <div dir="ltr">
                <SyncingCharts />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Missing / Null values</CardTitle>
            </CardHeader>

            <CardBody>
              <div dir="ltr">
                <NullValuesChart />
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Dashed Line Chart</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <DashedLineChart />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Stepline Chart</CardTitle>
            </CardHeader>

            <CardBody>
              <SteplineChart />
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Brush Chart</CardTitle>
            </CardHeader>

            <CardBody>
              <BrushChart />
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Realtime Chart</CardTitle>
            </CardHeader>

            <CardBody>
              <RealTimeChart />
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default Page
