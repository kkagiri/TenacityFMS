import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { BasicRadialBarChart, CircleAngleRadialBarChart, GradientRadialBarChart, ImageRadialBarChart, MultipleRadialBars, SemiCircleGaugeChart, StrokedRadialBarChart } from './components/Radialbar'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="RadialBar Apexchart" subtitle="Charts" />
      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Basic RadialBar Chart</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <BasicRadialBarChart />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Multiple RadialBars</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <MultipleRadialBars />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Circle Chart - Custom Angle</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="text-center" dir="ltr">
                <CircleAngleRadialBarChart />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Circle Chart with Image</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <ImageRadialBarChart />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Stroked Circular Guage</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <StrokedRadialBarChart />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Gradient Circular Chart</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <GradientRadialBarChart />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Semi Circle Gauge</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <SemiCircleGaugeChart />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}
export default Page
