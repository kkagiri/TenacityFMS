import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import Example from './components/RowTable'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Child Row" subtitle="DataTables" />
      <Row className="justify-content-center">
        <Col xxl={10}>
          <Example />
        </Col>
      </Row>
    </>
  )
}

export default Page
