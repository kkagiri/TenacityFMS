import Icon from '@/components/wrappers/Icon'
import { Card, CardBody, CardHeader, CardTitle, FormControl, FormLabel, FormSelect } from 'react-bootstrap'

const Organize = () => {
  return (
    <Card>
      <CardHeader className="d-block p-3">
        <CardTitle as="h4" className="mb-1">
          Organize
        </CardTitle>
        <p className="text-muted mb-0">Organize your product by selecting the appropriate brand, category, sub-category, status, and tags.</p>
      </CardHeader>
      <CardBody>
        <div className="mb-3">
          <FormLabel htmlFor="brand">Brand</FormLabel>
          <div className="app-search">
            <FormControl type="text" id="brand" placeholder="Enter brand name" />
            <Icon icon="stack-2" className="app-search-icon text-muted" />
          </div>
        </div>

        <div className="mb-3">
          <FormLabel htmlFor="category">
            Category <span className="text-danger">*</span>
          </FormLabel>
          <div className="app-search">
            <FormSelect className="form-control my-1 my-md-0" id="category">
              <option selected>Choose Category</option>
              <option value="Furniture">Furniture</option>
              <option value="Electronics">Electronics</option>
              <option value="Fashion">Fashion</option>
            </FormSelect>
            <Icon icon="category" className="app-search-icon text-muted" />
          </div>
        </div>

        <div className="mb-3">
          <FormLabel htmlFor="subCategory">
            Sub Category <span className="text-danger">*</span>
          </FormLabel>
          <div className="app-search">
            <FormSelect className="form-control my-1 my-md-0" id="subCategory">
              <option selected>Choose Sub Category</option>
              <option value="Chairs">Chairs</option>
              <option value="Sofas">Sofas</option>
              <option value="Tables">Tables</option>
            </FormSelect>
            <Icon icon="list-check" className="app-search-icon text-muted" />
          </div>
        </div>

        <div className="mb-3">
          <FormLabel htmlFor="statusOne">
            Status <span className="text-danger">*</span>
          </FormLabel>
          <div className="app-search">
            <FormSelect className="form-control my-1 my-md-0" id="statusOne">
              <option selected>Choose Status</option>
              <option value="Published">Published</option>
              <option value="Inactive">Inactive</option>
              <option value="Schedule">Schedule</option>
              <option value="Draft">Draft</option>
            </FormSelect>
            <Icon icon="wand" className="app-search-icon text-muted" />
          </div>
        </div>

        <div className="mb-0">
          <FormLabel htmlFor="tags">Tags</FormLabel>
          <div className="app-search">
            <FormControl type="text" id="tags" placeholder="Enter tags separated by commas" />
            <Icon icon="tag" className="app-search-icon text-muted" />
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

export default Organize
