import Icon from '@/components/wrappers/Icon'
import { toPascalCase } from '@/utils/helpers'
import { CardBody, CardFooter, CardTitle, Col } from 'react-bootstrap'
import { Link } from 'react-router'
import { blogData } from './data'
const Categories = () => {
  return (
    <>
      {blogData.map((blog, index) => (
        <article className="card flex-md-row mb-3" key={index}>
          <Col md={4}>
            <div className="position-relative h-100 overflow-hidden rounded-start">
              <div className={`badge badge-label position-absolute top-0 start-0 m-3 ${blog.category.className}`}>{toPascalCase(blog.category.label)}</div>
              <img src={blog.image} alt={blog.title} className="w-100 h-100 object-fit-cover" />
            </div>
          </Col>

          <Col md={8} className="d-flex flex-column">
            <CardBody>
              <CardTitle as="h6" className="fs-lg lh-base mb-2">
                <Link to="apps/blog/article" className="link-reset">
                  {blog.title}
                </Link>
              </CardTitle>
              <p className="mb-3 text-muted">{blog.description}</p>

              <div>
                {blog.tags.map((tag, i) => (
                  <Link key={i} to="" className="badge badge-label badge-default me-1">
                    {tag}
                  </Link>
                ))}
              </div>

              <p className="d-flex flex-wrap gap-3 text-muted mb-0 mt-3 align-items-center fs-base">
                <span className="d-flex align-items-center gap-1">
                  <Icon icon="calendar" className="fs-md" />
                  {blog.date}
                </span>
                <span className="d-flex align-items-center gap-1">
                  <Icon icon="message-circle" className="fs-md" />
                  <Link to="" className="link-reset">
                    {blog.comments}
                  </Link>
                </span>
                <span className="d-flex align-items-center gap-1">
                  <Icon icon="eye" className="fs-md" />
                  {blog.views.toLocaleString()}
                </span>
              </p>
            </CardBody>
            <CardFooter className="bg-transparent border-top mt-auto d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <div className="avatar avatar-xs">
                  <img src={blog.author.image} alt={blog.author.name} className="img-fluid rounded-circle" />
                </div>
                <div>
                  <h5 className="text-nowrap fs-base mb-0 lh-base">
                    <Link to="" className="link-reset">
                      {blog.author.name}
                    </Link>
                  </h5>
                </div>
              </div>
              <Link className="link-primary fw-semibold d-flex align-items-center gap-1" to="/apps/blog/article">
                Read more <Icon icon="arrow-right" />
              </Link>
            </CardFooter>
          </Col>
        </article>
      ))}
    </>
  )
}
export default Categories
