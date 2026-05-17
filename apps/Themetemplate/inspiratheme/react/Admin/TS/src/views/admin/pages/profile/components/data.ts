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

import blog3 from '@/assets/images/blog/blog-3.jpg'
import blog4 from '@/assets/images/blog/blog-4.jpg'
import blog5 from '@/assets/images/blog/blog-5.jpg'


export type ProfileItem = {
  icon: string
  label: string
  value?: string
  link?: string
}

export const profileData: ProfileItem[] = [
  {
    icon: 'briefcase',
    label: 'UI/UX Designer & Full-Stack Developer',
  },
  {
    icon: 'school',
    label: 'Studied at',
    value: 'Stanford University',
  },
  {
    icon: 'map-pin',
    label: 'Lives in',
    value: 'San Francisco, CA',
  },
  {
    icon: 'users',
    label: 'Followed by',
    value: '25.3k People',
  },
  {
    icon: 'mail',
    label: 'Email',
    link: 'hello@example.com',
  },
  {
    icon: 'link',
    label: 'Website',
    link: 'www.example.dev',
  },
  {
    icon: 'world',
    label: 'Languages',
    value: 'English, Hindi, Japanese',
  },
]

export type SocialFeedType = {
  image: string
  name: string
  text?: string
  actionIcons?: {
    icon: string
    variant: string
  }[]
  time?: string
  badge?: {
    variant: string
    text: string
  }
}

export const socialFeedData: SocialFeedType[] = [
  {
    image: user3,
    name: 'Ava Brooks',
    text: 'ava@pixelsuite.io',
    actionIcons: [{ icon: 'message', variant: 'primary' }],
  },
  {
    image: user4,
    name: 'Leo Martin',
    text: 'leo@designbyte.com',
    badge: { variant: 'success', text: 'New Request' },
    actionIcons: [
      { icon: 'check', variant: 'outline-primary' },
      { icon: 'x', variant: 'danger' },
    ],
  },
  {
    image: user5,
    name: 'Sophie Moore',
    text: 'Liked your post',
    time: '2m ago',
  },
  {
    image: user6,
    name: 'Liam Johnson',
    text: 'Commented on your photo',
    actionIcons: [{ icon: 'eye', variant: 'outline-secondary' }],
  },
  {
    image: user7,
    name: 'Mia Collins',
    text: 'Invited you to join "Design Ninjas"',
    actionIcons: [{ icon: 'user-plus', variant: 'outline-primary' }],
  },
  {
    image: user8,
    name: 'Ethan Green',
    text: 'Mentioned you in a comment',
    actionIcons: [{ icon: 'bell', variant: 'outline-info' }],
  },
  {
    image: user9,
    name: 'Emma King',
    text: 'Tagged you in a photo',
    actionIcons: [{ icon: 'camera', variant: 'outline-secondary' }],
  },
  {
    image: user10,
    name: 'Jack Wilson',
    text: 'Started following you',
    actionIcons: [{ icon: 'user-check', variant: 'outline-primary' }],
  },
  {
    image: user1,
    name: 'Isabella Lee',
    text: 'Reacted to your story',
    time: '15m ago',
  },
  {
    image: user2,
    name: 'Benjamin Gray',
    text: 'Shared your post',
    actionIcons: [{ icon: 'share', variant: 'outline-success' }],
  },
]

export type TaskType = {
  title: string
  dueDays: number
  status: 'in-progress' | 'completed' | 'on-hold' | 'out-dated'
  assignBy: {
    name: string
    image: string
    email: string
  }
  startDate: string
  priority: 'high' | 'low' | 'medium'
  progress: number
  time: string
}

