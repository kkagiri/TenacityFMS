import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import ProductViewsTable from './components/ProductViewsTable'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Product Views" subtitle="Ecommerce" />
      <Row className="justify-content-center">
        <Col xxl={10}>
          <ProductViewsTable />
        </Col>
      </Row>
    </>
  )
}
export default Page
