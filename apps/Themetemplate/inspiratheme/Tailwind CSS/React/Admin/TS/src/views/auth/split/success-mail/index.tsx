import checkMark from '@/assets/images/checkmark.png'
import AuthLogo from '@/components/AuthLogo'
import { currentYear, META_DATA } from '@/config/constants'


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
              <form>
                <div className="mt-3 mb-9">
                  <div className="bg-default-50 border-light mx-auto flex size-20 items-center justify-center rounded-full border border-dashed">
                    <img src={checkMark} alt="checkmark" className="size-16" />
                  </div>
                </div>
                <h4 className="mb-9 text-center text-base font-bold">Well Done! Email verified Successfully</h4>
                <div>
                  <button type="submit" className="btn bg-primary w-full py-3 font-semibold text-white hover:bg-primary-hover">
                    Back to dashboard
                  </button>
                </div>
              </form>
              <p className="text-default-400 mt-7.5 text-center">
                Not you? Return to&nbsp;
                <a href="/auth/split/sign-in" className="text-primary font-semibold underline underline-offset-4">
                  Sign in
                </a>
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
