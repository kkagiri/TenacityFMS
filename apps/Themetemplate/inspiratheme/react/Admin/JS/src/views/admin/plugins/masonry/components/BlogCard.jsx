import Icon from '@/components/wrappers/Icon'
import { CardBody, CardFooter, CardTitle } from 'react-bootstrap'
import { Link } from 'react-router'
const BlogCard = ({ blog }) => {
  return (
    <article className="card mb-0">
      <CardBody>
        <CardTitle as="h6" className="fs-lg lh-base mb-2">
          <Link to="" className="link-reset">
            {blog.title}
          </Link>
        </CardTitle>
        <p className="mb-3 text-muted">{blog.description}</p>

        <div>
          {blog.tags.map((tag, idx) => (
            <Link to="" className="badge badge-label badge-default me-1" key={idx}>
              {tag}
            </Link>
          ))}
        </div>
      </CardBody>

      <CardFooter className="bg-transparent d-flex justify-content-between">
        <div className="d-flex justify-content-start align-items-center gap-2">
          <div className="avatar avatar-xs">
            <img src={blog.author.image} alt="avatar-6" className="img-fluid rounded-circle" />
          </div>
          <div>
            <h5 className="text-nowrap fs-sm mb-0 lh-base">
              <Link to="" className="link-reset">
                {blog.author.name}
              </Link>
            </h5>
          </div>
        </div>
        <Link className="link-primary fw-semibold" to="">
          Read more
          <Icon icon="arrow-right" />
        </Link>
      </CardFooter>
    </article>
  )
}
export default BlogCard
