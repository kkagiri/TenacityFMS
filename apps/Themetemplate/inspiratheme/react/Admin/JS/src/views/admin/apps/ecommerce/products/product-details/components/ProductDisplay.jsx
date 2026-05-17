import product1 from '@/assets/images/products/single-1.png'
import product2 from '@/assets/images/products/single-2.png'
import product3 from '@/assets/images/products/single-3.png'
import product4 from '@/assets/images/products/single-4.png'
import Icon from '@/components/wrappers/Icon'
import clsx from 'clsx'
import { useCallback, useMemo, useState } from 'react'
import { Card, CardBody, Carousel, CarouselItem } from 'react-bootstrap'
import { Link } from 'react-router'
const ProductDisplay = () => {
  const [activeSlide, setActiveSlide] = useState(0)
  const handleSlideChange = useCallback((index) => {
    setActiveSlide(index)
  }, [])
  const slides = useMemo(() => [product1, product2, product3, product4], [])
  return (
    <Card className="card-top-sticky border-0">
      <CardBody className="p-0">
        <Carousel activeIndex={activeSlide} fade className="bg-light bg-opacity-25 border border-light border-dashed rounded-3" controls={false} indicators={false}>
          {slides.map((index, i) => (
            <CarouselItem key={i} className="text-center">
              <img
                src={index}
                alt={`product-${i + 1}`}
                width={576}
                height={576}
                className="img-fluid"
                style={{
                  minWidth: '100%',
                }}
              />
            </CarouselItem>
          ))}
        </Carousel>
        <div className="carousel-indicators m-0 mt-3 d-lg-flex d-none position-static h-100 rounded gap-2">
          {slides.map((index, i) => (
            <button
              type="button"
              key={i}
              onClick={() => handleSlideChange(i)}
              aria-label={`Slide ${i + 1}`}
              className={clsx('h-auto rounded bg-light-subtle border')}
              style={{
                width: 'auto !important',
                opacity: i === activeSlide ? 1 : 0.5,
                zIndex: i === activeSlide ? 1 : 0,
              }}
            >
              <img src={index} className="d-block avatar-xl" alt="indicator-img" />
            </button>
          ))}
        </div>
        <div className="text-center my-3">
          <Link to="/apps/ecommerce/product-add" className="me-1 btn btn-light">
            <Icon icon="pencil" className="fs-lg me-1" /> Edit
          </Link>
          <Link to="/apps/ecommerce/product-add" className="btn btn-danger">
            <Icon icon="circle-dashed-plus" className="fs-lg me-1" /> Delisting
          </Link>
        </div>
      </CardBody>
    </Card>
  )
}
export default ProductDisplay
