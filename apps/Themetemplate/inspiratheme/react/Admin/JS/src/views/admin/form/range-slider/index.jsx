import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Container, Row } from 'react-bootstrap'
import RangeSlider from './components/RangeSlider'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Range Slider" subtitle="Forms" />

      <Container fluid="xxl">
        <Row>
          <Col xs={12}>
            <RangeSlider />
          </Col>
        </Row>
      </Container>
    </>
  )
}
export default Page
