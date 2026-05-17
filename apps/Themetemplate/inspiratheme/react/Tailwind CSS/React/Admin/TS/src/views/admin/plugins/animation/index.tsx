import PageBreadcrumb from '@/components/PageBreadcrumb'
import Animations from './components/Animations'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Animation" subtitle="Miscellaneous" />
      <div className="container">
        <Animations />
      </div>
    </>
  )
}

export default Page
