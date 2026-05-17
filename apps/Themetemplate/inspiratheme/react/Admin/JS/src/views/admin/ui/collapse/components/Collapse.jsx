import { Button, Card, CardBody, CardHeader, CardTitle, Col, Collapse, Row } from 'react-bootstrap'
import { useToggle } from 'usehooks-ts'
export const DefaultCollapse = () => {
  const [isTrue, toggle] = useToggle()
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Collapse</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p>
          <Button variant="primary" onClick={toggle}>
            Link with href
          </Button>
          &nbsp;
          <Button variant="primary" className="ms-1" onClick={toggle}>
            Button with data-bs-target
          </Button>
        </p>
        <Collapse in={isTrue}>
          <div>
            <Card className="card-body mb-0">Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus terry richardson ad squid. Nihil anim keffiyeh helvetica, craft beer labore wes anderson cred nesciunt sapiente ea proident.</Card>
          </div>
        </Collapse>
      </CardBody>
    </Card>
  )
}
export const MultipleTargets = () => {
  const [isOpenFirst, toggleFirst] = useToggle(false)
  const [isOpenSecond, toggleSecond] = useToggle(false)
  const toggleBoth = () => {
    toggleFirst()
    toggleSecond()
  }
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Multiple Targets</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <div className="d-flex flex-wrap gap-2 mb-3">
          <Button variant="primary" onClick={toggleFirst}>
            Toggle first element
          </Button>
          <Button variant="primary" onClick={toggleSecond}>
            Toggle second element
          </Button>
          <Button variant="primary" onClick={toggleBoth}>
            Toggle both elements
          </Button>
        </div>
        <Row>
          <Col>
            <Collapse className="multi-collapse" in={isOpenFirst}>
              <div>
                <Card className="card-body mb-0">Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus terry richardson ad squid. Nihil anim keffiyeh helvetica, craft beer labore wes anderson cred nesciunt sapiente ea proident.</Card>
              </div>
            </Collapse>
          </Col>
          <Col>
            <Collapse className="multi-collapse" in={isOpenSecond}>
              <div>
                <Card className="card-body mb-0">Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus terry richardson ad squid. Nihil anim keffiyeh helvetica, craft beer labore wes anderson cred nesciunt sapiente ea proident.</Card>
              </div>
            </Collapse>
          </Col>
        </Row>
      </CardBody>
    </Card>
  )
}
export const CollapseHorizontal = () => {
  const [isTrue, toggle] = useToggle()
  return (
    <Card title="Collapse Horizontal">
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Collapse Horizontal</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p>
          <Button variant="primary" onClick={toggle}>
            Toggle width collapse
          </Button>
        </p>
        <div
          style={{
            height: 100,
          }}
        >
          <Collapse dimension="width" in={isTrue}>
            <div>
              <Card
                className="card-body mb-0"
                style={{
                  width: 300,
                }}
              >
                This is some placeholder content for a horizontal collapse. It&apos;s hidden by default and shown when triggered.
              </Card>
            </div>
          </Collapse>
        </div>
      </CardBody>
    </Card>
  )
}
