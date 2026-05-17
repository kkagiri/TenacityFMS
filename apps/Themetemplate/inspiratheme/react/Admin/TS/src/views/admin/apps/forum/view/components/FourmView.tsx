import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'
import { Card, CardBody, CardFooter } from 'react-bootstrap'
import { forumPostData, ForumPostType } from './data'

const FourmView = () => {
  return (
    <>
      {forumPostData.map((post: ForumPostType, index: number) => (
        <Card key={index} className={index === forumPostData.length - 1 ? '' : 'mb-1'}>
          <CardBody>
            <div className="d-flex gap-4 align-items-center">
              <div className="flex-grow-1">
                <p className="text-muted text-uppercase mb-2 fw-semibold">{post.category}</p>
                <h4 className="fs-lg mb-2">
                  <Link to="/apps/forum/post" className="link-reset">
                    {post.title}
                  </Link>
                </h4>
                <p className="text-muted mb-0">{post.description}</p>
              </div>
            </div>
          </CardBody>

          <CardFooter>
            <p className="d-flex flex-wrap gap-3 text-muted mb-0 align-items-center justify-content-between fs-sm">
              <span className="d-flex align-items-center gap-2">
                <img src={post.author.image} alt="avatar" className="img-fluid avatar-sm rounded" />
                <span>
                  <Link to="" className="link-dark fw-semibold lh-sm d-block">
                    {post.author.name}
                  </Link>
                  <span className="text-muted small">{post.timeStamp}</span>
                </span>
              </span>
              <span className="d-flex align-items-center gap-1">
                <Icon icon="messages" />
                <Link to="" className="link-reset">
                  Answers: {post.answers}
                </Link>
              </span>
              <span className="d-flex align-items-center gap-1">
                <Icon icon="clock" />
                Ends in: {post.timeLeft}
              </span>
              <span className="d-flex align-items-center gap-1">
                <Icon icon="users" />
                Votes: {post.votes.toLocaleString()}
              </span>
              <span className="d-flex align-items-center gap-1">
                <span className={`badge ${post.badge.className}`}>{post.badge.text}</span>
              </span>
            </p>
          </CardFooter>
        </Card>
      ))}
    </>
  )
}

export default FourmView
