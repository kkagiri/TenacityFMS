import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import ProductReviews from './components/ProductReviews'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Reviews" subtitle="Ecommerce" />
      <Row className="justify-content-center">
        <Col xxl={10}>
          <ProductReviews />
        </Col>
      </Row>
    </>
  )
}
export default Page
