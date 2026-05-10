import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, Col, Row } from 'react-bootstrap'
import ProductDetails from './components/ProductDetails'
import ProductDisplay from './components/ProductDisplay'
import ProductReviews from './components/ProductReviews'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Product Details" subtitle="Ecommerce" />

      <Row>
        <Col xs={12}>
          <Card>
            <CardBody>
              <Row>
                <Col xl={4}>
                  <ProductDisplay />
                </Col>

                <Col xl={8}>
                  <div className="p-4">
                    <ProductDetails />

                    <ProductReviews />
                  </div>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}
export default Page
