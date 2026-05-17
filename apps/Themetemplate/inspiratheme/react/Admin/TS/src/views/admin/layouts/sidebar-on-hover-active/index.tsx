import PageBreadcrumb from '@/components/PageBreadcrumb'
import LayoutInfo from '../LayoutInfo'
import LayoutSwitcher from '../LayoutSwitcher'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="On Hover Active" subtitle="Layouts" />
      <LayoutSwitcher attribute="sidenavSize" value="on-hover-active" />
      <LayoutInfo option="sidenavSize" value="on-hover-active" />
    </>
  )
}

export default Page
