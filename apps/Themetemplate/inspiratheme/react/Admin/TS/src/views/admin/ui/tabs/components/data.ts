type TabContentItem = {
  id: string
  title: string
  variant: string
  text: string
  icon: string
}

const text1 = 'This dashboard provides a quick overview of your recent activity, performance metrics, and system status. You can easily monitor key indicators, recent logins, pending tasks, and overall user engagement.'
const text2 = 'View your latest interactions and actions taken across the platform. This includes recent file uploads, comments, status updates, and notification history to keep you up to date with ongoing changes.'
const text3 = 'Customize your account preferences including theme options, notification settings, and privacy controls. Adjust layout configurations to suit your workflow and manage integration with third-party services.'

export const tabContents: TabContentItem[] = [
  { id: '1', title: 'Overview', text: text1, variant: 'info', icon: 'smart-home' },
  { id: '2', title: 'Activity', text: text2, variant: 'danger', icon: 'user-circle' },
  { id: '3', title: 'Settings', text: text3, variant: 'secondary', icon: 'settings' },
]
