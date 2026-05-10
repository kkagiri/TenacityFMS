import user2 from '@/assets/images/users/user-2.jpg'
import user3 from '@/assets/images/users/user-3.jpg'
import user4 from '@/assets/images/users/user-4.jpg'
import user5 from '@/assets/images/users/user-5.jpg'
import user8 from '@/assets/images/users/user-8.jpg'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { searchResultData } from './components/data'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Search Results" subtitle="Pages" />
      <div className="card">
        <div className="card-body">
          <div className="mx-auto py-6 text-center xl:w-1/2 md:w-3/4">
            <div className="input-icon-group mb-base">
              <Icon icon="search" className="input-icon" />
              <input type="text" defaultValue="AI Content Tools" placeholder="Search AI platforms..." className="form-input form-input-lg rounded-s-full! font-semibold" />
              <button type="button" className="btn btn-lg text-base rounded-s-none rounded-e-full bg-secondary text-white -ms-px hover:bg-secondary-hover">
                Discover
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1.25 text-sm">
              <h5 className="text-default-400">Popular Searches :</h5>
              <a href="" className="bg-primary/15 text-primary inline-flex items-center rounded-full px-3 py-1 text-xs font-bold">
                Text Generation
              </a>
              <a href="" className="bg-primary/15 text-primary inline-flex items-center rounded-full px-3 py-1 text-xs font-bold">
                Image AI
              </a>
              <a href="" className="bg-primary/15 text-primary inline-flex items-center rounded-full px-3 py-1 text-xs font-bold">
                Speech
              </a>
              <a href="" className="bg-primary/15 text-primary inline-flex items-center rounded-full px-3 py-1 text-xs font-bold">
                Coding
              </a>
            </div>
          </div>
        </div>

        <div className="card-header">
          <h4 className="text-default-400 text-lg italic">
            Found&nbsp;
            <span className="badge bg-danger/15 text-danger font-bold">72</span>
            &nbsp;results for&nbsp;
            <span className="text-default-800 font-medium">&quot;AI Content Tools&quot;</span>
          </h4>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold me-3">Filter By:</span>

            <div className="input-icon-group">
              <Icon icon="cpu" className="input-icon" />
              <select className="form-select" defaultValue="Tool Type">
                <option>Tool Type</option>
                <option value="chatbot">Chatbot</option>
                <option value="analytics">Analytics</option>
                <option value="image">Image Generator</option>
                <option value="voice">Voice AI</option>
                <option value="automation">Automation</option>
              </select>
            </div>

            <div className="input-icon-group">
              <Icon icon="wallet" className="input-icon" />
              <select className="form-select" defaultValue="Pricing">
                <option>Pricing</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          {searchResultData.map((item, idx) => (
            <div className="border-default-300 border-b border-dashed px-7.5 py-5" key={idx}>
              <h4 className="mb-1.25 text-base font-medium">
                <a href="" target="_blank" className="card-title">
                  {item.title}
                </a>
              </h4>
              <p className="text-success mb-2.5 text-sm">{item.href}</p>
              <p className="text-default-400 mb-2.5 text-sm">{item.description}</p>
              <p className="text-sm text-default-500 mb-1.25 flex flex-wrap items-center gap-base">
                <span className="flex items-center gap-1.25">
                  <img src={item.user.image} alt="avatar-4" className="size-6 rounded-full object-cover" />
                  <a href="" className="text-default-400 hover:text-primary font-semibold">
                    {item.user.name}
                  </a>
                </span>

                <span className="text-default-400 flex items-center gap-1">
                  <Icon icon="calendar" />
                  <span>Published on: {item.publishedDate}</span>
                </span>

                <span className="text-default-400 flex items-center gap-1">
                  <Icon icon="users" />
                  <span>Users: {item.users}+</span>
                </span>

                <span className="text-default-400 flex items-center gap-1">
                  <Icon icon="message-circle" />
                  <a href="" className="hover:text-primary">
                    Feedback: {item.feedback}
                  </a>
                </span>

                <span className="text-default-400 flex items-center gap-1">
                  <Icon icon="star" />
                  <span>Rating: {item.rating}</span>
                </span>
              </p>
            </div>
          ))}

          <div className="border-default-300 border-b border-dashed px-7.5 py-5">
            <h4 className="card-title mb-base">Featured AI Creators:</h4>
            <div className="flex items-center gap-3">
              <div className="avatar">
                <img src={user4} alt="avatar-4" className="size-12 rounded" />
              </div>
              <div className="avatar">
                <img src={user5} alt="avatar-5" className="size-12 rounded" />
              </div>
              <div className="avatar">
                <img src={user3} alt="avatar-3" className="size-12 rounded" />
              </div>
              <div className="avatar">
                <img src={user8} alt="avatar-8" className="size-12 rounded" />
              </div>
              <div className="avatar">
                <img src={user2} alt="avatar-2" className="size-12 rounded" />
              </div>
            </div>
          </div>
          <div className="px-7.5 py-5">
            <h4 className="card-title mb-base">People also search for:</h4>
            <div className="flex flex-wrap items-center gap-3">
              <a href="" className="btn bg-light/50 text-md">
                AI SaaS Platforms
                <Icon icon="search" />
              </a>
              <a href="" className="btn bg-light/50 text-md">
                AI Code Generators
                <Icon icon="search" />
              </a>
              <a href="" className="btn bg-light/50 text-md">
                AI Productivity Tools
                <Icon icon="search" />
              </a>
              <a href="" className="btn bg-light/50 text-md">
                AI for Marketing
                <Icon icon="search" />
              </a>
            </div>
          </div>
        </div>
        <div className="card-footer">
          <nav className="mx-auto flex items-center justify-center gap-1.25" aria-label="Pagination">
            <button type="button" className="btn btn-icon size-8.5! border-default-300 rounded-full border" aria-label="Previous">
              <Icon icon="chevron-left" />
            </button>
            <button type="button" className="btn btn-icon size-8.5! border-default-300 bg-primary rounded-full border text-white" aria-current="page">
              1
            </button>
            <button type="button" className="btn btn-icon size-8.5! border-default-300 rounded-full border">
              2
            </button>
            <button type="button" className="btn btn-icon size-8.5! border-default-300 rounded-full border">
              3
            </button>
            <button type="button" className="btn btn-icon size-8.5! border-default-300 rounded-full border">
              ...
            </button>
            <button type="button" className="btn btn-icon size-8.5! border-default-300 rounded-full border">
              4
            </button>
            <button type="button" className="btn btn-icon size-8.5! border-default-300 rounded-full border">
              5
            </button>
            <button type="button" className="btn btn-icon size-8.5! border-default-300 rounded-full border" aria-label="Next">
              <Icon icon="chevron-right" />
            </button>
          </nav>
        </div>
      </div>
    </>
  )
}

export default Page
