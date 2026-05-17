import svg404 from '@/assets/images/svg/404.svg'
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
                <div className="mb-5 flex flex-col items-center justify-center text-center">
                  <AuthLogo />
                </div>
                <div className="p-6 text-center">
                  <img src={svg404} alt="Maintenance" className="mx-auto md:size-64" />
                  <h3 className="mb-2 text-xl font-bold uppercase">Page Not Found</h3>
                  <p className="text-default-400 mx-auto">We couldn’t find the page you were looking for. It might have been moved or deleted.</p>
                  <div className="mt-8 flex items-center justify-center gap-1.5">
                    <Link to="/" className="btn bg-primary text-white hover:bg-primary-hover">
                      {' '}
                      Back to Home
                    </Link>
                    <button className="btn border-info text-info hover:bg-info hover:text-white">Search</button>
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
