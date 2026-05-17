import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import SellerContact from './components/SellerContact'
import SellerOverview from './components/SellerOverview'
import SellerProducts from './components/SellerProducts'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Seller Details" subtitle="Ecommerce" />
      <Row>
        <Col xl={4}>
          <SellerContact />
        </Col>
        <Col xl={8}>
          <SellerOverview />
          <h4 className="my-4">My Products</h4>
          <Row>
            <Col xs={12}>
              <SellerProducts />
            </Col>
          </Row>
        </Col>
      </Row>
    </>
  )
}
export default Page
