import logo from '@/assets/images/logo.png'
import { currentYear, META_DATA } from '@/config/constants'
import { cn } from '@/utils/helpers'
import { Icon as IconifyIcon } from '@iconify/react'
import { Link } from 'react-router'
import { footerLinks, socialLinks } from './data'

const Footer = () => {
  return (
    <footer className="lg:pt-26 pt-12 pb-2.5 bg-[#1e1f27]">
      <div className="container">
        <div className="grid xl:grid-cols-12 grid-cols-1 gap-7.5">
          <div className="xl:col-span-3">
            <img src={logo} alt="logo" height={30} />
            <p className="my-5 text-sm text-white/50">{META_DATA.name} is the top-selling admin dashboard template on WrapBootstrap, known for its sleek design, flexibility, and powerful features. Build modern web applications with ease using the best in class!</p>
            <div className="flex gap-2.5 mt-7.5 mb-2.5">
              {socialLinks.map((link, idx) => (
                <Link to={link.url} className="btn btn-sm btn-icon rounded-full bg-dark text-white" title={link.title} key={idx}>
                  <IconifyIcon icon={link.icon} className="text-sm"></IconifyIcon>
                </Link>
              ))}
            </div>
          </div>

          <div className="xl:col-span-9 lg:w-187.75 lg:ms-auto">
            <div className="grid md:grid-cols-3 grid-cols-2 gap-7.5">
              {footerLinks.map((section, index) => (
                <div key={index}>
                  <h5 className="text-white mb-7.5 ps-2.5">{section.title}</h5>
                  <ul className="flex flex-col">
                    {section.links.map((link, i) => (
                      <li key={i} className={`py-2 px-4 text-white/50 ${i === 0 && 'pt-0'}`}>
                        <Link to={link.url} className="hover:text-white/80">
                          {link.name}
                          {link.badge && <span className={cn(`badge text-white ms-2.5`, link.badge.variant)}>{link.badge.title}</span>}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-15">
          <div className="text-center">
            <p className="mb-7.5 text-white/50">
              © 2014 - {currentYear}&nbsp;
              {META_DATA.name} By <span className="fw-semibold">{META_DATA.author}</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
