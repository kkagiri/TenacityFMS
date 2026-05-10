import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { BasicHeatmapChart, HeatmapChart, HeatMapDataChart } from './components/HeatMapChart'

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Heatmap Echart" subtitle="EChart" />
      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                Basic Heatmap Chart
              </CardTitle>
            </CardHeader>
            <CardBody>
              <BasicHeatmapChart />
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                Heatmap Chart
              </CardTitle>
            </CardHeader>
            <CardBody>
              <HeatmapChart />
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                Heatmap - 20K Data Chart
              </CardTitle>
            </CardHeader>
            <CardBody>
              <HeatMapDataChart />
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default Page
