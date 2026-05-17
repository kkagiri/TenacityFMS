import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { BasicPolarAreaChart, MonochromePolarAreaChart } from './components/PolarAreaChart'

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Polar Area Apexchart" subtitle="Charts" />
      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Basic Polar Area Chart</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <BasicPolarAreaChart />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Monochrome Polar Area</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <MonochromePolarAreaChart />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default Page
