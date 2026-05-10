import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import RenderingTable from './components/RenderingTable'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Data Rendering" subtitle="DataTables" />
      <Row className="justify-content-center">
        <Col xxl={10}>
          <RenderingTable />
        </Col>
      </Row>
    </>
  )
}

export default Page
