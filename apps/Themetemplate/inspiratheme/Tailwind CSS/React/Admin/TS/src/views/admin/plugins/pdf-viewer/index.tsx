import PageBreadcrumb from '@/components/PageBreadcrumb'
import PdfView from './components/PdfView'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="PDF Viewer" subtitle="Miscellaneous" />
      <div className="grid lg:grid-cols-1 gap-base">
        <PdfView />
      </div>
    </>
  )
}

export default Page
