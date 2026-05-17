export type SitemapItem = {
  title: string
  href?: string
  icon?: string
  itemClassName?: string
  children?: SitemapItem[]
}

export const sitemapData: { title: string; items: SitemapItem[] }[] = [
  {
    title: 'Dashboard & Pages',
    items: [
      {
        title: 'Dashboards',
        href: '',
        children: [
          { title: 'Analytics', href: '' },
          { title: 'CRM', href: '' },
          { title: 'Sales', href: '' },
          { title: 'Minimal', href: '' },
          { title: 'eCommerce', href: '' },
        ],
      },
      {
        title: 'Profile',
        href: '',
        children: [
          { title: 'Overview', href: '' },
          { title: 'Edit', href: '' },
          { title: 'Security', href: '' },
        ],
      },
      { title: 'Help Center', href: '' },
      { title: 'Login', href: '' },
      { title: 'Register', href: '' },
    ],
  },
  {
    title: 'Applications',
    items: [
      { title: 'Calendar', href: '', icon: 'calendar' },
      {
        title: 'Email',
        href: '',
        icon: 'mail',
        children: [
          { title: 'Inbox', href: '' },
          { title: 'Read', href: '' },
          { title: 'Compose', href: '' },
        ],
      },
      {
        title: 'Users',
        href: '',
        icon: 'users',
        children: [
          { title: 'List', href: '' },
          { title: 'Add User', href: '' },
          { title: 'Roles', href: '' },
        ],
      },
      {
        title: 'Projects',
        href: '',
        icon: 'briefcase',
        children: [
          { title: 'Overview', href: '' },
          { title: 'Create', href: '' },
          { title: 'Tasks', href: '' },
        ],
      },
    ],
  },
  {
    title: 'Reports & Settings',
    items: [
      {
        title: 'Reports',
        href: '',
        icon: 'chart-bar',
        itemClassName: 'link-primary',
        children: [
          { title: 'Sales', href: '' },
          { title: 'Users', href: '' },
          { title: 'Performance', href: '' },
        ],
      },
      {
        title: 'Billing',
        href: '',
        icon: 'wallet',
        itemClassName: 'link-info',
        children: [
          { title: 'Invoices', href: '' },
          { title: 'Payments', href: '' },
          { title: 'Methods', href: '' },
        ],
      },
      {
        title: 'Settings',
        href: '',
        icon: 'settings',
        itemClassName: 'link-danger',
        children: [
          { title: 'General', href: '' },
          { title: 'Appearance', href: '' },
          { title: 'Integrations', href: '' },
          { title: 'Audit Logs', href: '' },
        ],
      },
      { title: 'Logout', href: '', icon: 'logout' },
    ],
  },
]
