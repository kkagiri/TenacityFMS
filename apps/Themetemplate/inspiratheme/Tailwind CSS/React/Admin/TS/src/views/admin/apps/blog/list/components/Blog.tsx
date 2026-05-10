import Icon from '@/components/wrappers/Icon'
import { cn } from '@/utils/helpers'
import { blogData } from './data'

const Blog = () => {
  return (
    <>
      <div className="space-y-5 xl:col-span-2">
        {blogData.map((item, idx) => (
          <article className="card border border-light" key={idx}>
            <div className="grid grid-cols-1 md:grid-cols-3">
              <div>
                <div className="relative h-full overflow-hidden rounded-s-md">
                  <div className={cn('badge badge-label text-white m-5 absolute start-0 top-0', item.category.className)}>{item.category.label}</div>
                  <img src={item.image} className="h-full w-full object-cover" alt="Building APIs" />
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="card-body">
                  <h6 className="card-title mb-2.5">
                    <a href="/apps/blog/article" className="text-base hover:text-primary">
                      {item.title}
                    </a>
                  </h6>
                  <p className="text-default-400 mb-5">{item.description}</p>
                  <div className="flex gap-1">
                    {item.tags.map((tag, idx) => (
                      <a href="" className="badge badge-label border border-default-300" key={idx}>
                        {tag}
                      </a>
                    ))}
                  </div>
                  <p className="text-default-400 mt-5 flex flex-wrap items-center gap-base text-sm">
                    <span className="flex items-center gap-1.25">
                      <Icon icon="calendar" className="text-md" />
                      {item.date}
                    </span>
                    <span className="flex items-center gap-1.25">
                      <Icon icon="message-circle" className="text-md" />
                      <a href="" className="hover:text-primary">
                        {item.comments}
                      </a>
                    </span>
                    <span className="flex items-center gap-1.25">
                      <Icon icon="eye" className="text-md" />
                      {item.views}
                    </span>
                  </p>
                </div>

                <div className="card-footer border-top items-center bg-transparent">
                  <div className="flex items-center gap-2.5">
                    <img src={item.author.image} alt="avatar-3" className="size-6 rounded-full" />
                    <div>
                      <h5 className="font-bold">
                        <a href="" className="hover:text-primary">
                          {item.author.name}
                        </a>
                      </h5>
                    </div>
                  </div>
                  <a className="text-primary flex items-center gap-1.25 font-semibold" href="/apps/blog/article">
                    Read more
                    <Icon icon="arrow-right" />
                  </a>
                </div>
              </div>
            </div>
          </article>
        ))}

        <div className="mt-7.5">
          <nav className="mx-auto flex items-center justify-center gap-1.5" aria-label="Pagination">
            <button type="button" className="btn btn-icon size-8.5 rounded-full border-default-300 hover:bg-default-100" aria-label="Previous">
              <Icon icon="chevron-left" />
            </button>
            <button type="button" className="btn btn-icon size-8.5 rounded-full bg-primary text-white" aria-current="page">
              1
            </button>
            <button type="button" className="btn btn-icon size-8.5 rounded-full border-default-300 hover:bg-default-100">
              2
            </button>
            <button type="button" className="btn btn-icon size-8.5 rounded-full border-default-300 hover:bg-default-100">
              3
            </button>
            <button type="button" className="btn btn-icon size-8.5 rounded-full border-default-300 hover:bg-default-100">
              ..
            </button>
            <button type="button" className="btn btn-icon size-8.5 rounded-full border-default-300 hover:bg-default-100">
              5
            </button>
            <button type="button" className="btn btn-icon size-8.5 rounded-full border-default-300 hover:bg-default-100">
              6
            </button>
            <button type="button" className="btn btn-icon size-8.5 rounded-full border-default-300 hover:bg-default-100" aria-label="Next">
              <Icon icon="chevron-right" />
            </button>
          </nav>
        </div>
      </div>
    </>
  )
}

export default Blog
