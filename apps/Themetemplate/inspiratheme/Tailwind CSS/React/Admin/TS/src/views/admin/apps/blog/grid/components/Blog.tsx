import { Masonry } from 'masonic'
import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'
import { blogData, BlogType } from './data'



const Blog = () => {
  return (
    <>
      <Masonry items={blogData} columnGutter={20} columnWidth={350} overscanBy={5} render={({ data }) => <BlogGrid blog={data} />} />
    </>
  )
}

export default Blog

export const BlogGrid = ({ blog }: { blog: BlogType }) => {
  const { category, comments, date, description, tags, title, user, views, image, isSpecialCard } = blog
  return (
    <>
      {isSpecialCard ? (
        <article className="card !bg-primary bg-linear-to-b from-white/30 to-white/0">
          <div className="card-body">
            <span className="badge badge-label bg-white/25 text-white mb-5">{category}</span>
            <h6 className="card-title mb-2.5">
              <a href="/apps/blog/article" className="text-base text-white">
                {title}
              </a>
            </h6>
            <p className="mb-5 text-white/50">{description}</p>
            <div>
              {tags.map((tag, idx) => (
                <a href="" className="badge badge-label rounded border border-white/25 text-white me-1" key={idx}>
                  {tag}
                </a>
              ))}
            </div>
            <p className="mt-5 flex flex-wrap items-center gap-base text-sm text-white/50">
              <span className="flex items-center gap-1.25">
                <Icon icon="calendar" className="text-md" />
                {date}
              </span>
              <span className="flex items-center gap-1.25">
                <Icon icon="message-circle" className="text-md" />
                <a href="" className="hover:text-primary">
                  {comments}
                </a>
              </span>
              <span className="flex items-center gap-1.25">
                <Icon icon="eye" className="text-md" />
                {views}
              </span>
            </p>
          </div>

          <div className="card-footer items-center border-t-0 bg-transparent">
            <div className="flex items-center gap-2.5">
              <div>
                <img src={user.image} alt="avatar-3" className="size-6 rounded-full" />
              </div>
              <div>
                <h5>
                  <a href="" className="text-sm text-white">
                    {user.name}
                  </a>
                </h5>
              </div>
            </div>
            <a className="flex items-center gap-1.25 font-semibold text-white" href="/apps/blog/article">
              Read more
              <Icon icon="arrow-right" />
            </a>
          </div>
        </article>
      ) : (
        <article className="card">
          {image && (
            <>
              <div className="relative h-full overflow-hidden rounded-t-md">
                <div className="badge badge-label bg-dark text-white absolute start-6 top-6">{category}</div>
                <img src={image} className="h-full w-full object-cover" alt="Building APIs" />
              </div>
            </>
          )}
          <div className="card-body">
            {!image && <div className="badge badge-label bg-dark text-white mb-base">{category}</div>}
            <h6 className="card-title mb-2.5">
              <a href="/apps/blog/article" className="text-base hover:text-primary">
                {title}
              </a>
            </h6>
            <p className="text-default-400 mb-5">{description}</p>
            <div>
              {tags.map((tag, idx) => (
                <Link to="" key={idx} className="badge badge-label border border-default-300 me-1">
                  {tag}
                </Link>
              ))}
            </div>
            <p className="text-default-400 text-sm mt-base flex flex-wrap items-center gap-base">
              <span className="flex items-center gap-1.25">
                <Icon icon="calendar" className="text-md" />
                {date}
              </span>
              <span className="flex items-center gap-1.25">
                <Icon icon="message-circle" className="text-md" />
                <Link to="" className="hover:text-primary">
                  {comments}
                </Link>
              </span>
              <span className="flex items-center gap-1.25">
                <Icon icon="eye" className="text-md" />
                {views}
              </span>
            </p>
          </div>
          <div className="card-footer items-center border-t-0 bg-transparent">
            <div className="flex items-center gap-3">
              <div>
                <img src={user.image} alt="avatar-3" className="size-6 rounded-full" />
              </div>
              <div>
                <h5>
                  <Link to="" className="text-sm hover:text-primary">
                    {user.name}
                  </Link>
                </h5>
              </div>
            </div>
            <a className="text-primary flex items-center gap-1.25 font-semibold" href="/apps/blog/article">
              Read more
              <Icon icon="arrow-right" />
            </a>
          </div>
        </article>
      )}
    </>
  )
}
