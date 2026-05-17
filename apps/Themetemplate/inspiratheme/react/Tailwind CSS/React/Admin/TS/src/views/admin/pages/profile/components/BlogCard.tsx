import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'
import { BlogType } from './data'

const BlogCard = ({ blog }: { blog: BlogType }) => {
  return (
    <>
      <article className="card">
        <div>
          <span className="absolute top-5 start-5 badge badge-label bg-dark text-white"> {blog.category}</span>
        </div>

        <img src={blog.image} alt={blog.title} className="rounded-t-md" />

        <div className="card-body">
          <h6 className="text-base mb-2.5">
            <Link to="" className="text-default-800 hover:text-primary">
              {blog.title}
            </Link>
          </h6>
          <p className="mb-5 text-default-400">{blog.description}</p>

          <div className="flex flex-wrap gap-1">
            {blog.tags.map((tag, i) => (
              <Link key={i} to="" className="badge badge-label border border-default-300">
                {tag}
              </Link>
            ))}
          </div>

          <p className="flex flex-wrap items-center gap-base text-default-400 mt-5">
            <span className="flex items-center gap-1.25">
              <Icon icon="calendar" className="text-base"></Icon>
              {blog.date}
            </span>
            <span className="flex items-center gap-1.25">
              <Icon icon="message-circle" className="text-base"></Icon>
              <Link to="" className="hover:text-primary">
                {blog.comments}
              </Link>
            </span>
            <span className="flex items-center gap-1.25">
              <Icon icon="eye" className="text-base"></Icon>
              {blog.views}
            </span>
          </p>
        </div>

        <div className="card-footer border-0">
          <div className="flex items-center gap-2.5">
            <img src={blog.author.image} alt={blog.author.name} className="size-6 rounded-full" />
            <div>
              <h5>
                <Link to="" className="text-sm hover:text-primary">
                  {blog.author.name}
                </Link>
              </h5>
            </div>
          </div>
          <div>
            <Link to="" className="text-primary text-sm flex items-center gap-1.25">
              Read more
              <Icon icon="arrow-right" />
            </Link>
          </div>
        </div>
      </article>
    </>
  )
}

export default BlogCard
