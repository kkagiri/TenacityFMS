import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import FixHeader from './components/FixHeader'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Fixed Header" subtitle="DataTables" />
      <Row className="justify-content-center">
        <Col xxl={10}>
          <FixHeader />
        </Col>
      </Row>
    </>
  )
}

export default Page
