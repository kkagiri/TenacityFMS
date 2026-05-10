import Icon from '@/components/wrappers/Icon'
import { Button } from 'react-bootstrap'
import { Link } from 'react-router'
import { commentData } from './data'
const Comments = () => {
  return (
    <>
      <form action="#" className="mb-3">
        <div className="mb-3">
          <textarea className="form-control" id="form-control-textarea" rows={4} placeholder="Enter your messages..."></textarea>
        </div>
        <div className="text-end">
          <Button variant="secondary" type="submit" size="sm">
            Comment <Icon icon="send-2" className="align-baseline ms-1" />
          </Button>
        </div>
      </form>

      <h4 className="mb-3 fs-md">Comments (15)</h4>

      {commentData.map((comment, idx) => (
        <div key={idx} className={`d-flex ${idx === commentData.length - 1 ? 'mb-3' : 'mb-2'} border border-dashed rounded p-3`}>
          <div className="flex-shrink-0">
            <img src={comment.user.image} alt="" className="avatar-sm rounded-circle shadow-sm" />
          </div>
          <div className="flex-grow-1 ms-2">
            <h5 className="mb-1">
              {comment.user.name}{' '}
              <small className="text-muted">
                {comment.date} · {comment.time}
              </small>
            </h5>
            <p className="mb-2">{comment.message}</p>
            <Link to="" className="badge bg-light text-muted d-inline-flex align-items-center gap-1">
              <Icon icon="corner-up-left" className="fs-lg" /> Reply
            </Link>
            {comment.reply &&
              comment.reply.map((reply, idx) => (
                <div className="d-flex mt-4" key={idx}>
                  <div className="flex-shrink-0">
                    <img src={reply.user.image} alt="" className="avatar-sm rounded-circle shadow-sm" />
                  </div>
                  <div className="flex-grow-1 ms-2">
                    <h5 className="mb-1">
                      {reply.user.name}{' '}
                      <small className="text-muted">
                        {reply.date} · {reply.time}
                      </small>
                    </h5>
                    <p className="mb-2">{reply.message}</p>
                    <Link to="" className="badge bg-light text-muted d-inline-flex align-items-center gap-1">
                      <Icon icon="corner-up-left" className="fs-lg" /> Reply
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}

      <ul className="pagination pagination-rounded pagination-boxed justify-content-center mb-0">
        <li className="page-item previous disabled">
          <Link className="page-link" to="">
            <Icon icon="chevron-left"></Icon>
          </Link>
        </li>
        <li className="page-item active">
          <Link className="page-link" to="">
            1
          </Link>
        </li>
        <li className="page-item">
          <Link className="page-link" to="">
            2
          </Link>
        </li>
        <li className="page-item">
          <Link className="page-link" to="">
            3
          </Link>
        </li>
        <li className="page-item">
          <Link className="page-link" to="">
            ...
          </Link>
        </li>
        <li className="page-item">
          <Link className="page-link" to="">
            5
          </Link>
        </li>
        <li className="page-item">
          <Link className="page-link" to="">
            6
          </Link>
        </li>
        <li className="page-item next">
          <Link className="page-link" to="">
            <Icon icon="chevron-right"></Icon>
          </Link>
        </li>
      </ul>
    </>
  )
}
export default Comments
