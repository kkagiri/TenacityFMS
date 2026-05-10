import logoBlack from '@/assets/images/logo-black.png'
import logo from '@/assets/images/logo.png'
import Icon from '@/components/wrappers/Icon'
import { META_DATA } from '@/config/constants'
import { useLayoutContext } from '@/context/useLayoutContext'
import useScrollEvent from '@/hooks/useScrollEvent'
import { Link } from 'react-router'
import { useState } from 'react'
import { Alert, Button, Container, Nav, Navbar, NavbarCollapse, NavbarToggle, NavLink } from 'react-bootstrap'

const navItems = ['Home', 'Services', 'Features', 'Plans', 'Reviews', 'Blog', 'Contact']

export default function Header() {
  const { theme, updateSettings } = useLayoutContext()

  const toggleTheme = () => {
    if (theme === 'dark') {
      updateSettings({ theme: 'light' })
      return
    }
    updateSettings({ theme: 'dark' })
    return
  }
  const [isCollapsed, setIsCollapsed] = useState(true)
  const { scrollY } = useScrollEvent()

  return (
    <>
      <Alert variant="primary" className="top-alert text-center mb-0 rounded-0" dismissible closeVariant="white">
        <div className="fst-italic fw-medium">
          🚀 INSPINIA 5.x is here! Now with Bootstrap 5, dark mode, and a refreshed UI. Upgrade today for the best experience!&nbsp;
          <a href={META_DATA.buyUrl} target="_blank" rel="noopener noreferrer" className="fw-semibold fst-normal text-white text-decoration-underline link-offset-3 ms-2">
            Buy Now!
          </a>
        </div>
      </Alert>

      <header>
        <Navbar expand="lg" className={`py-3 sticky-top ${scrollY > 100 && 'top-scroll-up top-fixed'}`} id="landing-navbar">
          <Container>
            <div className="auth-brand mb-0">
              <a href="/" className="logo-dark">
                <img src={logoBlack} alt="dark logo" height={32} />
              </a>
              <a href="/" className="logo-light">
                <img src={logo} alt="logo" height={32} />
              </a>
            </div>

            <NavbarToggle aria-controls="navbarSupportedContent" onClick={() => setIsCollapsed(!isCollapsed)} />
            <NavbarCollapse in={!isCollapsed} id="navbarSupportedContent">
              <Nav className="fw-medium gap-2 fs-sm mx-auto mt-2 mt-lg-0">
                {navItems.map((item, idx) => (
                  <li className="nav-item" key={idx}>
                    <NavLink className="nav-link" href={`#${item.toLowerCase()}`}>
                      {item}
                    </NavLink>
                  </li>
                ))}
              </Nav>
              <div>
                <Button variant="link" className="btn-icon fw-semibold text-body" onClick={toggleTheme}>
                  <Icon icon="contrast" className="fs-22" />
                </Button>
                &nbsp;
                <Link to="/auth/sign-in" className="btn btn-link fw-semibold text-body ps-2">
                  SIGN IN
                </Link>
                &nbsp;
                <Link to="/auth/sign-up" className="btn btn-sm btn-primary">
                  Sign Up
                </Link>
              </div>
            </NavbarCollapse>
          </Container>
        </Navbar>
      </header>
    </>
  )
}
