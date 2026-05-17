import Rating from '@/components/Rating'
import Icon from '@/components/wrappers/Icon'
import clsx from 'clsx'
import { Badge, Button, Card, CardBody, CardFooter, CardTitle } from 'react-bootstrap'
import { Link } from 'react-router'
const Page = ({ product }) => {
  const { price, discount, reviews, image, name, rating } = product
  return (
    <Card className="h-100 mb-2">
      {discount && (
        <Badge bg={discount > 20 ? 'success' : 'danger'} className="badge-label fs-base rounded position-absolute top-0 start-0 m-3">
          {discount}% OFF
        </Badge>
      )}

      <CardBody>
        <div className="bg-light-subtle p-3 mb-3 border border-light rounded">
          <img src={image} alt={name} className="img-fluid" />
        </div>

        <CardTitle as="h6" className="fs-sm lh-base mb-2">
          <Link to="/apps/ecommerce/details" className="link-reset">
            {name}
          </Link>
        </CardTitle>

        <div className="d-flex align-items-center">
          <Rating rating={rating} className="d-inline-flex gap-1 flex-wrap" />
          <span className="ms-1">
            <Link to="/apps/ecommerce/reviews" className="link-reset fw-semibold">
              ({reviews})
            </Link>
          </span>
        </div>
      </CardBody>

      <CardFooter className="bg-transparent d-flex justify-content-between">
        <div className="d-flex justify-content-start align-items-center gap-2">
          <h4 className={clsx('d-flex align-items-center gap-2 mb-0', discount && discount > 20 ? 'text-success' : 'text-danger')}>
            <span className="text-muted text-decoration-line-through">${price.toFixed(2)}</span>${(price - (price * (discount ?? 10)) / 100).toFixed(2)}
          </h4>
        </div>
        <Button size="sm" variant="primary" className="btn-icon">
          <Icon icon="basket" className="fs-lg" />
        </Button>
      </CardFooter>
    </Card>
  )
}
export default Page
