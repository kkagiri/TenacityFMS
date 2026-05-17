import PageBreadcrumb from '@/components/PageBreadcrumb'
import Gallery from './components/Gallery'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Gallery" subtitle="Pages" />
      <div className="container-fluid">
        <Gallery />
      </div>
    </>
  )
}

export default Page
