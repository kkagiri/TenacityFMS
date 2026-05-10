import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { AdvanceTimeLineChart, DistributedTimelineChart, GroupRowTimelineChart, MultiSeriesTimelineChart, TimeLineChart } from './components/TimeLineChart'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Timeline Apexchart" subtitle="Charts" />
      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Basic Timeline</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <TimeLineChart />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Distributed Timeline</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <DistributedTimelineChart />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Multi Series Timeline</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <MultiSeriesTimelineChart />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Advanced Timeline</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <AdvanceTimeLineChart />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Multiple Series - Group Rows</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <GroupRowTimelineChart />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default Page
