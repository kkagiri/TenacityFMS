import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Container, Row } from 'react-bootstrap'
import { BasicTooltips, ColorTooltips, DisabledElements, FourDirections, HoverElements, HTMLTags } from './components/Tooltip'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Tooltips" subtitle="UI" />
      <Container fluid="xxl">
        <Row>
          <Col xl={6}>
            <BasicTooltips />
            <DisabledElements />
            <HoverElements />
          </Col>
          <Col xl={6}>
            <FourDirections />
            <HTMLTags />
            <ColorTooltips />
          </Col>
        </Row>
      </Container>
    </>
  )
}
export default Page
