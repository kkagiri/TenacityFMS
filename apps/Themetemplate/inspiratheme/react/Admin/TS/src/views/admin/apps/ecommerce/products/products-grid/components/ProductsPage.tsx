import Icon from '@/components/wrappers/Icon'
import { currentYear } from '@/config/constants'
import { useState } from 'react'
import { Button, Col, Pagination, Row } from 'react-bootstrap'
import { productData } from './data'
import ProductCard from './ProductCard'
import ProductFilter from './ProductFilter'

const ProductsPage = () => {
  const [isOffcanvasOpen, setIsOffcanvasOpen] = useState(false)

  return (
    <>
      <Row className="mb-2">
        <Col lg={12}>
          <div className="bg-light-subtle rounded border p-3">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
              <div className="d-lg-none">
                <Button variant="light" className="btn-icon" onClick={() => setIsOffcanvasOpen(true)}>
                  <Icon icon="menu-4" className="fs-lg" />
                </Button>
              </div>
              <h3 className="mb-0 fs-xl flex-grow-1">952 Products</h3>
              <div className="d-flex gap-1">
                <Button href="" variant="primary" className="btn-primary btn-icon">
                  <Icon icon="category" className="fs-lg" />
                </Button>
                <Button href="/apps/ecommerce/products" variant="primary" className="btn-soft-primary btn-icon">
                  <Icon icon="list-check" className="fs-lg" />
                </Button>
                <Button href="" variant="danger" className="ms-1">
                  <Icon icon="plus" className="fs-sm me-2" /> Add Product
                </Button>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      <Row className="g-2">
        <ProductFilter isOffcanvasOpen={isOffcanvasOpen} setIsOffcanvasOpen={setIsOffcanvasOpen} />

        <Col xl={9}>
          <Row className="row-cols-xxl-4 row-cols-lg-3 row-cols-sm-2 row-col-1 g-2">
            {productData.map((product, idx) => (
              <Col key={idx}>
                <ProductCard product={product} />
              </Col>
            ))}
          </Row>

          <div className="d-flex justify-content-between align-items-center mb-4 mt-3">
            <span className="text-muted fst-italic">
              Last modification: <Icon icon="clock" /> 4:55 pm - 22.04.{currentYear}
            </span>
            <Pagination className="pagination-boxed justify-content-center mb-0">
              <Pagination.Prev disabled>
                <Icon icon="chevron-left" />
              </Pagination.Prev>
              <Pagination.Item active>{1}</Pagination.Item>
              <Pagination.Item>{2}</Pagination.Item>
              <Pagination.Item>{3}</Pagination.Item>
              <Pagination.Next>
                <Icon icon="chevron-right" />
              </Pagination.Next>
            </Pagination>
          </div>
        </Col>
      </Row>
    </>
  )
}

export default ProductsPage
