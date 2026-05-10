import blogPost from '@/assets/images/blog/blog-post.jpg'
import user1 from '@/assets/images/users/user-1.jpg'
import Icon from '@/components/wrappers/Icon'

const Blog = () => {
  return (
    <>
      <div className="2xl:col-span-2">
        <h1 className="text-xl">Mastering the Art of Focus: Tools &amp; Strategies for Deep Work</h1>

        <div className="inline-flex items-cneter flex-wrap gap-base mt-5 text-sm">
          <div>
            <span className="badge badge-label bg-dark text-white">Productivity</span>
          </div>
          <span className="text-default-400 flex items-center gap-1.25">
            <Icon icon="calendar" />
            Mar 18, 2025
          </span>
          <span className="text-default-400 flex items-center gap-1.25">
            <Icon icon="message-circle" />
            <a href="" className="hover:text-primary">
              42
            </a>
          </span>
          <span className="text-default-400 flex items-center gap-1.25">
            <Icon icon="eye" />
            982
          </span>
        </div>

        <img src={blogPost} className="mt-7.5 rounded" alt="blog-img" />
        <div className="text-md mt-7.5">
          <p className="mb-4">In a world full of constant notifications and distractions, developing the ability to focus has become a superpower. This article dives into proven methods for cultivating deep work and staying productive in a digital age.</p>
          <p className="mb-4">Eliminating distractions and building a workflow that encourages uninterrupted focus can drastically improve your efficiency. Whether you&apos;re coding, writing, or designing — deep work leads to higher quality output and greater satisfaction.</p>
          <p className="mb-4">Some effective strategies include time-blocking your calendar, using tools like Pomodoro timers, and creating a distraction-free workspace. Even just 90 minutes of intentional, focused work per day can compound into massive progress over time.</p>
          <p>
            By embracing stillness and training your attention,&nbsp;
            <span className="bg-warning/10 p-0.75 dark:text-warning">you’ll uncover a new level of clarity and creativity</span> that transforms how you work and what you’re capable of achieving.
          </p>
        </div>

        <div className="bg-light/15 border-light mt-12 flex flex-wrap items-center justify-center gap-3 rounded border p-5 text-center md:mt-15 md:justify-between md:gap-0">
          <h5>Was this article helpful?</h5>
          <p>
            <b>41</b> out of <b>72</b> found this helpful
          </p>

          <div className="flex">
            <div>
              <input type="radio" name="radiotoggle" id="radioYes" className="peer hidden" />
              <label htmlFor="radioYes" className="btn btn-sm rounded-e-none bg-success/15 text-success peer-checked:bg-success peer-checked:text-white">
                <Icon icon="thumb-up" />
                Yes
              </label>
            </div>
            <div>
              <input type="radio" name="radiotoggle" id="radioNo" className="peer hidden" />
              <label htmlFor="radioNo" className="btn btn-sm rounded-s-none bg-danger/15 text-danger peer-checked:bg-danger peer-checked:text-white">
                No
                <Icon icon="thumb-down" />
              </label>
            </div>
          </div>
        </div>
        <div className="border-default-300 mt-7.5 mb-7.5 flex flex-wrap items-center gap-7.5 rounded border border-dashed p-6 md:flex-nowrap md:p-7.5">
          <div className="shrink-0 text-center">
            <div className="mb-3">
              <img src={user1} className="mx-auto size-12 rounded-full" alt="" />
            </div>
            <div className="text-center">
              <a href="" className="text-primary text-sm font-bold">
                Nathan Brooks
              </a>
              <br />
              <span className="text-default-400 mt-1.5 text-xs font-semibold">Productivity Coach</span>
            </div>
          </div>
          <div>
            <div className="text-default-400 mb-3 text-sm font-medium">Nathan is passionate about helping creators, developers, and entrepreneurs reclaim their time and do meaningful work. He writes regularly about mindful productivity and digital wellness.</div>
            <a href="" className="text-primary text-sm font-semibold">
              Author’s Profile
            </a>
          </div>
        </div>
        <div className="my-5 text-center md:my-7.5">
          <h5 className="mb-5 text-sm font-bold uppercase">Share This:</h5>
          <div className="mt-7.5 mb-2.5 flex flex-wrap items-center justify-start gap-2.5 md:justify-center">
            <a href="" className="btn btn-icon bg-primary rounded-full hover:bg-primary-hover">
              <svg className="text-lg text-white" xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M7 10v4h3v7h4v-7h3l1 -4h-4v-2a1 1 0 0 1 1 -1h3v-4h-3a5 5 0 0 0 -5 5v2h-3" />
              </svg>
            </a>
            <a href="" className="btn btn-icon bg-info rounded-full hover:bg-info-hover">
              <svg className="text-lg text-white" xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
                <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
              </svg>
            </a>
            <a href="" className="btn btn-icon bg-danger rounded-full hover:bg-danger-hover">
              <svg className="text-lg text-white" xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M4 8a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4z" />
                <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
                <path d="M16.5 7.5v.01" />
              </svg>
            </a>
            <a href="" className="btn btn-icon bg-success rounded-full hover:bg-success-hover">
              <svg className="text-lg text-white" xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                <path d="M9 3.6c5 6 7 10.5 7.5 16.2" />
                <path d="M6.4 19c3.5 -3.5 6 -6.5 14.5 -6.4" />
                <path d="M3.1 10.75c5 0 9.814 -.38 15.314 -5" />
              </svg>
            </a>
            <a href="" className="btn btn-icon bg-secondary rounded-full hover:bg-secondary-hover">
              <svg className="text-lg text-white" xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M8 11v5" />
                <path d="M8 8v.01" />
                <path d="M12 16v-5" />
                <path d="M16 16v-3a2 2 0 1 0 -4 0" />
                <path d="M3 7a4 4 0 0 1 4 -4h10a4 4 0 0 1 4 4v10a4 4 0 0 1 -4 4h-10a4 4 0 0 1 -4 -4z" />
              </svg>
            </a>
            <a href="" className="btn btn-icon bg-danger rounded-full hover:bg-danger-hover">
              <svg className="text-lg text-white" xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M2 8a4 4 0 0 1 4 -4h12a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-12a4 4 0 0 1 -4 -4v-8z" />
                <path d="M10 9l5 3l-5 3z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </>
  )
}

export default Blog
