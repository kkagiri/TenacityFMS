import Rating from '@/components/Rating'
import Icon from '@/components/wrappers/Icon'
import { getColor } from '@/utils/helpers'
import { Link } from 'react-router'
import { useState } from 'react'
import { getTrackBackground, Range } from 'react-range'
import { Direction, IRenderThumbParams, IRenderTrackParams } from 'react-range/lib/types'
import { brandData, categoryData, ratingData } from './data'

const STEP = 0.1
const MIN = 1
const MAX = 9999

const renderTrack = ({
  props,
  children,
  values,
  direction,
}: IRenderTrackParams & {
  values: number[]
  direction?: Direction
}) => (
  <div
    onMouseDown={props.onMouseDown}
    onTouchStart={props.onTouchStart}
    style={{
      ...props.style,
      height: '36px',
      display: 'flex',
      width: '100%',
    }}
  >
    <div
      ref={props.ref}
      
      style={{
        height: '4px',
        width: '100%',
        borderRadius: '4px',
        background: getTrackBackground({
          values,
          colors: values.length == 1 ? [getColor('chart-primary'), getColor('light')] : values.length == 2 ? [getColor('light'), getColor('chart-primary'), getColor('light')] : ['#000', getColor('chart-primary'), getColor('chart-secondary'), getColor('light')],
          min: MIN,
          max: MAX,
          direction,
        }),
        alignSelf: 'center',
      }}
    >
      {children}
    </div>
  </div>
)

const renderThumb = ({ props }: IRenderThumbParams) => (
  <div
    
    {...props}
    key={props.key}
    style={{
      ...props.style,
      height: '16px',
      width: '16px',
      borderRadius: '50%',
      backgroundColor: getColor('primary'),
    }}
  />
)

const ProductFilter = () => {
  const [values, setValues] = useState([1000, 2500])
  return (
    <div className="card">
      <div className="card-body p-0">
        <div className="border-default-300 border-b border-dashed p-5">
          <div className="input-icon-group">
            <Icon icon="search" className="input-icon" />
            <input type="search" className="form-input" placeholder="Search product name..." />
          </div>
        </div>
        <div className="border-default-300 border-b border-dashed p-5">
          <div className="mb-4.5 flex items-center justify-between">
            <h5>Category:</h5>
            <Link to="" className="font-semibold text-primary">
              View All
            </Link>
          </div>
          <div className="space-y-2.5 mt-1.5">
            {categoryData.map((category, idx) => (
              <div className="flex items-center justify-between" key={idx}>
                <div className="flex items-center gap-1.5">
                  <input type="checkbox" id="cat-electronics" className="form-checkbox" />
                  <label htmlFor="cat-electronics" className="text-default-400 font-normal">
                    {category.name}
                  </label>
                </div>
                {category.value && (
                  <div>
                    <span className="badge bg-light text-dark font-semibold">{category.value}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="border-default-300 border-b border-dashed p-5">
          <div className="mb-4.5 flex items-center justify-between">
            <h5>Brands:</h5>
            <Link to="" className="font-semibold text-primary">
              View All
            </Link>
          </div>
          <div className="space-y-2.5 mt-1.5">
            {brandData.map((brand, idx) => (
              <div className="flex items-center justify-between" key={idx}>
                <div className="flex items-center gap-1.5">
                  <input type="checkbox" id="brand-apple" className="form-checkbox" />
                  <label htmlFor="brand-apple" className="text-default-400 font-normal">
                    {brand.name}
                  </label>
                </div>
                {brand.value && (
                  <div>
                    <span className="badge bg-light text-dark font-semibold">{brand.value}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="border-default-300 border-b border-dashed p-5">
          <h5 className="mb-4.5">Price:</h5>
          <Range step={STEP} min={MIN} max={MAX} values={values} onChange={(values) => setValues(values)} renderTrack={(params) => renderTrack({ ...params, values })} renderThumb={renderThumb} />
          <div className="mt-5 w-full flex items-center gap-2">
            <div className="border border-default-300 rounded w-full text-center p-2" id="price-filter-low">
              ${values[0].toFixed(0)}
            </div>
            <span className="text-default-400 font-semibold">to</span>
            <div className="border border-default-300 rounded w-full text-center p-2" id="price-filter-high">
              ${values[1].toFixed(0)}
            </div>
          </div>
        </div>
        <div className="border-default-300 p-5">
          <div className="mb-4.5 flex items-center justify-between">
            <h5>Ratings:</h5>
          </div>
          <div className="space-y-2.5 mt-1.5">
            {ratingData.map((rating, idx) => (
              <div className="flex items-center justify-between" key={idx}>
                <div className="flex items-center gap-1.5">
                  <input type="checkbox" id={`rating-${rating.id}`} className="form-checkbox" />
                  <div className="flex items-center">
                    <Rating rating={Number(rating.id)} />
                    <span className="text-default-400 ms-1.25 font-normal">{rating.name} Stars &amp; Up</span>
                  </div>
                </div>
                <div>
                  <span className="badge bg-light text-dark font-semibold">{rating.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductFilter
