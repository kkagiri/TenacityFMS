import PageBreadcrumb from '@/components/PageBreadcrumb'
import ChecksRadioSwitches from './components/ChecksRadioSwitches'
import FloatingLabels from './components/FloatingLabels'
import InputGroup from './components/InputGroup'
import InputSizes from './components/InputSizes'
import InputTextfieldType from './components/InputTextfieldType'
import InputTypes from './components/InputTypes'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Basic Elements" subtitle="Forms" />

      <div className="container">
        <div className="grid grid-cols-1 gap-base">
          <InputTextfieldType />
          <InputTypes />
          <InputGroup />
          <FloatingLabels />
          <InputSizes />
          <ChecksRadioSwitches />
        </div>
      </div>
    </>
  )
}

export default Page
