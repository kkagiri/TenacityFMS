import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import SellerTable from './components/SellerTable'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Sellers" subtitle="Ecommerce" />
      <Row className="justify-content-center">
        <Col xxl={10}>
          <SellerTable />
        </Col>
      </Row>
    </>
  )
}

export default Page
