import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { HeatmapColorRange, HeatmapMultipleSeries, HeatmapRangeWithoutShades, HeatmapSingleSeries } from './components/HeatMap'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Heatmap Apexchart" subtitle="Charts" />
      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Heatmap - Single Series</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <HeatmapSingleSeries />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Multiple Series</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <HeatmapMultipleSeries />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Heatmap - Color Range</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <HeatmapColorRange />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Heatmap - Range without Shades</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <HeatmapRangeWithoutShades />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default Page
