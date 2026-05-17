import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Container, Row } from 'react-bootstrap'
import SweetAlerts from './components/SweetAlerts'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="SweetAlert2" subtitle="Plugins" />
      <Container>
        <Row>
          <Col xs={12}>
            <SweetAlerts />
          </Col>
        </Row>
      </Container>
    </>
  )
}
export default Page
