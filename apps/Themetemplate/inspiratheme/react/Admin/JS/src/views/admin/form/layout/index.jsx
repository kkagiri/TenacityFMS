import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Container, Row } from 'react-bootstrap'
import LayoutForm from './components/LayoutForm'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Layouts" subtitle="Forms" />
      <Container fluid="xxl">
        <Row>
          <Col lg={12}>
            <LayoutForm />
          </Col>
        </Row>
      </Container>
    </>
  )
}
export default Page
