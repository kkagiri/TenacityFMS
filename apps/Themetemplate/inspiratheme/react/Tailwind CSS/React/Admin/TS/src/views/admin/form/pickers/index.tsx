import PageBreadcrumb from '@/components/PageBreadcrumb'
import ColorPicker from './components/ColorPicker'
import DataPicker from './components/DataPicker'
import Pickers from './components/Pickers'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Pickers" subtitle="Forms" />
      <div className="container">
        <div className="grid grid-cols-1 gap-base">
          <Pickers />
          <DataPicker />
          <ColorPicker />
        </div>
      </div>
    </>
  )
}

export default Page
