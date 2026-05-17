import AuthLogo from '@/components/AuthLogo'
import { currentYear, META_DATA } from '@/config/constants'
import { Link } from 'react-router'


const Page = () => {
  return (
    <>
      <div className="flex min-h-screen items-center p-12.5">
        <div className="container">
          <div className="flex justify-center px-2.5">
            <div className="2xl:w-4/10 md:w-1/2 sm:w-2/3 w-full">
              <div className="mb-3 flex flex-col items-center justify-center text-center">
                <AuthLogo />
                <h4 className="font-bold text-base text-dark mt-5 mb-2">Forgot Password?</h4>
                <p className="text-default-400 mx-auto w-full lg:w-3/4 mb-4">Enter your email address and we'll send you a link to reset your password.</p>
              </div>
              <div className="card p-7.5 rounded-2xl">
                <form>
                  <div className="mb-5">
                    <label htmlFor="userEmail" className="form-label">
                      Email address&nbsp;
                      <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <input type="email" className="form-input" id="userEmail" placeholder="you@example.com" required />
                    </div>
                  </div>
                  <div className="mb-6">
                    <div className="flex items-center gap-2">
                      <input className="form-checkbox form-checkbox-light size-4.5" type="checkbox" id="rememberMe" />
                      <label className="form-check-label" htmlFor="rememberMe">
                        Agree the Terms &amp; Policy
                      </label>
                    </div>
                  </div>
                  <div>
                    <button type="submit" className="btn bg-primary w-full py-3 font-semibold text-white hover:bg-primary-hover">
                      Send Request
                    </button>
                  </div>
                </form>
                <p className="text-default-400 mt-7.5 text-center">
                  Return to&nbsp;
                  <Link to="/auth/sign-in" className="text-primary font-semibold underline underline-offset-4">
                    Sign in
                  </Link>
                </p>
              </div>
              <p className="text-default-400 mt-7.5 text-center">
                © {currentYear}&nbsp;{META_DATA.name} - by&nbsp;<span>{META_DATA.author}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
