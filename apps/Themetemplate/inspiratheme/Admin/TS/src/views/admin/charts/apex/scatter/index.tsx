import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { BasicScatte, DatetimeScatter, ScatterImages } from './components/ScatterChart'

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Scatter Apexchart" subtitle="Charts" />
      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Scatter (XY) Chart</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <BasicScatte />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Scatter Chart - Datetime</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <DatetimeScatter />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Scatter - Images</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <ScatterImages />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default Page
