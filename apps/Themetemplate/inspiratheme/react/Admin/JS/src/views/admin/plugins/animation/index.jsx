import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Container, Row } from 'react-bootstrap'
import Animations from './components/Animations'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Animation" subtitle="Plugins" />
      <Container>
        <Row>
          <Col xs={12}>
            <Animations />
          </Col>
        </Row>
      </Container>
    </>
  )
}
export default Page
