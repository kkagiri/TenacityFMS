import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { BasicRadarChart, RadarMultipleSeriesChart, RadarPolygonChart } from './components/RadarChart'

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Radar Apexchart" subtitle="Charts" />
      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Basic Radar Chart</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <BasicRadarChart />
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Radar with Polygon-fill</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <RadarPolygonChart />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Radar – Multiple Series</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <RadarMultipleSeriesChart />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default Page
