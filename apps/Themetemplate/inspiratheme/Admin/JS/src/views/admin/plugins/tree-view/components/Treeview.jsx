import Icon from '@/components/wrappers/Icon'
import { Icon as IconifyIcon } from '@iconify/react'
import clsx from 'clsx'
import { useState } from 'react'
import { Tree } from 'react-arborist'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { treeViewData } from './data'
const Treeview = () => {
  const [treeData, setTreeData] = useState(treeViewData)
  const updateNodeById = (data, id, checked) => {
    return data.map((node) => {
      if (node.id === id) {
        return {
          ...node,
          checked,
        }
      }
      if (node.children) {
        return {
          ...node,
          children: updateNodeById(node.children, id, checked),
        }
      }
      return node
    })
  }
  return (
    <Row>
      <Col md={6}>
        <Card>
          <CardHeader>
            <CardTitle as="h4">Basic Treeview</CardTitle>
          </CardHeader>
          <CardBody>
            <Tree initialData={treeViewData} openByDefault>
              {({ node, style, dragHandle }) => (
                <div style={style} ref={dragHandle} onClick={() => node.toggle()} className="d-flex gap-1 align-items-center py-1">
                  <IconifyIcon icon={node.data.iconName} className={clsx('fs-lg', node.data.iconClassName)} />
                  <span>{node.data.text}</span>
                </div>
              )}
            </Tree>
          </CardBody>
        </Card>
      </Col>

      <Col md={6}>
        <Card>
          <CardHeader>
            <CardTitle as="h4">Tree with Checkboxes</CardTitle>
          </CardHeader>
          <CardBody>
            <Tree data={treeData} openByDefault>
              {({ node, style }) => (
                <div style={style} className="d-flex align-items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={node.data.checked || false}
                    onChange={(e) => {
                      const updated = updateNodeById(treeData, node.id, e.target.checked)
                      setTreeData(updated)
                    }}
                  />
                  <IconifyIcon icon={node.data.iconName} className={clsx('fs-lg', node.data.iconClassName)} />
                  <span>{node.data.text}</span>
                </div>
              )}
            </Tree>
          </CardBody>
        </Card>
      </Col>

      <Col md={6}>
        <Card>
          <CardHeader>
            <CardTitle as="h4">Expandable Toggle with Icons</CardTitle>
          </CardHeader>
          <CardBody>
            <Tree initialData={treeViewData} openByDefault={true}>
              {({ node, style, dragHandle }) => {
                return (
                  <div style={style} ref={dragHandle} className="d-flex align-items-center gap-2 py-1">
                    <div>
                      {node.isInternal && (
                        <span
                          onClick={() => node.toggle()}
                          style={{
                            cursor: 'pointer',
                          }}
                        >
                          {node.isOpen ? <Icon icon="chevron-down" /> : <Icon icon="chevron-right" />}
                        </span>
                      )}
                      <IconifyIcon icon={node.data.iconName} className={clsx('fs-lg', node.data.iconClassName)} />
                    </div>
                    <span>{node.data.text}</span>
                  </div>
                )
              }}
            </Tree>
          </CardBody>
        </Card>
      </Col>
    </Row>
  )
}
export default Treeview
