import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Container } from 'react-bootstrap'
import LayoutInfo from '../LayoutInfo'
import LayoutSwitcher from '../LayoutSwitcher'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Compact" subtitle="Layouts" />
      <LayoutSwitcher attribute="width" value="compact" />
      <Container fluid="xl">
        <LayoutInfo option="width" value="compact" />
      </Container>
    </>
  )
}
export default Page
