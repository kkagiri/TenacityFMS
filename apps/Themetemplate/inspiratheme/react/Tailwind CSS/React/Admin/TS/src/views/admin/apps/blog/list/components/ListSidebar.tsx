import Icon from '@/components/wrappers/Icon'
import { categoryData, popularPostData, tagData } from './data'

const ListSidebar = () => {
  return (
    <>
      <div className="col-span-1">
        <div className="mb-7.5">
          <a href="/apps/blog/add" className="btn bg-primary btn-lg w-full text-sm text-white hover:bg-primary-hover">
            <Icon icon="circle-dashed-plus" />
            Add New Article
          </a>
        </div>
        <h5 className="mb-5 font-bold uppercase">Search</h5>
        <div className="input-icon-group mb-15">
          <Icon icon="search" className="input-icon" />
          <input type="text" className="form-input bg-light/20 border-light" placeholder="Search post..." />
        </div>

        <div className="mb-15">
          <h5 className="mb-5 font-bold uppercase">Categories</h5>
          <ul className="*:py-3 *:pe-5 *:flex *:items-center *:justify-between">
            {categoryData.map((item, idx) => (
              <li className="border-b border-default-300" key={idx}>
                <a href="" className="hover:text-primary flex items-center gap-3 font-medium">
                  <Icon icon="folder" />
                  {item.name}
                </a>
                <span className="badge bg-light">{item.value}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-15">
          <h5 className="mb-5 font-bold uppercase">Popular Posts</h5>
          <ul className="*:py-3 *:flex *:items-center *:justify-between">
            {popularPostData.map((item, idx) => (
              <li className="border-b border-default-300" key={idx}>
                <a href={item.href} className="hover:text-primary flex items-center gap-3 font-medium">
                  <Icon icon="article" />
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-15">
          <h5 className="mb-5 font-bold uppercase">Popular Tags</h5>
          <div className="flex flex-wrap itmes-center gap-1.25">
            {tagData.map((item, idx) => (
              <a href={item.href} className="btn btn-sm bg-light hover:text-primary" key={idx}>
                {item.name}
              </a>
            ))}
          </div>
        </div>

        <div className="bg-light/15 border-default-300 rounded border p-6 md:p-7.5">
          <h5 className="mb-5 font-bold uppercase">Subscribe to Newsletter</h5>
          <p className="text-default-400 mb-5 text-sm">Get the latest articles and updates directly to your inbox.</p>
          <form action="#">
            <div className="relative">
              <input type="email" className="form-input" placeholder="Your email address" />
              <button className="btn bg-dark absolute end-0 top-1/2 -translate-y-1/2 rounded-s-none py-3 text-white" type="submit">
                <Icon icon="send-2" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default ListSidebar
