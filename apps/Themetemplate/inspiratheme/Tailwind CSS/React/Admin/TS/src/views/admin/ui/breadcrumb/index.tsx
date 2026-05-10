import ComponentCard from '@/components/cards/ComponentCard'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Breadcrumb" subtitle="Base UI" />
      <div className="container">
        <div className="grid grid-cols-1 gap-base">
          <Basic />

          <WithIcon />
        </div>
      </div>
    </>
  )
}

export default Page

const Basic = () => {
  return (
    <ComponentCard title="Basic" isCollapsible>
      <nav className="py-2.5">
        <ol className="flex items-center whitespace-nowrap">
          <li className="text-default-400 inline-flex items-center truncate font-medium" aria-current="page">
            Home
          </li>
        </ol>
      </nav>
      <nav className="py-2.5">
        <ol className="flex items-center whitespace-nowrap">
          <li className="inline-flex items-center">
            <a className="text-default-600 hover:text-primary flex items-center font-medium" href="">
              Home
            </a>
            <Icon icon="chevron-right" className="text-default-400 m-0.75 text-base pe-1" />
          </li>
          <li className="text-default-400 inline-flex items-center truncate font-medium" aria-current="page">
            Library
          </li>
        </ol>
      </nav>
      <nav className="py-2.5">
        <ol className="flex items-center whitespace-nowrap">
          <li className="inline-flex items-center">
            <a className="text-default-600 hover:text-primary flex items-center font-medium" href="">
              Home
            </a>
            <Icon icon="chevron-right" className="text-default-400 m-0.75 text-base pe-1" />
          </li>
          <li className="inline-flex items-center">
            <a className="text-default-600 hover:text-primary flex items-center font-medium" href="">
              Library
            </a>
            <Icon icon="chevron-right" className="text-default-400 m-0.75 text-base pe-1" />
          </li>
          <li className="text-default-400 inline-flex items-center truncate font-medium" aria-current="page">
            Data
          </li>
        </ol>
      </nav>
    </ComponentCard>
  )
}

const WithIcon = () => {
  return (
    <ComponentCard title="With Icons" isCollapsible>
      <nav className="bg-light/50 p-2.5 mb-2.5">
        <ol className="flex items-center whitespace-nowrap">
          <li className="text-default-400 inline-flex items-center truncate font-medium" aria-current="page">
            <Icon icon="smart-home" className="me-2 text-sm" />
            Home
          </li>
        </ol>
      </nav>
      <nav className="bg-light/50 p-2.5 mb-2.5">
        <ol className="flex items-center whitespace-nowrap">
          <li className="inline-flex items-center">
            <a className="hover:text-primary flex items-center font-medium" href="">
              <Icon icon="smart-home" className="me-1.25" /> Home
            </a>
            <Icon icon="chevron-right" className="text-default-400 m-0.75 text-base pe-1" />
          </li>
          <li className="text-default-400 inline-flex items-center truncate font-medium" aria-current="page">
            Library
          </li>
        </ol>
      </nav>
      <nav className="bg-light/50 p-2.5">
        <ol className="flex items-center whitespace-nowrap">
          <li className="inline-flex items-center">
            <a className="hover:text-primary flex items-center font-medium" href="">
              <Icon icon="smart-home" className="me-1 text-sm" />
              Home
            </a>
            <Icon icon="chevron-right" className="text-default-400 m-0.75 text-base pe-1" />
          </li>
          <li className="inline-flex items-center">
            <a className="hover:text-primary flex items-center font-medium" href="">
              Library
            </a>
            <Icon icon="chevron-right" className="text-default-400 m-0.75 text-base pe-1" />
          </li>
          <li className="text-default-400 inline-flex items-center truncate font-medium" aria-current="page">
            Data
          </li>
        </ol>
      </nav>
    </ComponentCard>
  )
}
