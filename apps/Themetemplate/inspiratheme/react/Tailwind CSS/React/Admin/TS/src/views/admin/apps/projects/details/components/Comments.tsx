import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'
import { commentData } from './data'

const Comments = () => {
  return (
    <>
      <div className="mb-5">
        <div className="mb-5">
          <textarea className="form-textarea" id="form-control-textarea" rows={4} placeholder="Enter your messages..."></textarea>
        </div>

        <div className="text-end">
          <button type="button" className="btn btn-sm bg-secondary text-white hover:bg-secondary-hover">
            Comment
            <Icon icon="send-2" />
          </button>
        </div>
      </div>

      <h4 className="text-md mb-base">Comments (15)</h4>
      {commentData.map((comment, idx) => (
        <div className="border-default-300 mb-2.5 rounded border border-dashed p-5" key={idx}>
          <div className="flex gap-2.5">
            <div className="shrink-0">
              <img src={comment.user.image} alt="" className="size-8 rounded-full" />
            </div>

            <div>
              <div>
                <h5 className="mb-1.25">
                  {comment.user.name}&nbsp;
                  <small className="text-default-400">
                    {comment.date} · {comment.time}
                  </small>
                </h5>
                <p className="mb-2.5">{comment.message}</p>

                <Link to="" className="badge bg-light text-default-400">
                  <Icon icon="corner-up-left" className="text-base" />
                  Reply
                </Link>
              </div>
              {comment.reply &&
                comment.reply.map((reply, idx) => (
                  <div className="mt-7.5 flex gap-2.5" key={idx}>
                    <div className="shrink-0">
                      <img src={reply.user.image} alt="" className="size-8 rounded-full" />
                    </div>

                    <div>
                      <h5 className="mb-1.25">
                        {reply.user.name}&nbsp;
                        <small className="text-default-400">
                          {reply.date} · {reply.time}
                        </small>
                      </h5>
                      <p className="mb-3">{reply.message}</p>

                      <Link to="" className="badge bg-light text-default-400">
                        <Icon icon="corner-up-left" className="text-base" />
                        Reply
                      </Link>
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

        <button type="button" className="btn btn-icon bg-primary rounded-full text-white">
          1
        </button>

        <button type="button" className="btn btn-icon border-default-300 hover:bg-default-100 hover:text-primary rounded-full border transition-all duration-300">
          2
        </button>

        <button type="button" className="btn btn-icon border-default-300 hover:bg-default-100 hover:text-primary rounded-full border transition-all duration-300">
          3
        </button>

        <button type="button" className="btn btn-icon border-default-300 hover:bg-default-100 hover:text-primary rounded-full border transition-all duration-300">
          ...
        </button>

        <button type="button" className="btn btn-icon border-default-300 hover:bg-default-100 hover:text-primary rounded-full border transition-all duration-300">
          5
        </button>

        <button type="button" className="btn btn-icon border-default-300 hover:bg-default-100 hover:text-primary gap-x-1.5 rounded-full border transition-all duration-300" aria-label="Next">
          <Icon icon="chevron-right" />
        </button>
      </nav>
    </>
  )
}

export default Comments
