import { META_DATA } from '@/config/constants'
import { Link } from 'react-router'
import PageMetaData from './PageMetaData'
import Icon from './wrappers/Icon'
const PageBreadcrumb = ({ title, subtitle }) => {
  return (
    <>
      <PageMetaData title={title} />

      <div className="page-title-head">
        <h4 className="page-main-title">{title}</h4>
        <div className="hidden items-center gap-1.25 text-sm font-semibold md:flex">
          <Link to="" className="text-sm font-medium">
            {META_DATA.name}
          </Link>
          <Icon icon="chevron-right" className="shrink-0 text-sm rtl:rotate-180"></Icon>
          {subtitle && (
            <>
              <Link to="" className="text-sm font-medium">
                {subtitle}
              </Link>
              <Icon icon="chevron-right" className="shrink-0 text-sm rtl:rotate-180"></Icon>
            </>
          )}
          <Link to="" className="text-default-400 text-sm font-medium" aria-current="page">
            {title}
          </Link>
        </div>
      </div>
    </>
  )
}
export default PageBreadcrumb
