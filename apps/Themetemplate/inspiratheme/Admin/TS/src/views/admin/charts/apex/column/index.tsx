import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import {
  AnnotationsColumnChart,
  BasicColumnCharts,
  ColumnChartwithDatalabels,
  ColumnChartWithNegative,
  ColumnwithGroupLabel,
  ColumnwithMarkers,
  DistributedColumnCharts,
  DumbbellChart,
  DynamicLoadedChart,
  FullStackedColumnChart,
  GroupedStackedColumnsChart,
  RangeColumnCharts,
  StackedColumnCharts,
} from './components/ColumnChart'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Column Apexchart" subtitle="Charts" />
      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Basic Column Charts</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <BasicColumnCharts />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Column Chart with Datalabels</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <ColumnChartwithDatalabels />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Stacked Column Charts</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <StackedColumnCharts />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">100% Stacked Column Chart</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <FullStackedColumnChart />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Grouped Stacked Columns Chart</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <GroupedStackedColumnsChart />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Dumbbell Chart</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <DumbbellChart />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Column with Markers</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <ColumnwithMarkers />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Column with Group Label</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <ColumnwithGroupLabel />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Column Chart with rotated labels & Annotations</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <AnnotationsColumnChart />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Column Chart with negative values</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <ColumnChartWithNegative />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Distributed Column Charts</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <DistributedColumnCharts />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Range Column Charts</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <RangeColumnCharts />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xs={12}>
          <DynamicLoadedChart />
        </Col>
      </Row>
    </>
  )
}

export default Page
