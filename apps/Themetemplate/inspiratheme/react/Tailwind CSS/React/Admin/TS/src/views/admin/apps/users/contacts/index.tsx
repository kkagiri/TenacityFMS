import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { generateInitials } from '@/utils/helpers'
import clsx from 'clsx'
import { Link } from 'react-router'
import { contactData, ContactType } from './data'


const page = () => {
  return (
    <>
      <PageBreadcrumb title="Contacts" subtitle="Apps" />
      <div className="card mb-base">
        <div className="card-body">
          <div className="grid xl:grid-cols-3 gap-base">
            <div className="col-span-1 lg:pe-2.5">
              <div className="input-icon-group">
                <Icon icon="search" className="input-icon text-default-400" />
                <input type="text" className="form-input" placeholder="Search contact name..." />
              </div>
            </div>

            <div className="xl:col-span-2 lg:ps-2.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-semibold me-2.5">Filter By:</span>

                <div className="input-icon-group">
                  <Icon icon="user-check" className="input-icon text-default-400" />
                  <select className="form-select" defaultValue="">
                    <option value="">Designation</option>
                    <option value="Manager">Manager</option>
                    <option value="Developer">Developer</option>
                    <option value="Designer">Designer</option>
                    <option value="Sales">Sales</option>
                    <option value="Support">Support</option>
                  </select>
                </div>

                <div className="input-icon-group">
                  <Icon icon="map-pin" className="input-icon text-default-400" />
                  <select className="form-select" defaultValue="">
                    <option value="">Location</option>
                    <option value="USA">USA</option>
                    <option value="UK">UK</option>
                    <option value="Germany">Germany</option>
                    <option value="India">India</option>
                    <option value="Canada">Canada</option>
                  </select>
                </div>

                <div className="input-icon-group">
                  <Icon icon="stack-2" className="input-icon text-default-400" />
                  <select className="form-select" defaultValue="">
                    <option value="">Department</option>
                    <option value="UI/UX">UI/UX</option>
                    <option value="Engineering">Engineering</option>
                    <option value="HR">HR</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>

                <button type="submit" className="btn bg-secondary text-white hover:bg-secondary-hover">
                  Apply
                </button>

                <div className="ms-auto">
                  <nav className="flex items-center gap-x-1" aria-label="Tabs" role="tablist" aria-orientation="horizontal">
                    <button type="button" className="hs-tab-active:bg-primary hs-tab-active:text-white bg-primary/15 text-primary btn btn-icon active size-9.25!" id="contact-tab-1" aria-selected="true" data-hs-tab="#tabs-contact-1" aria-controls="tabs-contact-1" role="tab">
                      <Icon icon="apps" className="text-lg" />
                    </button>

                    <button type="button" className="hs-tab-active:bg-primary hs-tab-active:text-white bg-primary/15 text-primary btn btn-icon size-9.25!" id="contact-tab-2" aria-selected="false" data-hs-tab="#tabs-contact-2" aria-controls="#tabs-contact-2" role="tab">
                      <Icon icon="list-check" className="text-lg" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-base lg:grid-cols-4">
        {contactData.map((contact, idx) => (
          <ContactCard key={idx} contactData={contact} />
        ))}
      </div>

      <div className="mt-5">
        <nav className="mx-auto flex items-center justify-center gap-1.5" aria-label="Pagination">
          <button type="button" className="btn btn-icon bg-card border-default-300 hover:bg-default-50 hover:text-primary rounded-full" aria-label="Previous">
            <Icon icon="chevron-left" className="align-middle text-lg"></Icon>
          </button>
          <button type="button" className="btn btn-icon bg-card hover:bg-default-50 border-default-300 hover:text-primary rounded-full">
            1
          </button>
          <button type="button" className="btn btn-icon bg-primary rounded-full text-white">
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
            <Icon icon="chevron-right" className="align-middle text-lg"></Icon>
          </button>
        </nav>
      </div>
    </>
  )
}

export default page

