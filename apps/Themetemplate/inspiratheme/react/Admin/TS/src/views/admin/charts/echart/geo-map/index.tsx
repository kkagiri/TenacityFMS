import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import GeoMapWithPieChart from './components/GeoMapWithPieChart'
import GeoSVGScatterMap from './components/GeoSVGScatterMap'
import MorphingMapBarChart from './components/MorphingMapBarChart'
import UsaMap from './components/UsaMap'
import WorldMap from './components/WorldMap'

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="GEO Maps" subtitle="Charts" />
      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                World Map
              </CardTitle>
            </CardHeader>
            <CardBody>
              <WorldMap />
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                USA Map
              </CardTitle>
            </CardHeader>
            <CardBody>
              <UsaMap />
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                Morphing between Map and Bar Chart
              </CardTitle>
            </CardHeader>
            <CardBody>
              <MorphingMapBarChart />
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                Pie Chart on Geo Map
              </CardTitle>
            </CardHeader>
            <CardBody>
              <GeoMapWithPieChart />
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                GEO SVG Scatter
              </CardTitle>
            </CardHeader>
            <CardBody>
              <GeoSVGScatterMap />
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default Page
