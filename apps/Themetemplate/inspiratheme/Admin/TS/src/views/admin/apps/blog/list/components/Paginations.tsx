import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'
import { Pagination } from 'react-bootstrap'

const Paginations = () => {
  return (
    <Pagination className="pagination-rounded pagination-boxed justify-content-center mb-0 mt-4">
      <li className="page-item previous disabled">
        <Link to="" className="page-link">
          <Icon icon="chevron-left" />
        </Link>
      </li>
      <li className="page-item active">
        <Link to="" className="page-link">
          1
        </Link>
      </li>
      <li className="page-item">
        <Link to="" className="page-link">
          2
        </Link>
      </li>
      <li className="page-item">
        <Link to="" className="page-link">
          3
        </Link>
      </li>
      <li className="page-item">
        <Link to="" className="page-link">
          ...
        </Link>
      </li>
      <li className="page-item">
        <Link to="" className="page-link">
          5
        </Link>
      </li>
      <li className="page-item">
        <Link to="" className="page-link">
          6
        </Link>
      </li>
      <li className="page-item next">
        <Link to="" className="page-link">
          <Icon icon="chevron-right" />
        </Link>
      </li>
    </Pagination>
  )
}

export default Paginations
