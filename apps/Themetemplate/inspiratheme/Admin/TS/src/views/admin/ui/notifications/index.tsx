import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Container, Row } from 'react-bootstrap'
import Toast from './components/Toast'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Notifications" subtitle="UI" />
      <Container fluid="xxl">
        <Row>
          <Toast />
        </Row>
      </Container>
    </>
  )
}

export default Page
