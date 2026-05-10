import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import Example from './components/BasicTable'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Basic" subtitle="Tables" />
      <Row className="justify-content-center">
        <Col xxl={10}>
          <Example />
        </Col>
      </Row>
    </>
  )
}
export default Page
