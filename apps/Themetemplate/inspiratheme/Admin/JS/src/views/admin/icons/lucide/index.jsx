import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Icon as IconifyIcon } from '@iconify/react'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { Link } from 'react-router'
const lucideIconData = [
  {
    iconName: 'phone',
    name: 'Phone',
  },
  {
    iconName: 'badge-percent',
    name: 'Ad 2',
  },
  {
    iconName: 'headphones',
    name: 'Headphones',
  },
  {
    iconName: 'camera',
    name: 'Camera',
  },
  {
    iconName: 'watch',
    name: 'Watch',
  },
  {
    iconName: 'mic',
    name: 'Microphone',
  },
  {
    iconName: 'headset',
    name: 'Headset',
  },
  {
    iconName: 'tablet',
    name: 'Tablet',
  },
  {
    iconName: 'gamepad-2',
    name: 'Gamepad',
  },
  {
    iconName: 'printer',
    name: 'Printer',
  },
  {
    iconName: 'speaker',
    name: 'Speaker',
  },
  {
    iconName: 'database',
    name: 'Database',
  },
  {
    iconName: 'cloud',
    name: 'Cloud',
  },
  {
    iconName: 'wifi',
    name: 'Wi-Fi',
  },
  {
    iconName: 'bluetooth',
    name: 'Bluetooth',
  },
  {
    iconName: 'usb',
    name: 'USB',
  },
  {
    iconName: 'folder',
    name: 'Folder',
  },
  {
    iconName: 'lock',
    name: 'Lock',
  },
  {
    iconName: 'key',
    name: 'Key',
  },
  {
    iconName: 'shield',
    name: 'Shield',
  },
  {
    iconName: 'paperclip',
    name: 'Paperclip',
  },
  {
    iconName: 'bell',
    name: 'Bell',
  },
  {
    iconName: 'search',
    name: 'Search',
  },
  {
    iconName: 'briefcase',
    name: 'Briefcase',
  },
  {
    iconName: 'shopping-cart',
    name: 'Cart',
  },
  {
    iconName: 'file',
    name: 'File',
  },
  {
    iconName: 'book',
    name: 'Book',
  },
  {
    iconName: 'mail',
    name: 'Mail',
  },
  {
    iconName: 'user',
    name: 'User',
  },
  {
    iconName: 'user-circle',
    name: 'User Circle',
  },
  {
    iconName: 'phone',
    name: 'Phone Call',
  },
  {
    iconName: 'music',
    name: 'Music',
  },
  {
    iconName: 'film',
    name: 'Movie',
  },
  {
    iconName: 'upload',
    name: 'Upload',
  },
  {
    iconName: 'cloud-upload',
    name: 'Cloud Upload',
  },
  {
    iconName: 'share',
    name: 'Share',
  },
  {
    iconName: 'arrow-right',
    name: 'Arrow Right',
  },
  {
    iconName: 'arrow-left',
    name: 'Arrow Left',
  },
  {
    iconName: 'arrow-up',
    name: 'Arrow Up',
  },
  {
    iconName: 'arrow-down',
    name: 'Arrow Down',
  },
  {
    iconName: 'search',
    name: 'Search',
  },
  {
    iconName: 'refresh-ccw',
    name: 'Refresh',
  },
]
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Lucide" subtitle="Icons" />
      <Row className="justify-content-center">
        <Col xxl={10}>
          <Card>
            <CardHeader className="d-block">
              <CardTitle as="h4" className="mb-1 d-flex align-items-center gap-2">
                <IconifyIcon icon="lucide:layout-dashboard" className="fs-xl" />
                Overview
              </CardTitle>
              <p className="mb-0 text-muted">Lucide is an open-source library of clean, scalable SVG icons for web and app development, offering easy integration and customization.</p>
            </CardHeader>

            <CardBody>
              <h4 className="mt-0 fs-base mb-1">Usage</h4>

              <div className="d-flex align-items-center gap-2 mt-3">
                <IconifyIcon icon="lucide:camera" className="fs-3" />
                <IconifyIcon icon="lucide:heart" className="fs-3" />
                <IconifyIcon icon="lucide:star" className="fs-3" />
                <IconifyIcon icon="lucide:check" className="fs-3" />
                <IconifyIcon icon="lucide:bell" className="fs-3" />
                <IconifyIcon icon="lucide:cloud" className="fs-3" />
                <IconifyIcon icon="lucide:user" className="fs-3" />
              </div>
            </CardBody>

            <CardBody className="border-top border-dashed">
              <h4 className="mt-0 fs-base mb-1">Colors</h4>

              <div className="d-flex align-items-center gap-2 mt-3">
                <IconifyIcon icon="lucide:home" className="fs-3 text-primary" />
                <IconifyIcon icon="lucide:settings" className="fs-3 text-secondary" />
                <IconifyIcon icon="lucide:calendar" className="fs-3 text-success" />
                <IconifyIcon icon="lucide:message-circle" className="fs-3 text-info" />
                <IconifyIcon icon="lucide:flag" className="fs-3 text-warning" />
                <IconifyIcon icon="lucide:folder" className="fs-3 text-danger" />
                <IconifyIcon icon="lucide:globe" className="fs-3 text-light" />
                <IconifyIcon icon="lucide:key" className="fs-3 text-dark" />
                <IconifyIcon icon="lucide:layers" className="fs-3 text-purple" />
              </div>
            </CardBody>

            <CardBody className="border-top border-dashed">
              <h4 className="mt-0 fs-base mb-1">Fill Colors</h4>

              <div className="d-flex align-items-center gap-2 mt-3">
                <IconifyIcon icon="lucide:star" className="fs-3 text-primary fill-primary" />
                <IconifyIcon icon="lucide:user" className="fs-3 text-secondary fill-secondary" />
                <IconifyIcon icon="lucide:check-circle" className="fs-3 text-success fill-success" />
                <IconifyIcon icon="lucide:bell" className="fs-3 text-info fill-info" />
                <IconifyIcon icon="lucide:alert-triangle" className="fs-3 text-warning fill-warning" />
                <IconifyIcon icon="lucide:file-text" className="fs-3 text-danger fill-danger" />
                <IconifyIcon icon="lucide:airplay" className="fs-3 text-light fill-light" />
                <IconifyIcon icon="lucide:lock" className="fs-3 text-dark fill-dark" />
                <IconifyIcon icon="lucide:database" className="fs-3 text-purple fill-purple" />
              </div>
            </CardBody>

            <CardBody className="border-top border-dashed">
              <h4 className="mt-0 fs-base mb-1">Sizes</h4>

              <div className="d-flex align-items-center gap-2 mt-3">
                <IconifyIcon icon="lucide:phone" className="fs-1" />
                <IconifyIcon icon="lucide:badge-dollar-sign" className="fs-2" />
                <IconifyIcon icon="lucide:monitor" className="fs-3" />
                <IconifyIcon icon="lucide:tablet" className="fs-4" />
                <IconifyIcon icon="lucide:gamepad-2" className="fs-5" />
                <IconifyIcon icon="lucide:watch" className="fs-6" />
              </div>

              <div className="d-flex align-items-center gap-2 mt-3">
                <IconifyIcon icon="lucide:watch" />
                <IconifyIcon icon="lucide:watch" className="fs-sm" />
                <IconifyIcon icon="lucide:watch" className="fs-lg" />
                <IconifyIcon icon="lucide:watch" className="fs-xl" />
                <IconifyIcon icon="lucide:watch" className="fs-xxl" />
                <IconifyIcon icon="lucide:watch" className="fs-24" />
                <IconifyIcon icon="lucide:watch" className="fs-32" />
                <IconifyIcon icon="lucide:watch" className="fs-36" />
                <IconifyIcon icon="lucide:watch" className="fs-42" />
                <IconifyIcon icon="lucide:watch" className="fs-60" />
              </div>
            </CardBody>

            <CardBody className="border-top border-dashed">
              <h4 className="mt-0 mb-3">Icons</h4>

              <div className="d-flex flex-wrap align-items-center text-center gap-2">
                {lucideIconData.map((item, idx) => (
                  <div className="avatar-xxl" key={idx}>
                    <span className="avatar-title flex-column gap-1 border border-dashed rounded-3 overflow-hidden text-truncate text-center p-1">
                      <IconifyIcon icon={`lucide:${item.iconName}`} className="fs-xxl"></IconifyIcon>
                      <span className="fw-semibold d-block w-100 text-truncate">{item.name}</span>
                    </span>
                  </div>
                ))}
              </div>

              <div className="text-center mt-3">
                <Link to="https://lucide.dev/icons/" target="_blank" className="btn btn-danger">
                  View All Icons
                </Link>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}
export default Page
