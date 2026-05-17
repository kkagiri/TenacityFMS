import user1 from '@/assets/images/users/user-1.jpg'
import AuthLogo from '@/components/AuthLogo'
import { currentYear, META_DATA } from '@/config/constants'
import { Link } from 'react-router'


const Page = () => {
  return (
    <div className="flex min-h-screen items-center p-12.5">
      <div className="container">
        <div className="flex justify-center px-2.5">
          <div className="2xl:w-4/10 md:w-1/2 sm:w-2/3 w-full">
            <div className="mb-3 flex flex-col items-center justify-center text-center">
              <AuthLogo />
              <h4 className="font-bold text-base text-dark mt-5 mb-2">Login with PIN!</h4>
              <p className="text-default-400 mx-auto w-full lg:w-3/4 mb-4">This screen is locked. Enter your PIN to continue.</p>
            </div>
            <div className="card p-7.5 rounded-2xl">
              <form>
                <div className="mb-9 text-center">
                  <div className="border-default-300 mx-auto mb-3 size-20 rounded-full border-4">
                    <img src={user1} className="size-18 rounded-full" alt="thumbnail" />
                  </div>
                  <h5 className="text-lg">{META_DATA.username}</h5>
                </div>
                <div className="mb-5">
                  <label htmlFor="userEmail" className="form-label">
                    Enter your 6-digit code&nbsp;
                    <span className="text-danger">*</span>
                  </label>
                  <div className="two-factor flex gap-2">
                    <input type="text" className="form-input text-center" required inputMode="numeric" maxLength={1} />
                    <input type="text" className="form-input text-center" required inputMode="numeric" maxLength={1} />
                    <input type="text" className="form-input text-center" required inputMode="numeric" maxLength={1} />
                    <input type="text" className="form-input text-center" required inputMode="numeric" maxLength={1} />
                    <input type="text" className="form-input text-center" required inputMode="numeric" maxLength={1} />
                    <input type="text" className="form-input text-center" required inputMode="numeric" maxLength={1} />
                  </div>
                </div>
                <div>
                  <button type="submit" className="btn bg-primary w-full py-3 font-semibold text-white hover:bg-primary-hover">
                    Confirm
                  </button>
                </div>
              </form>
              <p className="text-default-400 mt-7.5 text-center">
                Not you? Return to&nbsp;
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
  )
}

export default Page
