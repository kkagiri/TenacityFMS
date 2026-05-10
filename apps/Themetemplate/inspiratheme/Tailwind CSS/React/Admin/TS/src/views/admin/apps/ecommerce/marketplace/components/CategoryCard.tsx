import Icon from '@/components/wrappers/Icon'
import { cn } from '@/utils/helpers'
import { Link } from 'react-router'
import type { CategoryType } from './data'

const CategoryCard = ({ category }: { category: CategoryType }) => {
  const { links, className, title, image } = category
  return (
    <div className={cn('flex justify-between rounded px-6 pt-6', className)}>
      <div>
        <h5 className="mb-5 font-semibold">{title}</h5>
        <ul className="list-unstyled text-body">
          {links.map(({ label, href }, idx) => (
            <li key={idx}>
              <Link to={href} className="block py-1.5">
                {label}
              </Link>
            </li>
          ))}
        </ul>
        <Link to="/apps/ecommerce/products-grid" className="text-default-700 hover:text-primary my-5 inline-flex items-center gap-0.5 font-semibold">
          View All
          <Icon icon="arrow-right" className="text-base" />
        </Link>
      </div>
      <img src={image} width={158} height={220} alt="For men" className="mt-auto" style={{ maxHeight: 220 }} />
    </div>
  )
}

export default CategoryCard
