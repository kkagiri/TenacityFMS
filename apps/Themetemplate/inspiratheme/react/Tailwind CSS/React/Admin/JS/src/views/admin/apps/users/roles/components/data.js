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
export const memberRoleData = [
  {
    title: 'Security Officer',
    description: 'Handles platform safety and protocol reviews.',
    icon: 'shield-lock',
    features: ['Daily Risk Assessment', 'Manage Security Logs', 'input Access Rights', 'Emergency Protocols'],
    users: [
      {
        image: user7,
      },
      {
        image: user8,
      },
      {
        image: user9,
      },
      {
        image: user10,
      },
    ],
    time: '1 hour ago',
  },
  {
    title: 'Project Manager',
    description: 'Coordinates planning and team delivery timelines.',
    icon: 'briefcase',
    features: ['Timeline Tracking', 'Task Assignments', 'Budget input', 'Stakeholder Reporting'],
    users: [
      {
        image: user2,
      },
      {
        image: user5,
      },
      {
        image: user6,
      },
      {
        image: user1,
      },
      {
        image: user8,
      },
    ],
    time: '2 hours ago',
  },
  {
    title: 'Developer',
    description: 'Builds and maintains the platform core features.',
    icon: 'code',
    features: ['Codebase Maintenance', 'API Integration', 'Unit Testing', 'Feature Deployment'],
    users: [
      {
        image: user3,
      },
      {
        image: user4,
      },
      {
        image: user9,
      },
      {
        image: user10,
      },
      {
        image: user8,
      },
      {
        image: user1,
      },
    ],
    time: '3 hours ago',
  },
  {
    title: 'Support Lead',
    description: 'Oversees customer support and service quality.',
    icon: 'headset',
    features: ['Respond to Tickets', 'Live Chat Supervision', 'FAQ Updates', 'Support Metrics Review'],
    users: [
      {
        image: user1,
      },
      {
        image: user5,
      },
      {
        image: user7,
      },
    ],
    time: '30 min ago',
  },
]
export const userData = [
  {
    id: '#USR00123',
    name: 'Nathan Young',
    email: 'nathan@companymail.com',
    image: user5,
    role: 'Project Manager',
    date: '18 Apr, 2025',
    time: '9:45 AM',
    status: 'inactive',
  },
  {
    id: '#USR00145',
    name: 'Leah Kim',
    email: 'leah@wavehub.io',
    image: user3,
    role: 'Developer',
    date: '21 Apr, 2025',
    time: '3:15 PM',
    status: 'active',
  },
  {
    id: '#USR00162',
    name: 'Sophie Lee',
    email: 'sophie@infrakit.io',
    image: user1,
    role: 'Support Lead',
    date: '19 Apr, 2025',
    time: '10:00 AM',
    status: 'suspended',
  },
  {
    id: '#USR00178',
    name: 'David Tran',
    email: 'david@devsync.com',
    image: user2,
    role: 'Developer',
    date: '22 Apr, 2025',
    time: '8:15 AM',
    status: 'active',
  },
  {
    id: '#USR00189',
    name: 'Isabella Moore',
    email: 'isabella@tracklog.com',
    image: user4,
    role: 'Security Officer',
    date: '20 Apr, 2025',
    time: '2:45 PM',
    status: 'active',
  },
  {
    id: '#USR00203',
    name: 'Daniel Cooper',
    email: 'daniel@cloudops.dev',
    image: user6,
    role: 'Support Lead',
    date: '15 Apr, 2025',
    time: '11:20 AM',
    status: 'inactive',
  },
  {
    id: '#USR00215',
    name: 'Ava Thompson',
    email: 'ava@digitalsphere.io',
    image: user8,
    role: 'Developer',
    date: '23 Apr, 2025',
    time: '4:25 PM',
    status: 'active',
  },
  {
    id: '#USR00228',
    name: 'Mason Carter',
    email: 'mason@buildzone.io',
    image: user9,
    role: 'Security Officer',
    date: '17 Apr, 2025',
    time: '6:10 PM',
    status: 'suspended',
  },
  {
    id: '#USR00239',
    name: 'Chloe Adams',
    email: 'chloe@infraops.io',
    image: user10,
    role: 'Project Manager',
    date: '11 Apr, 2025',
    time: '1:30 PM',
    status: 'inactive',
  },
]
