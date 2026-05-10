import { toPascalCase } from '@/utils/helpers'
import { Card, CardBody, ProgressBar } from 'react-bootstrap'
import { Link } from 'react-router'
const Widget5 = ({ item }) => {
  const { title, progress, status, description } = item
  return (
    <>
      <Card>
        <CardBody>
          <div>
            <Link to="#" className="link-reset text-uppercase fw-semibold">
              {title}
            </Link>
            <div className="py-2">
              <span className="fs-xl fw-bold me-2">{progress}%</span>
              &nbsp;<span className="fw-semibold text-muted fs-7">{toPascalCase(status)}</span>
            </div>
          </div>
          <ProgressBar now={progress} variant="success" className="progress-md bg-opacity-25 bg-success" />
          <div className="mt-2 text-muted">{description}</div>
        </CardBody>
      </Card>
    </>
  )
}
export default Widget5
