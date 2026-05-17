import Icon from '@/components/wrappers/Icon'
import { Card, CardBody, Col, Row } from 'react-bootstrap'

type LayoutInfoProps = {
  option: string
  value: string
}

const LayoutInfo = ({ option, value }: LayoutInfoProps) => {
  return (
    <>
      <Row>
        <Col xs={12}>
          <div className="alert alert-info alert-bordered border-start border-info d-flex align-items-start gap-2">
            <Icon icon="info-circle" className="fs-xxl" />
            <div>
              To enable this layout, use <code>updateSettings</code> from <code>useLayoutContext</code> context hook and pass it
              <code>{`{${option}:'${value}'}`}</code>. eg. <code>{`updateSettings({ ${option}: '${value}' })`}</code>
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col xs={12}>
          <Card>
            <CardBody className="text-center">
              <h4 className="m-0">Your custom content here</h4>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default LayoutInfo
