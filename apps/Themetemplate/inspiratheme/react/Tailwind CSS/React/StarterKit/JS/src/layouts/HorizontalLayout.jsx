import Customizer from '@/layouts/components/Customizer'
import Footer from '@/layouts/components/Footer'
import TopBar from '@/layouts/components/TopBar'
import ResponsiveNav from './components/ResponsiveNav'
const HorizontalLayout = ({ children }) => {
  return (
    <>
      <div className="wrapper">
        <TopBar />
        <ResponsiveNav />
        <div className="page-content">
          <main>
            <div className="container-fluid">{children}</div>
          </main>
          <Footer />
        </div>
      </div>
      <Customizer />
    </>
  )
}
export default HorizontalLayout
