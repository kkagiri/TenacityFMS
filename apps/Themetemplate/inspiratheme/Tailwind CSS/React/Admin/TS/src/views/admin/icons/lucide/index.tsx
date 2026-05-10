import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Icon as IconifyIcon } from '@iconify/react'


export type LucideIconType = {
  iconName: string
  name: string
}

export const lucideIconData: LucideIconType[] = [
  { iconName: 'phone', name: 'Phone' },
  { iconName: 'badge-percent', name: 'Ad 2' },
  { iconName: 'headphones', name: 'Headphones' },
  { iconName: 'camera', name: 'Camera' },
  { iconName: 'watch', name: 'Watch' },
  { iconName: 'mic', name: 'Microphone' },
  { iconName: 'headset', name: 'Headset' },
  { iconName: 'tablet', name: 'Tablet' },
  { iconName: 'gamepad-2', name: 'Gamepad' },
  { iconName: 'printer', name: 'Printer' },
  { iconName: 'speaker', name: 'Speaker' },
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
  { iconName: 'phone', name: 'Phone Call' },
  { iconName: 'music', name: 'Music' },
  { iconName: 'film', name: 'Movie' },
  { iconName: 'upload', name: 'Upload' },
  { iconName: 'cloud-upload', name: 'Cloud Upload' },
  { iconName: 'share', name: 'Share' },
  { iconName: 'arrow-right', name: 'Arrow Right' },
  { iconName: 'arrow-left', name: 'Arrow Left' },
  { iconName: 'arrow-up', name: 'Arrow Up' },
  { iconName: 'arrow-down', name: 'Arrow Down' },
  { iconName: 'search', name: 'Search' },
  { iconName: 'refresh-ccw', name: 'Refresh' },
]

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Lucide" subtitle="Icons" />

      <div className="container-fluid">
        <div className="card">
          <div className="card-header block">
            <h4 className="card-title mb-1.25">Overview</h4>
            <p className="text-default-400">Lucide is an open-source library of clean, scalable SVG icons for web and app development, offering easy integration and customization.</p>
          </div>

          <div className="card-body">
            <h4 className="mb-2 text-sm">Usage</h4>
            <code>&lt;IconifyIcon icon=&quot;lucide:xxxx&quot;/&gt;</code>
            <div className="mt-3 flex items-center gap-3">
              <IconifyIcon icon="lucide:camera" className="text-2xl" />
              <IconifyIcon icon="lucide:heart" className="text-2xl" />
              <IconifyIcon icon="lucide:star" className="text-2xl" />
              <IconifyIcon icon="lucide:check" className="text-2xl" />
              <IconifyIcon icon="lucide:bell" className="text-2xl" />
              <IconifyIcon icon="lucide:cloud" className="text-2xl" />
              <IconifyIcon icon="lucide:user" className="text-2xl" />
            </div>
          </div>

          <div className="card-body border-default-300 border-t border-dashed">
            <h4 className="mb-2 text-sm">Colors</h4>
            <code>&lt;IconifyIcon icon=&quot;lucide:xxxx&quot; className=&quot;text-xxxx&quot;/&gt;</code>
            <div className="mt-3 flex items-center gap-3">
              <IconifyIcon icon="lucide:house" className="text-primary text-2xl" />
              <IconifyIcon icon="lucide:settings" className="text-secondary text-2xl" />
              <IconifyIcon icon="lucide:calendar" className="text-success text-2xl" />
              <IconifyIcon icon="lucide:message-circle" className="text-info text-2xl" />
              <IconifyIcon icon="lucide:flag" className="text-warning text-2xl" />
              <IconifyIcon icon="lucide:folder" className="text-danger text-2xl" />
              <IconifyIcon icon="lucide:globe" className="text-light text-2xl" />
              <IconifyIcon icon="lucide:key" className="text-dark text-2xl" />
              <IconifyIcon icon="lucide:layers" className="text-purple text-2xl" />
            </div>
          </div>

          <div className="card-body border-default-300 border-t border-dashed">
            <h4 className="mb-2 text-sm">Sizes</h4>
            <code>&lt;IconifyIcon icon=&quot;lucide:xxxx&quot; className=&quot;text-xxxx&quot;/&gt;</code>
            <div className="mt-3 flex items-center gap-3">
              <IconifyIcon icon="lucide:phone" className="size-8.75" />
              <IconifyIcon icon="lucide:badge-dollar-sign" className="size-7.5" />
              <IconifyIcon icon="lucide:monitor" className="size-6" />
              <IconifyIcon icon="lucide:tablet" className="size-4.25" />
              <IconifyIcon icon="lucide:gamepad-2" className="size-3.5" />
              <IconifyIcon icon="lucide:watch" className="size-2.75" />
            </div>
            <div className="mt-3 flex items-center gap-3">
              <IconifyIcon icon="lucide:watch" className="size-3" />
              <IconifyIcon icon="lucide:watch" className="size-3.25" />
              <IconifyIcon icon="lucide:watch" className="text-base" />
              <IconifyIcon icon="lucide:watch" className="text-lg" />
              <IconifyIcon icon="lucide:watch" className="size-5" />
              <IconifyIcon icon="lucide:watch" className="size-6" />
              <IconifyIcon icon="lucide:watch" className="size-8" />
              <IconifyIcon icon="lucide:watch" className="size-9" />
              <IconifyIcon icon="lucide:watch" className="size-10.5" />
              <IconifyIcon icon="lucide:watch" className="size-15" />
            </div>
          </div>

          <div className="card-body border-default-300 border-t border-dashed">
            <h4 className="mt-0 mb-3">Icons</h4>
            <div className="align-items-center flex flex-wrap gap-3 text-center">
              {lucideIconData.map((item, idx) => (
                <div className="border-default-300 flex size-20 flex-col items-center justify-center gap-3 truncate rounded border border-dashed" key={idx}>
                  <IconifyIcon icon={`lucide:${item.iconName}`} className="text-xl" />
                  <span className="block w-full truncate text-center font-semibold">{item.name}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 text-center">
              <a href="https://tabler.io/icons" target="_blank" className="btn bg-danger text-white hover:bg-danger-hover">
                View All Icons
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
