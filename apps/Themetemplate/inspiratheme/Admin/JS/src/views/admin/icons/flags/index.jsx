import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import Flags from './components/Flags'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Flags" subtitle="Icons" />
      <Row className="justify-content-center">
        <Col xxl={10}>
          <Flags />
        </Col>
      </Row>
    </>
  )
}
export default Page
