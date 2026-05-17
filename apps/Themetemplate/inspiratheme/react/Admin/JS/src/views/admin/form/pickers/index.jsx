import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Container, Row } from 'react-bootstrap'
import ColorPicker from './components/ColorPicker'
import DataPicker from './components/DataPicker'
import Flatpickr from './components/Pickers'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Pickers" subtitle="Forms" />
      <Container fluid="xxl">
        <Row>
          <Col lg={12}>
            <DataPicker />

            <Flatpickr />

            <ColorPicker />
          </Col>
        </Row>
      </Container>
    </>
  )
}
export default Page
