import gallery10 from '@/assets/images/gallery/10.jpg'
import gallery2 from '@/assets/images/gallery/2.jpg'
import gallery3 from '@/assets/images/gallery/3.jpg'
import user10 from '@/assets/images/users/user-10.jpg'
import user2 from '@/assets/images/users/user-2.jpg'
import user3 from '@/assets/images/users/user-3.jpg'
import user4 from '@/assets/images/users/user-4.jpg'
import user6 from '@/assets/images/users/user-6.jpg'
import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'
import { type ReactNode } from 'react'
import { commentData } from './data'

export type FeedCardType = {
  image: string
  name: string
  time: string
  description?: string
  children?: ReactNode
}

const PostCard = () => {
  return (
    <div className="card">
      <div className="card-header lg:hidden">
        <button className="btn btn-sm btn-icon border-default-300" aria-haspopup="dialog" aria-expanded="false" aria-controls="outlookSidebaroffcanvas" aria-label="Toggle navigation" data-hs-overlay="#outlookSidebaroffcanvas">
          <Icon icon="menu-4" className="text-default-600 size-6"></Icon>
        </button>
      </div>

      <div className="card-body">
        <h5 className="mb-2.5">What&apos;s on your mind?</h5>

        <textarea rows={3} className="form-textarea" placeholder="Share your thoughts..."></textarea>

        <div className="flex justify-between pt-2.5">
          <div className="flex gap-1.25">
            <Link to="" className="btn btn-sm btn-icon bg-light hover:text-primary size-8">
              <Icon icon="user" className="text-base" />
            </Link>

            <Link to="" className="btn btn-sm btn-icon bg-light hover:text-primary size-8">
              <Icon icon="map-pin" className="text-base" />
            </Link>

            <Link to="" className="btn btn-sm btn-icon bg-light hover:text-primary size-8">
              <Icon icon="camera" className="text-base" />
            </Link>

            <Link to="" className="btn btn-sm btn-icon bg-light hover:text-primary size-8">
              <Icon icon="mood-smile" className="text-base" />
            </Link>
          </div>

          <button type="submit" className="btn bg-dark btn-sm text-white">
            Post
          </button>
        </div>
      </div>
    </div>
  )
}

const CommonPostCard = ({ name, time, children, image, description }: FeedCardType) => {
  return (
    <div className="card">
      <div className="card-body">
        <div className="mb-2.5 flex items-center gap-2.5">
          <img className="size-9 rounded-full" src={image} alt="Generic placeholder image" />

          <div className="w-full">
            <h5>
              <Link to="" className="hover:text-primary">
                {name}
              </Link>
            </h5>

            <p className="text-default-400">
              <small>{time}</small>
            </p>
          </div>

          <div className="relative ms-auto">
            <div className="hs-dropdown relative inline-flex [--placement:bottom-right]">
              <button type="button" className="hs-dropdown-toggle" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
                <Icon icon="dots-vertical" className="text-default-400 text-base" />
              </button>

              <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
                <div className="space-y-0.5">
                  <Link className="dropdown-item" to="">
                    <Icon icon="edit" />
                    Edit post
                  </Link>

                  <Link className="dropdown-item" to="">
                    <Icon icon="trash" />
                    Delete post
                  </Link>

                  <Link className="dropdown-item" to="">
                    <Icon icon="share" />
                    Share
                  </Link>

                  <Link className="dropdown-item" to="">
                    <Icon icon="pin" />
                    Pin to top
                  </Link>

                  <Link className="dropdown-item" to="">
                    <Icon icon="flag" />
                    Report post
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {description && <p className="mb-4">{description}</p>}

        {children}

        <div className="mt-2.5">
          <Link to="" className="btn btn-sm text-default-400 text-sm">
            <Icon icon="corner-up-left" className="text-sm" />
            Reply
          </Link>

          <Link to="" className="btn btn-sm text-default-400 text-sm">
            <div className="relative">
              <span id="like-count-one"></span>
              <button type="button" data-hs-toggle-password='{"target": "#like-count-one" }'>
                <div className="hs-password-active:hidden flex items-center gap-1.25">
                  <Icon icon="heart-filled" className="text-danger" />
                  Liked!
                </div>

                <div className="hs-password-active:flex hidden items-center gap-1.25">
                  <Icon icon="heart" className="text-default-400" />
                  Like
                </div>
              </button>
            </div>
          </Link>

          <Link to="" className="btn btn-sm text-default-400 text-sm">
            <Icon icon="share" className="text-sm" />
            Share
          </Link>
        </div>
      </div>
    </div>
  )
}

