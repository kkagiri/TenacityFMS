import gallery10 from '@/assets/images/gallery/10.jpg'
import gallery2 from '@/assets/images/gallery/2.jpg'
import gallery3 from '@/assets/images/gallery/3.jpg'
import user1 from '@/assets/images/users/user-1.jpg'
import user10 from '@/assets/images/users/user-10.jpg'
import user2 from '@/assets/images/users/user-2.jpg'
import user3 from '@/assets/images/users/user-3.jpg'
import user4 from '@/assets/images/users/user-4.jpg'
import user6 from '@/assets/images/users/user-6.jpg'
import Icon from '@/components/wrappers/Icon'
import { META_DATA } from '@/config/constants'
import clsx from 'clsx'
import { Fragment, useState } from 'react'
import { Button, Card, CardBody, Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, FormCheck, Row } from 'react-bootstrap'
import { Link } from 'react-router'
import { commentData } from './data'
const PostCard = () => {
  return (
    <Card>
      <CardBody>
        <h5 className="mb-2">What&apos;s on your mind?</h5>

        <form action="#">
          <textarea rows={3} className="form-control" placeholder="Share your thoughts..."></textarea>

          <div className="d-flex pt-2 justify-content-between align-items-center">
            <div className="d-flex gap-1">
              <Button variant="light" size="sm" className="btn-icon" title="Tag People">
                <Icon icon="user" className="fs-md" />
              </Button>
              <Button variant="light" size="sm" className="btn-icon" title="Add Location">
                <Icon icon="map-pin" className="fs-md" />
              </Button>
              <Button variant="light" size="sm" className="btn-icon" title="Upload Photo">
                <Icon icon="camera" className="fs-md" />
              </Button>
              <Button variant="light" size="sm" className="btn-icon" title="Add Emoji">
                <Icon icon="mood-smile" className="fs-md" />
              </Button>
            </div>

            <button type="submit" className="btn btn-dark btn-sm">
              Post
            </button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}
const CommonPostCard = ({ name, time, children, image, description }) => {
  const [liked, setLiked] = useState(false)
  return (
    <Card>
      <CardBody className="pb-2">
        <div className="d-flex align-items-center mb-2">
          <img height={32} width={32} className="me-2 avatar-md rounded-circle" src={image} alt="Generic placeholder image" />
          <div className="w-100">
            <h5 className="m-0">
              <Link to="/apps/users/profile" className="link-reset">
                {name}
              </Link>
            </h5>
            <p className="text-muted mb-0">
              <small>{time}</small>
            </p>
          </div>
          <Dropdown className="ms-auto">
            <DropdownToggle className="bg-transparent border-0 text-muted drop-arrow-none card-drop p-0">
              <Icon icon="dots-vertical" className="fs-lg" />
            </DropdownToggle>
            <DropdownMenu align="end" className="dropdown-menu-end">
              <DropdownItem href="">
                <Icon icon="edit" className="me-2" />
                Edit Post
              </DropdownItem>
              <DropdownItem href="">
                <Icon icon="trash" className="me-2" />
                Delete Post
              </DropdownItem>
              <DropdownItem href="">
                <Icon icon="share" className="me-2" />
                Share
              </DropdownItem>
              <DropdownItem href="">
                <Icon icon="pin" className="me-2" />
                Pin to Top
              </DropdownItem>
              <DropdownItem href="">
                <Icon icon="flag" className="me-2" />
                Report Post
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
        {description && <p>{description}</p>}
        {children}

        <div className="mt-2">
          <Link to="" className="btn btn-sm fs-sm btn-link text-muted">
            <Icon icon="corner-up-left" className="me-1" /> Reply
          </Link>
          <span className="btn btn-sm fs-sm btn-link text-muted" onClick={() => setLiked(!liked)}>
            {liked ? (
              <>
                <Icon icon="heart-filled" className="text-danger me-1" /> Liked!
              </>
            ) : (
              <>
                <Icon icon="heart" className="text-muted me-1" /> Likes (45)
              </>
            )}
          </span>
          <Link to="" className="btn btn-sm fs-sm btn-link text-muted">
            <Icon icon="share" className="me-1" /> Share
          </Link>
        </div>
      </CardBody>
    </Card>
  )
}
const Post1 = () => {
  return (
    <CommonPostCard
      image={user10}
      name="Sophia Martinez"
      time="about 5 minutes ago"
      description=" Story inspired by the beauty of changing seasons — a nature-themed
            animation coming soon!"
    >
      <Row className="g-1">
        <Col md={6}>
          <img
            src={gallery10}
            className="img-fluid w-100 h-100 rounded"
            style={{
              aspectRatio: '3/4',
              objectFit: 'cover',
            }}
            alt="Tall Image"
          />
        </Col>

        <Col md={6} className="d-flex flex-column gap-1">
          <img
            src={gallery2}
            className="img-fluid w-100 rounded"
            style={{
              aspectRatio: '4/3',
              objectFit: 'cover',
            }}
            alt="Top Right"
          />
          <img
            src={gallery3}
            className="img-fluid w-100 rounded"
            style={{
              aspectRatio: '4/3',
              objectFit: 'cover',
            }}
            alt="Bottom Right"
          />
        </Col>
      </Row>
    </CommonPostCard>
  )
}
const Post2 = () => {
  return (
    <CommonPostCard image={user4} name="Liam Anderson" time="about 30 minutes ago">
      <div className="fs-16 text-center mt-3 mb-4 fst-italic">
        <Icon icon="quote" className="fs-20" />
        Spent the weekend exploring the local trails! Captured some amazing nature shots and can’t wait to post them soon. 🌿📸
      </div>
      <div className="bg-light-subtle mx-n3 p-3 border-top border-bottom border-dashed">
        {commentData.map((comment, idx) => (
          <div
            className={clsx('d-flex align-items-start', {
              'mb-2': commentData.length > 1,
            })}
            key={idx}
          >
            <img className="me-2 avatar-sm rounded-circle" src={comment.image} alt="Generic placeholder image" />
            <div className="w-100">
              <h5 className="mt-0 mb-1">
                <Link to="/apps/users/profile" className="link-reset">
                  {comment.name}
                </Link>{' '}
                <small className="text-muted fw-normal float-end">{comment.time}</small>
              </h5>
              {comment.message}
              <br />
              {comment.reply && (
                <>
                  <Link to="" className="text-muted font-13 d-inline-block mt-2">
                    <Icon icon="corner-up-left" /> Reply
                  </Link>
                  {comment.reply.map((reply, idx) => (
                    <Fragment key={idx}>
                      <div className="d-flex align-items-start mt-3">
                        <Link className="pe-2" to="">
                          <img src={reply.image} className="avatar-sm rounded-circle" alt="Generic placeholder image" />
                        </Link>
                        <div className="w-100">
                          <h5 className="mt-0 mb-1">
                            <Link to="/apps/users/profile" className="link-reset">
                              {reply.name}
                            </Link>{' '}
                            <small className="text-muted fw-normal float-end">{reply.time}</small>
                          </h5>
                          {reply.message}
                        </div>
                      </div>
                    </Fragment>
                  ))}
                </>
              )}
            </div>
          </div>
        ))}

        <div className="d-flex align-items-start mt-3">
          <Link className="pe-2" to="">
            <img src={user3} className="rounded-circle" alt="Generic placeholder image" height="31" />
          </Link>
          <div className="w-100">
            <input type="text" id="simpleinput" className="form-control form-control-sm" placeholder="Add a comment..." />
          </div>
        </div>
      </div>
    </CommonPostCard>
  )
}
const Post3 = () => {
  return (
    <CommonPostCard image={user2} name="Anika Roy" time="Posted 2 hours ago">
      <h5 className="mb-2">
        🌿 Save the Date:
        <strong>Nature Photography Workshop 2025</strong>
      </h5>
      <p className="text-muted mb-2">Join fellow creatives and outdoor enthusiasts for an inspiring weekend of nature photography tips, live field sessions, and community networking.</p>
      <ul className="list-unstyled mb-3">
        <li className="pb-2">
          <strong>Date: </strong>
          Saturday, 14th September 2025
        </li>
        <li className="pb-2">
          <strong>Time: </strong>
          10:00 AM – 4:00 PM
        </li>
        <li>
          <strong>Location: </strong>
          Green Valley National Park (Meeting point to be shared)
        </li>
      </ul>

      <div className="d-flex gap-2">
        <Button size="sm" className=" btn-outline-primary">
          <Icon icon="bell" className="me-1"></Icon>
          Interested
        </Button>
        <Button size="sm" className="btn-primary">
          <Icon icon="user-plus" className="me-1"></Icon>
          Join Now
        </Button>
      </div>
    </CommonPostCard>
  )
}
const Post4 = () => {
  return (
    <CommonPostCard image={user1} name={META_DATA.username} time="Posted 2 hours ago" description="Sharing a couple of timelapses from my recent Iceland trip. Let me know which one you like most!">
      <Row className="g-2">
        <Col md={6}>
          <div className="ratio ratio-16x9 rounded overflow-hidden">
            <iframe src="https://player.vimeo.com/video/1084537" allowFullScreen></iframe>
          </div>
        </Col>
        <Col md={6}>
          <div className="ratio ratio-16x9 rounded overflow-hidden">
            <iframe src="https://player.vimeo.com/video/76979871" allowFullScreen></iframe>
          </div>
        </Col>
      </Row>
    </CommonPostCard>
  )
}
const Post5 = () => {
  return (
    <CommonPostCard image={user6} name="David Kim" time="Posted 1 hour ago">
      <h5 className="mb-3">🔥 Quick Poll: What’s your go-to front-end framework in 2025?</h5>
      <p className="text-muted">We’re gathering developer preferences for our next project. Cast your vote below! 💻</p>
      <form>
        <FormCheck type="radio" className="mb-1" name="framework_poll" id="optionReact" label="React (Meta)" />
        <FormCheck type="radio" className="mb-1" name="framework_poll" id="optionVue" label="Vue.js (Evan You)" />
        <FormCheck type="radio" className="mb-1" name="framework_poll" id="optionAngular" label="Angular (Google)" />
        <FormCheck type="radio" className="mb-3" name="framework_poll" id="optionSvelte" label="Svelte (Rich Harris)" />

        <Button variant="primary" size="sm" type="submit">
          Submit Vote
        </Button>
      </form>
    </CommonPostCard>
  )
}
const AchievementPost = () => {
  return (
    <Card>
      <CardBody className="text-center">
        <h1 className="mb-2">🏆</h1>
        <h4 className="mb-1 fw-semibold">Congratulations, {META_DATA.username}! 🎉</h4>

        <p className="text-muted fst-italic mb-3">
          Congratulations! You’ve reached <strong>5,000 subscribers </strong>! Your community is growing fast!
        </p>

        <div className="d-flex justify-content-center mb-3">
          <div className="me-4 text-center">
            <h6 className="mb-0">Posts</h6>
            <span className="fw-bold">250</span>
          </div>
          <div className="me-4 text-center">
            <h6 className="mb-0">Likes</h6>
            <span className="fw-bold">15,200</span>
          </div>
          <div className="text-center">
            <h6 className="mb-0">Subscribers</h6>
            <span className="fw-bold">5,000</span>
          </div>
        </div>

        <button className="btn btn-sm btn-outline-success me-2">
          <Icon icon="share" className="me-1" /> Share Achievement
        </button>
        <Link to="/apps/users/profile" className="btn btn-sm btn-primary">
          <Icon icon="user" className="me-1" /> View Profile
        </Link>
      </CardBody>
    </Card>
  )
}
const Feeds = () => {
  return (
    <>
      <PostCard />

      <AchievementPost />

      <Post1 />

      <Post2 />

      <Post3 />

      <Post4 />

      <Post5 />

      <div className="d-flex align-items-center justify-content-center gap-2 p-3 mb-3">
        <strong>Loading...</strong>
        <div className="spinner-border spinner-border-sm text-danger" role="status" aria-hidden="true"></div>
      </div>
    </>
  )
}
export default Feeds
