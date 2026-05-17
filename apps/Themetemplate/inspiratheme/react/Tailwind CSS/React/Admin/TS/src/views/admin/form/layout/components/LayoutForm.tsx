import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'

const LayoutForm = () => {
  return (
    <div className="container-fluid">
      <div className="space-y-6">
        <BasicForm />
        <ModalForm />
        <BasicExample />
        <HorizontalForm />
        <HorizontalFormLabelSizing />
        <InlineForm />
        <FormRow />
        <FloatingLabels />
      </div>
    </div>
  )
}

export default LayoutForm

const BasicForm = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Basic Form</h4>
      </div>
      <div className="card-body">
        <div className="grid md:grid-cols-2 grid-cols-1 items-center gap-7.5">
          <div className="md:border-e md:border-0 border-b border-dashed border-default-300 md:pb-0 pb-4">
            <div className="md:p-7.5">
              <h4 className="text-lg uppercase font-bold mb-1.25">Sign in</h4>
              <p className="text-default-400 mb-7.5">Let&apos;s get you signed in. Enter your email and password to continue.</p>
              <form>
                <div className="mb-5">
                  <label htmlFor="userEmail" className="form-label">
                    Email address
                    <span className="text-danger">*</span>
                  </label>
                  <div>
                    <input type="email" className="form-input" id="userEmail" placeholder="you@example.com" required />
                  </div>
                </div>

                <div className="mb-5">
                  <label htmlFor="userPassword" className="form-label">
                    Password
                    <span className="text-danger">*</span>
                  </label>
                  <div>
                    <input type="password" className="form-input" id="userPassword" placeholder="••••••••" required />
                  </div>
                </div>

                <div className="flex flex-wrap justify-between items-start">
                  <div className="flex items-center gap-2">
                    <input className="form-checkbox border-0" type="checkbox" id="rememberMe1" />
                    <label className="font-medium italic text-default-400" htmlFor="rememberMe1">
                      Keep me signed in
                    </label>
                  </div>

                  <button className="btn bg-primary rounded-full text-white" type="submit">
                    <strong>Log in</strong>
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div className="text-center">
            <div className="mb-5">
              <span className="btn btn-icon size-12 rounded-full bg-secondary/15">
                <Icon icon="user-hexagon" className="text-secondary size-7" />
              </span>
            </div>
            <h4 className="mb-2 text-lg">Don&apos;t Have an Account Yet?</h4>
            <p className="text-default-400 mb-5">Join us today and unlock access to personalized features, updates, and more!</p>
            <Link to="/auth/sign-up" className="text-primary underline font-semibold">
              Create Your Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

const ModalForm = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Modal Form</h4>
      </div>
      <div className="card-body">
        <div className="text-center">
          <button type="button" className="btn bg-primary text-white hover:bg-primary-hover" aria-haspopup="dialog" aria-expanded="false" aria-controls="modal-form" data-hs-overlay="#modal-form">
            Form in simple modal box
          </button>
          <div
            id="modal-form"
            className="hs-overlay hs-overlay-open:opacity-100 hs-overlay-open:duration-500 hidden size-full fixed top-8  start-0 z-80 opacity-0 overflow-x-hidden transition-all overflow-y-auto pointer-events-none"
            role="dialog"
            tabIndex={-1}
            aria-labelledby="modal-form-label"
          >
            <div className="lg:w-3xl md:w-2xl w-xs mx-auto">
              <div className="card">
                <div className="card-body">
                  <div className="grid md:grid-cols-2 grid-cols-1 items-center gap-7.5">
                    <div className="md:border-e border-b border-dashed border-default-300 md:pb-0 pb-4">
                      <div className="md:p-9 text-start">
                        <h4 className="text-lg uppercase font-bold mb-1.25">Sign in</h4>
                        <p className="text-default-400 mb-7.5">Let’s get you signed in. Enter your email and password to continue.</p>
                        <form>
                          <div className="mb-5">
                            <label htmlFor="userEmail" className="form-label">
                              Email address
                              <span className="text-danger">*</span>
                            </label>
                            <div>
                              <input type="email" className="form-input" id="userEmail" placeholder="you@example.com" required />
                            </div>
                          </div>

                          <div className="mb-5">
                            <label htmlFor="userPassword" className="form-label">
                              Password
                              <span className="text-danger">*</span>
                            </label>
                            <div>
                              <input type="password" className="form-input" id="userPassword" placeholder="••••••••" required />
                            </div>
                          </div>

                          <div className="flex flex-wrap justify-between items-start">
                            <div className="flex items-center gap-2">
                              <input className="form-checkbox border-0" type="checkbox" id="rememberMe1" />
                              <label className="font-medium italic text-default-400" htmlFor="rememberMe1">
                                Keep me signed in
                              </label>
                            </div>

                            <button className="btn bg-primary rounded-full text-white" type="submit">
                              <strong>Log in</strong>
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="mb-5">
                        <span className="btn btn-icon size-12 rounded-full bg-secondary/15">
                          <Icon icon="user-hexagon" className="text-secondary size-7" />
                        </span>
                      </div>
                      <h4 className="mb-2 text-lg">Do&apos;t Have an Account Yet?</h4>
                      <p className="text-default-400 mb-5">Join us today and unlock access to personalized features, updates, and more!</p>
                      <Link to="/auth/sign-up" className="text-primary underline font-semibold">
                        Create Your Account
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const BasicExample = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Basic Example</h4>
      </div>
      <div className="card-body">
        <form className="space-y-6">
          <div>
            <label htmlFor="exampleInputEmail1" className="form-label">
              Email address
            </label>
            <div>
              <input type="email" className="form-input" id="exampleInputEmail1" placeholder="Enter email" required />
            </div>
            <small id="emailHelp" className="text-xs text-default-400">
              We&apos;ll never share your email with anyone else.
            </small>
          </div>

          <div>
            <label htmlFor="exampleInputPassword1" className="form-label">
              Password
            </label>
            <div>
              <input type="password" className="form-input" id="exampleInputPassword1" placeholder="Password" required />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input className="form-checkbox border-0" type="checkbox" id="checkmeout0" />
            <label className="font-medium text-default-600" htmlFor="checkmeout0">
              Check me out !
            </label>
          </div>

          <button className="btn bg-primary text-white hover:bg-primary-hover" type="submit">
            <strong>Submit</strong>
          </button>
        </form>
      </div>
    </div>
  )
}

