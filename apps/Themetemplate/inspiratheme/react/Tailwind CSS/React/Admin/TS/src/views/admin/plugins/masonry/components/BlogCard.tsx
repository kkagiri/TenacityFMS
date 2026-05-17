import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'
import { BlogType } from './data'

const BlogCard = ({ blog }: { blog: BlogType }) => {
  return (
    <article className="card mb-0">
      <div className="card-body">
        <h6 className="card-title mb-2.5 text-base">
          <Link to="" className="hover:text-primary">
            {blog.title}
          </Link>
        </h6>
        <p className="text-default-400 mb-5">{blog.description}</p>
        <div>
          {blog.tags.map((tag, idx) => (
            <Link to="" className="badge badge-label border border-default-300 me-1" key={idx}>
              {tag}
            </Link>
          ))}
        </div>
      </div>
      <div className="card-footer flex justify-between border-0!">
        <div className="flex items-center justify-start gap-2.5">
          <div className="size-6">
            <img src={blog.author.image} alt="avatar-6" className="img-fluid rounded-full" />
          </div>
          <div>
            <h5 className="lh-base text-sm text-nowrap">
              <Link to="" className="hover:text-primary">
                {blog.author.name}
              </Link>
            </h5>
          </div>
        </div>
        <Link className="text-primary font-semibold hover:text-primary-hover flex gap-1 items-center" to="">
          Read more
          <Icon icon="arrow-right" />
        </Link>
      </div>
    </article>
  )
}

export default BlogCard
