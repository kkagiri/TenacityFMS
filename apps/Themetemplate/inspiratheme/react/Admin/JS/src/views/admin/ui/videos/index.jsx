import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, CardHeader, CardTitle, Col, Container, Row } from 'react-bootstrap'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Videos" subtitle="UI" />
      <Container fluid="xxl">
        <Row>
          <Col xl={6}>
            <ResponsiveEmbedVideo219 />
            <ResponsiveEmbedVideo11 />
          </Col>
          <Col xl={6}>
            <ResponsiveEmbedVideo169 />
            <ResponsiveEmbedVideo43 />
          </Col>
        </Row>
      </Container>
    </>
  )
}
export default Page
const ResponsiveEmbedVideo219 = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h4">Responsive embed video 21:9</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="ratio ratio-21x9">
          <iframe src="https://www.youtube.com/embed/zpOULjyy-n8?rel=0" />
        </div>
      </CardBody>
    </Card>
  )
}
const ResponsiveEmbedVideo11 = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h4">Responsive embed video 1:1</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="ratio ratio-1x1">
          <iframe src="https://www.youtube.com/embed/zpOULjyy-n8?rel=0" />
        </div>
      </CardBody>
    </Card>
  )
}
const ResponsiveEmbedVideo169 = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h4">Responsive embed video 16:9</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="ratio ratio-16x9">
          <iframe src="https://www.youtube.com/embed/zpOULjyy-n8?rel=0" />
        </div>
      </CardBody>
    </Card>
  )
}
const ResponsiveEmbedVideo43 = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h4">Responsive embed video 4:3</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="ratio ratio-4x3">
          <iframe src="https://www.youtube.com/embed/zpOULjyy-n8?rel=0" />
        </div>
      </CardBody>
    </Card>
  )
}
