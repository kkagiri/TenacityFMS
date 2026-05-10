import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { generateInitials } from '@/utils/helpers'
import clsx from 'clsx'
import { Card, CardBody, Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, FormControl, FormSelect, Row } from 'react-bootstrap'
import { Link } from 'react-router'
import { contactData } from './data'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Contacts" subtitle="Users" />
      <Row className="mb-3">
        <Col lg={12}>
          <form className="bg-light-subtle rounded border p-3">
            <Row className="gap-3">
              <Col lg={4}>
                <div className="app-search">
                  <FormControl type="text" placeholder="Search contact name..." />
                  <Icon icon="search" className="app-search-icon text-muted" />
                </div>
              </Col>
              <Col>
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <span className="me-2 fw-semibold">Filter By:</span>

                  <div className="app-search">
                    <FormSelect className="form-control my-1 my-md-0">
                      <option>Designation</option>
                      <option value="Manager">Manager</option>
                      <option value="Developer">Developer</option>
                      <option value="Designer">Designer</option>
                      <option value="Sales">Sales</option>
                      <option value="Support">Support</option>
                    </FormSelect>
                    <Icon icon="user-check" className="app-search-icon text-muted" />
                  </div>

                  <div className="app-search">
                    <FormSelect className="form-control my-1 my-md-0">
                      <option>Location</option>
                      <option value="USA">USA</option>
                      <option value="UK">UK</option>
                      <option value="Germany">Germany</option>
                      <option value="India">India</option>
                      <option value="Canada">Canada</option>
                    </FormSelect>
                    <Icon icon="map-pin" className="app-search-icon text-muted" />
                  </div>

                  <div className="app-search">
                    <FormSelect className="form-control my-1 my-md-0">
                      <option>Department</option>
                      <option value="UI/UX">UI/UX</option>
                      <option value="Engineering">Engineering</option>
                      <option value="HR">HR</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Finance">Finance</option>
                    </FormSelect>
                    <Icon icon="stack-2" className="app-search-icon text-muted" />
                  </div>
                  <button type="submit" className="btn btn-secondary">
                    Apply
                  </button>
                  <div role="group" aria-label="Layout toggle button group" className="ms-auto flex-shrink-0">
                    <input type="radio" className="btn-check " name="btnradio" id="btnradio1" defaultChecked />
                    <label className="btn btn-soft-primary btn-icon me-1" htmlFor="btnradio1">
                      <Icon icon="apps" className="fs-lg" />
                    </label>
                    <input type="radio" className="btn-check" name="btnradio" id="btnradio2" />
                    <label className="btn btn-soft-primary btn-icon" htmlFor="btnradio2">
                      <Icon icon="list-check" className="fs-lg" />
                    </label>
                  </div>
                </div>
              </Col>
            </Row>
          </form>
        </Col>
      </Row>
      <Row>
        {contactData.map((contact, idx) => (
          <Col md={6} xxl={3} key={idx}>
            <ContactCard contactData={contact} />
          </Col>
        ))}
      </Row>
      <ul className="pagination pagination-rounded pagination-boxed justify-content-center">
        <li className="page-item">
          <Link className="page-link" to="" aria-label="Previous">
            <span aria-hidden="true">«</span>
          </Link>
        </li>
        <li className="page-item">
          <Link className="page-link" to="">
            1
          </Link>
        </li>
        <li className="page-item active">
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
const ContactCard = ({ contactData }) => {
  const { name, image, position, role, email, contact, location, website, updatedTime, flag, className } = contactData
  return (
    <Card className="card-h-100">
      <CardBody>
        <div className="d-flex align-items-center mb-4">
          <div className="me-3 position-relative">
            {image ? (
              <img src={image} alt={name} className="rounded-circle" width={72} height={72} />
            ) : (
              <div
                className="avatar rounded-circle flex-shrink-0"
                style={{
                  height: 72,
                  width: 72,
                }}
              >
                <span className="avatar-title text-bg-primary fw-semibold rounded-circle fs-22">{generateInitials(name)}</span>
              </div>
            )}

            <span className={clsx('position-absolute bottom-0 end-0 badge rounded-circle p-1 shadow-sm', className)} title="Rating 4.8">
              <Icon icon="star" className="text-white"></Icon>
            </span>
          </div>
          <div>
            <h5 className="mb-1 d-flex align-items-center">
              <Link to="/apps/users/profile" className="link-reset">
                {name}
              </Link>
              <img src={flag} alt="UK" className="ms-2 rounded-circle" height={16} />
            </h5>
            <p className="text-muted mb-1">{position}</p>
            <span className="badge text-bg-light badge-label">{role}</span>
          </div>
          <div className="ms-auto">
            <Dropdown>
              <DropdownToggle as="button" className="btn btn-icon btn-ghost-light text-muted drop-arrow-none">
                <Icon icon="dots-vertical" className="fs-xl"></Icon>
              </DropdownToggle>
              <DropdownMenu align="end">
                <DropdownItem>
                  <Icon icon="share" className="me-2"></Icon>
                  Share
                </DropdownItem>
                <DropdownItem>
                  <Icon icon="edit" className="me-2"></Icon>
                  Edit
                </DropdownItem>
                <DropdownItem>
                  <Icon icon="ban" className="me-2"></Icon>
                  Block
                </DropdownItem>
                <DropdownItem>
                  <Icon icon="trash" className="me-2"></Icon>
                  Delete
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>

        <ul className="list-unstyled text-muted mb-4">
          <li className="mb-2">
            <div className="d-flex align-items-center gap-2">
              <div className="avatar-xs avatar-img-size fs-24">
                <span className="avatar-title text-bg-light fs-sm rounded-circle">
                  <Icon icon="mail"></Icon>
                </span>
              </div>
              <h5 className="fs-base mb-0 fw-medium">
                <Link to="" className="link-reset">
                  {email}
                </Link>
              </h5>
            </div>
          </li>
          <li className="mb-2">
            <div className="d-flex align-items-center gap-2">
              <div className="avatar-xs avatar-img-size fs-24">
                <span className="avatar-title text-bg-light fs-sm rounded-circle">
                  <Icon icon="phone"></Icon>
                </span>
              </div>
              <h5 className="fs-base mb-0 fw-medium">
                <Link to="" className="link-reset">
                  {contact}
                </Link>
              </h5>
            </div>
          </li>
          <li className="mb-2">
            <div className="d-flex align-items-center gap-2">
              <div className="avatar-xs avatar-img-size fs-24">
                <span className="avatar-title text-bg-light fs-sm rounded-circle">
                  <Icon icon="map-pin"></Icon>
                </span>
              </div>
              <h5 className="fs-base mb-0 fw-medium">{location}</h5>
            </div>
          </li>
          <li>
            <div className="d-flex align-items-center gap-2">
              <div className="avatar-xs avatar-img-size fs-24">
                <span className="avatar-title text-bg-light fs-sm rounded-circle">
                  <Icon icon="link"></Icon>
                </span>
              </div>
              <h5 className="fs-base mb-0 fw-medium">
                <Link to="">{website}</Link>
              </h5>
            </div>
          </li>
        </ul>

        <div className="d-flex justify-content-between align-items-center">
          <span className="text-muted fs-xs">
            <Icon icon="refresh" className="me-1"></Icon>
            {updatedTime}
          </span>
          <Link to="/apps/users/profile" className="btn btn-soft-primary btn-sm rounded-pill">
            View Profile
          </Link>
        </div>
      </CardBody>
    </Card>
  )
}
