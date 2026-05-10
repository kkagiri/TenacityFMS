import seller1 from '@/assets/images/sellers/1.png'
import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'

const SellerContact = () => {
  return (
    <div className="card lg:sticky lg:top-22">
      <div className="card-body">
        <div className="bg-light/15 border-light flex items-center justify-between gap-2 rounded border p-2.5">
          <div className="md:flex items-center gap-base">
            <div className="size-12">
              <img src={seller1} alt="avatar-store" className="img-fluid rounded-full" />
            </div>
            <div>
              <h4 className="font-bold whitespace-nowrap mb-1.25">MacHub Retailers</h4>
              <p className="text-default-400 text-sm">Since 2017</p>
            </div>
          </div>
          <div className="relative ms-auto">
            <div className="hs-dropdown relative inline-flex [--placement:bottom-right]">
              <button type="button" className="hs-dropdown-toggle btn btn-sm btn-icon bg-light text-dark" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
                <Icon icon="dots" className="text-2xl" />
              </button>
              <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
                <div className="space-y-0.5">
                  <Link className="dropdown-item" to="">
                    Edit profile
                  </Link>
                  <Link className="dropdown-item text-danger" to="">
                    Report
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5">
          <div className="mb-2.5 flex items-center gap-2.5">
            <div className="btn btn-icon bg-light size-8">
              <Icon icon="user" className="text-default-400 text-lg" />
            </div>
            <p className="text-sm">
              Owner: <span className="font-semibold">Sophie Martinez</span>
            </p>
          </div>
          <div className="mb-2.5 flex items-center gap-2.5">
            <div className="btn btn-icon bg-light size-8">
              <Icon icon="briefcase" className="text-default-400 text-lg" />
            </div>
            <p className="text-sm">
              Business Type: <span className="font-semibold">Fashion Retail</span>
            </p>
          </div>
          <div className="mb-2.5 flex items-center gap-2.5">
            <div className="btn btn-icon bg-light size-8">
              <Icon icon="calendar" className="text-default-400 text-lg" />
            </div>
            <p className="text-sm">
              Founded: <span className="font-semibold">2015</span>
            </p>
          </div>
          <div className="mb-2.5 flex items-center gap-2.5">
            <div className="btn btn-icon bg-light size-8">
              <Icon icon="map-pin" className="text-default-400 text-lg" />
            </div>
            <p className="text-sm">
              Location: <span className="font-semibold">Los Angeles, USA</span>
            </p>
          </div>
          <div className="mb-2.5 flex items-center gap-2.5">
            <div className="btn btn-icon bg-light size-8">
              <Icon icon="mail" className="text-default-400 text-lg" />
            </div>
            <p className="text-sm">
              Support:&nbsp;
              <a href="mailto:help@stylehub.com" className="text-primary font-semibold">
                help@stylehub.com&nbsp;
              </a>
            </p>
          </div>
          <div className="mb-2.5 flex items-center gap-2.5">
            <div className="btn btn-icon bg-light size-8">
              <Icon icon="world" className="text-default-400 text-lg" />
            </div>
            <p className="text-sm">
              Website:&nbsp;
              <a href="https://www.stylehub.com" className="text-primary font-semibold">
                www.stylehub.com
              </a>
            </p>
          </div>
        </div>
      </div>
      <div className="card-body border-default-300 border-t border-dashed">
        <h5 className="mb-base">Contact Seller</h5>
        <textarea className="form-textarea mb-base" rows={4} id="exampleFormControlTextarea1" placeholder="Enter your messages..." defaultValue={''} />
        <div className="text-end">
          <button type="submit" className="btn bg-primary text-white hover:bg-primary-hover">
            Send Messages
          </button>
        </div>
      </div>
    </div>
  )
}

export default SellerContact
