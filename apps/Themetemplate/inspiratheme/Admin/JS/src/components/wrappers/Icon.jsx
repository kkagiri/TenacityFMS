import { Icon as IconifyIcon } from '@iconify/react'
const Icon = ({ icon, ...props }) => {
  return <IconifyIcon icon={`tabler:${icon}`} {...props} />
}
export default Icon
