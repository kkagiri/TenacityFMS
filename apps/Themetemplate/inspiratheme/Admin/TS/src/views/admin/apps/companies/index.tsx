import PageBreadcrumb from '@/components/PageBreadcrumb'
import Rating from '@/components/Rating'
import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'
import { Button, Card, Col, Form, FormControl, FormSelect, Row } from 'react-bootstrap'
import { companyData, CompanyType } from './data'

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Companies" subtitle="Apps" />
      <Row className="mb-3">
        <Col lg={12}>
          <Form className="bg-light-subtle rounded border p-3">
            <Row className="gap-3">
              <Col>
                <Row className="gap-3">
                  <Col lg={4}>
                    <div className="app-search">
                      <FormControl type="text" placeholder="Search company name..." />
                      <Icon icon="search" className="app-search-icon text-muted" />
                    </div>
                  </Col>
                  <Col className="col-auto">
                    <div className="d-flex align-items-center gap-2">
                      <span className="me-2 fw-semibold">Filter By:</span>

                      <div className="app-search">
                        <FormSelect className="form-control my-1 my-md-0">
                          <option>Location</option>
                          <option value="USA">USA</option>
                          <option value="Canada">Canada</option>
                          <option value="Germany">Germany</option>
                          <option value="India">India</option>
                          <option value="UK">United Kingdom</option>
                        </FormSelect>
                        <Icon icon="map-pin" className="app-search-icon text-muted" />
                      </div>

                      <div className="app-search">
                        <FormSelect className="form-control my-1 my-md-0">
                          <option value="Category">Category</option>
                          <option value="Tech">Tech</option>
                          <option value="Finance">Finance</option>
                          <option value="eCommerce">eCommerce</option>
                          <option value="Healthcare">Healthcare</option>
                          <option value="Automotive">Automotive</option>
                        </FormSelect>
                        <Icon icon="briefcase" className="app-search-icon text-muted" />
                      </div>

                      <div className="app-search">
                        <FormSelect className="form-control my-1 my-md-0">
                          <option>Rating</option>
                          <option value="5">5 Stars</option>
                          <option value="4">4 Stars & Up</option>
                          <option value="3">3 Stars & Up</option>
                          <option value="2">2 Stars & Up</option>
                          <option value="1">1 Star & Up</option>
                        </FormSelect>
                        <Icon icon="star" className="app-search-icon text-muted" />
                      </div>

                      <Button variant="secondary" type="submit">
                        Apply
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Col>
              <Col xs="auto">
                <div role="group" aria-label="Layout toggle button group">
                  <div className="d-flex gap-1">
                    <input type="radio" className="btn-check" name="btnradio" id="btnradio1" defaultChecked />
                    <label className="btn btn-soft-primary btn-icon" htmlFor="btnradio1">
                      <Icon icon="category" className="fs-lg"></Icon>
                    </label>

                    <input type="radio" className="btn-check" name="btnradio" id="btnradio2" />
                    <label className="btn btn-soft-primary btn-icon" htmlFor="btnradio2">
                      <Icon icon="list-check" className="fs-lg"></Icon>
                    </label>
                  </div>
                </div>
              </Col>
            </Row>
          </Form>
        </Col>
      </Row>
      <Row>
        {companyData.map((company, idx) => (
          <Col xl={4} md={6} key={idx}>
            <CompanyCard company={company} />
          </Col>
        ))}
      </Row>

      <ul className="pagination pagination-rounded pagination-boxed mb-3 justify-content-center">
        <li className="page-item">
          <Link className="page-link" to="" aria-label="Previous">
            <span aria-hidden="true">«</span>
          </Link>
        </li>
        <li className="page-item active">
          <Link className="page-link" to="">
            1
          </Link>
        </li>
        <li className="page-item">
          <Link className="page-link" to="">
            2
          </Link>
        </li>
        <li className="page-item">
          <Link className="page-link" to="">
            3
          </Link>
        </li>
        <li className="page-item">
          <Link className="page-link" to="">
            4
          </Link>
        </li>
        <li className="page-item">
          <Link className="page-link" to="">
            5
          </Link>
        </li>
        <li className="page-item">
          <Link className="page-link" to="" aria-label="Next">
            <span aria-hidden="true">»</span>
          </Link>
        </li>
      </ul>
    </>
  )
}

export default Page

const CompanyCard = ({ company }: { company: CompanyType }) => {
  const { image, name, website, location, industry, description, rating, employees, revenue } = company
  return (
    <Card className="d-flex flex-row p-3">
      <img src={image} alt={name} className="avatar-xl me-3" />

      <div className="flex-grow-1">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h4 className="mb-1 fw-bold">{name}</h4>
            <a href={`https://${website}`} className="text-muted text-decoration-none">
              {website}
            </a>
          </div>
          <a href="" className="btn btn-sm btn-outline-danger rounded-pill">
            <Icon icon="heart" className="me-1"></Icon>
            Follow
          </a>
        </div>

        <div className="mt-2 mb-3 d-flex flex-wrap gap-2">
          <span className="badge bg-light text-primary p-1 fs-xxs">
            <Icon icon="map-pin" className="me-1"></Icon>
            {location}
          </span>
          <span className="badge bg-light text-success p-1 fs-xxs">{industry}</span>
        </div>

        <p className="text-muted mb-3">{description}</p>

        <div className="d-flex justify-content-between flex-wrap mt-2 gap-3">
          <div>
            <h6 className="text-muted">Employees</h6>
            <span className="fw-semibold fs-lg">{employees}</span>
          </div>
          <div>
            <h6 className="text-muted">Revenue</h6>
            <span className="fw-semibold fs-lg">{revenue}</span>
          </div>
          <div className="text-warning align-self-center fs-lg">
            <Rating rating={rating} className="fs-lg d-flex gap-1" />
          </div>
        </div>
      </div>
    </Card>
  )
}
