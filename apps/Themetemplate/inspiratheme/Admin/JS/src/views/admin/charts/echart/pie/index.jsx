import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { BasicPieChart, DoughnutPieChart, DoughnutRoundedPieChart, MultiplePieChart, NightingaleMap, PieEdgeAlignChart, PieLabelAlignChart } from './components/PieChart'
const Page = () => {
  return (
    <>
      <PageBreadcrumb subtitle="Charts" title="Pie Echart" />
      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                Basic Pie Chart
              </CardTitle>
            </CardHeader>
            <CardBody>
              <BasicPieChart />
            </CardBody>
          </Card>
        </Col>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                Doughnut Pie Chart
              </CardTitle>
            </CardHeader>
            <CardBody>
              <DoughnutPieChart />
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                Doughnut Rounded Pie Chart
              </CardTitle>
            </CardHeader>
            <CardBody>
              <DoughnutRoundedPieChart />
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                Multiple Pie Chart
              </CardTitle>
            </CardHeader>
            <CardBody>
              <MultiplePieChart />
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                Pie Label Align Chart
              </CardTitle>
            </CardHeader>
            <CardBody>
              <PieLabelAlignChart />
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                Nightingale Map
              </CardTitle>
            </CardHeader>
            <CardBody>
              <NightingaleMap />
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                Pie Edge Align Chart
              </CardTitle>
            </CardHeader>
            <CardBody>
              <PieEdgeAlignChart />
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}
export default Page
