import checkMark from '@/assets/images/checkmark.png'
import AuthLogo from '@/components/AuthLogo'
import { currentYear, META_DATA } from '@/config/constants'


const Page = () => {
  return (
    <div className="flex min-h-screen items-center p-12.5">
      <div className="container">
        <div className="flex justify-center px-2.5">
          <div className="2xl:w-4/10 md:w-1/2 sm:w-2/3 w-full">
            <div className="mb-3 flex flex-col items-center justify-center text-center">
              <AuthLogo />
              <p className="text-default-400 mx-auto mt-6 mb-4 w-full lg:w-3/4">Awesome! You’ve read the important message like a pro.</p>
            </div>
            <div className="card p-7.5 rounded-2xl">
              <form>
                <div className="mt-3 mb-9">
                  <div className="bg-default-50 border-light mx-auto flex size-20 items-center justify-center rounded-full border border-dashed">
                    <img src={checkMark} alt="checkmark" className="size-16" />
                  </div>
                </div>
                <h4 className="mb-9 text-center text-lg font-bold">Well Done! Email verified Successfully</h4>
                <div>
                  <button type="submit" className="btn bg-primary w-full py-3 font-semibold text-white hover:bg-primary-hover">
                    Back to dashboard
                  </button>
                </div>
              </form>
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