const HorizontalForm = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Horizontal Form</h4>
      </div>
      <div className="card-body">
        <form className="space-y-6">
          <div className="grid md:grid-cols-4">
            <div>
              <label htmlFor="inputEmail3" className="form-label">
                Email
              </label>
            </div>
            <div className="md:col-span-3">
              <input type="email" className="form-input" id="inputEmail3" placeholder="Email" required />
            </div>
          </div>

          <div className="grid md:grid-cols-4">
            <div>
              <label htmlFor="inputPassword3" className="form-label">
                Password
              </label>
            </div>
            <div className="md:col-span-3">
              <input type="password" className="form-input" id="inputPassword3" placeholder="Password" required />
            </div>
          </div>

          <div className="grid md:grid-cols-4">
            <div>
              <label htmlFor="inputPassword5" className="form-label">
                Re Password
              </label>
            </div>
            <div className="md:col-span-3">
              <input type="password" className="form-input" id="inputPassword5" placeholder="Retype Password" required />
            </div>
          </div>

          <div className="grid md:grid-cols-4">
            <div className="md:col-span-3 md:col-start-2">
              <div className="flex items-center gap-2">
                <input className="form-checkbox" type="checkbox" id="checkmeout" />
                <label className="font-medium text-default-600" htmlFor="checkmeout">
                  Check me out !
                </label>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-4">
            <div className="md:col-span-3 md:col-start-2">
              <button className="btn bg-info text-white hover:bg-info-hover" type="submit">
                <strong>Sign in</strong>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

const InlineForm = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Inline Form</h4>
      </div>
      <div className="card-body">
        <form className="grid lg:grid-cols-2 md:grid-cols-1 gap-3 items-center mb-5">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <label htmlFor="staticEmail2" className="sr-only hidden">
                Password
              </label>
              <input type="text" id="staticEmail2" value="email@example.com" readOnly className="bg-transparent border-0 text-default-700 text-sm focus:ring-0" />
            </div>

            <div>
              <label htmlFor="inputPassword2" className="sr-only hidden">
                Password
              </label>
              <input type="password" id="inputPassword2" placeholder="Password" className="form-input" />
            </div>

            <div>
              <button type="submit" className="btn bg-primary text-white hover:bg-primary-hover">
                Confirm identity
              </button>
            </div>
          </div>
        </form>
        <h6 className="text-base mb-2">Auto-sizing</h6>
        <form>
          <div className="grid lg:grid-cols-3 md:grid-cols-1 gap-2 items-center">
            <div className="lg:col-span-2 flex flex-wrap items-center gap-4">
              <div>
                <label className="hidden" htmlFor="inlineFormInput">
                  Name
                </label>
                <input type="text" className="form-input" id="inlineFormInput" placeholder="Jane Doe" />
              </div>
              <div>
                <label className="hidden" htmlFor="inlineFormInputGroup">
                  Username
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-s-md border border-default-300 bg-default-100 text-default-600 text-sm">@</span>
                  <input type="text" className="form-input rounded-s-none!" id="inlineFormInputGroup" placeholder="Username" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <input className="form-checkbox" type="checkbox" id="autoSizingCheck" />
                  <label className="font-medium text-default-600" htmlFor="autoSizingCheck">
                    Check me out !
                  </label>
                </div>
              </div>
              <div>
                <button type="submit" className="btn bg-primary text-white hover:bg-primary-hover">
                  Submit
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

