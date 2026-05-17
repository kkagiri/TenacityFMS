import blogpost from '@/assets/images/blog/blog-post.jpg'
import user1 from '@/assets/images/users/user-1.jpg'
import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'
import { ReactNode } from 'react'
import { Col } from 'react-bootstrap'

type SocialItem = {
  title: string
  colorClass: string
  SvgIcon: ReactNode
}

const socialLinks: SocialItem[] = [
  {
    title: 'Facebook',
    colorClass: 'btn-primary',
    SvgIcon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-brand-facebook">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M7 10v4h3v7h4v-7h3l1 -4h-4v-2a1 1 0 0 1 1 -1h3v-4h-3a5 5 0 0 0 -5 5v2h-3" />
      </svg>
    ),
  },
  {
    title: 'Twitter-x',
    colorClass: 'btn-info',
    SvgIcon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-brand-x">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
        <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
      </svg>
    ),
  },
  {
    title: 'Instagram',
    colorClass: 'btn-danger',
    SvgIcon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-brand-instagram">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M4 8a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4z" />
        <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
        <path d="M16.5 7.5v.01" />
      </svg>
    ),
  },
  {
    title: 'Dribbble',
    colorClass: 'btn-success',
    SvgIcon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-brand-dribbble">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
        <path d="M9 3.6c5 6 7 10.5 7.5 16.2" />
        <path d="M6.4 19c3.5 -3.5 6 -6.5 14.5 -6.4" />
        <path d="M3.1 10.75c5 0 9.814 -.38 15.314 -5" />
      </svg>
    ),
  },
  {
    title: 'LinkedIn',
    colorClass: 'btn-secondary',
    SvgIcon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-brand-linkedin">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M8 11v5" />
        <path d="M8 8v.01" />
        <path d="M12 16v-5" />
        <path d="M16 16v-3a2 2 0 1 0 -4 0" />
        <path d="M3 7a4 4 0 0 1 4 -4h10a4 4 0 0 1 4 4v10a4 4 0 0 1 -4 4h-10a4 4 0 0 1 -4 -4z" />
      </svg>
    ),
  },
  {
    title: 'YouTube',
    colorClass: 'btn-danger',
    SvgIcon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-brand-youtube">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M2 8a4 4 0 0 1 4 -4h12a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-12a4 4 0 0 1 -4 -4v-8z" />
        <path d="M10 9l5 3l-5 3z" />
      </svg>
    ),
  },
]

const Articles = () => {
  return (
    <Col lg={8}>
      <h1 className="h3 mb-0">Mastering the Art of Focus: Tools & Strategies for Deep Work</h1>
      <p className="d-flex flex-wrap gap-3 text-muted mb-0 mt-3 align-items-center fs-base">
        <span className="badge text-bg-dark badge-label">Productivity</span>
        <span className="d-flex align-items-center gap-1">
          <Icon icon="calendar" className="fs-md" /> Mar 18, 2025
        </span>
        <span className="d-flex align-items-center gap-1">
          <Icon icon="message-circle" className="fs-md" />
          <Link to="" className="link-reset">
            42
          </Link>
        </span>
        <span className="d-flex align-items-center gap-1">
          <Icon icon="eye" className="fs-md" /> 982
        </span>
      </p>

      <img src={blogpost} className="img-fluid rounded mt-4" alt="blog-img" />

      <div className="fs-md">
        <p className="mt-4">In a world full of constant notifications and distractions, developing the ability to focus has become a superpower. This article dives into proven methods for cultivating deep work and staying productive in a digital age.</p>
        <p>Eliminating distractions and building a workflow that encourages uninterrupted focus can drastically improve your efficiency. Whether you&apos;re coding, writing, or designing — deep work leads to higher quality output and greater satisfaction.</p>
        <p>Some effective strategies include time-blocking your calendar, using tools like Pomodoro timers, and creating a distraction-free workspace. Even just 90 minutes of intentional, focused work per day can compound into massive progress over time.</p>
        <p className="mb-0">
          By embracing stillness and training your attention, <mark>you&apos;ll uncover a new level of clarity and creativity</mark> that transforms how you work and what you&apos;re capable of achieving.
        </p>
      </div>

      <div className="bg-light-subtle border border-light rounded d-md-flex justify-content-between align-items-center text-center p-3 mt-5">
        <h5 className="mb-0">Was this article helpful?</h5>
        <p className="py-3 p-md-0 mb-0">
          <b>41</b> out of <b>72</b> found this helpful
        </p>

        <div className="btn-group" role="group" aria-label="Basic radio toggle button group">
          <input type="radio" className="btn-check" name="btnradio" id="btnradio1" />
          <label className="btn btn-soft-success btn-sm mb-0" htmlFor="btnradio1">
            <Icon icon="thumb-up" className="me-1" /> Yes
          </label>

          <input type="radio" className="btn-check" name="btnradio" id="btnradio2" />
          <label className="btn btn-soft-danger btn-sm mb-0" htmlFor="btnradio2">
            No <Icon icon="thumb-down" className="ms-1" />
          </label>
        </div>
      </div>

      <div className="d-flex align-items-center gap-4 border mt-4 border-dashed p-4 rounded mb-14">
        <div className="text-center flex-shrink-0 me-7 me-lg-13">
          <div className="mb-2">
            <img src={user1} className="avatar-xl rounded-circle" alt="" />
          </div>
          <div className="mb-0">
            <Link to="" className="fw-bold fs-sm">
              Nathan Brooks
            </Link>
            <span className="text-muted fs-6 fw-semibold d-block mt-1">Productivity Coach</span>
          </div>
        </div>
        <div className="mb-0">
          <div className="text-muted fw-medium lh-base mb-2">Nathan is passionate about helping creators, developers, and entrepreneurs reclaim their time and do meaningful work. He writes regularly about mindful productivity and digital wellness.</div>

          <Link to="" className="fw-semibold link-primary">
            Author&apos;s Profile
          </Link>
        </div>
      </div>

      <div className="my-4 text-center">
        <h5 className="mb-3 text-uppercase fw-bold">Share This:</h5>

        <div className="d-flex justify-content-center gap-2 mt-4 mb-2">
          {socialLinks.map((item, index) => (
            <Link key={index} to="" className={`btn btn-icon rounded-circle ${item.colorClass}`} title={item.title}>
              {item.SvgIcon}
            </Link>
          ))}
        </div>
      </div>
    </Col>
  )
}

export default Articles
