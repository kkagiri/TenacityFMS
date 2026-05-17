import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { Col, Row } from 'react-bootstrap'
import { Link } from 'react-router'
import { memberRoleData } from './components/data'
import MemberRoleCard from './components/MemberRoleCard'
import Users from './components/UsersTable'
export const dynamic = 'force-dynamic'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Roles" subtitle="Users" />
      <Row className="justify-content-center">
        <Col xxl={10}>
          <div className="d-flex align-items-sm-center flex-sm-row flex-column mb-3">
            <div className="flex-grow-1">
              <h4 className="fs-xl mb-1">Manage Roles</h4>
              <p className="text-muted mb-0">Manage roles for smoother operations and secure access.</p>
            </div>
            <div className="text-end">
              <Link to="" className="btn btn-success">
                <Icon icon="plus" className="me-1"></Icon>
                Add New Role
              </Link>
            </div>
          </div>
          <Row>
            {memberRoleData.map((member, idx) => (
              <Col md={6} lg={3} key={idx}>
                <MemberRoleCard member={member} />
              </Col>
            ))}
          </Row>
          <Row>
            <Col xs={12}>
              <Users />
            </Col>
          </Row>
        </Col>
      </Row>
    </>
  )
}
export default Page
