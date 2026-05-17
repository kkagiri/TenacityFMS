import Icon from '@/components/wrappers/Icon'
import clsx from 'clsx'
import { Link } from 'react-router'
import { Card, CardBody } from 'react-bootstrap'
import type { CategoryType } from './data'

const CategoryCard = ({ category }: { category: CategoryType }) => {
  const { links, className, title, image } = category
  return (
    <Card className={clsx(' bg-opacity-10 bg-gradient', className)}>
      <CardBody className="pb-0 d-flex align-items-center justify-content-between">
        <div>
          <h5 className="fw-semibold mb-3">{title}</h5>
          <ul className="list-unstyled mb-0 text-body">
            {links.map(({ label, href }, idx) => (
              <li key={idx}>
                <Link to={href ?? ''} className="text-reset d-block py-1">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/apps/ecommerce/products-grid" className="fw-semibold link-reset d-inline-block my-3">
            View All <Icon icon="arrow-right" className="bi align-middle fs-lg" />
          </Link>
        </div>
        <img src={image} alt={title} height={220} width={159} className="img-fluid mt-auto" style={{ maxHeight: 220 }} />
      </CardBody>
    </Card>
  )
}

export default CategoryCard
