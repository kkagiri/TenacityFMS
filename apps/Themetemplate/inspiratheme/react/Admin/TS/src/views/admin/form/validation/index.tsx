import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Container, Row } from 'react-bootstrap'
import BrowserDefault from './components/BrowserDefault'
import CustomValidation from './components/CustomValidation'
import ServerSide from './components/ServerSide'
import SupportedElement from './components/SupportedElement'
import Tooltips from './components/Tooltips'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Validation" subtitle="Forms" />

      <Container fluid="xxl">
        <Row>
          <Col lg={12}>
            <CustomValidation />

            <Tooltips />

            <ServerSide />

            <SupportedElement />

            <BrowserDefault />
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default Page
