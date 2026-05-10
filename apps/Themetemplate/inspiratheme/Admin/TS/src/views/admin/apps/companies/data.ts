import airbnb from '@/assets/images/logos/airbnb.svg'
import amazon from '@/assets/images/logos/amazon.svg'
import apple from '@/assets/images/logos/apple.svg'
import google from '@/assets/images/logos/google.svg'
import meta from '@/assets/images/logos/meta.svg'
import shell from '@/assets/images/logos/shell.svg'
import spotify from '@/assets/images/logos/spotify.svg'
import starbucks from '@/assets/images/logos/starbucks.svg'
import walmart from '@/assets/images/logos/walmart.svg'

export type CompanyType = {
  image: string
  name: string
  website: string
  location: string
  industry: string
  description: string
  rating: number
  employees: string
  revenue: string
}

export const companyData: CompanyType[] = [
  {
    image: amazon,
    name: 'Amazon Inc.',
    website: 'www.amazon.com',
    location: 'Seattle, WA',
    industry: 'eCommerce',
    rating: 4,
    description: 'Amazon.com, Inc. is an American multinational technology company focusing on e-commerce, cloud computing...',
    employees: '1.5M+',
    revenue: '$514B',
  },
  {
    image: apple,
    name: 'Apple Inc.',
    website: 'www.apple.com',
    location: 'Cupertino, CA',
    industry: 'Tech',
    rating: 4,
    description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, and accessories.',
    employees: '160K+',
    revenue: '$383B',
  },
  {
    image: walmart,
    name: 'Walmart Inc.',
    website: 'www.walmart.com',
    location: 'Bentonville, AR',
    industry: 'Retail',
    rating: 3,
    description: 'Walmart operates a chain of hypermarkets, discount department stores, and grocery stores worldwide.',
    employees: '2.1M+',
    revenue: '$611B',
  },
  {
    image: starbucks,
    name: 'Starbucks',
    website: 'www.starbucks.com',
    location: 'Seattle, WA',
    industry: 'Food & Beverage',
    rating: 3,
    description: 'Starbucks is a multinational chain of coffeehouses and roastery reserves headquartered in Seattle, Washington.',
    employees: '400K+',
    revenue: '$36B',
  },
  {
    image: meta,
    name: 'Meta Platforms',
    website: 'about.meta.com',
    location: 'Menlo Park, CA',
    industry: 'Tech',
    rating: 4,
    description: 'Meta develops social media platforms and technologies including Facebook, Instagram, and the Metaverse.',
    employees: '86K+',
    revenue: '$117B',
  },
  {
    image: spotify,
    name: 'Spotify',
    website: 'www.spotify.com',
    location: 'Stockholm, Sweden',
    industry: 'Entertainment',
    rating: 3,
    description: 'Spotify is a digital music, podcast, and video streaming service with millions of active users worldwide.',
    employees: '8K+',
    revenue: '$13B',
  },
  {
    image: google,
    name: 'Google LLC',
    website: 'www.google.com',
    location: 'Mountain View, CA',
    industry: 'Tech',
    rating: 4,
    description: 'Google specializes in internet-related services and products, including search, ads, cloud, and more.',
    employees: '180K+',
    revenue: '$324B',
  },
  {
    image: airbnb,
    name: 'Airbnb',
    website: 'www.airbnb.com',
    location: 'San Francisco, CA',
    industry: 'Hospitality',
    rating: 3,
    description: 'Airbnb is a global platform for lodging, primarily homestays for vacation rentals and tourism activities.',
    employees: '6K+',
    revenue: '$9.9B',
  },
  {
    image: shell,
    name: 'Shell plc',
    website: 'www.shell.com',
    location: 'London, UK',
    industry: 'Energy',
    rating: 3,
    description: 'Shell is a global energy and petrochemical company focused on oil, gas, and renewable energy solutions.',
    employees: '90K+',
    revenue: '$381B',
  },
]
