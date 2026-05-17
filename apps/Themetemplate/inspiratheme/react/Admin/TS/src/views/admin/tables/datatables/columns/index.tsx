import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import Example from './components/ColumnTable'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Show & Hide Columns" subtitle="Datatables" />
      <Row className="justify-content-center">
        <Col xxl={10}>
          <Example />
        </Col>
      </Row>
    </>
  )
}

export default Page
