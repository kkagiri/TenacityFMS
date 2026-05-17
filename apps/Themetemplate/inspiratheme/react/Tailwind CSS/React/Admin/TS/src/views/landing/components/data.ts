
import user1 from '@/assets/images/users/user-1.jpg'
import user2 from '@/assets/images/users/user-2.jpg'
import user3 from '@/assets/images/users/user-3.jpg'
import user4 from '@/assets/images/users/user-4.jpg'
import user5 from '@/assets/images/users/user-5.jpg'
import user7 from '@/assets/images/users/user-7.jpg'

import blog3 from '@/assets/images/blog/blog-3.jpg'
import blog4 from '@/assets/images/blog/blog-4.jpg'
import blog5 from '@/assets/images/blog/blog-5.jpg'

export type ServiceType = {
  name: string
  description: string
  icon: string
}

export const services: ServiceType[] = [
  {
    name: 'Digital Strategy',
    description: 'Crafting data-driven strategies to maximize online growth and brand engagement.',
    icon: 'bulb',
  },
  {
    name: 'SEO Optimization',
    description: 'Improve search engine rankings and increase website visibility through tailored SEO practices.',
    icon: 'chart-bar',
  },
  {
    name: 'Social Media Marketing',
    description: 'Engage your audience across platforms with strategic content and campaign management.',
    icon: 'speakerphone',
  },
  {
    name: 'Web Development',
    description: 'Building fast, responsive, and scalable websites that meet your business needs.',
    icon: 'world',
  },
  {
    name: 'Email Marketing',
    description: 'Connect with your audience and boost conversions through targeted email campaigns.',
    icon: 'mail',
  },
  {
    name: 'E-Commerce Solutions',
    description: 'Launch and manage high-performing online stores with secure, scalable features.',
    icon: 'shopping-cart',
  },
  {
    name: 'Content Creation',
    description: 'Produce compelling visuals and copy to drive traffic and build brand identity.',
    icon: 'camera',
  },
  {
    name: 'Security Audits',
    description: 'Ensure your website and data are secure with comprehensive vulnerability assessments.',
    icon: 'shield-check',
  },
]

export type StateType = {
  value: number
  suffix: string
  label: string
}

export const stats1: StateType[] = [
  { value: 99.2, suffix: '%', label: 'User satisfaction' },
  { value: 7.4, suffix: 'x', label: 'Monthly user growth' },
  { value: 1200, suffix: '+', label: 'Messages sent per second' },
]
export const stats2: StateType[] = [
  { value: 99.5, suffix: '%', label: 'File recovery success rate' },
  { value: 3.2, suffix: 'x', label: 'Faster upload speed' },
  { value: 1500, suffix: '+', label: 'Files organized per minute' },
]
export const stats3: StateType[] = [
  { value: 97.5, suffix: '%', label: 'Sync reliability' },
  { value: 4.2, suffix: 'x', label: 'Faster contact search' },
  { value: 250000, suffix: '+', label: 'Contacts managed daily' },
]

export type PricingPlanType = {
  name: string
  price: number
  description: string
  highlight: string
  features: {
    text: string
    included: boolean
  }[]
  btnClass: string
  isPopular?: boolean
}

export const pricingPlans: PricingPlanType[] = [
  {
    name: 'Single License',
    price: 49,
    description: 'Perfect for personal or one-client projects',
    highlight: 'Single project use',
    features: [
      { text: '1 project usage', included: true },
      { text: 'Full component access', included: true },
      { text: 'Basic documentation', included: true },
      { text: 'No multi-client use', included: false },
      { text: 'No SaaS/resale rights', included: false },
    ],
    btnClass: 'border border-primary text-primary hover:text-white hover:bg-primary',
  },
  {
    name: 'Multiple License',
    price: 249,
    description: 'For developers or agencies working with multiple clients',
    highlight: 'Up to 5 projects',
    features: [
      { text: 'Use in up to 5 projects', included: true },
      { text: 'Commercial client use', included: true },
      { text: 'Lifetime updates', included: true },
      { text: 'Premium support', included: true },
      { text: 'No resale/SaaS rights', included: false },
    ],
    btnClass: 'bg-primary text-white hover:bg-primary-hover',
    isPopular: true,
  },
  {
    name: 'Extended License',
    price: 999,
    description: 'For SaaS products or items offered in paid applications',
    highlight: 'Commercial redistribution rights',
    features: [
      { text: 'Unlimited project usage', included: true },
      { text: 'SaaS & resale rights', included: true },
      { text: 'Full Figma source files', included: true },
      { text: 'Priority support', included: true },
      { text: 'Custom licensing agreement', included: true },
    ],
    btnClass: 'bg-dark text-white hover:bg-dark-hover',
  },
]

