import Icon from '@/components/wrappers/Icon'
import { abbreviatedNumber } from '@/utils/helpers'
import { Card, CardBody } from 'react-bootstrap'
import { comments } from './data'
const CommentCard = () => {
  return (
    <Card>
      <CardBody>
        {comments.map((item, idx) => (
          <div className="d-flex border border-dashed rounded p-3" key={idx}>
            <div className="flex-shrink-0">
              <img src={item.avatar} alt="" className="avatar-sm rounded-circle shadow-sm" />
            </div>
            <div className="flex-grow-1 ms-2">
              <h5 className="mb-1">
                {item.name}
                <small className="text-muted">
                  {' '}
                  {item.date} · {item.time}
                </small>
              </h5>
              <p className="mb-2">{item.message}</p>
              <div className="d-flex justify-content-between mt-2 text-muted">
                <div className="d-flex gap-3">
                  <span className="d-inline-flex align-items-center gap-1">
                    <Icon icon="eye" /> {abbreviatedNumber(item.views)}
                  </span>
                  <span className="d-inline-flex align-items-center gap-1">
                    <Icon icon="heart" /> {item.likes}
                  </span>
                  <span className="d-inline-flex align-items-center gap-1">
                    <Icon icon="message-circle" /> {item.comments}
                  </span>
                </div>
                <a href="" className="link-primary fw-semibold d-inline-flex align-items-center gap-1">
                  <Icon icon="arrow-back-up" /> Reply
                </a>
              </div>

              {item.reply &&
                item.reply.map((reply, rIdx) => (
                  <div className="d-flex mt-4" key={rIdx}>
                    <div className="flex-shrink-0">
                      <img src={reply.avatar} alt="" className="avatar-sm rounded-circle shadow-sm" />
                    </div>
                    <div className="flex-grow-1 ms-2">
                      <h5 className="mb-1">
                        {reply.name}
                        <small className="text-muted">
                          {' '}
                          {reply.date} · {reply.time}
                        </small>
                      </h5>
                      <p className="mb-2">{reply.message}</p>
                      <div className="d-flex justify-content-between text-muted">
                        <div className="d-flex gap-3">
                          <span className="d-inline-flex align-items-center gap-1">
                            <Icon icon="eye" /> {abbreviatedNumber(reply.views)}
                          </span>
                          <span className="d-inline-flex align-items-center gap-1">
                            <Icon icon="heart" /> {reply.likes}
                          </span>
                          <span className="d-inline-flex align-items-center gap-1">
                            <Icon icon="message-circle" /> {reply.comments}
                          </span>
                        </div>
                        <a href="" className="link-primary fw-semibold d-inline-flex align-items-center gap-1">
                          <Icon icon="arrow-back-up" /> Reply
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  )
}
export default CommentCard
