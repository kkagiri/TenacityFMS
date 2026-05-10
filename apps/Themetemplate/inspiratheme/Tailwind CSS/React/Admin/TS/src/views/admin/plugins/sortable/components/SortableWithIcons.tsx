import Icon from '@/components/wrappers/Icon'
import { useState } from 'react'
import { ReactSortable, Sortable } from 'react-sortablejs'
import { groupedSortableData } from './data'

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
    <div className="px-5 py-3" key={item.id}>
      <div className="mb-2 flex items-center gap-2">
        <div className="bg-default-150 flex size-6 shrink-0 items-center justify-center rounded-full">
          <Icon icon={item.icon} className="text-primary text-sm" />
        </div>
        <div>
          <h5>{item.title}</h5>
        </div>
      </div>
      <div className="nested-sortable">
        <ReactSortable list={list} setList={setList} {...sortableOptions}>
          {list.map((child) => {
            return (
              <div className="px-5 py-3 flex items-center gap-1" key={child.id}>
                <Icon icon={child.icon} className="text-default-400 me-2 text-sm" />
                {child.title}
              </div>
            )
          })}
        </ReactSortable>
      </div>
    </div>
  )
}

const SortableWithIcons = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Sortable with Icons</h4>
      </div>
      <div className="card-body">
        <p className="text-default-400 mb-4">
          Use
          <code>nested-sortable</code>
          class to class to set a nested list with sortable items where icons are given within.
        </p>
        <div className="border-default-300 divide-default-200 divide-y divide-dashed rounded border border-dashed">
          {groupedSortableData.map((item) => {
            return <SortableGroup key={item.id} item={item} />
          })}
        </div>
      </div>
    </div>
  )
}

export default SortableWithIcons
