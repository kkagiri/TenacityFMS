import user1 from '@/assets/images/users/user-1.jpg'
import AuthLogo from '@/components/AuthLogo'
import Icon from '@/components/wrappers/Icon'
import { currentYear, META_DATA } from '@/config/constants'
import { Link } from 'react-router'


const Page = () => {
  return (
    <div className="min-h-screen">
      <div className="flex h-full w-full">
        <div className="hidden w-full md:block">
          <div className="relative h-full overflow-hidden bg-[url('../images/auth.jpg')] bg-cover bg-center bg-no-repeat">
            <div className="from-zinc-800 via-zinc-800/80 to-zinc-800/50 absolute inset-0 flex items-end justify-center bg-linear-to-t p-9" />
          </div>
        </div>
        <div className="min-w-full md:min-w-106 md:max-w-118">
          <div className="card relative flex min-h-screen flex-col justify-between rounded-none p-12.5">
            <div className="mb-7.5 flex flex-col items-center justify-center text-center">
              <AuthLogo />
            </div>
            <div>
              <h4 className="font-bold mb-2 text-default-900 text-lg text-center">Lock Screen!</h4>
              <p className="text-default-400 mx-auto mb-4 w-full text-center lg:w-72">Let’s get you signed in. Enter your password to continue.</p>
              <form className="mt-9">
                <div className="mb-9 text-center">
                  <div className="border-default-300 mx-auto mb-3 size-20 rounded-full border-4">
                    <img src={user1} className="size-18 rounded-full" alt="thumbnail" />
                  </div>
                  <h5 className="text-base font-semibold">{META_DATA.username}</h5>
                </div>
                <div className="mb-6">
                  <label htmlFor="userPassword" className="form-label">
                    Password
                    <span className="text-danger">*</span>
                  </label>
                  <div className="input-icon-group">
                    <Icon icon="lock-password" className="input-icon" />
                    <input type="password" className="form-input" id="userPassword" placeholder="••••••••" required />
                  </div>
                </div>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex gap-2 items-center">
                    <input className="form-checkbox size-4.25!" type="checkbox" defaultChecked id="rememberMe" />
                    <label className="form-check-label" htmlFor="rememberMe">
                      Keep me signed in
                    </label>
                  </div>
                  <Link to="/auth/split/reset-pass" className="underline text-default-400">
                    Forgot Password?
                  </Link>
                </div>
                <div>
                  <button type="submit" className="btn bg-primary w-full py-3 font-semibold text-white hover:bg-primary-hover">
                    Sign In
                  </button>
                </div>
              </form>
              <p className="text-default-400 mt-7.5 text-center">
                Not you? Return to&nbsp;
                <Link to="/auth/split/sign-in" className="text-primary font-semibold underline underline-offset-4">
                  Sign in
                </Link>
              </p>
            </div>
            <p className="text-default-400 mt-7.5 text-center">
              © {currentYear} {META_DATA.name} - by <span>{META_DATA.author}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Page
