import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import PurchaseOrderTable from './components/PurchaseOrderTable'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Purchased Orders" subtitle="Ecommerce" />
      <Row>
        <Col xs={12}>
          <PurchaseOrderTable />
        </Col>
      </Row>
    </>
  )
}
export default Page
