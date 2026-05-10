/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useState } from 'react'
import { ReactSortable, SortableEvent, type Sortable } from 'react-sortablejs'
import { nestedListInitialData } from './data'

export type NestableBlockProps = {
  item: (typeof nestedListInitialData)[number]
  setList: (newList: typeof nestedListInitialData) => void
  index: number[]
}

const sortableOptions: Partial<Sortable.Options> = {
  group: 'nested',
  animation: 150,
  ghostClass: 'sortable-item-ghost',
  fallbackOnBody: true,
  swapThreshold: 0.65,
  onStart: (event: SortableEvent) => {
    event.item.classList.add('sortable-drag')
  },
  onEnd: (event: SortableEvent) => {
    event.item.classList.remove('sortable-drag')
  },
}

const NestableBlock = ({ item, setList: setNewList, index }: NestableBlockProps) => {
  return item.children ? (
    <div className=" border-default-300 border-0 divide-default-200 nested-sortable divide-y rounded font-medium px-4 py-2.5" key={item.id}>
      {item.title}
      <div className="border-default-300 divide-default-300 nested-sortable divide-y rounded border">
        <ReactSortable
          key={item.id}
          list={item.children}
          group="nested-group"
          setList={(currentList) => {
            // @ts-ignore
            setNewList((sourceList: typeof nestedListInitialData) => {
              const tempList = [...sourceList]
              const indexes = [...index]
              const lastIndex = indexes.pop()!
              // @ts-ignore
              const lastArr = indexes.reduce((arr, i) => arr[i]['children'], tempList)
              // @ts-ignore
              lastArr[lastIndex]['children'] = currentList
              return tempList
            })
          }}
          {...sortableOptions}
        >
          {item.children.map((child, idx) => (
            <NestableBlock key={child.id} item={child} setList={setNewList} index={[...index, idx]} />
          ))}
        </ReactSortable>
      </div>
    </div>
  ) : (
    <div className="border-default-300 divide-default-200 nested-sortable divide-y rounded border font-medium px-4 py-2.5" key={item.id}>
      {item.title}
    </div>
  )
}

const NestedSortableList = () => {
  const [list, setList] = useState<typeof nestedListInitialData>(nestedListInitialData)
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Sortables List</h4>
      </div>
      <div className="card-body">
        <p className="text-default-400 mb-4">
          Use
          <code>nested-sortable</code>
          classes on the element to enable drag-and-drop sorting of hierarchical task items.
        </p>
        <div className="border-default-300 divide-default-300 nested-sortable divide-y rounded border font-medium">
          <ReactSortable list={list} setList={setList} group="nested-group" {...sortableOptions}>
            {list.map((item, index) => {
              return <NestableBlock key={item.id} item={item} setList={setList} index={[index]} />
            })}
          </ReactSortable>
        </div>
      </div>
    </div>
  )
}

export default NestedSortableList
