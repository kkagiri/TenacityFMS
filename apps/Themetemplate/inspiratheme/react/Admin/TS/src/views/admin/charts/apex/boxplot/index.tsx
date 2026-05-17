import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { BasicBoxplot, HorizontalBoxPlot, ScatterBoxplot } from './components/BoxPlotChart'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Boxplot Apexchart" subtitle="Charts" />
      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Basic Boxplot</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <BasicBoxplot />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Scatter Boxplot</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <ScatterBoxplot />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Horizontal BoxPlot</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <HorizontalBoxPlot />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default Page
