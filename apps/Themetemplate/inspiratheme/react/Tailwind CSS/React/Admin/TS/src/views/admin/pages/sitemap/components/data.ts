export type SitemapItem = {
  title: string
  href?: string
  icon?: string
  itemClassName?: string
  children?: SitemapItem[]
}

export const sitemapData: { title: string; items: SitemapItem[] }[] = [
  {
    title: 'AI Dashboards',
    items: [
      {
        title: 'Analytics',
        href: '',
        children: [
          { title: 'Model Metrics', href: '' },
          { title: 'User Insights', href: '' },
          { title: 'Prediction Logs', href: '' },
          { title: 'Real-Time Monitor', href: '' },
          { title: 'Data Pipelines', href: '' },
        ],
      },
      {
        title: 'Model Hub',
        href: '',
        children: [
          { title: 'Overview', href: '' },
          { title: 'Upload Model', href: '' },
          { title: 'Version Control', href: '' },
        ],
      },
      { title: 'AI Documentation', href: '' },
      { title: 'Sign In', href: '' },
      { title: 'Create Account', href: '' },
    ],
  },
  {
    title: 'AI Applications',
    items: [
      { title: 'Training Scheduler', href: '', icon: 'calendar' },
      {
        title: 'Notifications',
        href: '',
        icon: 'mail',
        children: [
          { title: 'Inbox', href: '' },
          { title: 'Alerts', href: '' },
          { title: 'Send Message', href: '' },
        ],
      },
      {
        title: 'Teams',
        href: '',
        icon: 'users',
        children: [
          { title: 'Members', href: '' },
          { title: 'Invite', href: '' },
          { title: 'Permissions', href: '' },
        ],
      },
      {
        title: 'AI Projects',
        href: '',
        icon: 'briefcase',
        children: [
          { title: 'Overview', href: '' },
          { title: 'New Project', href: '' },
          { title: 'Tasks', href: '' },
        ],
      },
    ],
  },
  {
    title: 'AI Reports & Settings',
    items: [
      {
        title: 'Reports',
        href: '',
        icon: 'chart-bar',
        itemClassName: 'text-primary',
        children: [
          { title: 'Model Accuracy', href: '' },
          { title: 'User Activity', href: '' },
          { title: 'Performance Trends', href: '' },
        ],
      },
      {
        title: 'Billing',
        href: '',
        icon: 'wallet',
        itemClassName: 'text-info',
        children: [
          { title: 'Subscriptions', href: '' },
          { title: 'Payments', href: '' },
          { title: 'Credits', href: '' },
        ],
      },
      {
        title: 'Settings',
        href: '',
        icon: 'settings',
        itemClassName: 'text-danger',
        children: [
          { title: 'General', href: '' },
          { title: 'Appearance', href: '' },
          { title: 'Integrations', href: '' },
          { title: 'Audit Logs', href: '' },
        ],
      },
      { title: 'Logout', href: '', icon: 'logout', itemClassName: 'text-dark' },
    ],
  },
]
