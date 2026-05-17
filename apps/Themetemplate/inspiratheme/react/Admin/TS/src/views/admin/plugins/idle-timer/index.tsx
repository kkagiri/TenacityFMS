import { Col, Container, Row } from 'react-bootstrap'

import PageBreadcrumb from '@/components/PageBreadcrumb'
import IdleTracker from './components/IdleTracker'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Idle Timer" subtitle="Plugins" />
      <Container>
        <Row>
          <Col xs={12}>
            <IdleTracker />
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default Page
