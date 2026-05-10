import Rating from '@/components/Rating'
import Icon from '@/components/wrappers/Icon'
import { cn } from '@/utils/helpers'
import { Link } from 'react-router'
import { ProductType } from './data'

const Page = ({ product }: { product: ProductType }) => {
  const { price, discount, reviews, image, name, rating } = product

  return (
    <div className="card relative h-full!">
      {discount && <div className={cn('badge badge-label font-semibold rounded text-sm text-white absolute start-0 top-0 m-5', discount > 20 ? 'bg-success' : 'bg-danger')}>{discount}% OFF</div>}
      <div className="card-body pb-0 h-full">
        <div className="p-5">
          <img src={image} alt={name} className="img-fluid" />
        </div>
        <h6 className="card-title mb-2.5 text-sm">
          <Link to="/apps/ecommerce/product-details" className="hover:text-primary">
            {name}
          </Link>
        </h6>
        <div className="flex items-center gap-1.25 mb-2">
          <Rating rating={rating} />
          <span>
            <Link to="/apps/ecommerce/reviews" className="hover:text-primary font-semibold">
              ({reviews})
            </Link>
          </span>
        </div>
      </div>
      <div className="card-footer border-0!">
        <div className="flex w-full justify-between">
          <h4 className={cn('flex items-center gap-3 text-sm', discount && discount > 20 ? 'text-success' : 'text-danger')}>
            <span className="text-default-400 line-through">${price.toFixed(2)}</span>${(price - (price * (discount ?? 10)) / 100).toFixed(2)}
          </h4>
          <div>
            <a className="btn btn-icon size-7.75 bg-primary text-white hover:bg-primary-hover" href="">
              <Icon icon="basket" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Page
