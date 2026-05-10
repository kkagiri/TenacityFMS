import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import CategoryTable from './components/CategoryTable'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Categories" subtitle="Ecommerce" />

      <Row>
        <Col xs={12}>
          <CategoryTable />
        </Col>
      </Row>
    </>
  )
}
export default Page
