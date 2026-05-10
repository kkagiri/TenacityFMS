import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardHeader, Col, Container, Row } from 'react-bootstrap'
import GoogleMap from './components/GoogleMap'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Google" subtitle="Maps" />

      <Container fluid="xxl">
        <Row>
          <Col xs={12}>
            <Card>
              <CardHeader>
                <div className="flex-grow-1">
                  <h4 className="card-title">Examples</h4>
                </div>
              </CardHeader>

              <GoogleMap />
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default Page
