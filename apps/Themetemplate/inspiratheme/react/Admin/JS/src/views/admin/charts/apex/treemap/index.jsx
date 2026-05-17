import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { BasicTreemap, ColorRangeTreemap, DistributedTreemap, MultipleTreemap } from './components/TreeMapChart'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Treemap Apexchart" subtitle="Charts" />
      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Basic Treemap</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <BasicTreemap />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Treemap Multiple Series</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <MultipleTreemap />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Distributed Treemap</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <DistributedTreemap />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Color Range Treemap</CardTitle>
            </CardHeader>
            <CardBody>
              <div dir="ltr">
                <ColorRangeTreemap />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}
export default Page
