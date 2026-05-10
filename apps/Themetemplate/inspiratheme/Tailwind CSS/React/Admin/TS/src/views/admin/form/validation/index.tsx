import PageBreadcrumb from '@/components/PageBreadcrumb'
import BrowserDefault from './components/BrowserDefault'
import CustomValidation from './components/CustomValidation'
import ServerSide from './components/ServerSide'
import SupportedElements from './components/SupportedElements'
import Tooltips from './components/Tooltips'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Validation" subtitle="Forms" />
      <div className="container">
        <div className="grid grid-cols-1 gap-base">
          <CustomValidation />
          <Tooltips />
          <ServerSide />
          <SupportedElements />
          <BrowserDefault />
        </div>
      </div>
    </>
  )
}

export default Page