export type TestimonialType = {
  avatar: string
  name: string
  title: string
  description: string
}

export const testimonials: TestimonialType[] = [
  {
    avatar: user1,
    name: 'Emily Carter',
    title: 'Absolutely love it!',
    description: 'This gadget exceeded all my expectations. Sleek design and incredible performance!',
  },
  {
    avatar: user2,
    name: 'Michael Zhang',
    title: 'Great value for money',
    description: 'Sturdy build and long battery life. Would definitely recommend it to friends!',
  },
  {
    avatar: user3,
    name: 'Sara Lopez',
    title: 'Top-notch customer service',
    description: 'The team helped me with my issue right away. Smooth experience overall!',
  },
  {
    avatar: user4,
    name: 'James Whitman',
    title: 'Highly impressed',
    description: 'The performance and features are unmatched in this price range. Highly impressed!',
  },
  {
    avatar: user5,
    name: 'Aisha Khan',
    title: 'Smooth experience from start to finish',
    description: 'The website, shipping, and support all worked flawlessly. Very satisfied!',
  },
]

export type BlogType = {
  category: string
  image: string
  title: string
  description: string
  date: string
  comments: number
  views: number
  author: {
    name: string
    image: string
  }
  url: string
}

export const blogs: BlogType[] = [
  {
    category: 'Technology',
    image: blog4,
    title: 'The Future of Artificial Intelligence',
    description: 'Discover how AI is transforming industries and what the future holds for this cutting-edge technology.',
    date: 'Jan 12, 2025',
    comments: 89,
    views: 1284,
    author: {
      name: 'Michael Turner',
      image: user4,
    },
    url: '/apps/blog/article',
  },
  {
    category: 'Data Science',
    image: blog5,
    title: 'Top Data Science Trends in 2025',
    description: 'Get ahead in the data science field with the latest trends, technologies, and tools that are reshaping the industry.',
    date: 'Jan 12, 2025',
    comments: 89,
    views: 1284,
    author: {
      name: 'Olivia Brown',
      image: user1,
    },
    url: '/apps/blog/article',
  },
  {
    category: 'Business',
    image: blog3,
    title: '5 Key Tips for New Entrepreneurs',
    description: 'Start your entrepreneurial journey with these 5 essential tips that will guide you through the first year of business.',
    date: 'Jan 12, 2025',
    comments: 89,
    views: 1284,
    author: {
      name: 'David Clark',
      image: user7,
    },
    url: '/apps/blog/article',
  },
]

export type footerLinksType = {
  title: string
  links: {
    name: string
    url: string
    badge?: {
      title: string
      variant: string
    }
  }[]
}

export const footerLinks: footerLinksType[] = [
  {
    title: 'Company',
    links: [
      { name: 'Our Story', url: '' },
      { name: 'Leadership Team', url: '' },
      {
        name: 'Careers',
        url: '',
        badge: { title: "We're Hiring", variant: 'bg-warning' },
      },
      { name: 'Press & Media', url: '' },
      { name: 'Investor Relations', url: '' },
      { name: 'Sustainability', url: '' },
    ],
  },
  {
    title: 'Community',
    links: [
      { name: 'Community Forum', url: '' },
      { name: 'Events & Meetups', url: '' },
      { name: 'Ambassadors', url: '' },
      { name: 'Customer Stories', url: '' },
      { name: 'Open Source', url: '' },
      { name: 'Code of Conduct', url: '' },
    ],
  },
  {
    title: 'Admin',
    links: [
      { name: 'Dashboard', url: '' },
      { name: 'User Management', url: '' },
      { name: 'Roles & Permissions', url: '' },
      { name: 'System Logs', url: '' },
      { name: 'Settings', url: '' },
      { name: 'API Access', url: '' },
    ],
  },
]

export type socialLinksType = {
  title: string
  icon: string
  url: string
}

export const socialLinks: socialLinksType[] = [
  { title: 'Facebook', icon: 'tabler:brand-facebook', url: '' },
  { title: 'Twitter-x', icon: 'tabler:brand-x', url: '' },
  { title: 'Instagram', icon: 'tabler:brand-instagram', url: '' },
  { title: 'Dribbble', icon: 'tabler:brand-whatsapp', url: '' },
]
