import logoBlack from '@/assets/images/logo-black.png'
import logo from '@/assets/images/logo.png'
import { META_DATA } from '@/config/constants'
import { Link } from 'react-router'

const navItems = [
  { name: 'Home', id: 'home' },
  { name: 'Services', id: 'services' },
  { name: 'Features', id: 'features' },
  { name: 'Plans', id: 'plans' },
  { name: 'Reviews', id: 'reviews' },
  { name: 'Blog', id: 'blog' },
  { name: 'Contact', id: 'contact' },
]

export default function Header() {
  return (
    <>
      <div id="alert" className="relative bg-[#1E1F27] dark:bg-primary text-white text-sm py-3 px-4 transition-all duration-300 hs-removing:opacity-0 hs-removing:-translate-x-3" role="alert">
        <div className="flex lg:items-center items-start justify-center relative">
          <p className="text-center italic font-medium">
            🚀 {META_DATA.name} is here! Now powered by Tailwind CSS 4.x, Bootstrap, multi-framework support, dark mode, and a completely refreshed UI. Upgrade today for the best experience!&nbsp;
            <a href={META_DATA.buyUrl} target="_blank" className="font-semibold text-white underline underline-offset-4 not-italic ms-2">
              Buy Now!
            </a>
          </p>
        </div>
      </div>

      <header className="dark:bg-body-bg bg-card">
        <nav className="container py-5">
          <div className="flex flex-wrap justify-between items-center">
            <div>
              <a href="/" className="inline-block">
                <img src={logoBlack} alt="dark logo" className="lg:h-8 h-6.5 dark:hidden block" />
              </a>
              <a href="/" className="inline-block">
                <img src={logo} alt="logo" className="lg:h-8 h-6.5 dark:block hidden" />
              </a>
            </div>

            <div className="flex items-center gap-x-2 lg:hidden">
              <button
                type="button"
                className="hs-collapse-toggle relative btn btn-icon py-1 border border-default-300"
                id="hs-navbar-alignment-collapse"
                aria-expanded="false"
                aria-controls="hs-navbar-alignment"
                aria-label="Toggle navigation"
                data-hs-collapse="#hs-navbar-alignment"
              >
                <svg className="size-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <line x1="3" x2="21" y1="6" y2="6" />
                  <line x1="3" x2="21" y1="12" y2="12" />
                  <line x1="3" x2="21" y1="18" y2="18" />
                </svg>
              </button>
            </div>

            <div id="hs-navbar-alignment" className="hs-collapse hidden w-full overflow-hidden transition-all duration-300 lg:block lg:w-auto" aria-labelledby="hs-navbar-alignment-collapse" role="region">
              <div className="flex flex-col lg:gap-1.25 gap-y-2 lg:flex-row lg:items-center lg:mt-0 mt-2.5">
                {navItems.map((item, idx) => (
                  <a key={idx} href={`#${item.id}`} className="lg:p-2 py-2 text-sm text-default-700 hover:text-primary">
                    {item.name}
                  </a>
                ))}
              </div>

              <div className="lg:hidden flex lg:items-center gap-x-2">
                <Link to="/auth/sign-in" className="btn font-semibold ps-2">
                  SIGN IN
                </Link>

                <Link to="/auth/sign-up" className="btn btn-sm bg-primary text-white hover:bg-primary-hover">
                  Sign Up
                </Link>
              </div>
            </div>

            <div className="lg:flex hidden lg:items-center gap-x-2">
              <Link to="/auth/sign-in" className="btn font-semibold ps-2">
                SIGN IN
              </Link>

              <Link to="/auth/sign-up" className="btn btn-sm bg-primary text-white hover:bg-primary-hover">
                Sign Up
              </Link>
            </div>
          </div>
        </nav>
      </header>
    </>
  )
}
