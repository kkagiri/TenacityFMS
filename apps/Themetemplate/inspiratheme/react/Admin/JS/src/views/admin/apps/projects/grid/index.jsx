import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { Button, Col, FormControl, Row } from 'react-bootstrap'
import { Link } from 'react-router'
import { projectData } from './components/data'
import ProjectCard from './components/ProjectCard'
import ProjectCard2 from './components/ProjectCard2'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Projects" subtitle="Apps" />
      <Row className="mb-3">
        <Col lg={12}>
          <form className="bg-light-subtle rounded border p-3">
            <Row className="gap-3">
              <Col>
                <Row className="gap-3">
                  <Col lg={4}>
                    <div className="app-search">
                      <FormControl type="text" placeholder="Search project name..." />
                      <Icon icon="search" className="app-search-icon text-muted" />
                    </div>
                  </Col>
                  <Col xs="auto">
                    <div className="d-flex flex-wrap align-items-center gap-2">
                      <span className="me-2 fw-semibold">Filter By:</span>

                      <div className="app-search">
                        <select className="form-select form-control my-1 my-md-0">
                          <option>Status</option>
                          <option value="On Track">On Track</option>
                          <option value="Delayed">Delayed</option>
                          <option value="At Risk">At Risk</option>
                          <option value="Completed">Completed</option>
                        </select>
                        <Icon icon="activity" className="app-search-icon text-muted" />
                      </div>

                      <div className="app-search">
                        <select className="form-select form-control my-1 my-md-0">
                          <option>Team</option>
                          <option value="Design">Design</option>
                          <option value="Development">Development</option>
                          <option value="Marketing">Marketing</option>
                          <option value="QA">QA</option>
                        </select>
                        <Icon icon="users" className="app-search-icon text-muted" />
                      </div>

                      <div className="app-search">
                        <select className="form-select form-control my-1 my-md-0">
                          <option>Deadline</option>
                          <option value="This Week">This Week</option>
                          <option value="This Month">This Month</option>
                          <option value="Next Month">Next Month</option>
                          <option value="No Deadline">No Deadline</option>
                        </select>
                        <Icon icon="calendar-clock" className="app-search-icon text-muted" />
                      </div>

                      <Button variant="secondary" type="submit">
                        Apply
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Col>

              <Col xs="auto">
                <div className="d-flex gap-1">
                  <Link to="/apps/projects/grid" className="btn btn-primary btn-icon">
                    <Icon icon="category" className="fs-lg" />
                  </Link>
                  <Link to="/apps/projects/list" className="btn btn-soft-primary btn-icon">
                    <Icon icon="list-check" className="fs-lg" />
                  </Link>
                </div>
              </Col>
            </Row>
          </form>
        </Col>
      </Row>

      <Row>
        {projectData.slice(0, 4).map((project, idx) => (
          <Col md={6} xxl={3} key={idx}>
            <ProjectCard project={project} />
          </Col>
        ))}
        {projectData.slice(4, 8).map((project, idx) => (
          <Col md={6} xxl={3} key={idx}>
            <ProjectCard2 project={project} />
          </Col>
        ))}
      </Row>

      <ul className="pagination pagination-rounded pagination-boxed justify-content-center">
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
