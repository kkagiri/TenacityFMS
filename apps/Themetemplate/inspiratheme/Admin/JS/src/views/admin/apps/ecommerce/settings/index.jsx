import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import ShopSettings from './components/ShopSettings'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Shop Settings" subtitle="Ecommerce" />
      <Row>
        <Col>
          <ShopSettings />
        </Col>
      </Row>
    </>
  )
}
export default Page
