import PageBreadcrumb from '@/components/PageBreadcrumb'
import Sliders from './components/Sliders'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Range Slider" subtitle="Forms" />
      <div className="container">
        <Sliders />
      </div>
    </>
  )
}

export default Page
