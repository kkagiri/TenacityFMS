import profile from '@/assets/images/profile-bg.jpg'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Account Settings" subtitle="Pages" />
      <div className="mb-5">
        <div className="relative h-62.5 overflow-hidden rounded bg-cover bg-center" style={{ backgroundImage: `url(${profile})`, minHeight: '300px' }}>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-linear-to-t from-[#313A46] via-[#313a46cc] to-[#313a4680] p-7.5 text-center">
            <h3 className="text-2xl text-white italic">
              &quot;Designing the future, one template at a time&quot;&nbsp;
              <a href="" className="text-primary inline-block">
                <Icon icon="edit" className="text-primary" />
              </a>
            </h3>
            <button type="button" className="btn bg-danger text-white hover:bg-danger-hover">
              Change Background
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="card -mt-12">
          <div className="card-body">
            <h5 className="bg-light/15 border-default-300 mb-5 flex items-center justify-center gap-1.5 rounded border border-dashed p-1.25 text-sm uppercase">
              <Icon icon="user-circle" className="text-base" />
              Personal Info
            </h5>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-base gap-y-5 mb-base">
              <div>
                <label htmlFor="firstname" className="form-label">
                  First Name
                </label>
                <input type="text" className="form-input" id="firstname" placeholder="Enter first name" />
              </div>
              <div>
                <label htmlFor="lastname" className="form-label">
                  Last Name
                </label>
                <input type="text" className="form-input" id="lastname" placeholder="Enter last name" />
              </div>
              <div>
                <label htmlFor="jobtitle" className="form-label">
                  Job Title
                </label>
                <input type="text" className="form-input" id="jobtitle" placeholder="e.g. UI Developer, Designer" />
              </div>
              <div>
                <label htmlFor="phone" className="form-label">
                  Phone Number
                </label>
                <input type="text" className="form-input" id="phone" placeholder="+1 234 567 8901" />
              </div>
              <div className="col-span-1 lg:col-span-2">
                <label htmlFor="userbio" className="form-label">
                  Bio
                </label>
                <textarea rows={4} className="form-textarea" id="userbio" placeholder="Write something about yourself..." />
              </div>
              <div>
                <label htmlFor="useremail" className="form-label">
                  Email Address
                </label>
                <input type="email" className="form-input" id="useremail" placeholder="Enter email" />
                <span className="text-default-400 text-xs italic">
                  <a href="" className="hover:text-primary">
                    Click here to change your email
                  </a>
                </span>
              </div>
              <div>
                <label htmlFor="userpassword" className="form-label">
                  Password
                </label>
                <input type="password" className="form-input" id="userpassword" placeholder="Enter new password" />
                <span className="text-default-400 text-xs italic">
                  <a href="" className="hover:text-primary">
                    Click here to change your email
                  </a>
                </span>
              </div>
              <div className="col-span-1 lg:col-span-2">
                <label htmlFor="profilephoto" className="form-label">
                  Password
                </label>
                <input type="file" name="file-input" id="profilephoto" className="form-input" />
              </div>
            </div>
            <h5 className="bg-light/15 border-default-300 mb-5 flex items-center justify-center gap-1.5 rounded border border-dashed p-1.25 text-sm uppercase">
              <Icon icon="map-pin" className="text-base" />
              Address Info
            </h5>
            <div className="mb-5 grid grid-cols-1 lg:grid-cols-6 gap-x-base gap-y-5">
              <div className="col-span-1 lg:col-span-3">
                <label htmlFor="address-line1" className="form-label">
                  Address Line 1
                </label>
                <input type="text" className="form-input" id="address-line1" placeholder="Street, Apartment, Unit, etc." />
              </div>
              <div className="col-span-1 lg:col-span-3">
                <label htmlFor="address-line2" className="form-label">
                  Address Line 2
                </label>
                <input type="text" className="form-input" id="address-line2" placeholder="Optional" />
              </div>
              <div className="col-span-1 lg:col-span-2">
                <label htmlFor="city" className="form-label">
                  City
                </label>
                <input type="text" className="form-input" id="city" placeholder="City" />
              </div>
              <div className="col-span-1 lg:col-span-2">
                <label htmlFor="state" className="form-label">
                  State / Province
                </label>
                <input type="text" className="form-input" id="state" placeholder="State or Province" />
              </div>
              <div className="col-span-1 lg:col-span-4">
                <label htmlFor="zipcode" className="form-label">
                  Postal / ZIP Code
                </label>
                <input type="text" className="form-input" id="zipcode" placeholder="Postal Code" />
              </div>
              <div className="col-span-1 lg:col-span-3">
                <label htmlFor="country" className="form-label">
                  Country
                </label>
                <input type="text" className="form-input" id="country" placeholder="Country" />
              </div>
            </div>
            <h5 className="bg-light/15 border-default-300 mb-5 flex items-center justify-center gap-1.5 rounded border border-dashed p-1.25 text-sm uppercase">
              <Icon icon="building" className="text-base" />
              Company Info
            </h5>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-base gap-y-5 mb-base">
              <div>
                <label htmlFor="companyname" className="form-label">
                  Company Name
                </label>
                <input type="text" className="form-input" id="companyname" placeholder="Enter company name" />
              </div>
              <div>
                <label htmlFor="cwebsite" className="form-label">
                  Website
                </label>
                <input type="text" className="form-input" id="cwebsite" placeholder="https://yourcompany.com" />
              </div>
            </div>
            <h5 className="bg-light/15 border-default-300 mb-5 flex items-center justify-center gap-1.5 rounded border border-dashed p-1.25 text-sm uppercase">
              <Icon icon="world" className="text-base" />
              Social
            </h5>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-base gap-y-5 mb-base">
              <div>
                <label htmlFor="social-fb" className="form-label">
                  Facebook
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <svg className="text-base text-default-800" xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M7 10v4h3v7h4v-7h3l1 -4h-4v-2a1 1 0 0 1 1 -1h3v-4h-3a5 5 0 0 0 -5 5v2h-3" />
                    </svg>
                  </span>
                  <input id="social-fb" type="text" className="form-input rounded-s-none!" placeholder="Facebook URL" required />
                </div>
              </div>
              <div>
                <label htmlFor="social-tw" className="form-label">
                  Twitter X
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <svg className="text-base text-default-800" xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
                      <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
                    </svg>
                  </span>
                  <input id="social-tw" type="text" className="form-input rounded-s-none!" placeholder="@username" required />
                </div>
              </div>
              <div>
                <label htmlFor="social-insta" className="form-label">
                  Instagram
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <svg className="text-base text-default-800" xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M4 8a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4z" />
                      <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
                      <path d="M16.5 7.5v.01" />
                    </svg>
                  </span>
                  <input id="social-insta" type="text" className="form-input rounded-s-none!" placeholder="Instagram URL" required />
                </div>
              </div>
              <div>
                <label htmlFor="social-lin" className="form-label">
                  LinkedIn
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <svg className="text-base text-default-800" xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M8 11v5" />
                      <path d="M8 8v.01" />
                      <path d="M12 16v-5" />
                      <path d="M16 16v-3a2 2 0 1 0 -4 0" />
                      <path d="M3 7a4 4 0 0 1 4 -4h10a4 4 0 0 1 4 4v10a4 4 0 0 1 -4 4h-10a4 4 0 0 1 -4 -4z" />
                    </svg>
                  </span>
                  <input id="social-lin" type="text" className="form-input rounded-s-none!" placeholder="LinkedIn Profile" required />
                </div>
              </div>
              <div>
                <label htmlFor="social-gh" className="form-label">
                  GitHub
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <svg className="text-default-800 text-base" xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5" />
                    </svg>
                  </span>
                  <input id="social-gh" type="text" className="form-input rounded-s-none!" placeholder="GitHub Username" required />
                </div>
              </div>
              <div>
                <label htmlFor="social-sky" className="form-label">
                  Dribbble
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <svg className="text-base text-default-800" xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                      <path d="M9 3.6c5 6 7 10.5 7.5 16.2" />
                      <path d="M6.4 19c3.5 -3.5 6 -6.5 14.5 -6.4" />
                      <path d="M3.1 10.75c5 0 9.814 -.38 15.314 -5" />
                    </svg>
                  </span>
                  <input id="social-sky" type="text" className="form-input rounded-s-none!" placeholder="@username" required />
                </div>
              </div>
            </div>
            <div className="mt-7.5 text-end">
              <button type="submit" className="btn bg-success text-white hover:bg-success-hover">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
