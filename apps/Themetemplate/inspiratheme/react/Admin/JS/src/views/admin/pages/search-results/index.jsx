import user2 from '@/assets/images/users/user-2.jpg'
import user3 from '@/assets/images/users/user-3.jpg'
import user4 from '@/assets/images/users/user-4.jpg'
import user5 from '@/assets/images/users/user-5.jpg'
import user8 from '@/assets/images/users/user-8.jpg'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { Button, Card, CardBody, CardHeader, Col, FormControl, FormSelect, Row } from 'react-bootstrap'
import { Link } from 'react-router'
import { searchResultData } from './components/data'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Search Results" subtitle="Pages" />

      <Row>
        <Col xs={12}>
          <Card>
            <div className="card-header d-block">
              <div className="text-center w-md-75 w-xl-50 mx-auto py-3">
                <div className="app-search app-search-pill input-group mb-3 rounded-pill">
                  <FormControl type="text" className="bg-light-subtle border-light py-2 fw-semibold" defaultValue="AI Tools" placeholder="Search AI products..." />
                  <Icon icon="search" className="app-search-icon text-muted" />
                  <Button variant="secondary" type="button">
                    Explore
                  </Button>
                </div>
                <div className="d-flex justify-content-center align-items-center gap-1">
                  <h5 className="text-muted mb-0">Popular Searches :</h5>
                  <Link to="" className="badge bg-primary-subtle text-primary rounded-pill px-2 py-1 fs-6">
                    AI Dashboard
                  </Link>
                  <Link to="" className="badge bg-primary-subtle text-primary rounded-pill px-2 py-1 fs-6">
                    Chatbot
                  </Link>
                  <Link to="" className="badge bg-primary-subtle text-primary rounded-pill px-2 py-1 fs-6">
                    Machine Learning
                  </Link>
                  <Link to="" className="badge bg-primary-subtle text-primary rounded-pill px-2 py-1 fs-6">
                    Generative AI
                  </Link>
                </div>
              </div>
            </div>
            <CardHeader className="border-light justify-content-between">
              <h4 className="fst-italic text-muted mb-0">
                Found <span className="fw-bold badge badge-soft-danger">42</span> results for
                <span className="text-dark">&quot;AI Tools&quot;</span>
              </h4>
              <div className="d-flex flex-wrap align-items-center gap-3">
                <span className="fw-semibold">Filter By:</span>
                <div className="app-search">
                  <FormSelect className="form-control my-1 my-md-0">
                    <option>Tool Type</option>
                    <option>Chatbot</option>
                    <option>Analytics</option>
                    <option>Image Generator</option>
                    <option>Voice AI</option>
                    <option>Automation</option>
                  </FormSelect>
                  <Icon icon="cpu" className="app-search-icon text-muted" />
                </div>
                <div className="app-search">
                  <FormSelect className="form-control my-1 my-md-0">
                    <option>Pricing</option>
                    <option>Free</option>
                    <option>Pro</option>
                    <option>Enterprise</option>
                  </FormSelect>
                  <Icon icon="wallet" className="app-search-icon text-muted" />
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {searchResultData.map((item, idx) => (
                <div className="border-bottom border-dashed px-4 py-3" key={idx}>
                  <h4 className="fs-md mb-1">
                    <Link to="" target="_blank" className="text-reset">
                      {item.title}
                    </Link>
                  </h4>
                  <p className="text-success mb-2">{item.href}</p>
                  <p className="text-muted mb-2">{item.description}</p>
                  <p className="d-flex flex-wrap gap-3 text-muted mb-1 align-items-center fs-base">
                    <span className="d-flex align-items-center gap-1">
                      <img src={item.user.image} height={24} width={24} alt="avatar-4" className="img-fluid avatar-xs rounded-circle" />
                      <Link to="" className="link-reset fw-semibold">
                        {item.user.name}
                      </Link>
                    </span>
                    <span>
                      <Icon icon="calendar" />
                      Published on: {item.publishedDate}
                    </span>
                    <span>
                      <Icon icon="users" />
                      Users: {item.users}+
                    </span>
                    <span>
                      <Icon icon="message-circle" />
                      <Link to="" className="link-reset">
                        Feedback: {item.feedback}
                      </Link>
                    </span>
                    <span>
                      <Icon icon="star" />
                      Rating: {item.rating}
                    </span>
                  </p>
                </div>
              ))}

              <div className="border-bottom border-dashed px-4 py-3">
                <h4 className="fs-md mb-3">Featured AI Creators:</h4>
                <div className="d-flex gap-2">
                  <div className="avatar">
                    <img src={user4} alt="" className="rounded avatar-xl" />
                  </div>
                  <div className="avatar">
                    <img src={user5} alt="" className="rounded avatar-xl" />
                  </div>
                  <div className="avatar">
                    <img src={user3} alt="" className="rounded avatar-xl" />
                  </div>
                  <div className="avatar">
                    <img src={user8} alt="" className="rounded avatar-xl" />
                  </div>
                  <div className="avatar">
                    <img src={user2} alt="" className="rounded avatar-xl" />
                  </div>
                </div>
              </div>

              <div className="border-bottom border-dashed px-4 py-3">
                <h4 className="fs-md mb-3">People also search for:</h4>
                <div className="d-flex gap-2 flex-wrap">
                  <div className="px-3 py-2 bg-light bg-opacity-50 rounded">
                    <Link to="" className="text-reset fs-md fw-semibold">
                      AI SaaS Platforms
                      <Icon icon="search" className="ms-2 align-middle" />
                    </Link>
                  </div>
                  <div className="px-3 py-2 bg-light bg-opacity-50 rounded">
                    <Link to="" className="text-reset fs-md fw-semibold">
                      AI Code Generators
                      <Icon icon="search" className="ms-2 align-middle" />
                    </Link>
                  </div>
                  <div className="px-3 py-2 bg-light bg-opacity-50 rounded">
                    <Link to="" className="text-reset fs-md fw-semibold">
                      AI Productivity Tools
                      <Icon icon="search" className="ms-2 align-middle" />
                    </Link>
                  </div>
                  <div className="px-3 py-2 bg-light bg-opacity-50 rounded">
                    <Link to="" className="text-reset fs-md fw-semibold">
                      AI for Marketing
                      <Icon icon="search" className="ms-2 align-middle" />
                    </Link>
                  </div>
                </div>
              </div>
              <ul className="pagination pagination-rounded pagination-boxed justify-content-center mb-0 py-3">
                <li className="page-item previous disabled">
                  <Link to="" className="page-link">
                    <Icon icon="chevron-left" />
                  </Link>
                </li>
                <li className="page-item active">
                  <Link to="" className="page-link">
                    1
                  </Link>
                </li>
                <li className="page-item">
                  <Link to="" className="page-link">
                    2
                  </Link>
                </li>
                <li className="page-item">
                  <Link to="" className="page-link">
                    3
                  </Link>
                </li>
                <li className="page-item">
                  <Link to="" className="page-link">
                    ...
                  </Link>
                </li>
                <li className="page-item">
                  <Link to="" className="page-link">
                    5
                  </Link>
                </li>
                <li className="page-item">
                  <Link to="" className="page-link">
                    6
                  </Link>
                </li>
                <li className="page-item next">
                  <Link to="" className="page-link">
                    <Icon icon="chevron-right" />
                  </Link>
                </li>
              </ul>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}
export default Page
