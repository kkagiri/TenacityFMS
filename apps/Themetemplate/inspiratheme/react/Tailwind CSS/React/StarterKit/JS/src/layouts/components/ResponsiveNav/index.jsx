import { useEffect, useState } from 'react'
import HorizontalNav from '../HorizontalNav'
import Sidenav from '../Sidenav'
const ResponsiveNav = () => {
  const [isMobile, setIsMobile] = useState(null)
  useEffect(() => {
    const checkScreen = () => setIsMobile(window.outerWidth < 992)
    checkScreen()
    window.addEventListener('resize', checkScreen)
    return () => window.removeEventListener('resize', checkScreen)
  }, [])
  if (isMobile === null) return null
  return isMobile ? <Sidenav /> : <HorizontalNav />
}
export default ResponsiveNav
