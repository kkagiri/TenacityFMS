import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, Col, Container, Row } from 'react-bootstrap'
import TourPage from './components/TourPage'

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Tour" subtitle="Plugins" />

      <Container fluid="xxl">
        <Row>
          <Col lg={12}>
            <Card>
              <TourPage />
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default Page
