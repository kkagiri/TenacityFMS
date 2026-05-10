import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'

const Paginations = () => {
  return (
    <ul className="pagination pagination-rounded pagination-boxed justify-content-center mb-0">
      <li className="page-item">
        <Link className="page-link" to="" aria-label="Previous">
          <Icon icon="chevron-left" className="align-middle fs-lg" />
        </Link>
      </li>
      <li className="page-item">
        <Link className="page-link" to="">
          1
        </Link>
      </li>
      <li className="page-item active">
        <Link className="page-link" to="">
          2
        </Link>
      </li>
      <li className="page-item">
        <Link className="page-link" to="">
          3
        </Link>
      </li>
      <li className="page-item">
        <Link className="page-link" to="">
          4
        </Link>
      </li>
      <li className="page-item">
        <Link className="page-link" to="">
          5
        </Link>
      </li>
      <li className="page-item">
        <Link className="page-link" to="" aria-label="Next">
          <Icon icon="chevron-right" className="align-middle fs-lg" />
        </Link>
      </li>
    </ul>
  )
}

export default Paginations
