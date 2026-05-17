import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import MemberRoleCard from './components/MemberRoleCard'
import UserTable from './components/UserTable'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Role Details" subtitle="Users" />
      <Row>
        <Col md={4} lg={3}>
          <MemberRoleCard />
        </Col>
        <Col md={8} lg={9}>
          <UserTable />
        </Col>
      </Row>
    </>
  )
}

export default Page
