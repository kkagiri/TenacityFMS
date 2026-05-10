import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { AllMixedChart, LineAreaChart, LineColumnMixed, MultipleYaxisMixed } from './components/MixedChart'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Mixed Apexchart" subtitle="Charts" />
      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Line & Column Chart</CardTitle>
            </CardHeader>

            <CardBody>
              <div dir="ltr">
                <LineColumnMixed />
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Multiple Y-Axis Chart</CardTitle>
            </CardHeader>

            <CardBody>
              <div dir="ltr">
                <MultipleYaxisMixed />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Line & Area Chart</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <LineAreaChart />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Line, Column & Area Chart</CardTitle>
            </CardHeader>

            <CardBody>
              <div dir="ltr">
                <AllMixedChart />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default Page