const FormRow = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Form Row</h4>
      </div>
      <div className="card-body">
        <form>
          <div className="grid md:grid-cols-6 gap-base">
            <div className="md:col-span-3">
              <label htmlFor="inputEmail4" className="form-label">
                Email
              </label>
              <div>
                <input type="email" className="form-input" id="inputEmail4" placeholder="Email" required />
              </div>
            </div>

            <div className="md:col-span-3">
              <label htmlFor="inputPassword4" className="form-label">
                Password
              </label>
              <div>
                <input type="password" className="form-input" id="inputPassword4" placeholder="Password" required />
              </div>
            </div>

            <div className="md:col-span-6">
              <label htmlFor="inputAddress" className="form-label">
                Address
              </label>
              <div>
                <input type="text" className="form-input" id="inputAddress" placeholder="1234 Main St" required />
              </div>
            </div>

            <div className="md:col-span-6">
              <label htmlFor="inputAddress2" className="form-label">
                Address 2
              </label>
              <div>
                <input type="text" className="form-input" id="inputAddress2" placeholder="Apartment, studio, or floor" required />
              </div>
            </div>

            <div className="md:col-span-3">
              <label htmlFor="inputCity" className="form-label">
                City
              </label>
              <div>
                <input type="text" className="form-input" id="inputCity" required />
              </div>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="inputState" className="form-label">
                City
              </label>
              <select id="inputState" className="form-input">
                <option>Choose</option>
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </select>
            </div>

            <div className="md:col-span-1">
              <label htmlFor="inputZip" className="form-label">
                Zip
              </label>
              <div>
                <input type="text" className="form-input" id="inputZip" required />
              </div>
            </div>

            <div className="md:col-span-6">
              <div className="flex items-center gap-2 mb-3">
                <input className="form-checkbox border-0" type="checkbox" id="customCheck11" />
                <label className="font-medium text-default-600" htmlFor="customCheck11">
                  Check this custom checkbox
                </label>
              </div>

              <button className="btn bg-primary text-white hover:bg-primary-hover" type="submit">
                <strong>Sign in</strong>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

