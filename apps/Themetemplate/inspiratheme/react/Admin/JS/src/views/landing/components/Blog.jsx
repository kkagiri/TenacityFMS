import Icon from '@/components/wrappers/Icon'
import { CardBody, Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router'
import { blogs } from './data'
const BlogCard = ({ blog }) => {
  return (
    <article className="card rounded-3 border-0 shadow-sm">
      <div className="badge text-bg-dark badge-label position-absolute top-0 start-0 m-3">{blog.category}</div>

      <img className="card-img-top rounded-top-3 img-fluid" src={blog.image} alt={blog.title} />

      <CardBody>
        <h6 className="card-title fs-lg lh-base mb-2">
          <Link to={blog.url} className="link-reset">
            {blog.title}
          </Link>
        </h6>
        <p className="mb-3 text-muted">{blog.description}</p>

        <p className="d-flex flex-wrap gap-3 text-muted mb-0 mt-3 align-items-center fs-base">
          <span>
            <Icon icon="calendar" className="fs-md" /> {blog.date}
          </span>
          <span>
            <Icon icon="message-circle" className="fs-md" />
            <Link to="" className="link-reset">
              {blog.comments}
            </Link>
          </span>
          <span>
            <Icon icon="eye" className="fs-md" /> {blog.views}
          </span>
        </p>
      </CardBody>

      <div className="card-footer bg-transparent d-flex justify-content-between border-0">
        <div className="d-flex justify-content-start align-items-center gap-2">
          <div className="avatar avatar-xs">
            <img src={blog.author.image} alt={blog.author.name} className="img-fluid rounded-circle" />
          </div>
          <div>
            <h5 className="text-nowrap fs-sm mb-0 lh-base">
              <Link to="" className="link-reset">
                {blog.author.name}
              </Link>
            </h5>
          </div>
        </div>
        <Link to={blog.url} className="link-primary fw-semibold">
          Read more <Icon icon="arrow-right" />
        </Link>
      </div>
    </article>
  )
}
const Blog = () => {
  return (
    <section className="section-custom bg-light bg-opacity-30 border-top border-bottom border-light" id="blog">
      <Container>
        <Row>
          <Col xs={12} className="text-center">
            <span className="text-muted rounded-3 d-inline-block">📝 Insights & Resources</span>
            <h2 className="mt-3 fw-bold mb-5">
              Explore Our <mark className="fst-italic">Latest</mark> Articles and Updates
            </h2>
          </Col>
        </Row>

        <Row className="g-4">
          {blogs.map((blog, index) => (
            <Col lg={4} key={index}>
              <BlogCard blog={blog} />
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  )
}
export default Blog
