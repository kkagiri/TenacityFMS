import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import AttributeTable from './components/AttributeTable'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Attributes" subtitle="Ecommerce" />
      <Row>
        <Col xs={12}>
          <AttributeTable />
        </Col>
      </Row>
    </>
  )
}
export default Page
