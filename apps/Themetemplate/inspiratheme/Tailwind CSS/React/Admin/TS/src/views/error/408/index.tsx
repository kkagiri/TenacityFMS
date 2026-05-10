import AuthLogo from '@/components/AuthLogo'
import { currentYear, META_DATA } from '@/config/constants'


const Page = () => {
  return (
    <div className="flex min-h-screen items-center">
      <div className="container">
        <div className="flex justify-center lg:p-0 p-12.5">
          <div className="2xl:w-4/10 md:w-1/2 sm:w-2/3 w-full">
            <div className="p-7.5">
              <div className="mb-5 flex flex-col items-center justify-center text-center">
                <AuthLogo />
              </div>
              <div className="p-9 text-center">
                <div className="error-wave-container justify-center gap-1">
                  <span className="error-wave-char">4</span>
                  <span className="error-wave-char">0</span>
                  <span className="error-wave-char">8</span>
                </div>
                <h3 className="mb-2 text-xl font-bold uppercase">Connection Timed Out</h3>
                <p className="text-default-400">The request took too long to respond. Please check your connection and try again.</p>
                <div className="mt-8 flex items-center justify-center gap-1.5">
                  <button className="btn bg-primary text-white hover:bg-primary-hover">Try Again</button>
                  <button className="btn border-info text-info hover:bg-info hover:text-white">Get Help</button>
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
  )
}

export default Page
