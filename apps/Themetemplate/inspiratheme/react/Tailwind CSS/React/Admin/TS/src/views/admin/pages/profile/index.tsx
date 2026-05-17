import profile from '@/assets/images/profile-bg.jpg'
import user1 from '@/assets/images/users/user-1.jpg'
import Icon from '@/components/wrappers/Icon'
import { META_DATA } from '@/config/constants'
import Account from './components/Account'
import ProfileCard from './components/ProfileCard'


const Page = () => {
  return (
    <>
      <div className="mb-5">
        <article className="card">
          <div className="relative overflow-hidden h-62.5 bg-cover bg-center" style={{ backgroundImage: `url(${profile})` }}>
            <div className="absolute inset-0 flex flex-col items-center justify-center p-7.5 bg-linear-to-t from-[#313A46] via-[#313a46cc] to-[#313a4680] text-center">
              <h3 className="text-white italic text-xl">"Designing the future, one template at a time"</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="flex flex-wrap justify-between items-center">
              <div className="flex items-center gap-base">
                <div>
                  <img src={user1} alt="avatar" width={80} height={80} className="size-20 rounded-full object-cover border-5 border-default-200" />
                </div>

                <div>
                  <h4 className="font-bold text-lg text-default-800 mb-1.25">{META_DATA.username}</h4>
                  <p className="text-default-400 text-sm mb-1.25">Product Designer</p>
                  <span className="badge bg-primary/15 text-primary text-xs">Author</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 md:mt-0 mt-5">
                <a href="" className="btn border border-primary hover:bg-primary text-primary hover:text-white">
                  Follow
                </a>
                <a href="" className="btn bg-primary hover:bg-primary-hover text-white">
                  Message
                </a>

                <div className="hs-dropdown [--auto-close:inside] relative inline-flex">
                  <button type="button" className="hs-dropdown-toggle btn btn-icon bg-dark text-white" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
                    <Icon icon="dots" className="text-white size-6"></Icon>
                  </button>

                  <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
                    <div>
                      <a className="dropdown-item" href="">
                        &nbsp; Edit Profile&nbsp;
                      </a>

                      <a className="dropdown-item text-danger" href="">
                        &nbsp; Report&nbsp;
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
      <div className="container-fluid px-5">
        <div className="grid xl:grid-cols-12 grid-cols-1 gap-base">
          <div className="xl:col-span-4">
            <ProfileCard />
          </div>

          <div className="xl:col-span-8">
            <Account />
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
