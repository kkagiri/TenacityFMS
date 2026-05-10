import product1 from '@/assets/images/products/single-1.png'
import product2 from '@/assets/images/products/single-2.png'
import product3 from '@/assets/images/products/single-3.png'
import product4 from '@/assets/images/products/single-4.png'
import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'

const ProductDisplay = () => {
  const slides = [product1, product2, product3, product4]

  return (
    <div className="card sticky top-20">
      <div data-hs-carousel='{ "loadingClasses": "opacity-0" }' className="relative">
        <div className="hs-carousel relative overflow-hidden w-full lg:min-h-120 min-h-90 rounded-lg">
          <div className="hs-carousel-body flex flex-nowrap transition-transform duration-700 opacity-0">
            {slides.map((image, idx) => (
              <div className="hs-carousel-slide" key={idx}>
                <img src={image} alt="indicator-img" className="w-full" />
              </div>
            ))}
          </div>
          <div className="hs-carousel-pagination relative mt-5 z-10">
            <div className="flex flex-row items-center justify-center gap-4">
              {slides.map((image, idx) => (
                <div className="hs-carousel-pagination-item shrink-0 border border-default-300 rounded overflow-hidden cursor-pointer opacity-50 hs-carousel-active:opacity-100" key={idx}>
                  <img src={image} alt="indicator-img" className="w-12" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="my-5 flex justify-center gap-2">
        <Link to="/apps/ecommerce/product/add" className="btn bg-light hover:text-primary">
          <Icon icon="pencil" className="text-base" />
          Edit
        </Link>
        <Link to="/apps/ecommerce/product/add" className="btn bg-danger text-white hover:bg-danger-hover">
          <Icon icon="circle-dashed-plus" className="text-base" />
          Delisting
        </Link>
      </div>
    </div>
  )
}

export default ProductDisplay
