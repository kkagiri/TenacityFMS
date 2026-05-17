import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { BasicSlope, MultiSlope } from './components/SlopeChart'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Slope Apexcharts" subtitle="Charts" />
      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Basic Slope</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <BasicSlope />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Multi Slope</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <MultiSlope />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default Page
