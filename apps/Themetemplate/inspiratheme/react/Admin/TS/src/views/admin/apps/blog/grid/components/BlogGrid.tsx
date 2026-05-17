import { Masonry } from 'masonic'
import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'
import { CardBody, CardFooter, CardTitle } from 'react-bootstrap'
import { blogData, type BlogType } from './data'



const BlogCard = ({ blog }: { blog: BlogType }) => {
  const { category, comments, date, description, tags, title, user, views, image, isSpecialCard } = blog
  return (
    <>
      {isSpecialCard ? (
        <article className="card bg-primary bg-gradient rounded-3">
          <CardBody>
            <div className="badge bg-white text-white bg-opacity-25 badge-label mb-3">{category}</div>
            <h6 className="card-title fs-lg lh-base mb-2">
              <Link to="/apps/blog/article" className="text-white">
                {title}
              </Link>
            </h6>
            <p className="mb-3 text-white-50">{description}</p>
            <div>
              {tags.map((tag, idx) => (
                <Link to="" key={idx} className="me-1 badge badge-label border rounded border-white border-opacity-25">
                  {tag}
                </Link>
              ))}
            </div>
            <p className="d-flex flex-wrap gap-3 text-white-50 mb-0 mt-3 align-items-center fs-base">
              <span className="d-flex align-items-center gap-1">
                <Icon icon="calendar" className="fs-md" />
                {date}
              </span>
              <span className="d-flex align-items-center gap-1">
                <Icon icon="message-circle" className="fs-md" />
                <Link to="" className="link-reset">
                  {comments}
                </Link>
              </span>
              <span className="d-flex align-items-center gap-1">
                <Icon icon="eye" className="fs-md" />
                {views}
              </span>
            </p>
          </CardBody>
          <CardFooter className="bg-transparent d-flex justify-content-between border-light border-opacity-25">
            <div className="d-flex justify-content-start align-items-center gap-2">
              <div className="avatar avatar-xs">
                <img src={user.image} alt="avatar-1" className="img-fluid rounded-circle" />
              </div>
              <div>
                <h5 className="text-nowrap fs-sm mb-0 lh-base">
                  <Link to="" className="text-white">
                    {user.name}
                  </Link>
                </h5>
              </div>
            </div>
            <Link className="text-white fw-semibold d-flex align-items-center gap-1" to="/apps/blog/article">
              Read more <Icon icon="arrow-right" />
            </Link>
          </CardFooter>
        </article>
      ) : (
        <article className="card rounded-3 mb-0">
          {image && (
            <>
              <div className="badge text-bg-dark badge-label position-absolute top-0 start-0 m-3">{category}</div>
              <img className="card-img-top rounded-top-3" src={image} alt="Building APIs" />
            </>
          )}
          <CardBody>
            {!image && <div className="badge text-bg-dark badge-label mb-3">{category}</div>}
            <CardTitle as="h6" className="fs-lg lh-base mb-2">
              <Link to="/apps/blog/article" className="link-reset">
                {title}
              </Link>
            </CardTitle>
            <p className="mb-3 text-muted">{description}</p>
            <div>
              {tags.map((tag, idx) => (
                <Link to="" key={idx} className="badge badge-label badge-default me-1">
                  {tag}
                </Link>
              ))}
            </div>
            <p className="d-flex flex-wrap gap-3 text-muted mb-0 mt-3 align-items-center fs-base">
              <span className="d-flex align-items-center gap-1">
                <Icon icon="calendar" className="fs-md" />
                {date}
              </span>
              <span className="d-flex align-items-center gap-1">
                <Icon icon="message-circle" className="fs-md" />
                <Link to="" className="link-reset">
                  {comments}
                </Link>
              </span>
              <span className="d-flex align-items-center gap-1">
                <Icon icon="eye" className="fs-md" />
                {views}
              </span>
            </p>
          </CardBody>
          <CardFooter className="bg-transparent d-flex justify-content-between">
            <div className="d-flex justify-content-start align-items-center gap-2">
              <div className="avatar avatar-xs">
                <img src={user.image} alt="avatar-6" className="img-fluid rounded-circle" />
              </div>
              <div>
                <h5 className="text-nowrap fs-sm mb-0 lh-base">
                  <Link to="" className="link-reset">
                    {user.name}
                  </Link>
                </h5>
              </div>
            </div>
            <Link className="link-primary fw-semibold d-flex align-items-center gap-1" to="/apps/blog/article">
              Read more <Icon icon="arrow-right" />
            </Link>
          </CardFooter>
        </article>
      )}
    </>
  )
}
const BlogGrid = () => (
  <div>
    <Masonry items={blogData} columnGutter={20} columnWidth={350} overscanBy={5} render={({ data }) => <BlogCard blog={data} />} />
  </div>
)

export default BlogGrid
