import AuthLogo from '@/components/AuthLogo'
import { currentYear, META_DATA } from '@/config/constants'
import { Link } from 'react-router'


const Page = () => {
  return (
    <>
      <div className="flex min-h-screen items-center">
        <div className="container">
          <div className="flex justify-center lg:p-0 p-12.5">
            <div className="2xl:w-4/10 md:w-1/2 sm:w-2/3 w-full">
              <div className="p-7.5">
                <div className="mb-4 flex flex-col items-center justify-center text-center">
                  <AuthLogo />
                </div>
                <div className="p-3 text-center">
                  <div className="error-wave-container justify-center gap-1">
                    <span className="error-wave-char">4</span>
                    <span className="error-wave-char">0</span>
                    <span className="error-wave-char">1</span>
                  </div>
                  <h3 className="mb-2 text-xl font-bold uppercase">Unauthorized Access</h3>
                  <p className="text-default-400 mb-4">You are not authorized to access this page.</p>
                  <Link to="" className="btn bg-primary mt-6 text-white hover:bg-primary-hover">
                    {' '}
                    Return Home
                  </Link>
                </div>
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
