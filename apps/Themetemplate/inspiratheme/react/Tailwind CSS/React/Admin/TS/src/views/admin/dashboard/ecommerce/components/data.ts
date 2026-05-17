import product1 from '@/assets/images/products/1.png'
import product2 from '@/assets/images/products/2.png'
import product4 from '@/assets/images/products/4.png'
import product5 from '@/assets/images/products/5.png'
import product6 from '@/assets/images/products/6.png'

import user1 from '@/assets/images/users/user-1.jpg'
import user2 from '@/assets/images/users/user-2.jpg'
import user4 from '@/assets/images/users/user-4.jpg'
import user5 from '@/assets/images/users/user-5.jpg'
import user6 from '@/assets/images/users/user-6.jpg'

import americanExpressImg from '@/assets/images/cards/american-express.svg'
import mastercardImg from '@/assets/images/cards/mastercard.svg'
import visaImg from '@/assets/images/cards/visa.svg'
import locationPinImg from '@/assets/images/location-pin.png'

import { getColor } from '@/utils/helpers'

export type CardData = {
  title: string
  badgeColor: string
  badgeText: string
  value: string
  metric: string
  targetValue: number
  prefix?: string
  suffix?: string
}

export const cardData: CardData[] = [
  {
    title: 'Total Sales',
    badgeColor: 'bg-success/15 text-success',
    badgeText: 'Monthly',
    value: '$0K',
    metric: 'Monthly Total Sales',
    targetValue: 250,
    prefix: '$',
    suffix: 'K',
  },
  {
    title: 'Total Orders',
    badgeColor: 'bg-primary/15 text-primary',
    badgeText: 'Monthly',
    value: '0',
    metric: 'Monthly Total Orders',
    targetValue: 180,
  },
  {
    title: 'New Customers',
    badgeColor: 'bg-info/15 text-info',
    badgeText: 'Monthly',
    value: '0',
    metric: 'Monthly New Customers',
    targetValue: 50895,
  },
  {
    title: 'Revenue',
    badgeColor: 'bg-warning/15 text-warning',
    badgeText: 'Monthly',
    value: '$0K',
    metric: 'Monthly Revenue',
    targetValue: 50.33,
    prefix: '$',
    suffix: 'K',
  },
]

type StatCardProps = {
  value: number
  valuePrefix?: string
  valueSuffix?: string
  percentage: number
  icon: string
  iconClassName: string
  title: string
  progress: number
}

export const ordersStatsData: StatCardProps[] = [
  {
    value: 24500,
    valuePrefix: '$',
    percentage: 18.45,
    icon: 'arrow-up',
    iconClassName: 'text-success',
    title: 'Total sales in period',
    progress: 18.45,
  },
  {
    value: 1240,
    percentage: 10.35,
    icon: 'arrow-down',
    iconClassName: 'text-danger',
    title: 'Number of customers',
    progress: 10.35,
  },
  {
    value: 3750,
    percentage: 22.61,
    icon: 'bolt',
    iconClassName: 'text-primary',
    title: 'Products sold in the period',
    progress: 22.61,
  },
  {
    value: 65.49,
    valuePrefix: '$',
    valueSuffix: 'USD',
    percentage: 5.92,
    icon: 'arrow-up',
    iconClassName: 'text-success',
    title: 'Average order value',
    progress: 5.92,
  },
]

export type ProductType = {
  id: number
  image: string
  name: string
  category: string
  stock: string
  price: string
  ratings: number
  reviews: number
  status: string
  statusVariant: string
}

export const products: ProductType[] = [
  {
    id: 1,
    image: product1,
    name: 'Smart Watch',
    category: 'Wearables',
    stock: '120 units',
    price: '$89.99',
    ratings: 4,
    reviews: 45,
    status: 'Active',
    statusVariant: 'text-success',
  },
  {
    id: 2,
    image: product2,
    name: 'Bluetooth Speaker',
    category: 'Audio',
    stock: '75 units',
    price: '$39.50',
    ratings: 3,
    reviews: 20,
    status: 'Low Stock',
    statusVariant: 'text-warning',
  },
  {
    id: 3,
    image: product4,
    name: 'Gaming Mouse',
    category: 'Accessories',
    stock: '0 units',
    price: '$24.99',
    ratings: 5,
    reviews: 14,
    status: 'Out of Stock',
    statusVariant: 'text-danger',
  },
  {
    id: 4,
    image: product5,
    name: '4K Action Camera',
    category: 'Cameras',
    stock: '60 units',
    price: '$149.00',
    ratings: 4,
    reviews: 31,
    status: 'Active',
    statusVariant: 'text-success',
  },
  {
    id: 5,
    image: product6,
    name: 'Fitness Tracker Band',
    category: 'Wearables',
    stock: '220 units',
    price: '$34.95',
    ratings: 4.5,
    reviews: 18,
    status: 'Active',
    statusVariant: 'text-success',
  },
]

export type OrderType = {
  id: string
  userImage: string
  userName: string
  product: string
  date: string
  amount: string
  status: string
  statusVariant: string
}

