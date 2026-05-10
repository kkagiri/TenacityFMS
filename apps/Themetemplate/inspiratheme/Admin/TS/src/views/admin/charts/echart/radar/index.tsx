import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { BasicRadarChart, CustomizedRadarChart, MultipleRadarChart, ProportionofBrowsers } from './components/RadarChart'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Radar Echart" subtitle="Charts" />
      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                Basic Radar Chart
              </CardTitle>
            </CardHeader>
            <CardBody>
              <BasicRadarChart />
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                Proportion of Browsers
              </CardTitle>
            </CardHeader>
            <CardBody>
              <ProportionofBrowsers />
            </CardBody>
          </Card>
        </Col>

        <Col xl={12}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                Customized Radar Chart
              </CardTitle>
            </CardHeader>
            <CardBody>
              <CustomizedRadarChart />
            </CardBody>
          </Card>
        </Col>

        <Col xl={12}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-0">
                Multiple Radar Chart
              </CardTitle>
            </CardHeader>
            <CardBody>
              <MultipleRadarChart />
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default Page
