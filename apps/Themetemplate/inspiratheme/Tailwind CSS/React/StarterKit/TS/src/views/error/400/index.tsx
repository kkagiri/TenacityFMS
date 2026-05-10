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
                  <div className="error-glitch" data-text={400}>
                    400
                  </div>
                  <h3 className="mb-2 text-xl font-bold uppercase">Oops! Invalid Request</h3>
                  <p className="text-default-400">The request couldn’t be processed. Please check the URL or try again.</p>
                  <div className="flex justify-center gap-3 mt-7.5">
                    <Link to="" className="btn border border-secondary text-secondary hover:text-white hover:bg-secondary">
                      {' '}
                      Go Back
                    </Link>
                    <Link to="/" className="btn bg-primary text-white hover:bg-primary-hover">
                      {' '}
                      Back to Dashboard
                    </Link>
                  </div>
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
