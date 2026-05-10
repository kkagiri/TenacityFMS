import Icon from '@/components/wrappers/Icon'
import { Card, CardBody, CardHeader, CardTitle, Pagination } from 'react-bootstrap'
export const DefaultPagination = () => {
  const items = []
  for (let number = 1; number <= 3; number++) {
    items.push(<Pagination.Item key={number}>{number}</Pagination.Item>)
  }
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Default Pagination</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted fs-sm">
          Use <code>.pagination</code> inside <code>&lt;nav&gt;</code>
          for accessible, easy-to-click page links.
        </p>
        <Pagination className="mb-0">
          <Pagination.Prev>Previous</Pagination.Prev>
          {items}
          <Pagination.Next>Next</Pagination.Next>
        </Pagination>
      </CardBody>
    </Card>
  )
}
export const AlignmentPagination = () => {
  const items = []
  for (let number = 1; number <= 3; number++) {
    items.push(<Pagination.Item key={number}>{number}</Pagination.Item>)
  }
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Alignment</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted fs-sm">
          Align pagination using flexbox utilities, such as
          <code>.justify-content-center</code> to center it.
        </p>
        <Pagination className="justify-content-center">
          <Pagination.Prev>Previous</Pagination.Prev>
          {items}
          <Pagination.Next>Next</Pagination.Next>
        </Pagination>
        <Pagination className="justify-content-end">
          <Pagination.Prev>Previous</Pagination.Prev>
          {items}
          <Pagination.Next>Next</Pagination.Next>
        </Pagination>
      </CardBody>
    </Card>
  )
}
export const CustomColorPagination = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Custom Color Pagination</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted fs-sm">
          Add classes like <code>.pagination-primary</code>,<code>.pagination-info</code>, or <code>.pagination-secondary</code> to customize pagination color.
        </p>
        <Pagination className="pagination-boxed pagination-info">
          <Pagination.Prev>
            <Icon icon="chevron-left" className="align-middle fs-lg" />
          </Pagination.Prev>
          <Pagination.Item>1</Pagination.Item>
          <Pagination.Item active>2</Pagination.Item>
          <Pagination.Item>3</Pagination.Item>
          <Pagination.Item>4</Pagination.Item>
          <Pagination.Item>5</Pagination.Item>
          <Pagination.Next>
            <Icon icon="chevron-right" className="align-middle fs-lg" />
          </Pagination.Next>
        </Pagination>
        <Pagination className="pagination-boxed pagination-secondary mb-0">
          <Pagination.Prev>
            <Icon icon="chevron-left" className="align-middle fs-lg" />
          </Pagination.Prev>
          <Pagination.Item>1</Pagination.Item>
          <Pagination.Item>2</Pagination.Item>
          <Pagination.Item active>3</Pagination.Item>
          <Pagination.Item>4</Pagination.Item>
          <Pagination.Item>5</Pagination.Item>
          <Pagination.Next>
            <Icon icon="chevron-right" className="align-middle fs-lg" />
          </Pagination.Next>
        </Pagination>
      </CardBody>
    </Card>
  )
}
export const DisabledAndActive = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Disabled and active states</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted fs-sm">
          Add <code>.disabled</code> and <code>tabindex={-1}</code> to
          <code>.page-item</code> to make it non-interactive.
        </p>
        <Pagination className="mb-0">
          <Pagination.Prev disabled>Previous</Pagination.Prev>
          <Pagination.Item>{1}</Pagination.Item>
          <Pagination.Item active>{2}</Pagination.Item>
          <Pagination.Item>{3}</Pagination.Item>
          <Pagination.Next>Next</Pagination.Next>
        </Pagination>
      </CardBody>
    </Card>
  )
}
export const CustomIconPagination = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Custom Icon Pagination</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted fs-sm">
          Add icons like
          <code>&lt;i class=&quot;ti ti-chevron-***&quot;&gt;&lt;/i&gt;</code> or SVGs inside
          <code>.page-link</code> for custom pagination arrows.
        </p>
        <Pagination className="pagination-boxed">
          <Pagination.Prev>
            <Icon icon="chevron-left" className="align-middle fs-lg" />
          </Pagination.Prev>
          <Pagination.Item>1</Pagination.Item>
          <Pagination.Item active>2</Pagination.Item>
          <Pagination.Item>3</Pagination.Item>
          <Pagination.Item>4</Pagination.Item>
          <Pagination.Item>5</Pagination.Item>
          <Pagination.Next>
            <Icon icon="chevron-right" className="align-middle fs-lg" />
          </Pagination.Next>
        </Pagination>
        <Pagination className="pagination-boxed m-0">
          <Pagination.Prev>
            <Icon icon="chevron-left" className="align-middle fs-lg" />
          </Pagination.Prev>
          <Pagination.Item>1</Pagination.Item>
          <Pagination.Item>2</Pagination.Item>
          <Pagination.Item active>3</Pagination.Item>
          <Pagination.Item>4</Pagination.Item>
          <Pagination.Item>5</Pagination.Item>
          <Pagination.Next>
            <Icon icon="chevron-right" className="align-middle fs-lg" />
          </Pagination.Next>
        </Pagination>
      </CardBody>
    </Card>
  )
}
export const SizingPagination = () => {
  const items = []
  for (let number = 1; number <= 3; number++) {
    items.push(<Pagination.Item key={number}>{number}</Pagination.Item>)
  }
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Sizing</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted fs-sm">
          Use <code>.pagination-lg</code> or
          <code>.pagination-sm</code> to change pagination size.
        </p>
        <nav>
          <Pagination size="lg">
            <Pagination.Prev />
            {items}
            <Pagination.Next />
          </Pagination>
          <Pagination size="sm" className="mb-0">
            <Pagination.Prev />
            {items}
            <Pagination.Next />
          </Pagination>
        </nav>
      </CardBody>
    </Card>
  )
}
export const BoxedPagination = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Boxed Pagination</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted fs-sm">
          Use <code>.pagination-boxed</code> with
          <code>.pagination</code> to give pagination items a boxed appearance.
        </p>
        <nav>
          <Pagination className="pagination-boxed">
            <Pagination.Prev />
            <Pagination.Item>1</Pagination.Item>
            <Pagination.Item>2</Pagination.Item>
            <Pagination.Item active>3</Pagination.Item>
            <Pagination.Item>4</Pagination.Item>
            <Pagination.Item>5</Pagination.Item>
            <Pagination.Next />
          </Pagination>
          <Pagination className="pagination-lg pagination-boxed">
            <Pagination.Prev />
            <Pagination.Item>1</Pagination.Item>
            <Pagination.Item>2</Pagination.Item>
            <Pagination.Item active>3</Pagination.Item>
            <Pagination.Item>4</Pagination.Item>
            <Pagination.Item>5</Pagination.Item>
            <Pagination.Next />
          </Pagination>
          <Pagination className="pagination-sm pagination-boxed mb-0">
            <Pagination.Prev />
            <Pagination.Item>1</Pagination.Item>
            <Pagination.Item>2</Pagination.Item>
            <Pagination.Item active>3</Pagination.Item>
            <Pagination.Item>4</Pagination.Item>
            <Pagination.Item>5</Pagination.Item>
            <Pagination.Next />
          </Pagination>
        </nav>
      </CardBody>
    </Card>
  )
}
export const RoundedPagination = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Rounded Pagination</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted fs-sm">
          Use <code>.pagination-rounded</code> with
          <code>.pagination</code> to create rounded pagination links.
        </p>
        <nav>
          <Pagination className="pagination-rounded pagination-boxed mb-0">
            <Pagination.Prev />
            <Pagination.Item>1</Pagination.Item>
            <Pagination.Item>2</Pagination.Item>
            <Pagination.Item active>3</Pagination.Item>
            <Pagination.Item>4</Pagination.Item>
            <Pagination.Item>5</Pagination.Item>
            <Pagination.Next />
          </Pagination>
        </nav>
      </CardBody>
    </Card>
  )
}
export const SoftPagination = () => {
  return (
    <Card title="Soft Pagination">
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Soft Pagination</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted fs-sm">
          Use <code>.pagination-soft-**</code> with
          <code>.pagination</code> for a soft-colored pagination style.
        </p>
        <nav>
          <Pagination className="pagination-soft-danger pagination-boxed mb-0">
            <Pagination.Prev />
            <Pagination.Item>1</Pagination.Item>
            <Pagination.Item>2</Pagination.Item>
            <Pagination.Item active>3</Pagination.Item>
            <Pagination.Item>4</Pagination.Item>
            <Pagination.Item>5</Pagination.Item>
            <Pagination.Next />
          </Pagination>
        </nav>
      </CardBody>
    </Card>
  )
}
