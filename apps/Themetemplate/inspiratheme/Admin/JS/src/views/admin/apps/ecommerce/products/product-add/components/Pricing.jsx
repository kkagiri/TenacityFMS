import Icon from '@/components/wrappers/Icon'
import { Card, CardBody, CardHeader, CardTitle, FormControl, FormLabel, FormSelect } from 'react-bootstrap'
const Pricing = () => {
  return (
    <Card>
      <CardHeader className="d-block p-3">
        <CardTitle as="h4" className="mb-1">
          Pricing
        </CardTitle>
        <p className="text-muted mb-0">Set the base price and applicable discount for the product using the options below.</p>
      </CardHeader>
      <CardBody>
        <div className="mb-3">
          <FormLabel htmlFor="basePrice">
            Base Price <span className="text-danger">*</span>
          </FormLabel>
          <div className="app-search">
            <FormControl type="number" id="basePrice" placeholder="Enter base price (e.g., 199.99)" />
            <Icon icon="currency-dollar" className="app-search-icon text-muted" />
          </div>
        </div>

        <div className="mb-3">
          <FormLabel htmlFor="discount">
            Discount Type <span className="text-muted">(Optional)</span>
          </FormLabel>
          <div className="app-search">
            <FormSelect id="discount" className="form-control my-1 my-md-0">
              <option>Choose Discount</option>
              <option value="No Discount">No Discount</option>
              <option value="Flat Discount">Flat Discount</option>
              <option value="Percentage Discount">Percentage Discount</option>
            </FormSelect>
            <Icon icon="discount" className="app-search-icon text-muted" />
          </div>
        </div>

        <div className="mb-0">
          <FormLabel htmlFor="discountValue">
            Discount Value <span className="text-muted">(Optional)</span>
          </FormLabel>
          <div className="app-search">
            <FormControl type="number" id="discountValue" placeholder="Enter discount amount or percentage" />
            <Icon icon="tag" className="app-search-icon text-muted" />
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
export default Pricing
