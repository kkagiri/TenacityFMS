import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import Table from './components/Table'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Fixed Columns" subtitle="Datatables" />
      <Row className="justify-content-center">
        <Col xxl={10}>
          <Table />
        </Col>
      </Row>
    </>
  )
}
export default Page
