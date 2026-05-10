import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Container, Row } from 'react-bootstrap'
import ReactSelect from './components/ReactSelect'
import Select2 from './components/Select2'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Select" subtitle="Forms" />

      <Container fluid="xxl">
        <Row>
          <Col xs={12}>
            <ReactSelect />
            <Select2 />
          </Col>
        </Row>
      </Container>
    </>
  )
}
export default Page
