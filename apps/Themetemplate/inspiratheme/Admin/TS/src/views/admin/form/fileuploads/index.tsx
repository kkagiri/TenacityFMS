import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Container, Row } from 'react-bootstrap'
import Dropzone from './components/Dropzone'
import FilePondUploader from './components/FilePondUploader'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="File Uploads" subtitle="Forms" />
      <Container fluid="xxl">
        <Row>
          <Col xs={12}>
            <Dropzone />
            <FilePondUploader />
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default Page
