import client1 from '@/assets/images/clients/01.svg'
import client2 from '@/assets/images/clients/02.svg'
import client3 from '@/assets/images/clients/03.svg'
import client4 from '@/assets/images/clients/04.svg'
import client5 from '@/assets/images/clients/05.svg'
import client6 from '@/assets/images/clients/06.svg'
import client7 from '@/assets/images/clients/07.svg'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'
import { Col, Container, Row } from 'react-bootstrap'
import CategoryCard from './components/CategoryCard'
import { categoryData, productData } from './components/data'
import ProductCard from './components/ProductCard'

const clients = [client1, client2, client3, client4, client5, client6, client7]


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Marketplace" subtitle="Ecommerce" />
      <Container fluid="xxl">
        <Row className="pt-3">
          {categoryData.map((category, idx) => (
            <Col key={idx} md={4}>
              <CategoryCard category={category} />
            </Col>
          ))}
        </Row>

        <Row className="pt-4">
          <Col xs={12} className="text-center">
            <span className="text-muted rounded-3 d-inline-block">👕 Discover styles tailored for everyone</span>
            <h3 className="mt-2 fw-bold mb-4">
              Find Your <mark>Perfect Style</mark>
            </h3>

            <div className="d-flex pt-1 justify-content-center align-items-center gap-1">
              <Link to="" className="badge badge-default rounded-pill px-3 py-2 fs-6 text-primary">
                Best Sellers
              </Link>
              <Link to="" className="badge badge-default rounded-pill px-3 py-2 fs-6 text-muted">
                New Arrived
              </Link>
              <Link to="" className="badge badge-default rounded-pill px-3 py-2 fs-6 text-muted">
                Sale Items
              </Link>
              <Link to="" className="badge badge-default rounded-pill px-3 py-2 fs-6 text-muted">
                Top Rated
              </Link>
            </div>
          </Col>
        </Row>

        <Row className="row-cols-xxl-4 row-cols-lg-3 row-cols-sm-2 row-col-1 mt-3">
          {productData.map((product, idx) => (
            <Col key={idx}>
              <ProductCard product={product} />
            </Col>
          ))}
        </Row>

        <Row>
          <Col xs={12} className="text-end">
            <Link to="/apps/ecommerce/products-grid" className="btn btn-success mt-3">
              {' '}
              View More Products <Icon icon="arrow-right" className="bi align-middle fs-lg" />{' '}
            </Link>
          </Col>
        </Row>

        <Row className="pt-4">
          <Col xs={12} className="text-center">
            <h3 className="fw-bold mb-2">
              Shop by <mark>Brand</mark>
            </h3>
            <span className="text-muted rounded-3 d-inline-block"> 🏷️ Discover trusted names loved by millions </span>
          </Col>
        </Row>

        <Row className="justify-content-center mb-5 mt-3">
          <Col xxl={9}>
            <div className="d-flex justify-content-center align-items-center flex-wrap gap-3 mt-4">
              {clients.map((client, idx) => (
                <div className="border rounded p-3" key={idx}>
                  <Link to="" className="d-block">
                    <img src={client} alt="logo" height="42" />
                  </Link>
                </div>
              ))}
            </div>
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default Page
