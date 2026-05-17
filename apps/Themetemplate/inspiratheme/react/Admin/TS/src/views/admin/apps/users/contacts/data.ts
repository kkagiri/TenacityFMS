import caFlag from '@/assets/images/flags/ca.svg'
import cnFlag from '@/assets/images/flags/cn.svg'
import esFlag from '@/assets/images/flags/es.svg'
import gbFlag from '@/assets/images/flags/gb.svg'
import inFlag from '@/assets/images/flags/in.svg'
import usFlag from '@/assets/images/flags/us.svg'
import user4 from '@/assets/images/users/user-4.jpg'
import user5 from '@/assets/images/users/user-5.jpg'
import user6 from '@/assets/images/users/user-6.jpg'
import user7 from '@/assets/images/users/user-7.jpg'
import user8 from '@/assets/images/users/user-8.jpg'

export type ContactType = {
  name: string
  image?: string
  position: string
  role: string
  email: string
  contact: string
  location: string
  website: string
  updatedTime: string
  flag: string
  className: string
}

export const contactData: ContactType[] = [
  {
    name: 'Sophia Carter',
    image: user5,
    position: 'Lead UI/UX Designer',
    role: 'Admin',
    email: 'sophia@designhub.com',
    contact: '+44 7911 123456',
    location: 'London, UK',
    website: 'www.sophiacarter.com',
    updatedTime: 'Updated 30 min ago',
    flag: gbFlag,
    className: 'bg-warning',
  },
  {
    name: 'Marcus Lee',
    image: user6,
    position: 'Senior Developer',
    role: 'Team Lead',
    email: 'marcus@devhub.com',
    contact: '+1 408-222-9876',
    location: 'Austin, TX',
    website: 'www.devhub.com',
    updatedTime: 'Updated 1 hour ago',
    flag: usFlag,
    className: 'bg-success',
  },
  {
    name: 'Emily Davis',
    image: user7,
    position: 'Marketing Strategist',
    role: 'Member',
    email: 'emily@marketboost.com',
    contact: '+1 212-555-7890',
    location: 'New York, NY',
    website: 'www.marketboost.com',
    updatedTime: 'Updated 10 min ago',
    flag: usFlag,
    className: 'bg-danger',
  },
  {
    name: 'Daniel Smith',
    image: user8,
    position: 'Data Analyst',
    role: 'Contributor',
    email: 'daniel@analyticspro.io',
    contact: '+1 987-654-3210',
    location: 'Toronto, Canada',
    website: 'www.analyticspro.io',
    updatedTime: 'Updated 45 min ago',
    flag: caFlag,
    className: 'bg-info',
  },
  {
    name: 'Daniel Morris',
    image: user7,
    position: 'Project Manager',
    role: 'Team Lead',
    email: 'daniel@projecthub.io',
    contact: '+1 212 555 7890',
    location: 'New York, USA',
    website: 'www.danielmorris.com',
    updatedTime: 'Updated 1 hour ago',
    flag: usFlag,
    className: 'bg-success',
  },
  {
    name: 'Jessica Chen',
    image: user4,
    position: 'UI/UX Designer',
    role: 'Editor',
    email: 'jessica@uxstudio.cn',
    contact: '+86 10-1234-5678',
    location: 'Beijing, China',
    website: 'www.uxstudio.cn',
    updatedTime: 'Updated 20 min ago',
    flag: cnFlag,
    className: 'bg-success',
  },
  {
    name: 'Arjun Patel',
    position: 'Software Engineer',
    role: 'Member',
    email: 'arjun@techflow.in',
    contact: '+91 98765-43210',
    location: 'Bangalore, India',
    website: 'www.techflow.in',
    updatedTime: 'Updated 10 min ago',
    flag: inFlag,
    className: 'bg-warning',
  },
  {
    name: 'Olivia Garcia',
    image: user6,
    position: 'Content Strategist',
    role: 'Guest',
    email: 'olivia@contentwave.es',
    contact: '+34 912 345 678',
    location: 'Madrid, Spain',
    website: 'www.contentwave.es',
    updatedTime: 'Updated 5 min ago',
    flag: esFlag,
    className: 'bg-danger',
  },
]
