import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import ProductStockTable from './components/ProductStockTable'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Stocks" subtitle="Ecommerce" />
      <Row>
        <Col xs={12}>
          <ProductStockTable />
        </Col>
      </Row>
    </>
  )
}
export default Page
