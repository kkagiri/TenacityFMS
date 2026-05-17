import Icon from '@/components/wrappers/Icon'
import { cn } from '@/utils/helpers'
import { forumPostData } from './data'

const Blog = () => {
  return (
    <>
      <div className="lg:col-span-3">
        <div className="grid grid-cols-1">
          <div className="space-y-1.25">
            {forumPostData.map((item, idx) => (
              <div className="card" key={idx}>
                <div className="card-body">
                  <p className="text-default-400 mb-2.5 text-sm font-semibold uppercase">{item.category}</p>
                  <h4 className="mb-2.5 text-base">
                    <a href="/apps/forum/post" className="hover:text-primary">
                      {item.title}
                    </a>
                  </h4>
                  <p className="text-default-400">{item.description}</p>
                </div>
                <div className="card-footer block border-0">
                  <div className="text-default-400 flex flex-wrap justify-between items-center gap-base">
                    <div className="flex items-center gap-2.5">
                      <img src={item.author.image} alt="avatar-5" className="size-8 rounded" />
                      <div>
                        <a href="" className="text-dark font-semibold">
                          {item.author.name}
                        </a>
                        <p className="text-xs">{item.timeStamp}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.25">
                      <Icon icon="messages" className="text-default-400" />
                      <a href="" className="hover:text-primary">
                        Answers: {item.answers}
                      </a>
                    </div>
                    <div className="flex items-center gap-1.25">
                      <Icon icon="clock" className="text-default-400" />
                      <span className="font-semibold">Ends in: {item.timeLeft}</span>
                    </div>
                    <div className="flex items-center gap-1.25">
                      <Icon icon="users" className="text-default-400" />
                      <a href="" className="hover:text-primary">
                        Votes: {item.votes}
                      </a>
                    </div>
                    <div className="flex items-center gap-1.25">
                      <span className={cn('badge text-white', item.badge.className)}>{item.badge.text}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="mt-5">
              <nav className="mx-auto flex items-center justify-center gap-1.5" aria-label="Pagination">
                <button type="button" className="btn btn-icon bg-card border-default-300 hover:bg-default-50 hover:text-primary rounded-full" aria-label="Previous">
                  <span>«</span>
                </button>
                <button type="button" className="btn btn-icon bg-primary rounded-full text-white">
                  1
                </button>
                <button type="button" className="btn btn-icon bg-card hover:bg-default-50 border-default-300 hover:text-primary rounded-full">
                  2
                </button>
                <button type="button" className="btn btn-icon bg-card hover:bg-default-50 border-default-300 hover:text-primary rounded-full">
                  3
                </button>
                <button type="button" className="btn btn-icon bg-card hover:bg-default-50 border-default-300 hover:text-primary rounded-full">
                  4
                </button>
                <button type="button" className="btn btn-icon bg-card hover:bg-default-50 border-default-300 hover:text-primary rounded-full">
                  5
                </button>
                <button type="button" className="btn btn-icon bg-card border-default-300 hover:bg-default-50 hover:text-primary rounded-full" aria-label="Next">
                  <span>»</span>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Blog
