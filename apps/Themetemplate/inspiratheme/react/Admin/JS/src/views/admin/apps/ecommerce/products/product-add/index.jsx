import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Button, Col, Row } from 'react-bootstrap'
import Organize from './components/Organize'
import Pricing from './components/Pricing'
import ProductImage from './components/ProductImage'
import ProductInformation from './components/ProductInformation'
export const dynamic = 'force-dynamic'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Add Product" subtitle="Ecommerce" />

      <Row className="justify-content-center">
        <Col xxl={10}>
          <Row>
            <Col xxl={8}>
              <ProductInformation />

              <ProductImage />
            </Col>

            <Col xxl={4}>
              <Pricing />

              <Organize />
            </Col>
          </Row>

          <div className="mt-2 mb-4 d-flex gap-2 justify-content-center">
            <Button variant="danger" className="fw-semibold">
              Discard
            </Button>
            <Button variant="secondary">Save as Draft</Button>
            <Button variant="success">Publish</Button>
          </div>
        </Col>
      </Row>
    </>
  )
}
export default Page
