import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'
import { blogs, BlogType } from './data'

const BlogCard = ({ blog }: { blog: BlogType }) => {
  return (
    <article className="card rounded-md border-0 shadow-sm">
      <div className="badge text-white bg-dark badge-label absolute top-0 inset-s-0 m-5">{blog.category}</div>

      <img className="card-img-top rounded-t-md" src={blog.image} alt={blog.title} />

      <div className="card-body">
        <h6 className="card-title text-base mb-2.5">
          <Link to={blog.url} className="hover:text-primary">
            {blog.title}
          </Link>
        </h6>
        <p className="mb-5 text-default-400">{blog.description}</p>

        <p className="flex flex-wrap gap-5 text-default-400 mb-0 mt-5 items-center fs-base">
          <span className="flex items-center gap-1">
            <Icon icon="calendar" />
            {blog.date}
          </span>

          <span className="flex items-center gap-1">
            <Icon icon="message-circle" />
            <Link to="" className="hover:text-primary">
              {blog.comments}
            </Link>
          </span>

          <span className="flex items-center gap-1">
            <Icon icon="eye" />
            {blog.views}
          </span>
        </p>
      </div>

      <div className="card-footer bg-transparent flex justify-between border-0">
        <div className="flex justify-start items-center gap-2.5">
          <div className="size-6">
            <img src={blog.author.image} alt={blog.author.name} className="rounded-full" />
          </div>
          <div>
            <h5 className="text-nowrap text-sm">
              <Link to="" className="hover:text-primary">
                {blog.author.name}
              </Link>
            </h5>
          </div>
        </div>
        <Link to={blog.url} className="text-primary font-semibold hover:text-primary-hover flex items-center gap-1">
          Read more <Icon icon="arrow-right"></Icon>
        </Link>
      </div>
    </article>
  )
}

const Blog = () => {
  return (
    <section className="lg:py-26 py-12 bg-light/30 border-t border-b border-default-300" id="blog">
      <div className="container">
        <div className="text-center">
          <span className="text-default-400 rounded-xl inline-block">📝 Insights & Resources</span>
          <h2 className="mt-5 font-bold md:text-2xl text-xl mb-15">
            Explore Our <mark className="italic bg-warning/20 text-default-800">Latest</mark> Articles and Updates
          </h2>
        </div>

        <div className="grid xl:grid-cols-3 grid-cols-1 gap-7.5">
          {blogs.map((blog, index) => (
            <BlogCard blog={blog} key={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Blog