const FloatingLabels = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Floating Labels</h4>
      </div>
      <div className="card-body">
        <form>
          <div className="grid md:grid-cols-6 gap-base">
            <div className="md:col-span-3">
              <div className="relative">
                <input type="text" id="usernameInput" placeholder="" className="peer block w-full border border-default-300 rounded px-3 pt-5 pb-2 text-base focus:border-0 focus:ring focus:ring-default-300" />
                <label
                  htmlFor="usernameInput"
                  className="absolute left-3 top-2 text-default-500 text-sm transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-default-400 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-xs peer-focus:border-0 peer-focus:ring-0"
                >
                  Username
                </label>
              </div>
            </div>

            <div className="md:col-span-3">
              <div className="relative">
                <input type="text" id="fullnameInput" placeholder="" className="peer block w-full border border-default-300 rounded px-3 pt-5 pb-2 text-base focus:border-0 focus:ring focus:ring-default-300" />
                <label
                  htmlFor="fullnameInput"
                  className="absolute left-3 top-2 text-default-500 text-sm transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-default-400 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-xs peer-focus:border-0 peer-focus:ring-0"
                >
                  Full Name
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="relative">
                <input type="text" id="phoneInput" placeholder="" className="peer block w-full border border-default-300 rounded px-3 pt-5 pb-2 text-base focus:border-0 focus:ring focus:ring-default-300" />
                <label
                  htmlFor="phoneInput"
                  className="absolute left-3 top-2 text-default-500 text-sm transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-default-400 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-xs peer-focus:border-0 peer-focus:ring-0"
                >
                  Phone Number
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="relative">
                <input type="date" id="dobInput" placeholder="" className="peer block w-full border border-default-300 rounded px-3 pt-5 pb-2 text-base focus:border-0 focus:ring focus:ring-default-300" />
                <label
                  htmlFor="dobInput"
                  className="absolute left-3 top-2 text-default-500 text-xs transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-default-400 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-xs peer-focus:border-0 peer-focus:ring-0"
                >
                  Date of Birth
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="relative">
                <select className="peer block w-full border border-default-300 rounded px-3 pt-5 pb-2 text-base focus:border-0 focus:ring focus:ring-default-300" id="genderSelect" aria-label="Select gender">
                  <option defaultValue="">Choose...</option>
                  <option value="1">Male</option>
                  <option value="2">Female</option>
                  <option value="3">Other</option>
                </select>
                <label
                  htmlFor="genderSelect"
                  className="absolute left-3 top-2 text-default-500 text-xs transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-default-400 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-xs peer-focus:border-0 peer-focus:ring-0"
                >
                  Gender
                </label>
              </div>
            </div>

            <div className="md:col-span-4">
              <div className="relative">
                <input type="text" id="addressInput" placeholder="" className="peer block w-full border border-default-300 rounded px-3 pt-5 pb-2 text-base focus:border-0 focus:ring focus:ring-default-300" />
                <label
                  htmlFor="addressInput"
                  className="absolute left-3 top-2 text-default-500 text-sm transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-default-400 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-xs peer-focus:border-0 peer-focus:ring-0"
                >
                  Street Address
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="relative">
                <select className="peer block w-full border border-default-300 rounded px-3 pt-5 pb-2 text-base focus:border-0 focus:ring focus:ring-default-300" id="stateSelect" aria-label="Select state">
                  <option defaultValue="">Choose...</option>
                  <option value="1">California</option>
                  <option value="2">Texas</option>
                  <option value="3">Florida</option>
                </select>
                <label
                  htmlFor="stateSelect"
                  className="absolute left-3 top-2 text-default-500 text-xs transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-default-400 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-xs peer-focus:border-0 peer-focus:ring-0"
                >
                  State
                </label>
              </div>
            </div>

            <div className="md:col-span-3">
              <div className="relative">
                <input type="text" id="websiteInput" placeholder="" className="peer block w-full border border-default-300 rounded px-3 pt-5 pb-2 text-base focus:border-0 focus:ring focus:ring-default-300" />
                <label
                  htmlFor="websiteInput"
                  className="absolute left-3 top-2 text-default-500 text-sm transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-default-400 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-xs peer-focus:border-0 peer-focus:ring-0"
                >
                  Website (optional)
                </label>
              </div>
            </div>

            <div className="md:col-span-3">
              <div className="relative">
                <input type="text" id="bioTextarea" placeholder="" className="h-25 peer block w-full border border-default-300 rounded px-3 pt-5 pb-2 text-base focus:border-0 focus:ring focus:ring-default-300" />
                <label
                  htmlFor="bioTextarea"
                  className="absolute left-3 top-2 text-default-500 text-sm transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-default-400 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-xs peer-focus:border-0 peer-focus:ring-0"
                >
                  Short Bio
                </label>
              </div>
            </div>

            <div className="md:col-span-6">
              <button className="btn bg-success text-white hover:bg-success-hover" type="submit">
                <strong>Create Account</strong>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

const HorizontalFormLabelSizing = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Horizontal Form Label Sizing</h4>
      </div>
      <div className="card-body">
        <form className="space-y-6">
          <div className="grid md:grid-cols-6">
            <div>
              <label htmlFor="colFormLabelSm" className="text-xs block mb-2">
                &nbsp; Email&nbsp;
              </label>
            </div>
            <div className="md:col-span-5">
              <input type="email" className="form-input form-input-sm" id="colFormLabelSm" placeholder="col-form-label-sm" required />
            </div>
          </div>

          <div className="grid md:grid-cols-6">
            <div>
              <label htmlFor="colFormLabel" className="form-label">
                &nbsp; Email&nbsp;
              </label>
            </div>
            <div className="md:col-span-5">
              <input type="email" className="form-input" id="colFormLabel" placeholder="col-form-label" required />
            </div>
          </div>

          <div className="grid md:grid-cols-6">
            <div>
              <label htmlFor="colFormLabelLg" className="text-base block mb-2">
                &nbsp; Email&nbsp;
              </label>
            </div>
            <div className="md:col-span-5">
              <input type="email" className="form-input h-12! text-base!" id="colFormLabelLg" placeholder="col-form-label-lg" required />
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
