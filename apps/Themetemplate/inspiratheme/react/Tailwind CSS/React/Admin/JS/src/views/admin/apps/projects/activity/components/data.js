import user1 from '@/assets/images/users/user-1.jpg'
import user10 from '@/assets/images/users/user-10.jpg'
import user2 from '@/assets/images/users/user-2.jpg'
import user3 from '@/assets/images/users/user-3.jpg'
import user4 from '@/assets/images/users/user-4.jpg'
import user5 from '@/assets/images/users/user-5.jpg'
import user6 from '@/assets/images/users/user-6.jpg'
import user7 from '@/assets/images/users/user-7.jpg'
import user8 from '@/assets/images/users/user-8.jpg'
import user9 from '@/assets/images/users/user-9.jpg'
export const basicActivityData = [
  {
    status: 'Add',
    variant: 'bg-info',
    time: 'Today at 08:05:33 am',
    user: {
      name: 'Olivia Lee',
      image: user1,
    },
    action: 'Added a new design asset',
  },
  {
    status: 'Update',
    variant: 'bg-success',
    time: 'Today at 08:48:20 am',
    user: {
      name: 'Ethan Wong',
      image: user2,
    },
    action: 'Updated project timeline',
  },
  {
    status: 'Upload',
    variant: 'bg-primary',
    time: 'Today at 09:12:45 am',
    user: {
      name: 'Grace Kim',
      image: user3,
    },
    action: 'Uploaded design guidelines PDF',
  },
  {
    status: 'Remove',
    variant: 'bg-danger',
    time: 'Today at 09:55:02 am',
    user: {
      name: 'Noah Smith',
      image: user4,
    },
    action: 'Removed outdated document',
  },
  {
    status: 'Comment',
    variant: 'bg-warning',
    time: 'Today at 10:34:10 am',
    user: {
      name: 'Mia Johnson',
      image: user5,
    },
    action: 'Commented on new task board',
  },
  {
    status: 'Approve',
    variant: 'bg-success',
    time: 'Today at 11:03:22 am',
    user: {
      name: 'Liam Davis',
      image: user6,
    },
    action: 'Approved budget request',
  },
  {
    status: 'Add',
    variant: 'bg-primary',
    time: 'Today at 11:40:07 am',
    user: {
      name: 'Sophia Martinez',
      image: user7,
    },
    action: 'Added new member to team',
  },
  {
    status: 'Edit',
    variant: 'bg-warning',
    time: 'Today at 12:18:33 pm',
    user: {
      name: 'Jack Wilson',
      image: user8,
    },
    action: 'Edited task deadline',
  },
  {
    status: 'Reject',
    variant: 'bg-danger',
    time: 'Today at 01:05:11 pm',
    user: {
      name: 'Ella Moore',
      image: user9,
    },
    action: 'Rejected draft submission',
  },
  {
    status: 'Share',
    variant: 'bg-info',
    time: 'Today at 01:43:29 pm',
    user: {
      name: 'Benjamin Taylor',
      image: user10,
    },
    action: 'Shared roadmap document',
  },
  {
    status: 'Upload',
    variant: 'bg-success',
    time: 'Today at 02:15:50 pm',
    user: {
      name: 'Olivia Lee',
      image: user1,
    },
    action: 'Uploaded Q2 reports',
  },
  {
    status: 'Edit',
    variant: 'bg-warning',
    time: 'Today at 02:52:06 pm',
    user: {
      name: 'Ethan Wong',
      image: user2,
    },
    action: 'Edited team description',
  },
  {
    status: 'Delete',
    variant: 'bg-danger',
    time: 'Today at 03:20:44 pm',
    user: {
      name: 'Grace Kim',
      image: user3,
    },
    action: 'Deleted obsolete files',
  },
  {
    status: 'Approve',
    variant: 'bg-success',
    time: 'Today at 03:58:00 pm',
    user: {
      name: 'Noah Smith',
      image: user4,
    },
    action: 'Approved new sprint plan',
  },
  {
    status: 'Add',
    variant: 'bg-primary',
    time: 'Today at 04:36:18 pm',
    user: {
      name: 'Mia Johnson',
      image: user5,
    },
    action: 'Added new project brief',
  },
  {
    status: 'Comment',
    variant: 'bg-warning',
    time: 'Today at 05:14:03 pm',
    user: {
      name: 'Liam Davis',
      image: user6,
    },
    action: 'Left a note on timeline slide',
  },
  {
    status: 'Share',
    variant: 'bg-info',
    time: 'Today at 05:49:57 pm',
    user: {
      name: 'Sophia Martinez',
      image: user7,
    },
    action: 'Shared access to internal repo',
  },
  {
    status: 'Remove',
    variant: 'bg-danger',
    time: 'Today at 06:30:41 pm',
    user: {
      name: 'Jack Wilson',
      image: user8,
    },
    action: 'Removed archived ticket',
  },
  {
    status: 'Upload',
    variant: 'bg-primary',
    time: 'Today at 07:10:59 pm',
    user: {
      name: 'Ella Moore',
      image: user9,
    },
    action: 'Uploaded team performance chart',
  },
  {
    status: 'Create',
    variant: 'bg-success',
    time: 'Today at 07:52:14 pm',
    user: {
      name: 'Benjamin Taylor',
      image: user10,
    },
    action: 'Created a new OKR session',
  },
]
export const expandedActivityData = [
  {
    icon: 'rocket',
    title: 'New Feature Released',
    badge: {
      label: 'Deploy',
      className: 'bg-info/15 text-info',
    },
    iconClassName: 'text-info',
    time: 'Today at 3:45 PM',
    user: {
      image: user6,
      name: 'Natalie Brooks',
    },
    description: 'Launched the real-time chat feature across all user accounts.',
    href: '/pages/profile',
  },
  {
    icon: 'calendar-event',
    title: 'Team Sync-Up',
    badge: {
      label: 'Meeting',
      className: 'bg-secondary/15 text-secondary',
    },
    iconClassName: 'text-secondary',
    time: 'Today at 2:00 PM',
    user: {
      image: user4,
      name: 'Oliver Grant',
    },
    description: 'Reviewed sprint progress and discussed remaining tasks with the dev team.',
    href: '/pages/profile',
  },
  {
    icon: 'palette',
    title: 'UI Design Review',
    badge: {
      label: 'Design',
      className: 'bg-success/15 text-success',
    },
    iconClassName: 'text-success',
    time: 'Today at 1:15 PM',
    user: {
      image: user9,
      name: 'Clara Jensen',
    },
    description: 'Updated component spacing and colors for improved accessibility.',
    href: '/pages/profile',
  },
  {
    icon: 'database',
    title: 'Database Optimization',
    badge: {
      label: 'Backend',
      className: 'bg-danger/15 text-danger',
    },
    iconClassName: 'text-danger',
    time: 'Today at 12:30 PM',
    user: {
      image: user10,
      name: 'Leo Armstrong',
    },
    description: 'Improved DB query performance, reducing load time by 35%.',
    href: '/pages/profile',
  },
  {
    icon: 'user-hexagon',
    title: 'Security Audit Completed',
    badge: {
      label: 'Audit',
      className: 'bg-warning/15 text-warning',
    },
    iconClassName: 'text-warning',
    time: 'Today at 11:00 AM',
    user: {
      image: user8,
      name: 'Liam Carter',
    },
    description: 'Completed internal security audit with no critical issues found.',
    href: '/pages/profile',
  },
  {
    icon: 'user-plus',
    title: 'New Team Member Joined',
    badge: {
      label: 'Onboarding',
      className: 'bg-primary/15 text-primary',
    },
    iconClassName: 'text-primary',
    time: 'Today at 10:15 AM',
    user: {
      image: user7,
      name: 'Emma Davis',
    },
    description: 'Michael Lee has joined the development team as a Frontend Engineer.',
    href: '/pages/profile',
  },
  {
    icon: 'pencil',
    title: 'Documentation Updated',
    badge: {
      label: 'Docs',
      className: 'bg-secondary/15 text-secondary',
    },
    iconClassName: 'text-secondary',
    time: 'Yesterday at 5:20 PM',
    user: {
      image: user7,
      name: 'Sophia Reed',
    },
    description: 'Refreshed developer documentation with updated APIs and workflows.',
    href: '/pages/profile',
  },
  {
    icon: 'check',
    title: 'Task Completed',
    badge: {
      label: 'Done',
      className: 'bg-success/15 text-success',
    },
    iconClassName: 'text-success',
    time: 'Yesterday at 3:10 PM',
    user: {
      image: user5,
      name: 'Daniel Chen',
    },
    description: 'Finished implementation of the email notification system.',
    href: '/pages/profile',
  },
]
