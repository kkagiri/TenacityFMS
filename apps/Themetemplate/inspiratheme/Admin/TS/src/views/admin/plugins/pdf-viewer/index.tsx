import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Container, Row } from 'react-bootstrap'
import PdfView from './components/PdfView'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="PDF Viewer" subtitle="Plugins" />

      <Container>
        <Row>
          <Col xs={12}>
            <PdfView />
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default Page
