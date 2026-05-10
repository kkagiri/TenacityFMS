import PageBreadcrumb from '@/components/PageBreadcrumb'
import Rating from '@/components/Rating'
import Icon from '@/components/wrappers/Icon'
import { CompanyType, companyData } from './data'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Companies" subtitle="Apps" />
      <div className="card border border-default-300 mb-base">
        <div className="card-body">
          <div className="grid xl:grid-cols-3 gap-base">
            <div className="col-span-1 lg:pe-2.5">
              <div className="input-icon-group">
                <Icon icon="search" className="input-icon text-default-400"></Icon>
                <input type="text" className="form-input" placeholder="Search company name..." />
              </div>
            </div>

            <div className="xl:col-span-2 lg:ps-2.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-semibold me-2.5">Filter By:</span>

                <div className="input-icon-group">
                  <Icon icon="map-pin" className="input-icon text-default-400"></Icon>
                  <select className="form-select">
                    <option>Location</option>
                    <option value="USA">USA</option>
                    <option value="Canada">Canada</option>
                    <option value="Germany">Germany</option>
                    <option value="India">India</option>
                    <option value="UK">United Kingdom</option>
                  </select>
                </div>

                <div className="input-icon-group">
                  <Icon icon="briefcase" className="input-icon text-default-400"></Icon>
                  <select className="form-select">
                    <option>Category</option>
                    <option value="Tech">Tech</option>
                    <option value="Finance">Finance</option>
                    <option value="eCommerce">eCommerce</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Automotive">Automotive</option>
                  </select>
                </div>

                <div className="input-icon-group">
                  <Icon icon="star" className="input-icon text-default-400"></Icon>
                  <select className="form-select">
                    <option>Rating</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars & Up</option>
                    <option value="3">3 Stars & Up</option>
                    <option value="2">2 Stars & Up</option>
                    <option value="1">1 Star & Up</option>
                  </select>
                </div>

                <button type="submit" className="btn bg-secondary text-white hover:bg-secondary-hover">
                  Apply
                </button>

                <div className="ms-auto">
                  <nav className="flex items-center gap-x-1" aria-label="Tabs" role="tablist" aria-orientation="horizontal">
                    <button type="button" className="hs-tab-active:bg-primary hs-tab-active:text-white bg-primary/15 text-primary btn btn-icon active size-9.25!" id="contact-tab-1" aria-selected="true" data-hs-tab="#tabs-contact-1" aria-controls="tabs-contact-1" role="tab">
                      <Icon icon="category" className="text-lg"></Icon>
                    </button>

                    <button type="button" className="hs-tab-active:bg-primary hs-tab-active:text-white bg-primary/15 text-primary btn btn-icon size-9.25!" id="contact-tab-2" aria-selected="false" data-hs-tab="#tabs-contact-2" aria-controls="#tabs-contact-2" role="tab">
                      <Icon icon="list-check" className="text-lg"></Icon>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-base mb-base">
        {companyData.map((company, idx) => (
          <CompanyCard company={company} key={idx} />
        ))}
      </div>
      <nav className="flex items-center justify-center gap-1.5" aria-label="Pagination">
        <button type="button" className="btn btn-icon bg-card border-default-300 hover:bg-default-50 hover:text-primary rounded-full" aria-label="Previous">
          <span>«</span>
        </button>
        <button type="button" className="btn btn-icon bg-primary rounded-full text-white">
          1
        </button>
        <button type="button" className="btn btn-icon bg-card hover:bg-default-50 border-default-300 hover:text-primary rounded-full">
          2
        </button>
        <button type="button" className="btn btn-icon bg-card hover:bg-default-50 border-default-300 hover:text-primary rounded-full">
          3
        </button>
        <button type="button" className="btn btn-icon bg-card hover:bg-default-50 border-default-300 hover:text-primary rounded-full">
          4
        </button>
        <button type="button" className="btn btn-icon bg-card hover:bg-default-50 border-default-300 hover:text-primary rounded-full">
          5
        </button>
        <button type="button" className="btn btn-icon bg-card border-default-300 hover:bg-default-50 hover:text-primary rounded-full" aria-label="Next">
          <span>»</span>
        </button>
      </nav>
    </>
  )
}

export default Page

const CompanyCard = ({ company }: { company: CompanyType }) => {
  const { image, name, website, location, industry, description, rating, employees, revenue } = company
  return (
    <div className="card flex flex-row p-5">
      <img src={image} alt={name} className="size-12 me-5" />

      <div className="grow">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="mb-1.25 font-bold text-lg">{name}</h4>
            <a href={`https://${website}`} className="text-default-400">
              {website}
            </a>
          </div>
          <a href="" className="btn btn-sm border border-danger text-danger hover:bg-danger hover:text-white rounded-full">
            <Icon icon="heart" className="me-1.25"></Icon>
            Follow
          </a>
        </div>

        <div className="mt-2.5 mb-5 flex flex-wrap gap-2.5">
          <span className="badge bg-light text-primary text-2xs">
            <Icon icon="map-pin" className="me-1.25"></Icon>
            {location}
          </span>
          <span className="badge bg-light text-success text-2xs">{industry}</span>
        </div>

        <p className="text-default-400 mb-5">{description}</p>

        <div className="flex justify-between flex-wrap mt-2.5 gap-5">
          <div>
            <h6 className="text-default-400 mb-2 text-xs">Employees</h6>
            <span className="font-semibold text-base">{employees}</span>
          </div>
          <div>
            <h6 className="text-default-400 mb-2 text-xs">Revenue</h6>
            <span className="font-semibold text-base">{revenue}</span>
          </div>
          <div className="text-warning align-self-center fs-lg">
            <Rating rating={rating} />
          </div>
        </div>
      </div>
    </div>
  )
}
