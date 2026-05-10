import PageBreadcrumb from '@/components/PageBreadcrumb'
import InputTouchspin from './components/InputTouchspin'
import ReactInputMask from './components/ReactInputMask'
import ReactTypeahead from './components/ReactTypeahead'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Other Plugins" subtitle="Forms" />
      <div className="container">
        <div className="grid grid-cols-1 gap-base">
          <ReactInputMask />
          <ReactTypeahead />
          <InputTouchspin />
        </div>
      </div>
    </>
  )
}

export default Page
