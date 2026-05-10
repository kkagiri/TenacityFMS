import Icon from '@/components/wrappers/Icon'
import { FormControl } from 'react-bootstrap'
const Search = () => {
  return (
    <div id="search-box" className="app-search d-none d-xl-flex">
      <FormControl type="search" className="topbar-search" name="search" placeholder="Search for something..." />
      <Icon icon="search" className="app-search-icon text-muted" />
    </div>
  )
}
export default Search
