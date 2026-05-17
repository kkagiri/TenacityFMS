import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { GradientDonutChart, ImagePieChart, MonochromePieChart, PatternedDonutChart, SimpleDonutChart, SimplePieChart, UpdateDonutChart } from './components/PieChart'

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Pie Apexchart" subtitle="Charts" />
      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Simple Pie Chart</CardTitle>
            </CardHeader>

            <CardBody>
              <div dir="ltr">
                <SimplePieChart />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Simple Donut Chart</CardTitle>
            </CardHeader>

            <CardBody>
              <div dir="ltr">
                <SimpleDonutChart />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Monochrome Pie Chart</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <MonochromePieChart />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Gradient Donut Chart</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <GradientDonutChart />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Patterned Donut Chart</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <PatternedDonutChart />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Pie Chart with Image fill</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <ImagePieChart />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Donut Update</CardTitle>
            </CardHeader>

            <CardBody>
              <div dir="ltr">
                <UpdateDonutChart />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default Page
