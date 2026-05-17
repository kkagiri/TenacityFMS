import Icon from '@/components/wrappers/Icon'
import { useState } from 'react'
import { Card, CardBody, CardHeader, CardTitle, ListGroup, ListGroupItem } from 'react-bootstrap'
import { ReactSortable, Sortable } from 'react-sortablejs'
import { groupedSortableData, groupedSortableDataWithLabels } from './data'

const sortableOptions: Partial<Sortable.Options> = {
  group: 'grouped-sortable',
  animation: 150,
  ghostClass: 'sortable-item-ghost',
  fallbackOnBody: true,
  swapThreshold: 0.65,
}

const SortableGroup = ({ item }: { item: (typeof groupedSortableData)[number] }) => {
  const [list, setList] = useState(item.children)

  return (
    <ListGroupItem key={item.id}>
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div className="d-flex align-items-center gap-2">
          <Icon icon={item.icon} className="fs-4 text-primary" />
          <h5 className="mb-0 fw-semibold">{item.title}</h5>
        </div>
        <span className={`badge bg-primary-subtle text-${item.label.variant}`}>{item.label.text}</span>
      </div>
      <ListGroup className="nested-sortable border-0">
        <ReactSortable list={list} setList={setList} {...sortableOptions}>
          {list.map((child) => {
            return (
              <ListGroupItem key={child.id}>
                <Icon icon={child.icon} className="fs-sm me-2 text-muted" />
                {child.title}
              </ListGroupItem>
            )
          })}
        </ReactSortable>
      </ListGroup>
    </ListGroupItem>
  )
}

const SortableWithIcons = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sortable with Icons with Labels</CardTitle>
      </CardHeader>
      <CardBody>
        <ListGroup className="border-dashed">
          {groupedSortableDataWithLabels.map((item) => {
            return <SortableGroup key={item.id} item={item} />
          })}
        </ListGroup>
      </CardBody>
    </Card>
  )
}

export default SortableWithIcons
