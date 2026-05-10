import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, CardHeader, Col, Container, Row } from 'react-bootstrap'
import ExamplesCard from './components/VectorMaps'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Vector Maps" subtitle="Maps" />

      <Container>
        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader className="border-0 border-bottom border-dashed">
                <h4 className="card-title">Examples</h4>
              </CardHeader>

              <CardBody>
                <ExamplesCard />
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  )
}
export default Page