const ContactCard = ({ contactData }: { contactData: ContactType }) => {
  const { name, image, position, role, email, contact, location, website, updatedTime, flag, className } = contactData
  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center mb-7.5">
          <div className="me-5 relative">
            {image ? (
              <img src={image} alt={name} className="rounded-full" width={72} height={72} />
            ) : (
              <div className="rounded-full shrink-0 flex justify-center items-center overflow-hidden text-white bg-primary" style={{ height: 72, width: 72 }}>
                <span className="font-semibold text-[22px]">{generateInitials(name)}</span>
              </div>
            )}
            <span className={clsx('absolute bottom-0 inset-e-0 badge rounded-full p-1.25 text-white', className)} title="Rating 4.8">
              <Icon icon="star" className="text-white"></Icon>
            </span>
          </div>

          <div>
            <h5 className="mb-1.25 flex items-center">
              <Link to="" className="hover:text-primary">
                {name}
              </Link>
              <img src={flag} alt="UK" height={16} width={16} className="ms-2.5 rounded-full size-4" />
            </h5>
            <p className="text-default-400 mb-1.25">{position}</p>
            <span className="badge bg-light badge-label">{role}</span>
          </div>

          <div className="relative ms-auto">
            <div className="hs-dropdown relative inline-flex [--placement:bottom-right]">
              <button type="button" className="hs-dropdown-toggle btn size-9.25 text-default-400 hover:bg-default-100" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
                <Icon icon="dots-vertical" className="text-xl"></Icon>
              </button>

              <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
                <a className="dropdown-item" href="">
                  <Icon icon="share"></Icon>
                  Share
                </a>

                <a className="dropdown-item" href="">
                  <Icon icon="edit"></Icon>
                  Edit
                </a>

                <a className="dropdown-item" href="">
                  <Icon icon="ban"></Icon>
                  Block
                </a>

                <a className="dropdown-item text-danger" href="">
                  <Icon icon="trash"></Icon>
                  Delete
                </a>
              </div>
            </div>
          </div>
        </div>

        <ul className="text-default-400 mb-7.5">
          <li className="mb-2.5">
            <div className="flex items-center gap-2.5">
              <div>
                <span className="size-6 flex justify-center items-center bg-light text-default-800 rounded-full">
                  <Icon icon="mail"></Icon>
                </span>
              </div>
              <h5 className="text-sm font-medium">
                <Link to="" className="hover:text-primary">
                  {email}
                </Link>
              </h5>
            </div>
          </li>

          <li className="mb-2.5">
            <div className="flex items-center gap-2.5">
              <div>
                <span className="size-6 flex justify-center items-center bg-light text-default-800 rounded-full">
                  <Icon icon="phone"></Icon>
                </span>
              </div>
              <h5 className="text-sm font-medium">
                <Link to="" className="hover:text-primary">
                  {contact}
                </Link>
              </h5>
            </div>
          </li>

          <li className="mb-2.5">
            <div className="flex items-center gap-2.5">
              <div>
                <span className="size-6 flex justify-center items-center bg-light text-default-800 rounded-full">
                  <Icon icon="map-pin"></Icon>
                </span>
              </div>
              <h5 className="text-sm font-medium">{location}</h5>
            </div>
          </li>

          <li>
            <div className="flex items-center gap-2.5">
              <div>
                <span className="size-6 flex justify-center items-center bg-light text-default-800 rounded-full">
                  <Icon icon="link"></Icon>
                </span>
              </div>
              <h5 className="text-sm font-medium">
                <Link to="" className="text-primary hover:text-primary-hover">
                  {website}
                </Link>
              </h5>
            </div>
          </li>
        </ul>

        <div className="flex justify-between items-center">
          <span className="text-default-400 text-xs flex items-center">
            <Icon icon="refresh" className="me-1.25"></Icon>
            {updatedTime}
          </span>
          <Link to="" className="btn bg-primary/15 text-primary btn-sm rounded-full hover:bg-primary hover:text-white">
            View Profile
          </Link>
        </div>
      </div>
    </div>
  )
}
