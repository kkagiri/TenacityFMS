import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Container, Row } from 'react-bootstrap'
import Clipboard from './components/Clipboard'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Clipboard" subtitle="Plugins" />
      <Container>
        <Row>
          <Col xs={12}>
            <Clipboard />
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default Page