export const taskData: TaskType[] = [
  {
    title: 'Admin Dashboard Template - Final Touch',
    dueDays: 2,
    status: 'in-progress',
    assignBy: {
      name: 'Liam Johnson',
      image: user3,
      email: 'liam@pixelcraft.io',
    },
    startDate: 'Apr 15, 2025',
    priority: 'high',
    progress: 70,
    time: '8h 45min',
  },
  {
    title: 'Tailwind UI Kit Design',
    dueDays: 10,
    status: 'completed',
    assignBy: {
      name: 'Ava Reynolds',
      image: user5,
      email: 'ava@designwave.co',
    },
    startDate: 'Mar 29, 2025',
    priority: 'low',
    progress: 100,
    time: '34h 10min',
  },
  {
    title: 'React + Next.js Starter Template',
    dueDays: 5,
    status: 'in-progress',
    assignBy: {
      name: 'Noah Carter',
      image: user2,
      email: 'noah@devspark.com',
    },
    startDate: 'Apr 12, 2025',
    priority: 'medium',
    progress: 45,
    time: '14h 25min',
  },
  {
    title: 'Laravel Template Docs Update',
    dueDays: 4,
    status: 'on-hold',
    assignBy: {
      name: 'Sophia Bennett',
      image: user1,
      email: 'sophia@codepress.io',
    },
    startDate: 'Apr 10, 2025',
    priority: 'low',
    progress: 30,
    time: '6h 50min',
  },
  {
    title: 'Portfolio Website Redesign',
    dueDays: 12,
    status: 'out-dated',
    assignBy: {
      name: 'Mason Clark',
      image: user6,
      email: 'mason@webgenius.dev',
    },
    startDate: 'Apr 01, 2025',
    priority: 'high',
    progress: 10,
    time: '11h 30min',
  },
]

export type BlogType = {
  category: string
  image: string
  title: string
  description: string
  tags: string[]
  date: string
  comments: number
  views: string
  author: {
    name: string
    image: string
  }
}

export const blogData: BlogType[] = [
  {
    category: 'Technology',
    image: blog4,
    title: 'The Future of Artificial Intelligence',
    description: 'Discover how AI is transforming industries and what the future holds for this cutting-edge technology.',
    tags: ['AI', 'Technology', 'Innovation'],
    date: 'Jan 12, 2025',
    comments: 89,
    views: '1,284',
    author: {
      name: 'Michael Turner',
      image: user4,
    },
  },
  {
    category: 'Data Science',
    image: blog5,
    title: 'Top Data Science Trends in 2025',
    description: 'Get ahead in the data science field with the latest trends, technologies, and tools that are reshaping the industry.',
    tags: ['Data Science', 'Trends', '2025'],
    date: 'Jan 29, 2025',
    comments: 70,
    views: '1,850',
    author: {
      name: 'Olivia Brown',
      image: user1,
    },
  },
  {
    category: 'Business',
    image: blog3,
    title: '5 Key Tips for New Entrepreneurs',
    description: 'Start your entrepreneurial journey with these 5 essential tips that will guide you through the first year of business.',
    tags: ['Business', 'Entrepreneur', 'Startup'],
    date: 'Jan 20, 2025',
    comments: 23,
    views: '3,842',
    author: {
      name: 'David Clark',
      image: user7,
    },
  },
]

export type StatisticsCardType = {
  title: string
  description: string
  badge: string
  icon: string
  count: { value: number; prefix?: string; suffix?: string }
  variant: string
  totalCount: { value: number; prefix?: string; suffix?: string }
}

export const statisticsData: StatisticsCardType[] = [
  {
    title: 'My Tasks',
    badge: '+3 New',
    icon: 'clipboard-list',
    count: { value: 124 },
    variant: 'primary',
    totalCount: { value: 12450 },
    description: 'Total Tasks',
  },
  {
    title: 'Messages',
    badge: '+5 New',
    icon: 'messages',
    count: { value: 69.5, suffix: 'k' },
    variant: 'secondary',
    totalCount: { value: 32.1, suffix: 'M' },
    description: 'Total Messages',
  },
  {
    title: 'Clients',
    badge: '+4 New',
    icon: 'users',
    count: { value: 184 },
    variant: 'secondary',
    totalCount: { value: 9835 },
    description: 'Total Clients',
  },
  {
    title: 'Revenue',
    badge: '+1.5%',
    icon: 'credit-card',
    count: { value: 25.5, prefix: '$', suffix: 'k' },
    variant: 'primary',
    totalCount: { value: 12.5, prefix: '$', suffix: 'M' },
    description: 'Total Revenue',
  },
]
