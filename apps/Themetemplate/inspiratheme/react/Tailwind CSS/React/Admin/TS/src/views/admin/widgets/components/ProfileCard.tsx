import profileBg from '@/assets/images/profile-bg.jpg'
import user2 from '@/assets/images/users/user-2.jpg'
import Icon from '@/components/wrappers/Icon'
import { META_DATA } from '@/config/constants'
import { abbreviatedNumber } from '@/utils/helpers'
import { Link } from 'react-router'
import { comments } from './data'

const ProfileCard = () => {
  return (
    <div className="flex flex-col gap-base">
      <div className="card">
        <div
          className="relative card-side-img overflow-hidden rounded-t-sm bg-no-repeat"
          style={{
            height: '180px',
            backgroundImage: `url(${profileBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="h-full p-7.5 bg-linear-to-t from-[#313a46] via-[rgba(49,58,70,0.8)] to-[rgba(49,58,70,0.5)] inset-0 absolute rounded-s-sm auth-overlay flex rounded-t-sm items-center justify-center">
            <h5 className="text-white italic">"Welcome!"</h5>
          </div>
        </div>

        <div className="card-body relative">
          <div className="flex justify-start gap-5">
            <div className="size-20" style={{ marginTop: '-60px' }}>
              <Link to="">
                <img src={user2} alt="User Profile" className="p-1 bg-body-bg border border-default-300 rounded-full" />
              </Link>
            </div>
            <div>
              <h4 className="text-nowrap font-bold mb-1.25">
                <Link to="" className="text-lg">
                  {META_DATA.username}
                </Link>
              </h4>
              <p className="text-default-400 mb-0">Member since Jan 2021</p>
            </div>

            <div className="relative -mt-10 ms-auto">
              <div className="hs-dropdown inline-flex [--placement:bottom-right]">
                <button type="button" className="hs-dropdown-toggle size-9.5 bg-primary text-white btn btn-icon rounded-full" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
                  <Icon icon="dots" className="text-2xl"></Icon>
                </button>

                <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical" tabIndex={-1}>
                  <div className="space-y-0.5">
                    <a href="" className="dropdown-item">
                      &nbsp; Edit Profile&nbsp;
                    </a>

                    <a href="" className="dropdown-item text-danger">
                      &nbsp; Report&nbsp;
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {comments.map((comment, idx) => (
            <div key={idx} className="flex border border-dashed rounded p-5 border-default-300">
              <div className="shrink-0">
                <img src={comment.avatar} alt="" className="size-8 rounded-full shadow-sm" />
              </div>

              <div className="grow ms-2.5">
                <h5 className="mb-1.25">
                  {comment.name}&nbsp;
                  <small className="text-default-400">
                    {comment.date} · {comment.time}
                  </small>
                </h5>

                <p className="mb-2.5">{comment.message}</p>

                <div className="flex justify-between mt-2.5 text-default-400">
                  <div className="flex gap-5">
                    <span className="inline-flex items-center gap-1.25">
                      <Icon icon="eye"></Icon> {abbreviatedNumber(comment.views)}
                    </span>
                    <span className="inline-flex items-center gap-1.25">
                      <Icon icon="heart"></Icon> {comment.likes}
                    </span>
                    <span className="inline-flex items-center gap-1.25">
                      <Icon icon="message-circle-2"></Icon> {comment.comments}
                    </span>
                  </div>

                  <a href="" className="text-primary hover:text-primary-hover font-semibold inline-flex items-center gap-1.25">
                    <Icon icon="arrow-back-up" /> Reply
                  </a>
                </div>

                {comment.reply?.map((reply, rIdx) => (
                  <div key={rIdx} className="flex mt-7.5">
                    <div className="shrink-0">
                      <img src={reply.avatar} alt="" className="size-8 rounded-full shadow-sm" />
                    </div>

                    <div className="grow ms-2.5">
                      <h5 className="mb-1.25">
                        {reply.name}&nbsp;
                        <small className="text-default-400">
                          {reply.date} · {reply.time}
                        </small>
                      </h5>

                      <p className="mb-2.5">{reply.message}</p>

                      <div className="flex justify-between text-default-400">
                        <div className="flex gap-5">
                          <span className="inline-flex items-center gap-1.25">
                            <Icon icon="eye" /> {abbreviatedNumber(reply.views)}
                          </span>
                          <span className="inline-flex items-center gap-1.25">
                            <Icon icon="heart" /> {reply.likes}
                          </span>
                          <span className="inline-flex items-center gap-1.25">
                            <Icon icon="message-circle-2" /> {reply.comments}
                          </span>
                        </div>

                        <a href="" className="text-primary hover:text-primary-hover font-semibold inline-flex items-center gap-1.25">
                          <Icon icon="arrow-back-up" /> Reply
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
export default ProfileCard
