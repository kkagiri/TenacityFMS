import Rating from '@/components/Rating'
import Icon from '@/components/wrappers/Icon'
import { cn } from '@/utils/helpers'
import { Link } from 'react-router'
import { ProductType } from './data'

const ProductCard = ({ product }: { product: ProductType }) => {
  const { discount, price, reviews, image, name, rating } = product

  return (
    <div className="card relative h-full!">
      <div className={cn('badge py-0 badge-label rounded text-xs text-white absolute start-0 top-0 m-6', discount > 20 ? 'bg-success' : 'bg-danger')}>{discount}% OFF</div>
      <div className="card-body h-full!">
        <div className="p-6">
          <img src={image} alt={name} className="img-fluid" />
        </div>
        <h6 className="card-title mb-3">
          <Link to="/apps/ecommerce/product-details" className="hover:text-primary">
            {name}
          </Link>
        </h6>
        <div className="flex items-center gap-1.5">
          <Rating rating={rating} />
          <span>
            <Link to="/apps/ecommerce/reviews" className="hover:text-primary font-semibold">
              ({reviews})
            </Link>
          </span>
        </div>
      </div>
      <div className="card-footer border-dashed">
        <div className="flex w-full justify-between">
          <h4 className="text-danger flex items-center gap-3 text-lg">
            <span className="text-default-400 line-through">${price.toFixed(2)}</span>${(price - (price * discount) / 100).toFixed(2)}
          </h4>
          <div>
            <Link className="btn btn-icon size-7.75 bg-primary text-white hover:bg-primary-hover" to="">
              <Icon icon="basket" className="text-base" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductCard
