import Icon from '@/components/wrappers/Icon'

const PostSidebar = () => {
  return (
    <>
      <div className="col-span-1">
        <button className="btn btn-lg w-full text-base bg-primary text-white hover:bg-primary-hover mb-5">Ask Question</button>
        <div className="card">
          <div className="card-body border-default-300 border-b border-dashed">
            <h5 className="mb-5 font-bold uppercase">Search</h5>
            <div className="input-icon-group">
              <Icon icon="search" className="input-icon" />
              <input type="search" placeholder="Search issues..." className="form-input bg-light/20" />
            </div>
          </div>
          <div className="card-body border-default-300 border-b border-dashed">
            <h5 className="mb-5 font-bold uppercase">Category:</h5>
            <ul className="text-sm">
              <li className="border-default-300 border-b py-3">
                <a href="" className="hover:text-primary transition-colors">
                  Development Talk
                </a>
              </li>
              <li className="border-default-300 border-b py-3">
                <a href="" className="hover:text-primary transition-colors">
                  AI &amp; Ethics
                </a>
              </li>
              <li className="border-default-300 border-b py-3">
                <a href="" className="hover:text-primary transition-colors">
                  Product Design
                </a>
              </li>
              <li className="border-default-300 border-b py-3">
                <a href="" className="hover:text-primary transition-colors">
                  Career Growth
                </a>
              </li>
              <li className="py-3">
                <a href="" className="hover:text-primary transition-colors">
                  Open Source
                </a>
              </li>
            </ul>
          </div>
          <div className="card-body border-default-300 border-b border-dashed">
            <h5 className="mb-5 font-bold uppercase">Popular Questions:</h5>
            <ul className="text-sm">
              <li className="border-default-300 border-b py-3">
                <a href="" className="hover:text-primary transition-colors">
                  Unlocking the Secrets of Modern UI Design
                </a>
              </li>
              <li className="border-default-300 border-b py-3">
                <a href="" className="hover:text-primary transition-colors">
                  How to Build a Portfolio with Tailwind CSS
                </a>
              </li>
              <li className="border-default-300 border-b py-3">
                <a href="" className="hover:text-primary transition-colors">
                  Boost Productivity with These Web Dev Tools
                </a>
              </li>
              <li className="border-default-300 border-b py-3">
                <a href="" className="hover:text-primary transition-colors">
                  The Future of Frontend: Trends to Watch in 2025
                </a>
              </li>
              <li className="py-3">
                <a href="" className="hover:text-primary transition-colors">
                  Essential Tips for Clean and Maintainable Code
                </a>
              </li>
            </ul>
          </div>
          <div className="card-body">
            <h5 className="mb-5 font-bold uppercase">Popular Tags:</h5>
            <div className="flex flex-wrap items-center gap-1.5">
              <a href="" className="btn btn-sm bg-light hover:text-primary transition-colors">
                Web Design
              </a>
              <a href="" className="btn btn-sm bg-light hover:text-primary transition-colors">
                Frontend
              </a>
              <a href="" className="btn btn-sm bg-light hover:text-primary transition-colors">
                Tailwind CSS
              </a>
              <a href="" className="btn btn-sm bg-light hover:text-primary transition-colors">
                JavaScript
              </a>
              <a href="" className="btn btn-sm bg-light hover:text-primary transition-colors">
                React
              </a>
              <a href="" className="btn btn-sm bg-light hover:text-primary transition-colors">
                Startup
              </a>
              <a href="" className="btn btn-sm bg-light hover:text-primary transition-colors">
                DevTools
              </a>
              <a href="" className="btn btn-sm bg-light hover:text-primary transition-colors">
                Open Source
              </a>
              <a href="" className="btn btn-sm bg-light hover:text-primary transition-colors">
                Performance
              </a>
              <a href="" className="btn btn-sm bg-light hover:text-primary transition-colors">
                UX/UI
              </a>
              <a href="" className="btn btn-sm bg-light hover:text-primary transition-colors">
                SEO
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default PostSidebar
