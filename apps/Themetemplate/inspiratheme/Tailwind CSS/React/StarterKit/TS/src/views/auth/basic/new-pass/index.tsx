import AuthLogo from '@/components/AuthLogo'
import { currentYear, META_DATA } from '@/config/constants'
import { Link } from 'react-router'
import NewPassForm from './components/NewPassForm'


const Page = () => {
  return (
    <div className="flex min-h-screen items-center p-12.5">
      <div className="container">
        <div className="flex justify-center px-2.5">
          <div className="2xl:w-4/10 md:w-1/2 sm:w-2/3 w-full">
            <div className="mb-3 flex flex-col items-center justify-center text-center">
              <AuthLogo />
              <h4 className="font-bold text-base text-dark mt-5 mb-2">Setup New Password!</h4>
              <p className="text-default-400 mx-auto w-full lg:w-3/4 mb-4">We've emailed you a 6-digit verification code. Please enter it below to confirm your email address</p>
            </div>
            <div className="card p-7.5 rounded-2xl">
              <NewPassForm />
              <p className="text-default-400 my-9 text-center">
                Don’t have a code?&nbsp;
                <Link to="" className="text-primary font-semibold underline underline-offset-3">
                  Resend
                </Link>
                &nbsp;or&nbsp;
                <Link to="" className="text-primary font-semibold underline underline-offset-3">
                  Call Us
                </Link>
              </p>
              <p className="text-default-400 text-center">
                Return to&nbsp;
                <Link to="/auth/sign-in" className="underline text-primary font-semibold">
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
