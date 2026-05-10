import PageBreadcrumb from '@/components/PageBreadcrumb'
import LayoutInfo from '../LayoutInfo'
import LayoutSwitcher from '../LayoutSwitcher'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Horizontal" subtitle="Layouts" />
      <LayoutSwitcher attribute="orientation" value="horizontal" />
      <LayoutInfo option="orientation" value="horizontal" />
    </>
  )
}
export default Page
