import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import CustomerTable from './components/CustomerTable'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Customers" subtitle="Ecommerce" />

      <Row className="justify-content-center">
        <Col xxl={10}>
          <CustomerTable />
        </Col>
      </Row>
    </>
  )
}
export default Page