const Post1 = () => {
  return (
    <CommonPostCard image={user10} name="Jeremy Tomlinson" time="about 2 minutes ago" description="Story based around the idea of time lapse, animation to post soon!">
      <div className="grid grid-cols-2 gap-1.5">
        <img src={gallery10} className="h-full rounded" style={{ aspectRatio: '3/4', objectFit: 'cover' }} alt="Tall Image" />

        <div className="flex flex-col gap-1.5">
          <img src={gallery2} className="rounded" style={{ aspectRatio: ' 4/3', objectFit: 'cover' }} alt="Top Right" />

          <img src={gallery3} className="rounded" style={{ aspectRatio: '4/3', objectFit: 'cover' }} alt="Bottom Right" />
        </div>
      </div>
    </CommonPostCard>
  )
}

const Post2 = () => {
  return (
    <CommonPostCard image={user4} name="Sophia Martinez" time="about 30 minutes ago">
      <div className="mt-5 mb-7.5 text-center text-base italic">
        <Icon icon="quote" className="text-xl" />
        Just finished a weekend project! Built a small weather app using React and OpenWeather API. Feeling excited to share the results with everyone soon. 🚀
      </div>
      <div className="border-default-300 bg-default-50 border-t border-b border-dashed p-3">
        {commentData.map((comment, idx) => (
          <div className="flex" key={idx}>
            <img src={comment.image} alt="User" className="me-2.5 size-8 rounded-full" />

            <div className="flex-1">
              <div className="w-full">
                <h5 className="mb-1.25">
                  <Link to="" className="hover:text-primary">
                    {comment.name}
                  </Link>
                  <small className="text-default-400 float-end font-normal">{comment.time}</small>
                </h5>

                {comment.message}

                <br />

                <Link to="" className="text-default-400 mt-2.5 inline-flex items-center gap-1">
                  <Icon icon="corner-up-left" />
                  Reply
                </Link>
              </div>

              {comment.reply?.map((reply, idx) => (
                <div className="mt-5 flex" key={idx}>
                  <img src={reply.image} alt="User" className="me-2.5 size-8 rounded-full" />

                  <div className="flex-1">
                    <div className="w-full">
                      <h5 className="mb-1.25">
                        <Link to="" className="hover:text-primary">
                          {reply.name}
                        </Link>
                        <small className="text-default-400 float-end font-normal">{reply.time}</small>
                      </h5>

                      {reply.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-base flex items-start gap-2">
          <img src={user3} alt="User" className="size-7.75 rounded-full" />

          <div className="w-full">
            <input type="text" className="form-input" placeholder="Add a comment..." />
          </div>
        </div>
      </div>
    </CommonPostCard>
  )
}

const Post3 = () => {
  return (
    <CommonPostCard image={user2} name="Anika Roy" time="2 hours ago" description="Sharing a couple of timelapses from my recent Iceland trip. Let me know which one you like most!">
      <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
        <div className="aspect-video overflow-hidden rounded-md">
          <iframe src="https://player.vimeo.com/video/1084537" allowFullScreen className="h-full w-full"></iframe>
        </div>

        <div className="aspect-video overflow-hidden rounded-md">
          <iframe src="https://player.vimeo.com/video/76979871" allowFullScreen className="h-full w-full"></iframe>
        </div>
      </div>
    </CommonPostCard>
  )
}

const Post4 = () => {
  return (
    <CommonPostCard image={user6} name="David Kim" time="Posted 1 hour ago">
      <h5 className="mb-5">🔥 Quick Poll: What’s your go-to front-end framework in 2025?</h5>
      <p className="text-default-400 mb-4">We’re gathering developer preferences for our next project. Cast your vote below! 💻</p>
      <form>
        <div className="mb-1.25 flex items-center gap-1.5">
          <input className="form-checkbox rounded-full" type="radio" name="framework_poll" id="optionReact" />
          <label className="form-check-label" htmlFor="optionReact">
            React (Meta)
          </label>
        </div>

        <div className="mb-1.25 flex items-center gap-1.5">
          <input className="form-checkbox rounded-full" type="radio" name="framework_poll" id="optionVue" />
          <label className="form-check-label" htmlFor="optionVue">
            Vue.js (Evan You)
          </label>
        </div>

        <div className="mb-1.25 flex items-center gap-1.5">
          <input className="form-checkbox rounded-full" type="radio" name="framework_poll" id="optionAngular" />
          <label className="form-check-label" htmlFor="optionAngular">
            Angular (Google)
          </label>
        </div>

        <div className="mb-5 flex items-center gap-1.5">
          <input className="form-checkbox rounded-full" type="radio" name="framework_poll" id="optionSvelte" />
          <label className="form-check-label" htmlFor="optionSvelte">
            Svelte (Emerging Favorite)
          </label>
        </div>

        <button type="submit" className="btn btn-sm bg-primary text-white hover:bg-primary-hover">
          Submit Vote
        </button>
      </form>
    </CommonPostCard>
  )
}

const Post5 = () => {
  return (
    <CommonPostCard image={user2} name="Anika roy" time="Posted 2 hours ago">
      <h5 className="mb-3">
        📢 You&apos;re Invited:
        <strong>Dev Meetup 2025 – Build with AI</strong>
      </h5>

      <p className="text-default-400 mb-3">Join developers and tech enthusiasts for an inspiring evening of AI-driven development talks, live demos, and networking opportunities.</p>

      <ul className="list-unstyled mb-base">
        <li className="pb-3">
          <strong>Date:</strong>
          Friday, 25th July 2025
        </li>

        <li className="pb-3">
          <strong>Time:</strong>
          6:00 PM IST
        </li>

        <li>
          <strong>Location:</strong>
          Online (Zoom – link to be shared)
        </li>
      </ul>

      <div className="flex gap-2.5">
        <button className="btn btn-sm border-primary text-primary hover:bg-primary border hover:text-white">
          <Icon icon="bell" className="text-sm" />
          Interested
        </button>

        <button className="btn btn-sm bg-primary text-white hover:bg-primary-hover">
          <Icon icon="user-plus" className="text-sm" />
          Join Now
        </button>
      </div>
    </CommonPostCard>
  )
}

const AchievementPost = () => {
  return (
    <div className="card">
      <div className="card-body text-center">
        <h1 className="mb-2.5 text-4xl">🏆</h1>
        <h4 className="mb-1.25 text-lg font-semibold">Congratulations, Anika! 🎉</h4>
        <p className="text-default-400 mb-5 italic">You’ve hit 1,000 followers ! Your content is making waves in the community!</p>

        <div className="mb-5 flex justify-center gap-7.5">
          <div className="text-center">
            <h6 className="text-2xs">Posts</h6>
            <span className="font-bold">135</span>
          </div>

          <div className="text-center">
            <h6 className="text-2xs">Likes</h6>
            <span className="font-bold">8,400</span>
          </div>

          <div className="text-center">
            <h6 className="text-2xs">Subscribers</h6>
            <span className="font-bold">1,000</span>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <button className="btn btn-sm text-success border-success hover:bg-success border hover:text-white">
            <Icon icon="share" />
            Share Achievement
          </button>

          <Link to="" className="btn btn-sm bg-primary text-white hover:bg-primary-hover">
            <Icon icon="user" />
            View Profile
          </Link>
        </div>
      </div>
    </div>
  )
}

const Feeds = () => {
  return (
    <>
      <div className="flex gap-base flex-col">
        <PostCard />
        <Post1 />
        <Post2 />
        <Post3 />
        <Post4 />

        <Post5 />
        <AchievementPost />

        <div className="mb-base flex items-center justify-center gap-3 p-5">
          <strong>Loading...</strong>
          <div className="text-danger inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" role="status" aria-label="loading">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      </div>
    </>
  )
}

export default Feeds
