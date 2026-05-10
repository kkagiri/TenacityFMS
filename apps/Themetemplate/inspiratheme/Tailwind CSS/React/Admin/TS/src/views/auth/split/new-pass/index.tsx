import AuthLogo from '@/components/AuthLogo'
import { currentYear, META_DATA } from '@/config/constants'
import { Link } from 'react-router'
import NewPassForm from './components/NewPassForm'


const Page = () => {
  return (
    <>
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
                <h4 className="font-bold mb-2 text-default-900 text-lg text-center">Setup New Password!</h4>
                <p className="text-default-400 mx-auto w-full text-center lg:w-72">We've emailed you a 6-digit verification code. Please enter it below to confirm your Email Address..</p>
                <NewPassForm />
              </div>
              <p className="text-default-400 mt-7.5 text-center">
                Don’t have a code?&nbsp;
                <Link to="" className="text-primary font-semibold underline underline-offset-3">
                  Resend
                </Link>
                &nbsp;or&nbsp;
                <Link to="" className="text-primary font-semibold underline underline-offset-3">
                  Call Us
                </Link>
              </p>
              <p className="text-default-400 mt-7.5 text-center">
                Return to&nbsp;
                <Link to="/auth/split/sign-in" className="text-primary font-semibold underline underline-offset-4">
                  Sign in
                </Link>
              </p>
              <p className="text-default-400 mt-7.5 text-center">
                © {currentYear} {META_DATA.name} - by <span>{META_DATA.author}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
