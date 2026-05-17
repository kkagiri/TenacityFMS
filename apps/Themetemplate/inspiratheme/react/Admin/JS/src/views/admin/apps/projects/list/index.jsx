import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import ProjectsList from './components/ProjectsList'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Projects List" subtitle="Apps" />

      <Row>
        <Col xs={12}>
          <ProjectsList />
        </Col>
      </Row>
    </>
  )
}
export default Page
