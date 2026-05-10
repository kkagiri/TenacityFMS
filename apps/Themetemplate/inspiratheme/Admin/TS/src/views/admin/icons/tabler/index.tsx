import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Icon as IconifyIcon } from '@iconify/react'
import { Link } from 'react-router'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'


type TablerIconType = {
  iconName: string
  name: string
}

const tablerIconData: TablerIconType[] = [
  { iconName: 'phone', name: 'Phone' },
  { iconName: 'ad-2', name: 'Ad 2' },
  { iconName: 'headphones', name: 'Headphones' },
  { iconName: 'camera', name: 'Camera' },
  { iconName: 'device-watch', name: 'Watch' },
  { iconName: 'microphone', name: 'Microphone' },
  { iconName: 'headset', name: 'Headset' },
  { iconName: 'device-tablet', name: 'Tablet' },
  { iconName: 'device-gamepad', name: 'Gamepad' },
  { iconName: 'printer', name: 'Printer' },
  { iconName: 'device-speaker', name: 'Speaker' },
  { iconName: 'database', name: 'Database' },
  { iconName: 'cloud', name: 'Cloud' },
  { iconName: 'wifi', name: 'Wi-Fi' },
  { iconName: 'bluetooth', name: 'Bluetooth' },
  { iconName: 'usb', name: 'USB' },
  { iconName: 'folder', name: 'Folder' },
  { iconName: 'lock', name: 'Lock' },
  { iconName: 'key', name: 'Key' },
  { iconName: 'shield', name: 'Shield' },
  { iconName: 'paperclip', name: 'Paperclip' },
  { iconName: 'bell', name: 'Bell' },
  { iconName: 'search', name: 'Search' },
  { iconName: 'briefcase', name: 'Briefcase' },
  { iconName: 'shopping-cart', name: 'Cart' },
  { iconName: 'file', name: 'File' },
  { iconName: 'book', name: 'Book' },
  { iconName: 'mail', name: 'Mail' },
  { iconName: 'user', name: 'User' },
  { iconName: 'user-circle', name: 'User Circle' },
  { iconName: 'phone-call', name: 'Phone Call' },
  { iconName: 'music', name: 'Music' },
  { iconName: 'movie', name: 'Movie' },
  { iconName: 'file-upload', name: 'Upload' },
  { iconName: 'cloud-upload', name: 'Cloud Upload' },
  { iconName: 'share', name: 'Share' },
  { iconName: 'arrow-right', name: 'Arrow Right' },
  { iconName: 'arrow-left', name: 'Arrow Left' },
  { iconName: 'arrow-up', name: 'Arrow Up' },
  { iconName: 'arrow-down', name: 'Arrow Down' },
  { iconName: 'search', name: 'Search' },
  { iconName: 'refresh', name: 'Refresh' },
]

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Tabler" subtitle="Icons" />

      <Row className="justify-content-center">
        <Col xxl={10}>
          <Card>
            <CardHeader className="d-block">
              <CardTitle className="mb-1">Overview</CardTitle>
              <p className="mb-0 text-muted">Free and open source icons designed to make your website or app attractive, visually consistent and simply beautiful.</p>
            </CardHeader>

            <CardBody>
              <h4 className="mt-0 fs-base mb-1">Usage</h4>

              <div className="d-flex align-items-center gap-2 mt-3">
                <IconifyIcon icon="tabler:phone" className="fs-2" />
                <IconifyIcon icon="tabler:ad-2" className="fs-2" />
                <IconifyIcon icon="tabler:device-desktop" className="fs-2" />
                <IconifyIcon icon="tabler:device-tablet" className="fs-2" />
                <IconifyIcon icon="tabler:device-gamepad" className="fs-2" />
                <IconifyIcon icon="tabler:device-watch" className="fs-2" />
              </div>
            </CardBody>

            <CardBody className="border-top border-dashed">
              <h4 className="mt-0 fs-base mb-1">Colors</h4>

              <div className="d-flex align-items-center gap-2 mt-3">
                <IconifyIcon icon="tabler:camera" className="fs-2 text-primary" />
                <IconifyIcon icon="tabler:chart-pie-2" className="fs-2 text-secondary" />
                <IconifyIcon icon="tabler:bell" className="fs-2 text-success" />
                <IconifyIcon icon="tabler:credit-card" className="fs-2 text-info" />
                <IconifyIcon icon="tabler:cloud" className="fs-2 text-warning" />
                <IconifyIcon icon="tabler:mail" className="fs-2 text-danger" />
                <IconifyIcon icon="tabler:lock" className="fs-2 text-dark" />
                <IconifyIcon icon="tabler:user" className="fs-2 text-purple" />
                <IconifyIcon icon="tabler:star" className="fs-2 text-light" />
              </div>
            </CardBody>

            <CardBody className="border-top border-dashed">
              <h4 className="mt-0 fs-base mb-1">Sizes</h4>

              <div className="d-flex align-items-center gap-2 mt-3">
                <IconifyIcon icon="tabler:phone" className="fs-1" />
                <IconifyIcon icon="tabler:ad-2" className="fs-2" />
                <IconifyIcon icon="tabler:device-desktop" className="fs-3" />
                <IconifyIcon icon="tabler:device-tablet" className="fs-4" />
                <IconifyIcon icon="tabler:device-gamepad" className="fs-5" />
                <IconifyIcon icon="tabler:device-watch" className="fs-6" />
              </div>

              <div className="d-flex align-items-center gap-2 mt-3">
                <IconifyIcon icon="tabler:device-watch" />
                <IconifyIcon icon="tabler:device-watch" className="fs-sm" />
                <IconifyIcon icon="tabler:device-watch" className="fs-lg" />
                <IconifyIcon icon="tabler:device-watch" className="fs-xl" />
                <IconifyIcon icon="tabler:device-watch" className="fs-xxl" />
                <IconifyIcon icon="tabler:device-watch" className="fs-24" />
                <IconifyIcon icon="tabler:device-watch" className="fs-32" />
                <IconifyIcon icon="tabler:device-watch" className="fs-36" />
                <IconifyIcon icon="tabler:device-watch" className="fs-42" />
                <IconifyIcon icon="tabler:device-watch" className="fs-60" />
              </div>
            </CardBody>

            <CardBody className="border-top border-dashed">
              <h4 className="mt-0 mb-3">Icons</h4>

              <div className="d-flex flex-wrap align-items-center text-center gap-2">
                {tablerIconData.map((item, idx) => (
                  <div className="avatar-xxl" key={idx}>
                    <span className="avatar-title flex-column gap-1 border border-dashed rounded-3 overflow-hidden text-truncate text-center p-1">
                      <IconifyIcon icon={`tabler:${item.iconName}`} className="fs-24" />
                      <span className="fw-semibold d-block w-100 text-truncate">{item.name}</span>
                    </span>
                  </div>
                ))}
              </div>

              <div className="text-center mt-3">
                <Link to="https://tabler.io/icons" target="_blank" className="btn btn-danger">
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
