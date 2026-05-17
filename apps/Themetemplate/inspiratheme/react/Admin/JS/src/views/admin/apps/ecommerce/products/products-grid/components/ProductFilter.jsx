import Rating from '@/components/Rating'
import Icon from '@/components/wrappers/Icon'
import { getColor } from '@/utils/helpers'
import { useState } from 'react'
import { Badge, Button, Card, CardBody, Col, FormCheck, Nav, NavItem, Offcanvas } from 'react-bootstrap'
import FormCheckInput from 'react-bootstrap/esm/FormCheckInput'
import { getTrackBackground, Range } from 'react-range'
import { Link } from 'react-router'
import { brandData, categoryData, ratingData } from './data'
const STEP = 0.1
const MIN = 1
const MAX = 9999
const renderTrack = ({ props, children, values, direction }) => (
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
const renderThumb = ({ props }) => (
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
const ProductFilter = ({ isOffcanvasOpen, setIsOffcanvasOpen }) => {
  const [values, setValues] = useState([1000, 2500])
  return (
    <Col xl={3}>
      <Offcanvas responsive="lg" placement="start" show={isOffcanvasOpen} onHide={() => setIsOffcanvasOpen(false)}>
        <Card className="h-100">
          <CardBody className="p-0">
            <div className="p-3 border-bottom border-dashed">
              <div className="app-search">
                <input type="search" className="form-control" placeholder="Search product name..." />
                <Icon icon="search" className="app-search-icon text-muted" />
              </div>
            </div>

            <div className="p-3 border-bottom border-dashed">
              <div className="d-flex mb-2 justify-content-between align-items-center">
                <h5 className="mb-0">Category:</h5>
                <Button variant="link" size="sm" className="px-0 fw-semibold">
                  View All
                </Button>
              </div>
              <Nav className="flex-column">
                {categoryData.map((category) => (
                  <NavItem key={category.id} className="d-flex align-items-center gap-2 text-muted py-1">
                    <FormCheck type="checkbox" id={`cat-${category.id}`} label={category.name} className="form-check-label flex-grow-1" />
                    <Badge bg="light" text="dark" className="ms-2 text-bg-light">
                      {category.value}
                    </Badge>
                  </NavItem>
                ))}
              </Nav>
            </div>

            <div className="p-3 border-bottom border-dashed">
              <div className="d-flex mb-2 justify-content-between align-items-center">
                <h5 className="mb-0">Brands:</h5>
                <Link to="" className="btn btn-link btn-sm px-0 fw-semibold">
                  View All
                </Link>
              </div>

              {brandData.map((brand) => (
                <NavItem key={brand.id} className="d-flex align-items-center gap-2 text-muted py-1">
                  <FormCheck type="checkbox" id={`brand-${brand.id}`} label={brand.name} className="flex-grow-1" />
                  <Badge bg="light" text="dark" className="ms-2 text-bg-light">
                    {brand.value}
                  </Badge>
                </NavItem>
              ))}
            </div>

            <div className="p-3 border-bottom">
              <h5 className="mb-0">Price:</h5>

              <Range
                step={STEP}
                min={MIN}
                max={MAX}
                values={values}
                onChange={(values) => setValues(values)}
                renderTrack={(params) =>
                  renderTrack({
                    ...params,
                    values,
                  })
                }
                renderThumb={renderThumb}
              />

              <div className="d-flex gap-2 align-items-center mt-1">
                <div className="form-control form-control-sm text-center" id="price-filter-low">
                  ${values[0].toFixed(0)}
                </div>
                <span className="fw-semibold text-muted">to</span>
                <div className="form-control form-control-sm text-center" id="price-filter-high">
                  ${values[1].toFixed(0)}
                </div>
              </div>
            </div>

            <div className="p-3">
              <h5 className="mb-3">Ratings:</h5>

              {ratingData.map((rating, idx) => (
                <div key={idx} className={`form-check ${idx !== ratingData.length - 1 ? 'py-1' : ''}`}>
                  <FormCheckInput type="checkbox" id={`rating-${rating.id}`} />
                  <label htmlFor={`rating-${rating.id}`} className="form-check-label d-block">
                    <span className="d-flex align-items-center">
                      <span className="flex-grow-1 d-inline-flex align-items-center">
                        <Rating rating={Number(rating.id)} />
                        <span className="text-muted ms-1">{rating.name} Stars &amp; Up</span>
                      </span>
                      <span className="flex-shrink-0">
                        <span className="badge text-bg-light">{rating.value}</span>
                      </span>
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </Offcanvas>
    </Col>
  )
}
export default ProductFilter
