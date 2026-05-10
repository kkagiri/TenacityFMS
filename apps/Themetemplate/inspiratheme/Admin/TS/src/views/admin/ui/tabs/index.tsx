import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { Card, CardBody, CardHeader, CardTitle, Col, Container, Row } from 'react-bootstrap'
import { BorderedTabswithColoredBorder, CardWithTabs, DefaultTabs, IconsTabs, TabsBordered, TabsJustified, TabsVerticalLeft, TabsVerticalRight } from './components/Tabs'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Tabs" subtitle="UI" />
      <Container fluid="xxl">
        <Row>
          <Col xs={12}>
            <Card>
              <CardHeader>
                <CardTitle as="h4" className="card-title">
                  Examples
                </CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-muted mb-2">Documentation and examples on how to use Bootstrap’s tab components.</p>
                <a className="btn btn-link p-0 fw-semibold" href="https://react-bootstrap.netlify.app/docs/components/tabs" target="_blank">
                  Tabs on React Bootstrap
                  <Icon icon="chevron-right" className="ms-1" />
                </a>
              </CardBody>
            </Card>
          </Col>

          <Col xxl={6}>
            <DefaultTabs />
          </Col>
          <Col xxl={6}>
            <TabsJustified />
          </Col>
          <Col xxl={6}>
            <TabsVerticalLeft />
          </Col>
          <Col xxl={6}>
            <TabsVerticalRight />
          </Col>
          <Col xxl={6}>
            <TabsBordered />
          </Col>
          <Col xxl={6}>
            <BorderedTabswithColoredBorder />
          </Col>
          <Col xxl={6}>
            <IconsTabs />
          </Col>
          <Col xxl={6}>
            <CardWithTabs />
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default Page
