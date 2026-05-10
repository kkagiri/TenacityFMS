import authImg from '@/assets/images/auth.jpg'
import logoBlack from '@/assets/images/logo-black.png'
import logo from '@/assets/images/logo.png'
import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'
import CountdownTimer from './components/CountdownTimer'


const Page = () => {
  return (
    <>
      <div className="flex min-h-screen items-center p-12.5">
        <div className="container">
          <div className="flex justify-center">
            <div className="xl:w-5/6">
              <div className="card rounded-2xl">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  <div className="card-body relative p-12.5">
                    <div className="mb-7.5 flex flex-col items-center justify-center text-center">
                      <Link to="/" className="auth-logo">
                        <img src={logoBlack} alt="logo" className="flex dark:hidden" />
                        <img src={logo} alt="dark logo" className="hidden dark:flex" />
                      </Link>
                      <h4 className="mt-5 mb-2 text-base font-bold">Big things are on the Way</h4>
                      <p className="text-default-400 mx-auto w-full lg:w-3/4">We’re working hard to bring you something amazing. Stay tuned!</p>
                    </div>
                    <div className="my-7.5">
                      <CountdownTimer />
                    </div>
                    <div className="bg-[linear-gradient(90deg,#6658dd_0%,#f1556c_100%)] bg-clip-text text-center text-lg! font-bold text-transparent" data-text="Stay tunned!">
                      Stay tunned!
                    </div>
                    <div className="relative mx-auto mt-5 flex w-auto items-center overflow-hidden rounded-md lg:w-sm">
                      <input type="text" placeholder="Enter email..." className="border-default-300 text-default-500 w-full rounded-md border py-3 ps-10 pe-28 text-sm font-semibold" />
                      <Icon icon="mail" className="text-default-400 absolute start-3 text-lg" />
                      <button type="button" className="bg-secondary absolute end-0 rounded-md rounded-s-none px-6 py-3.25 text-sm font-medium text-white transition">
                        Notify me!
                      </button>
                    </div>
                  </div>
                  <div className="relative hidden h-full overflow-hidden rounded-e-2xl bg-cover bg-center object-cover lg:block" style={{ backgroundImage: `url("${authImg}")` }}>
                    <div className="absolute inset-0 flex items-end justify-center rounded-e-sm p-9 [background:linear-gradient(to_top,#313a46,rgba(49,58,70,.8),rgba(49,58,70,.5))]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
