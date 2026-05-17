import Icon from '@/components/wrappers/Icon'
import { cn } from '@/utils/helpers'
import { Icon as IconifyIcon } from '@iconify/react'
import { useState } from 'react'
import { NodeRendererProps, Tree } from 'react-arborist'
import { TreeType, treeViewData } from './data'

const Treeview = () => {
  const [treeData, setTreeData] = useState<TreeType[]>(treeViewData)

  const updateNodeById = (data: TreeType[], id: string, checked: boolean): TreeType[] => {
    return data.map((node) => {
      if (node.id === id) {
        return { ...node, checked }
      }
      if (node.children) {
        return { ...node, children: updateNodeById(node.children, id, checked) }
      }
      return node
    })
  }

  return (
    <div className="grid md:grid-cols-2 gap-base">
      <div>
        <div className="card mb-base">
          <div className="card-header">
            <h4 className="card-title">Basic Treeview</h4>
          </div>
          <div className="card-body">
            <Tree initialData={treeViewData} openByDefault>
              {({ node, style, dragHandle }: NodeRendererProps<TreeType>) => (
                <div style={style} ref={dragHandle} onClick={() => node.toggle()} className="flex gap-1 items-center py-1">
                  <IconifyIcon icon={node.data.iconName} className={cn('text-base', node.data.iconClassName)} />
                  <span>{node.data.text}</span>
                </div>
              )}
            </Tree>
          </div>
        </div>
        <div className="card mb-base">
          <div className="card-header">
            <h4 className="card-title">Tree with Checkboxes</h4>
          </div>
          <div className="card-body">
            <Tree data={treeData} openByDefault>
              {({ node, style }: NodeRendererProps<TreeType>) => (
                <div style={style} className="flex gap-1 items-center py-1">
                  <input
                    type="checkbox"
                    className="form-checkbox form-checkbox-light size-4.5"
                    checked={node.data.checked || false}
                    onChange={(e) => {
                      const updated = updateNodeById(treeData, node.id, e.target.checked)
                      setTreeData(updated)
                    }}
                  />
                  <IconifyIcon icon={node.data.iconName} className={cn('text-base', node.data.iconClassName)} />
                  <span>{node.data.text}</span>
                </div>
              )}
            </Tree>
          </div>
        </div>
      </div>
      <div>
        <div className="card mb-base">
          <div className="card-header block">
            <h4 className="card-title mb-1">Expandable Toggle with Icons</h4>
          </div>
          <div className="card-body">
            <Tree initialData={treeViewData} openByDefault={true}>
              {({ node, style, dragHandle }: NodeRendererProps<TreeType>) => {
                return (
                  <div style={style} ref={dragHandle} className="flex gap-1 items-center py-1">
                    {node.isInternal && (
                      <span onClick={() => node.toggle()} style={{ cursor: 'pointer' }}>
                        {node.isOpen ? <Icon icon="chevron-down" /> : <Icon icon="chevron-right" />}
                      </span>
                    )}
                    <IconifyIcon icon={node.data.iconName} className={cn('text-base', node.data.iconClassName)} />
                    <span>{node.data.text}</span>
                  </div>
                )
              }}
            </Tree>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Treeview
