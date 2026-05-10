import Customizer from '@/layouts/components/Customizer'
import Footer from '@/layouts/components/Footer'
import Sidenav from '@/layouts/components/Sidenav'
import TopBar from '@/layouts/components/TopBar'
const VerticalLayout = ({ children }) => {
  return (
    <>
      <div className="wrapper">
        <TopBar />
        <Sidenav />
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
export default VerticalLayout
