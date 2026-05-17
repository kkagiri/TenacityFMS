import PageBreadcrumb from '@/components/PageBreadcrumb'
import Clipboard from './components/Clipboard'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Clipboard" subtitle="Plugins" />
      <div className="container">
        {/* <div className="grid xl:grid-cols-1 gap-base"> */}
        <Clipboard />
        {/* </div> */}
      </div>
    </>
  )
}

export default Page
