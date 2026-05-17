import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import Invoices from './components/Invoices'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Invoices" subtitle="Apps" />

      <Row>
        <Col xs={12}>
          <Invoices />
        </Col>
      </Row>
    </>
  )
}
export default Page
