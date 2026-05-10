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

export type ProjectType = {
  icon: string
  title: string
  updatedTime: string
  task: {
    total: number
    completed: number
    new?: number
  }
  members: { image: string }[]
  progress: number
  attachments: number
  comments: number
  dueDate: string
  status: 'in-progress' | 'completed' | 'overdue' | 'in-review' | 'on-hold' | 'pending-review' | 'scheduled'
}

export const projectData: ProjectType[] = [
  {
    icon: 'code',
    title: 'AI Analytics Dashboard',
    updatedTime: '5 minutes ago',
    task: { total: 60, completed: 18, new: 4 },
    members: [{ image: user2 }, { image: user3 }, { image: user5 }, { image: user1 }],
    progress: 65,
    attachments: 15,
    comments: 5,
    dueDate: '10 May, 2025',
    status: 'in-progress',
  },
  {
    icon: 'device-desktop',
    title: 'E-commerce Platform',
    updatedTime: '12 minutes ago',
    task: { total: 40, completed: 10 },
    members: [{ image: user6 }, { image: user8 }, { image: user7 }],
    progress: 25,
    attachments: 8,
    comments: 3,
    dueDate: '12 May, 2025',
    status: 'pending-review',
  },
  {
    icon: 'brush',
    title: 'UI Kit Design',
    updatedTime: '30 minutes ago',
    task: { total: 40, completed: 20 },
    members: [{ image: user4 }],
    progress: 50,
    attachments: 12,
    comments: 7,
    dueDate: '5 May, 2025',
    status: 'overdue',
  },
  {
    icon: 'world',
    title: 'Website Redesign',
    updatedTime: '1 hour ago',
    task: { total: 30, completed: 15, new: 1 },
    members: [{ image: user2 }, { image: user7 }, { image: user9 }],
    progress: 50,
    attachments: 6,
    comments: 2,
    dueDate: '18 May, 2025',
    status: 'in-review',
  },
  {
    icon: 'chart-bar',
    title: 'Marketing Report',
    updatedTime: '2 hours ago',
    task: { total: 40, completed: 40 },
    members: [{ image: user5 }, { image: user10 }, { image: user8 }, { image: user2 }],
    progress: 100,
    attachments: 20,
    comments: 10,
    dueDate: '1 May, 2025',
    status: 'completed',
  },
  {
    icon: 'bulb',
    title: 'Sales Pitch Deck',
    updatedTime: '45 minutes ago',
    task: { total: 12, completed: 9, new: 1 },
    members: [{ image: user9 }, { image: user10 }],
    progress: 75,
    attachments: 5,
    comments: 1,
    dueDate: '9 May, 2025',
    status: 'in-review',
  },
  {
    icon: 'speakerphone',
    title: 'Mobile UI Mockups',
    updatedTime: 'yesterday',
    task: { total: 10, completed: 6, new: 3 },
    members: [{ image: user7 }, { image: user4 }, { image: user5 }, { image: user1 }],
    progress: 60,
    attachments: 7,
    comments: 0,
    dueDate: '6 May, 2025',
    status: 'in-progress',
  },
  {
    icon: 'database',
    title: 'Server Maintenance',
    updatedTime: '3 days ago',
    task: { total: 3, completed: 3 },
    members: [{ image: user6 }, { image: user5 }, { image: user9 }, { image: user10 }],
    progress: 100,
    attachments: 2,
    comments: 1,
    dueDate: '3 May, 2025',
    status: 'scheduled',
  },
  {
    icon: 'bug',
    title: 'Security Audit',
    updatedTime: 'last week',
    task: { total: 10, completed: 5, new: 1 },
    members: [{ image: user7 }, { image: user9 }],
    progress: 50,
    attachments: 6,
    comments: 4,
    dueDate: '2 May, 2025',
    status: 'on-hold',
  },
  {
    icon: 'setting-2',
    title: 'Plugin Development',
    updatedTime: '4 days ago',
    task: { total: 6, completed: 2, new: 1 },
    members: [{ image: user3 }],
    progress: 33,
    attachments: 4,
    comments: 2,
    dueDate: '7 May, 2025',
    status: 'in-progress',
  },
]
