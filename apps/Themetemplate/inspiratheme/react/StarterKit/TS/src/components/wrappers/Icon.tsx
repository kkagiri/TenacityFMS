import { Icon as IconifyIcon, type IconProps } from '@iconify/react'

const Icon = ({ icon, ...props }: { icon: string } & IconProps) => {
  return <IconifyIcon icon={`tabler:${icon}`} {...props} />
}
export default Icon
