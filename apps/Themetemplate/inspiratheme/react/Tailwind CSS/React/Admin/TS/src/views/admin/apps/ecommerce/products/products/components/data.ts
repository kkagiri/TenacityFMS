import product1 from '@/assets/images/products/1.png'
import product10 from '@/assets/images/products/10.png'
import product2 from '@/assets/images/products/2.png'
import product3 from '@/assets/images/products/3.png'
import product4 from '@/assets/images/products/4.png'
import product5 from '@/assets/images/products/5.png'
import product6 from '@/assets/images/products/6.png'
import product7 from '@/assets/images/products/7.png'
import product8 from '@/assets/images/products/8.png'
import product9 from '@/assets/images/products/9.png'

export type StatType = {
  title: string
  value: number
  prefix?: string
  suffix?: string
  change: number
  icon: string
  iconClassName: string
  bulletClassName: string
  metric: string
  metricValue: string
}

export const statData: StatType[] = [
  {
    title: 'Products',
    value: 2240,
    change: 24,
    icon: 'package',
    iconClassName: 'bg-primary',
    metric: 'Active Listings',
    metricValue: '980',
    bulletClassName: 'text-primary',
  },
  {
    title: 'Orders',
    value: 8014,
    change: 120,
    icon: 'shopping-cart',
    iconClassName: 'bg-secondary',
    metric: 'Total Orders',
    metricValue: '105K',
    bulletClassName: 'text-secondary',
  },
  {
    title: 'Sales',
    value: 17854.22,
    prefix: '$',
    change: 8.2,
    icon: 'currency-dollar',
    iconClassName: 'bg-success',
    metric: "Today's Sales",
    metricValue: '$156K',
    bulletClassName: 'text-success',
  },
  {
    title: 'Customers',
    value: 3209,
    change: 36,
    icon: 'users',
    iconClassName: 'bg-info',
    metric: 'Total Customers',
    metricValue: '58,320',
    bulletClassName: 'text-info',
  },
  {
    title: 'Revenue',
    value: 3.5,
    suffix: 'M',
    prefix: '$',
    change: -4.5,
    icon: 'chart-bar',
    iconClassName: 'bg-warning',
    metric: 'Total Revenue',
    metricValue: '$12.8M',
    bulletClassName: 'text-warning',
  },
]

export type ProductType = {
  id: string
  image: string
  name: string
  brand: string
  sku: string
  category: string
  stock: number
  price: string
  orders: number
  rating: number
  reviews: number
  status: 'published' | 'out-of-stock' | 'pending'
  lastModified: string
  date: string
  time: string
}

export const productData: ProductType[] = [
  {
    id: 'WB-10245',
    image: product1,
    name: 'Wireless Earbuds',
    brand: 'My Furniture',
    sku: 'WB-10245',
    category: 'Electronics',
    stock: 56,
    price: '$59.99',
    orders: 124,
    rating: 5,
    reviews: 87,
    status: 'published',
    lastModified: '18 Apr, 2025 12:24 PM',
    date: '18 Apr, 2025',
    time: '12:24 PM',
  },
  {
    id: 'SL-89012',
    image: product2,
    name: 'Smart LED Desk Lamp',
    brand: 'BrightLite',
    sku: 'SL-89012',
    category: 'Home & Office',
    stock: 32,
    price: '$39.49',
    orders: 78,
    rating: 4,
    reviews: 54,
    status: 'pending',
    lastModified: '22 Apr, 2025 09:45 AM',
    date: '22 Apr, 2025',
    time: '09:45 AM',
  },
  {
    id: 'RS-20450',
    image: product3,
    name: "Men's Running Shoes",
    brand: 'ActiveWear Co.',
    sku: 'RS-20450',
    category: 'Fashion',
    stock: 120,
    price: '$89.00',
    orders: 231,
    rating: 5,
    reviews: 142,
    status: 'published',
    lastModified: '24 Apr, 2025 03:10 PM',
    date: '24 Apr, 2025',
    time: '03:10 PM',
  },
  {
    id: 'FT-67123',
    image: product4,
    name: 'Fitness Tracker Watch',
    brand: 'FitPulse',
    sku: 'FT-67123',
    category: 'Fitness',
    stock: 78,
    price: '$49.95',
    orders: 198,
    rating: 4,
    reviews: 89,
    status: 'published',
    lastModified: '23 Apr, 2025 10:12 AM',
    date: '23 Apr, 2025',
    time: '10:12 AM',
  },
  {
    id: 'GM-72109',
    image: product5,
    name: 'Gaming Mouse RGB',
    brand: 'HyperClick',
    sku: 'GM-72109',
    category: 'Gaming',
    stock: 120,
    price: '$29.99',
    orders: 243,
    rating: 3,
    reviews: 102,
    status: 'published',
    lastModified: '19 Apr, 2025 05:56 PM',
    date: '19 Apr, 2025',
    time: '05:56 PM',
  },
  {
    id: 'FC-31220',
    image: product6,
    name: 'Modern Lounge Chair',
    brand: 'UrbanLiving',
    sku: 'FC-31220',
    category: 'Furniture',
    stock: 24,
    price: '$199.00',
    orders: 38,
    rating: 5,
    reviews: 27,
    status: 'out-of-stock',
    lastModified: '18 Apr, 2025 11:30 AM',
    date: '18 Apr, 2025',
    time: '11:30 AM',
  },
  {
    id: 'TY-00788',
    image: product7,
    name: 'Plush Toy Bear',
    brand: 'Softies',
    sku: 'TY-00788',
    category: 'Toys',
    stock: 150,
    price: '$15.99',
    orders: 305,
    rating: 4,
    reviews: 120,
    status: 'published',
    lastModified: '17 Apr, 2025 04:21 PM',
    date: '17 Apr, 2025',
    time: '04:21 PM',
  },
  {
    id: 'TV-5588',
    image: product8,
    name: '55" Ultra HD Smart TV',
    brand: 'ViewMaster',
    sku: 'TV-5588',
    category: 'Electronics',
    stock: 64,
    price: '$499.00',
    orders: 142,
    rating: 4,
    reviews: 88,
    status: 'published',
    lastModified: '25 Apr, 2025 10:10 AM',
    date: '25 Apr, 2025',
    time: '10:10 AM',
  },
  {
    id: 'IMAC-M3-24',
    image: product9,
    name: 'Apple iMac 24" M3',
    brand: 'Apple',
    sku: 'IMAC-M3-24',
    category: 'Computers',
    stock: 18,
    price: '$1399.0',
    orders: 29,
    rating: 5,
    reviews: 16,
    status: 'pending',
    lastModified: '24 Apr, 2025 02:14 PM',
    date: '24 Apr, 2025',
    time: '02:14 PM',
  },
  {
    id: 'SWPX2-GL',
    image: product10,
    name: 'Smart Watch Pro X2',
    brand: 'FitTech',
    sku: 'SWPX2-GL',
    category: 'Wearables',
    stock: 85,
    price: '$149.5',
    orders: 197,
    rating: 4,
    reviews: 65,
    status: 'published',
    lastModified: '23 Apr, 2025 08:00 AM',
    date: '23 Apr, 2025',
    time: '08:00 AM',
  },
]
