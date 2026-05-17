import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { AreaChartDatetime, AreawithNegativeValues, AreaWithNullValues, BasicAreaChart, IrregularTimeSeries, SplineAreaChart, StackedAreaChart } from './components/AreaChart'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Area Apexchart" subtitle="Charts" />
      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Basic Area Chart</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <BasicAreaChart />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Spline Area</CardTitle>
            </CardHeader>

            <CardBody>
              <div dir="ltr">
                <SplineAreaChart />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Area Chart - Datetime X-axis</CardTitle>
            </CardHeader>
            <CardBody>
              <AreaChartDatetime />
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Area with Negative Values</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <AreawithNegativeValues />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Stacked Area</CardTitle>
            </CardHeader>

            <CardBody>
              <div dir="ltr">
                <StackedAreaChart />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Irregular TimeSeries</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <IrregularTimeSeries />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Area Chart with Null values</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <AreaWithNullValues />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}
export default Page
