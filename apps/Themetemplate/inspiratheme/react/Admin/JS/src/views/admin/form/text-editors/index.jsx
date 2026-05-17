import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Container, Row } from 'react-bootstrap'
import TextEditors from './components/TextEditors'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Text Editors" subtitle="Forms" />
      <Container fluid="xxl">
        <Row>
          <TextEditors />
        </Row>
      </Container>
    </>
  )
}
export default Page
