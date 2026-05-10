import Icon from '@/components/wrappers/Icon'
import { Button, Col, Form, FormControl, InputGroup } from 'react-bootstrap'
import { Link } from 'react-router'
import { categoryData, popularPostData, tagData } from './data'
const Sidebar = () => {
  return (
    <Col lg={4}>
      <div className="d-grid mb-4">
        <Link to="/apps/blog/add" className="btn btn-primary btn-lg fs-base d-flex align-items-center justify-content-center gap-2">
          <Icon icon="circle-dashed-plus" /> Add New Article
        </Link>
      </div>

      <h5 className="mb-3 text-uppercase fw-bold">Search</h5>
      <div className="app-search mb-5">
        <input type="text" className="form-control bg-light-subtle border-light" placeholder="Search post..." />
        <Icon icon="search" className="app-search-icon text-muted" />
      </div>

      <div className="mb-5">
        <h5 className="mb-3 text-uppercase fw-bold">Categories</h5>
        <ul className="list-group list-group-flush">
          {categoryData.map((category, index) => (
            <li key={index} className="list-group-item ps-0 d-flex justify-content-between align-items-center">
              <Link to="" className="link-reset fw-medium">
                <Icon icon="folder" className="me-2" />
                {category.name}
              </Link>
              <span className="badge text-bg-light">{category.value}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-5">
        <h5 className="mb-3 text-uppercase fw-bold">Popular Posts</h5>
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

      <div className="mb-5">
        <h5 className="mb-3 text-uppercase fw-bold">Popular Tags</h5>
        <div className="d-flex flex-wrap gap-1">
          {tagData.map((tag, index) => (
            <Link key={index} className="btn btn-light btn-sm" to={tag.href}>
              {tag.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="p-4 bg-light-subtle rounded-3 border">
        <h5 className="text-uppercase fw-bold mb-3">Subscribe to Newsletter</h5>
        <p className="text-muted fs-sm mb-3">Get the latest articles and updates directly to your inbox.</p>
        <Form action="">
          <InputGroup>
            <FormControl type="email" placeholder="Your email address" />
            <Button className="btn-dark" type="submit">
              <Icon icon="send-2" />
            </Button>
          </InputGroup>
        </Form>
      </div>
    </Col>
  )
}
export default Sidebar
