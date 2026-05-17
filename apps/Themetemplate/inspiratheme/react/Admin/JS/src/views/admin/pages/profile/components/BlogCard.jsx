import Icon from '@/components/wrappers/Icon'
import { Card, CardBody } from 'react-bootstrap'
import { Link } from 'react-router'
const BlogCard = ({ blog }) => {
  return (
    <>
      <Card className="rounded-3">
        <div className="badge text-bg-dark badge-label position-absolute top-0 start-0 m-3">{blog.category}</div>

        <img className="card-img-top rounded-top-3 img-fluid" src={blog.image} alt={blog.title} height={221} />

        <CardBody>
          <h6 className="card-title fs-lg lh-base mb-2">
            <Link to="" className="link-reset">
              {blog.title}
            </Link>
          </h6>

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
              {blog.views}
            </span>
          </p>
        </CardBody>

        <div className="card-footer bg-transparent d-flex justify-content-between">
          <div className="d-flex justify-content-start align-items-center gap-2">
            <div className="avatar avatar-xs">
              <div className="avatar avatar-xs">
                <img src={blog.author.image} alt={blog.author.name} className="img-fluid rounded-circle" />
              </div>
            </div>

            <div>
              <h5 className="text-nowrap fs-sm mb-0 lh-base">
                <Link to="" className="link-reset">
                  {blog.author.name}
                </Link>
              </h5>
            </div>
          </div>

          <Link className="link-primary fw-semibold d-flex align-items-center gap-1" to="">
            Read more
            <Icon icon="arrow-right" />
          </Link>
        </div>
      </Card>
    </>
  )
}
export default BlogCard
