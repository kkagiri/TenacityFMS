import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { Card, CardBody, CardHeader, CardTitle, Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router'
import { AlignmentPagination, BoxedPagination, CustomColorPagination, CustomIconPagination, DefaultPagination, DisabledAndActive, RoundedPagination, SizingPagination, SoftPagination } from './components/Paginations'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Pagination" subtitle="UI" />
      <Container fluid="xxl">
        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader>
                <CardTitle as="h4">Examples</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-muted mb-2">Use loading placeholders for your components or pages to indicate something may still be loading.</p>
                <Link className="btn btn-link p-0" to="https://react-bootstrap.netlify.app/docs/components/pagination" target="_blank">
                  Pagination on React Bootstrap
                  <Icon icon="chevron-right" className="ms-1" />
                </Link>
              </CardBody>
            </Card>
          </Col>
          <Col xl={6}>
            <DefaultPagination />
            <AlignmentPagination />
            <CustomColorPagination />
            <DisabledAndActive />
            <CustomIconPagination />
          </Col>
          <Col xl={6}>
            <SizingPagination />
            <BoxedPagination />
            <RoundedPagination />
            <SoftPagination />
          </Col>
        </Row>
      </Container>
    </>
  )
}
export default Page
