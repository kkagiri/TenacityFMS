import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Container, Row } from 'react-bootstrap'
import ReactInputMask from './components/ReactInputMask'
import ReactTypeahead from './components/ReactTypeahead'
import TouchSpin from './components/TouchSpin'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Other Plugins" subtitle="Forms" />
      <Container fluid="xxl">
        <Row>
          <Col xs={12}>
            <ReactInputMask />
            <ReactTypeahead />
            <TouchSpin />
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default Page
