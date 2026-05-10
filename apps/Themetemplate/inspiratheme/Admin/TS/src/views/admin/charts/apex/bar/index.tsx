import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { BasicBarChart, CustomDataLabelsBarChart, FullStackedBarChart, GroupedBarChart, GroupedStackedBarChart, ImageFillBarChart, MarkersBarChart, NegativeBarChart, PatternedBarChart, ReversedBarChart, StackedBarChart } from './components/BarChart'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Bar Apexchart" subtitle="Charts" />
      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Basic Bar Charts</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <BasicBarChart />
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Grouped Bar Chart</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <GroupedBarChart />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Stacked Bar Chart</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <FullStackedBarChart />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">100% Stacked Bar Chart</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <StackedBarChart />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Grouped Stacked Bars</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <GroupedStackedBarChart />
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Bar with Negative Values</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <NegativeBarChart />
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Reversed Bar Chart</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <ReversedBarChart />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Bar with Image Fill</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <ImageFillBarChart />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Custom DataLabels Bar</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <CustomDataLabelsBarChart />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Patterned Bar Chart</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <PatternedBarChart />
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Bar with Markers</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <MarkersBarChart />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default Page
