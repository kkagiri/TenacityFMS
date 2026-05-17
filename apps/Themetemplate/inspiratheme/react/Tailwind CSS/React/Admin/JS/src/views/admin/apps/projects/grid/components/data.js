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
export const projectData = [
  {
    title: 'AI Analytics Dashboard',
    icon: 'robot',
    iconClassName: 'bg-primary',
    updatedTime: '5 minutes ago',
    task: {
      total: 60,
      completed: 18,
      label: 'Assets & docs',
    },
    files: {
      count: 15,
      description: 'Tasks',
    },
    comments: {
      count: 5,
      description: 'Latest: today',
    },
    dueDate: {
      description: 'Due date',
      date: '10 Jun, 2025',
    },
    members: [
      {
        image: user2,
      },
      {
        image: user3,
      },
      {
        image: user5,
      },
      {
        image: user1,
      },
    ],
    status: 'in-progress',
    progress: 65,
  },
  {
    title: 'CRM Web Platform for Club',
    icon: 'dashboard',
    iconClassName: 'bg-warning',
    updatedTime: '2 hours ago',
    task: {
      total: 120,
      completed: 45,
      label: 'Features',
    },
    files: {
      count: 28,
      description: 'Resources',
    },
    comments: {
      count: 19,
      description: 'Latest: 30m ago',
    },
    dueDate: {
      description: 'Due date',
      date: '02 Aug, 2025',
    },
    members: [
      {
        image: user4,
      },
      {
        image: user6,
      },
      {
        image: user8,
      },
    ],
    status: 'pending',
    progress: 42,
  },
  {
    title: 'E-Commerce Mobile App',
    icon: 'shopping-cart',
    iconClassName: 'bg-info',
    updatedTime: '1 day ago',
    task: {
      total: 80,
      completed: 32,
      label: 'Screens',
    },
    files: {
      count: 21,
      description: 'UI / Icons',
      type: 'Assets',
    },
    comments: {
      count: 12,
      description: 'Design Feedback',
    },
    dueDate: {
      description: 'Launch Target',
      date: '18 Dec, 2025',
    },
    members: [
      {
        image: user9,
      },
      {
        image: user7,
      },
      {
        image: user10,
      },
    ],
    status: 'review',
    progress: 78,
  },
  {
    title: 'HR Employee Portal - Web & Mobile',
    icon: 'users',
    iconClassName: 'bg-secondary',
    updatedTime: '30 minutes ago',
    task: {
      total: 40,
      completed: 12,
      label: 'Modules',
    },
    files: {
      count: 9,
      description: 'Policies',
    },
    comments: {
      count: 3,
      description: 'Feedback',
    },
    dueDate: {
      description: 'Review',
      date: '22 Apr, 2025',
    },
    members: [
      {
        image: user1,
      },
      {
        image: user4,
      },
      {
        image: user9,
      },
    ],
    status: 'on-hold',
    progress: 33,
  },
  {
    title: 'SaaS Billing System - Starbucks',
    icon: 'invoice',
    iconClassName: 'bg-danger',
    updatedTime: '12 minutes ago',
    task: {
      total: 70,
      completed: 50,
      label: 'APIs',
    },
    files: {
      count: 32,
      description: 'Integration',
      type: 'Docs',
    },
    comments: {
      count: 16,
      description: 'Team',
    },
    dueDate: {
      description: 'Launch',
      date: '12 Jul, 2025',
    },
    members: [
      {
        image: user6,
      },
      {
        image: user3,
      },
      {
        image: user7,
      },
      {
        image: user2,
      },
    ],
    status: 'critical',
    progress: 54,
  },
  {
    title: 'Learning Management System',
    icon: 'school',
    iconClassName: 'bg-info',
    updatedTime: '1 hour ago',
    task: {
      total: 100,
      completed: 40,
      label: 'Modules',
    },
    files: {
      count: 14,
      description: 'PDF / Docs',
    },
    comments: {
      count: 6,
      description: 'Instructor',
    },
    dueDate: {
      description: 'Next milestone',
      date: '05 May, 2025',
    },
    members: [
      {
        image: user3,
      },
      {
        image: user8,
      },
      {
        image: user5,
      },
    ],
    status: 'review',
    progress: 60,
  },
  {
    title: 'Warehouse Inventory System',
    icon: 'building-warehouse',
    iconClassName: 'bg-dark',
    updatedTime: '6 hours ago',
    task: {
      total: 450,
      completed: 120,
      label: 'Items Tracked',
    },
    files: {
      count: 48,
      description: 'Reports',
    },
    comments: {
      count: 9,
      description: 'Audit',
    },
    dueDate: {
      description: 'Next Check',
      date: '14 Mar, 2025',
    },
    members: [
      {
        image: user2,
      },
      {
        image: user5,
      },
      {
        image: user7,
      },
      {
        image: user9,
      },
      {
        image: user10,
      },
    ],
    status: 'monitoring',
    progress: 47,
  },
  {
    title: 'Fitness Tracker App - Tracky',
    icon: 'activity',
    iconClassName: 'bg-success',
    updatedTime: '3 days ago',
    task: {
      total: 45,
      completed: 22,
      label: 'Features',
    },
    files: {
      count: 12,
      description: 'Images/Videos',
      type: 'Media',
    },
    comments: {
      count: 7,
      description: 'Community',
    },
    dueDate: {
      description: 'Goal',
      date: '30 Sep, 2025',
    },
    members: [
      {
        image: user1,
      },
      {
        image: user4,
      },
      {
        image: user6,
      },
      {
        image: user8,
      },
    ],
    status: 'stable',
    progress: 78,
  },
]