export const orders: OrderType[] = [
  {
    id: 'ORD-1001',
    userImage: user1,
    userName: 'John Doe',
    product: 'Smart Watch',
    date: '2025-04-29',
    amount: '$89.99',
    status: 'Delivered',
    statusVariant: 'text-success',
  },
  {
    id: 'ORD-1002',
    userImage: user2,
    userName: 'Emma Watson',
    product: 'Bluetooth Speaker',
    date: '2025-04-28',
    amount: '$39.50',
    status: 'Pending',
    statusVariant: 'text-warning',
  },
  {
    id: 'ORD-1003',
    userImage: user4,
    userName: 'Liam Johnson',
    product: 'Smart Watch',
    date: '2025-04-27',
    amount: '$89.99',
    status: 'Completed',
    statusVariant: 'text-success',
  },
  {
    id: 'ORD-1004',
    userImage: user6,
    userName: 'Olivia Brown',
    product: 'Gaming Mouse',
    date: '2025-04-26',
    amount: '$24.99',
    status: 'Cancelled',
    statusVariant: 'text-danger',
  },
  {
    id: 'ORD-1005',
    userImage: user5,
    userName: 'Noah Smith',
    product: 'Fitness Tracker Band',
    date: '2025-04-25',
    amount: '$34.95',
    status: 'Completed',
    statusVariant: 'text-success',
  },
]

export type TransactionType = {
  id: string
  order: string
  date: string
  time: string
  amount: string
  status: string
  statusVariant: string
  paymentMethod: string
  lastFour: string
}

export const transactions: TransactionType[] = [
  {
    id: '#TR-3468',
    order: '#ORD-1003 - Smart Watch',
    date: '27 Apr 2025',
    time: '02:15 PM',
    amount: '$89.99',
    status: 'Paid',
    statusVariant: 'bg-success/15 text-success',
    paymentMethod: mastercardImg,
    lastFour: '1123',
  },
  {
    id: '#TR-3469',
    order: '#ORD-1004 - Gaming Mouse',
    date: '26 Apr 2025',
    time: '09:42 AM',
    amount: '$24.99',
    status: 'Failed',
    statusVariant: 'bg-danger/15 text-danger',
    paymentMethod: visaImg,
    lastFour: '3490',
  },
  {
    id: '#TR-3470',
    order: '#ORD-1005 - Fitness Tracker Band',
    date: '25 Apr 2025',
    time: '11:10 AM',
    amount: '$34.95',
    status: 'Paid',
    statusVariant: 'bg-success/15 text-success',
    paymentMethod: americanExpressImg,
    lastFour: '8765',
  },
  {
    id: '#TR-3471',
    order: '#ORD-1006 - Wireless Keyboard',
    date: '24 Apr 2025',
    time: '08:58 PM',
    amount: '$59.00',
    status: 'Pending',
    statusVariant: 'bg-warning/15 text-warning',
    paymentMethod: mastercardImg,
    lastFour: '5566',
  },
  {
    id: '#TR-3472',
    order: '#ORD-1007 - Portable Charger',
    date: '23 Apr 2025',
    time: '05:37 PM',
    amount: '$45.80',
    status: 'Paid',
    statusVariant: 'bg-success/15 text-success',
    paymentMethod: visaImg,
    lastFour: '9012',
  },
]

export const getWorldMapOptions = () => {
  return {
    type: 'world',
    zoomOnScroll: true,
    zoomButtons: false,
    selectedMarkers: [1, 1],
    markersSelectable: true,
    selectedRegions: ['CA', 'US', 'AU'],
    regionStyle: {
      initial: {
        stroke: '#a2abbd',
        strokeWidth: 0.5,
        fillOpacity: 0.1,
      },
      selected: { fill: getColor('primary') },
    },
    markers: [
      {
        name: 'Russia',
        coords: [61.524, 105.3188],
      },
      {
        name: 'Canada',
        coords: [56.1304, -106.3468],
        style: {
          image: locationPinImg,
        },
      },
      { name: 'Australia', coords: [-25.2744, 133.7751] },
      { name: 'Greenland', coords: [71.7069, -42.6043] },
    ],
    lines: [
      {
        from: 'Russia',
        to: 'Canada',
      },
      {
        from: 'Australia',
        to: 'Canada',
      },
      {
        from: 'Greenland',
        to: 'Canada',
      },
      {
        from: 'Brazil',
        to: 'Canada',
      },
    ],
    markerStyle: {
      initial: {
        fill: getColor('primary'),
        stroke: getColor('primary'),
        fillOpacity: 0.3,
        strokeWidth: 2,
        r: 2,
      },
      selected: {
        fill: getColor('primary'),
        stroke: getColor('primary'),
        strokeWidth: 1,
      },
    },
    labels: {
      markers: {
        render: (marker: any) => marker.name,
      },
    },
    lineStyle: {
      animation: true,
      strokeDasharray: '6 3 6',
    },
  }
}
