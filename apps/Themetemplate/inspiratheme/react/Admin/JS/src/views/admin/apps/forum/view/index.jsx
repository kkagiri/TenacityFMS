import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import FourmView from './components/FourmView'
import Paginations from './components/Paginations'
import Sidebar from './components/Sidebar'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Forum" subtitle="Apps" />
      <Row className="justify-content-center">
        <Col xxl={10}>
          <Row>
            <Col xl={9}>
              <FourmView />
              <Paginations />
            </Col>
            <Sidebar />
          </Row>
        </Col>
      </Row>
    </>
  )
}
export default Page
