import blog1 from '@/assets/images/blog/blog-1.jpg'
import blog2 from '@/assets/images/blog/blog-2.jpg'
import blog3 from '@/assets/images/blog/blog-3.jpg'
import blog4 from '@/assets/images/blog/blog-4.jpg'
import blog5 from '@/assets/images/blog/blog-5.jpg'
import user3 from '@/assets/images/users/user-3.jpg'
import user5 from '@/assets/images/users/user-5.jpg'
import user7 from '@/assets/images/users/user-7.jpg'
import user8 from '@/assets/images/users/user-8.jpg'
import user9 from '@/assets/images/users/user-9.jpg'
export const blogData = [
  {
    category: {
      label: 'Development',
      className: 'text-bg-dark',
    },
    image: blog1,
    title: 'Building REST APIs with Node.js',
    description: 'Learn how to design and build scalable REST APIs with Node.js and Express in this step-by-step tutorial.',
    tags: ['Node.js', 'API', 'Tutorial'],
    date: 'Feb 2, 2025',
    comments: 16,
    views: 8974,
    author: {
      name: 'John Doe',
      image: user3,
    },
  },
  {
    category: {
      label: 'Design',
      className: 'text-bg-primary',
    },
    image: blog2,
    title: '10 Essential UI Design Tips for Better User Experience',
    description: 'Discover key principles and practical tips to enhance usability, accessibility, and aesthetics in your web design.',
    tags: ['Design', 'UI/UX', 'Tips'],
    date: 'Mar 10, 2025',
    comments: 24,
    views: 12346,
    author: {
      name: 'Sarah Lee',
      image: user5,
    },
  },
  {
    category: {
      label: 'Technology',
      className: 'text-bg-success',
    },
    image: blog3,
    title: 'How AI is Transforming Modern Web Development',
    description: 'Explore how artificial intelligence is revolutionizing the way developers build, test, and deploy web applications.',
    tags: ['AI', 'Web', 'Technology'],
    date: 'Apr 5, 2025',
    comments: 32,
    views: 15478,
    author: {
      name: 'Michael Brown',
      image: user7,
    },
  },
  {
    category: {
      label: 'Marketing',
      className: 'text-bg-warning',
    },
    image: blog4,
    title: 'Top 5 Content Marketing Strategies That Work in 2025',
    description: 'Learn how to build a strong content plan, leverage social media trends, and boost engagement with your target audience.',
    tags: ['Marketing', 'SEO', 'Strategy'],
    date: 'May 18, 2025',
    comments: 19,
    views: 9812,
    author: {
      name: 'Emily Carter',
      image: user8,
    },
  },
  {
    category: {
      label: 'Startup',
      className: 'text-bg-info',
    },
    image: blog5,
    title: 'Scaling Your Startup: Lessons from Successful Founders',
    description: 'Explore actionable insights from entrepreneurs on managing growth, funding rounds, and building strong company culture.',
    tags: ['Startup', 'Growth', 'Business'],
    date: 'Jun 9, 2025',
    comments: 27,
    views: 14532,
    author: {
      name: 'David Wilson',
      image: user9,
    },
  },
]
export const categoryData = [
  {
    name: 'Development',
    value: 12,
  },
  {
    name: 'Design',
    value: 8,
  },
  {
    name: 'Marketing',
    value: 5,
  },
  {
    name: 'Technology',
    value: 9,
  },
  {
    name: 'Startup',
    value: 6,
  },
]
export const popularPostData = [
  {
    title: 'Unlocking the Secrets of Modern UI Design',
    href: '',
  },
  {
    title: 'How to Build a Portfolio with Tailwind CSS',
    href: '',
  },
  {
    title: 'Boost Productivity with These Web Dev Tools',
    href: '',
  },
  {
    title: 'The Future of Frontend: Trends to Watch in 2025',
    href: '',
  },
  {
    title: 'Essential Tips for Clean and Maintainable Code',
    href: '',
  },
]
export const tagData = [
  {
    name: 'Web Design',
    href: '',
  },
  {
    name: 'Frontend',
    href: '',
  },
  {
    name: 'Tailwind CSS',
    href: '',
  },
  {
    name: 'JavaScript',
    href: '',
  },
  {
    name: 'React',
    href: '',
  },
  {
    name: 'Startup',
    href: '',
  },
  {
    name: 'DevTools',
    href: '',
  },
  {
    name: 'Open Source',
    href: '',
  },
  {
    name: 'Performance',
    href: '',
  },
  {
    name: 'UX/UI',
    href: '',
  },
  {
    name: 'SEO',
    href: '',
  },
]
