import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { BasicFunnel, PyramidFunnel } from './components/FunnelChart'

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Funnel Apexcharts" subtitle="Charts" />
      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Basic Funnel</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <BasicFunnel />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Pyramid Funnel</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <PyramidFunnel />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default Page
