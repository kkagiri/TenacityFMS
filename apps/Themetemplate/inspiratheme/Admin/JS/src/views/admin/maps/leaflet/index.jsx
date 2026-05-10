import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, Col, Container, Row } from 'react-bootstrap'
import LeaFletMap from './components/LeaFletMap'
export const dynamic = 'force-dynamic'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Leaflet" subtitle="Maps" />
      <Container>
        <Row>
          <Col lg={12}>
            <Card>
              <div className="card-header border-0 border-bottom border-dashed">
                <h4 className="card-title">Examples</h4>
              </div>
              <CardBody>
                <LeaFletMap />
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  )
}
export default Page
