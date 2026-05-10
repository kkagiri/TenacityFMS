import PageBreadcrumb from '@/components/PageBreadcrumb'
import TextDiff from './components/TextDiff'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Text Diff" subtitle="Plugins" />
      <div className="grid xl:grid-cols-1 gap-base">
        <TextDiff />
      </div>
    </>
  )
}

export default Page
