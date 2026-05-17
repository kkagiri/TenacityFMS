import PageBreadcrumb from '@/components/PageBreadcrumb'
import SnowEditor from './components/SnowEditor'

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Text Editors" subtitle="Forms" />
      <div className="container">
        <div className="grid grid-cols-1 gap-base">
          <SnowEditor />
        </div>
      </div>
    </>
  )
}

export default Page
