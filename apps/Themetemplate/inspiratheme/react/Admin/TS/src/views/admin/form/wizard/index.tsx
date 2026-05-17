import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Container, Row } from 'react-bootstrap'
import BasicWizard from './components/BasicWizard'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Wizard" subtitle="Forms" />

      <Container fluid="xxl">
        <Row className="justify-content-center">
          <Col xs={12}>
            <BasicWizard />
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default Page
