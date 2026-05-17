import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Container, Row } from 'react-bootstrap'
import LoadingButtons from './components/LoadingButtons'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Loading Buttons" subtitle="Plugins" />
      <Container>
        <Row>
          <Col xs={12}>
            <LoadingButtons />
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default Page
