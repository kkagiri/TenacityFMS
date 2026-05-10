import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import PermissionTable from './components/PermissionTable'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Permissions" subtitle="Users" />

      <Row className="justify-content-center">
        <Col xxl={10}>
          <PermissionTable />
        </Col>
      </Row>
    </>
  )
}
export default Page
