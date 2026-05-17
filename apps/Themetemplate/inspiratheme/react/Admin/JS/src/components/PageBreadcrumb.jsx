import { META_DATA } from '@/config/constants'
import { Link } from 'react-router'
import PageMetaData from './PageMetaData'
const PageBreadcrumb = ({ title, subtitle }) => {
  return (
    <>
      <PageMetaData title={title} />

      <div className="page-title-head d-flex align-items-center">
        <div className="flex-grow-1">
          <h4 className="page-main-title m-0">{title}</h4>
        </div>
        <div className="text-end">
          <ol className="breadcrumb m-0 py-0">
            <li className="breadcrumb-item">
              <Link to="">{META_DATA.name}</Link>
            </li>
            {subtitle && (
              <li className="breadcrumb-item">
                <Link to="">{subtitle}</Link>
              </li>
            )}
            <li className="breadcrumb-item active">{title}</li>
          </ol>
        </div>
      </div>
    </>
  )
}
export default PageBreadcrumb
