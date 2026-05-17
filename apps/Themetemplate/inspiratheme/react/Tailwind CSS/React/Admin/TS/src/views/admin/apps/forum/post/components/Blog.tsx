import user5 from '@/assets/images/users/user-5.jpg'
import Icon from '@/components/wrappers/Icon'
import { cn } from '@/utils/helpers'
import { commentData } from './data'

const Blog = () => {
  return (
    <>
      <div className="lg:col-span-3">
        <div className="card">
          <div className="card-body">
            <p className="text-default-400 my-2.5 text-center font-semibold uppercase">#Development Talk</p>
            <h4 className="mb-5 text-center text-xl">What&apos;s the best JavaScript framework in {new Date().getFullYear()} ? </h4>
            <p className="mb-4">
              With the ever-evolving front-end landscape, JavaScript frameworks are at the heart of most web development stacks. In 2025, options like React, Vue 3, Angular, Svelte, SolidJS, and even newer players continue to battle for dominance in terms of performance,
              developer experience, ecosystem, and community support.
            </p>
            <p className="mb-4">
              React remains a popular choice due to its strong community, wide adoption, and extensive tooling, while Vue 3 continues to grow thanks to its approachable syntax and composition API. On the other hand, Svelte and SolidJS are gaining attention for their compile-time
              optimization and ultra-fast runtime performance.
            </p>
            <p>We&apos;d love to hear your experience: Which framework do you use and why? Are you prioritizing performance, learning curve, community support, or integration capabilities? Share your insights, real-world comparisons, and predictions for the future!</p>
            <div className="mt-7.5 flex flex-wrap justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <img src={user5} alt="avatar-5" className="size-8 rounded" />
                <div>
                  <a href="" className="hover:text-primary block font-semibold">
                    James Milton
                  </a>
                  <span className="text-default-400 text-2xs">1 hour ago</span>
                </div>
              </div>
              <span className="text-default-400 flex items-center gap-1.25">
                <Icon icon="messages" />
                Answers: 45
              </span>
              <span className="text-default-400 flex items-center gap-1.25">
                <Icon icon="clock" />
                Ends in: 3 days
              </span>
              <span className="text-default-400 flex items-center gap-1.25">
                <Icon icon="users" />
                Votes: 732
              </span>
            </div>
            <div className="border-b border-dashed border-default-300 my-5" />
            <div className="mb-5">
              <div className="mb-5">
                <textarea className="form-textarea bg-light/20" id="form-control-textarea" rows={4} placeholder="Enter your messages..." />
              </div>
              <div className="text-end">
                <button type="submit" className="btn bg-secondary text-white hover:bg-secondary-hover">
                  Submit
                  <Icon icon="send-2" className="text-white" />
                </button>
              </div>
            </div>
            <h4 className="mb-2 text-lg">Replies(15)</h4>
            <div className="border-default-300 my-5 border-b border-dashed" />
            {commentData.map((comment, idx) => (
              <div key={idx} className={cn('border-default-300 rounded border border-dashed p-5', idx === commentData.length - 1 ? 'mb-5' : 'mb-2.5')}>
                <div className="flex gap-2.5">
                  <div className="shrink-0">
                    <img src={comment.user.image} alt={comment.user.name} className="size-8 rounded-full" />
                  </div>
                  <div>
                    <h5 className="mb-1.25">
                      {comment.user.name}&nbsp;
                      <small className="text-default-400">
                        {comment.date} · {comment.time}
                      </small>
                    </h5>
                    <p className="mb-2.5">{comment.message}</p>
                    <a href="" className="badge py-1 px-1.5 bg-light text-default-400">
                      <Icon icon="corner-up-left" className="text-base" /> Reply
                    </a>
                    {comment.reply?.map((reply, rIdx) => (
                      <div key={rIdx} className="mt-7.5 flex gap-2.5">
                        <img src={reply.user.image} alt={reply.user.name} className="size-8 rounded-full" />
                        <div>
                          <h5 className="mb-1.25">
                            {reply.user.name}&nbsp;
                            <small className="text-default-400">
                              {reply.date} · {reply.time}
                            </small>
                          </h5>
                          <p className="mb-2.5">{reply.message}</p>
                          <a href="" className="badge py-1 px-1.5 bg-light text-default-400">
                            <Icon icon="corner-up-left" className="text-base" /> Reply
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <nav className="flex items-center justify-center gap-1.5" aria-label="Pagination">
              <button type="button" className="btn btn-icon border-default-300 hover:bg-default-100 hover:text-primary gap-x-1.5 rounded-full border transition-all duration-300" aria-label="Previous">
                <Icon icon="chevron-left" />
              </button>
              <button type="button" className="btn btn-icon border-default-300 hover:bg-default-100 hover:text-primary rounded-full border transition-all duration-300">
                1
              </button>
              <button type="button" className="btn btn-icon bg-primary rounded-full text-white">
                2
              </button>
              <button type="button" className="btn btn-icon border-default-300 hover:bg-default-100 hover:text-primary rounded-full border transition-all duration-300">
                3
              </button>
              <button type="button" className="btn btn-icon border-default-300 hover:bg-default-100 hover:text-primary rounded-full border transition-all duration-300">
                4
              </button>
              <button type="button" className="btn btn-icon border-default-300 hover:bg-default-100 hover:text-primary rounded-full border transition-all duration-300">
                5
              </button>
              <button type="button" className="btn btn-icon border-default-300 hover:bg-default-100 hover:text-primary gap-x-1.5 rounded-full border transition-all duration-300" aria-label="Next">
                <Icon icon="chevron-right" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    </>
  )
}

export default Blog
