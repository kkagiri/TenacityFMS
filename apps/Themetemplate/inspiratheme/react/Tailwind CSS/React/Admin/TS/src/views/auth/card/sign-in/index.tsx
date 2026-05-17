import authImg from '@/assets/images/auth.jpg'
import AuthLogo from '@/components/AuthLogo'
import { currentYear, META_DATA } from '@/config/constants'
import { Link } from 'react-router'
import Form from './components/Form'


const Page = () => {
  return (
    <div className="flex min-h-screen items-center p-12.5">
      <div className="container">
        <div className="flex justify-center">
          <div className="xl:w-5/6">
            <div className="card rounded-2xl">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="card-body relative p-12.5">
                  <div className="mb-7.5 flex flex-col items-center justify-center text-center">
                    <AuthLogo />
                    <h4 className="mt-7.5 mb-2 text-base font-bold">Welcome to Admin</h4>
                    <p className="text-default-400 mx-auto w-full lg:w-3/4">Let’s get you signed in. Enter your email and password to continue.</p>
                  </div>
                  <div className="rounded-md">
                    <Form />
                    <p className="text-default-400 mt-7.5 text-center">
                      New here?&nbsp;
                      <Link to="/auth/card/sign-up" className="text-primary font-semibold underline underline-offset-4">
                        Create an account
                      </Link>
                    </p>
                    <p className="text-default-400 mt-7.5 text-center">
                      © {currentYear}&nbsp;{META_DATA.name} - by&nbsp;<span>{META_DATA.author}</span>
                    </p>
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
  )
}

export default Page
