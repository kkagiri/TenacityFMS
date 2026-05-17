import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { BubbleChart, SimpleBubbleCharts, ThreeDBubbleChart } from './components/BubbleChart'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Bubble Apexchart" subtitle="Charts" />
      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Simple Bubble Charts</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <SimpleBubbleCharts />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">3D Bubble Charts</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <ThreeDBubbleChart />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Bubble Charts</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <BubbleChart />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}
export default Page
