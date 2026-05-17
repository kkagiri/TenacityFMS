import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import WarehouseTable from './components/WarehouseTable'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Warehouse" subtitle="Ecommerce" />
      <Row>
        <Col xs={12}>
          <WarehouseTable />
        </Col>
      </Row>
    </>
  )
}

export default Page
