import Icon from '@/components/wrappers/Icon'
import { Col, FormControl } from 'react-bootstrap'
import { Link } from 'react-router'
import { popularPostData, tagData } from './data'
const Sidebar = () => {
  return (
    <Col lg={4}>
      <h5 className="mb-3 text-uppercase fw-bold">Search</h5>
      <div className="app-search">
        <FormControl type="text" className="bg-light-subtle border-light" placeholder="Search post..." />
        <Icon icon="search" className="app-search-icon text-muted" />
      </div>

      <div className="align-items-center mt-5">
        <h5 className="mb-3 text-uppercase fw-bold">Related post:</h5>
        <ul className="list-group list-group-flush">
          {popularPostData.map((post, index) => (
            <li key={index} className="list-group-item ps-0">
              <Link to={post.href} className="link-reset fw-medium">
                <Icon icon="article" className="me-2" />
                {post.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="align-items-center mt-5">
        <h5 className="mb-3 text-uppercase fw-bold">Popular Tags:</h5>
        <div className="d-flex flex-wrap gap-1">
          {tagData.map((tag, index) => (
            <Link key={index} className="btn btn-light btn-sm" to={tag.href}>
              {tag.name}
            </Link>
          ))}
        </div>
      </div>
    </Col>
  )
}
export default Sidebar
