import { toPascalCase } from '@/utils/helpers'
import { Link } from 'react-router'
import { Card, CardBody, ProgressBar } from 'react-bootstrap'
import { Widget6Type } from './data'

const Widget5 = ({ item }: { item: Widget6Type }) => {
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
