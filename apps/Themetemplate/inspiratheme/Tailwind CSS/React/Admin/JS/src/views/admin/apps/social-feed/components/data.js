import gallery1 from '@/assets/images/gallery/1.jpg'
import gallery2 from '@/assets/images/gallery/2.jpg'
import gallery3 from '@/assets/images/gallery/3.jpg'
import user1 from '@/assets/images/users/user-1.jpg'
import user10 from '@/assets/images/users/user-10.jpg'
import user2 from '@/assets/images/users/user-2.jpg'
import user3 from '@/assets/images/users/user-3.jpg'
import user5 from '@/assets/images/users/user-5.jpg'
import user6 from '@/assets/images/users/user-6.jpg'
import user8 from '@/assets/images/users/user-8.jpg'
import user9 from '@/assets/images/users/user-9.jpg'
export const activityData = [
  {
    user: {
      image: user8,
      name: 'jenny.w',
    },
    message: 'started following you',
    time: '2m ago',
  },
  {
    user: {
      image: user9,
      name: 'daniel92',
    },
    message: 'commented on your post',
    time: '3m ago',
    image: gallery1,
  },
  {
    user: {
      image: user10,
      name: 'amelie.design',
    },
    message: 'liked your story',
    time: '4m ago',
    image: gallery2,
  },
  {
    user: {
      image: user5,
      name: 'johnny_dev',
    },
    message: 'started following you',
    time: '6m ago',
  },
  {
    user: {
      image: user6,
      name: 'art.gal',
    },
    message: 'liked your post',
    time: '8m ago',
    image: gallery3,
  },
]
export const requestData = [
  {
    image: user3,
    title: 'Emily Zhang',
    description: 'requested to collaborate on your design project.',
    badge: {
      label: 'New',
      className: 'bg-primary',
    },
    time: '2 minutes ago',
    action: 'Accept',
  },
  {
    icon: 'rocket',
    iconClassName: 'bg-info',
    title: 'New Feature:',
    description: 'Suggestion for dark mode support.',
    badge: {
      label: 'Pending',
      className: 'bg-warning text-dark',
    },
    time: '10 minutes ago',
    action: 'Review',
  },
  {
    image: user6,
    title: 'Client Feedback:',
    description: 'John Doe left a review on your dashboard.',
    badge: {
      label: 'Feedback',
      className: 'bg-secondary',
    },
    time: '30 minutes ago',
    action: 'Respond',
  },
  {
    icon: 'bug',
    iconClassName: 'bg-primary',
    title: 'Bug Report:',
    description: 'Login form issue on Safari mobile.',
    badge: {
      label: 'Urgent',
      className: 'bg-danger',
    },
    time: '1 hour ago',
    action: 'View',
  },
]
export const trendingData = [
  {
    title: 'Golden Globes:',
    description: 'The 27 Best moments from the Golden Globe Awards',
    href: '',
  },
  {
    title: 'World Cricket:',
    description: 'India has won ICC T20 World Cup Yesterday',
    href: '',
  },
  {
    title: 'Antarctica:',
    description: 'Melting of Totten Glacier could cause high risk to areas near by sea',
    href: '',
  },
  {
    title: 'Global Tournament:',
    description: 'America has won Football match Yesterday',
    href: '',
  },
]
export const profileMainMenuData = [
  {
    label: 'News Feed',
    href: '',
    icon: 'smart-home',
  },
  {
    label: 'Messages',
    href: '',
    icon: 'message-circle',
    badge: {
      label: '5',
      className: 'bg-danger/10 text-danger',
    },
  },
  {
    label: 'Friends',
    href: '',
    icon: 'users',
  },
  {
    label: 'Notifications',
    href: '',
    icon: 'bell',
    badge: {
      label: '12',
      className: 'bg-warning/10 text-warning',
    },
  },
  {
    label: 'Groups',
    href: '',
    icon: 'category',
  },
  {
    label: 'Pages',
    href: '',
    icon: 'book',
  },
  {
    label: 'Events',
    href: '',
    icon: 'calendar-event',
  },
  {
    label: 'Settings',
    href: '',
    icon: 'settings',
  },
]
export const commentData = [
  {
    image: user1,
    message: "That sounds awesome! Can't wait to see how you designed the UI.",
    name: 'Liam Johnson',
    time: '10 minutes ago',
    reply: [
      {
        image: user2,
        message: "I'm excited to see the final result! Let me know when you're ready to share.",
        name: 'Olivia Carter',
        time: '5 minutes ago',
      },
    ],
  },
]
export const categoryData = [
  {
    label: 'Technology',
    href: '',
    iconClassName: 'text-primary',
  },
  {
    label: 'Travel',
    href: '',
    iconClassName: 'text-success',
  },
  {
    label: 'Lifestyle',
    href: '',
    iconClassName: 'text-danger',
  },
  {
    label: 'Photography',
    href: '',
    iconClassName: 'text-info',
  },
]
