import auFlag from '@/assets/images/flags/au.svg'
import brFlag from '@/assets/images/flags/br.svg'
import caFlag from '@/assets/images/flags/ca.svg'
import deFlag from '@/assets/images/flags/de.svg'
import frFlag from '@/assets/images/flags/fr.svg'
import gbFlag from '@/assets/images/flags/gb.svg'
import inFlag from '@/assets/images/flags/in.svg'
import itFlag from '@/assets/images/flags/it.svg'
import jpFlag from '@/assets/images/flags/jp.svg'
import usFlag from '@/assets/images/flags/us.svg'

import user3Img from '@/assets/images/users/user-3.jpg'
import user4Img from '@/assets/images/users/user-4.jpg'
import user6Img from '@/assets/images/users/user-6.jpg'
import user7Img from '@/assets/images/users/user-7.jpg'

import { getColor } from '@/utils/helpers'
import { ApexOptions } from 'apexcharts'

export type StatItem = {
  target: number
  suffix: string
  label: string
  change: number
  trend: {
    type: 'up' | 'down'
    icon: string
  }
  icon: string
}

export const statsData: StatItem[] = [
  {
    target: 14.59,
    suffix: 'M',
    label: 'Total Views',
    change: +5.2,
    trend: {
      type: 'up',
      icon: 'trending-up',
    },
    icon: 'eye',
  },
  {
    target: 815.58,
    suffix: 'K',
    label: 'Sessions',
    change: +3.9,
    trend: {
      type: 'up',
      icon: 'activity',
    },
    icon: 'clock',
  },
  {
    target: 41.3,
    suffix: '%',
    label: 'Bounce Rate',
    change: -1.1,
    trend: {
      type: 'down',
      icon: 'arrow-down-left',
    },
    icon: 'repeat-once',
  },
  {
    target: 56.39,
    suffix: 'K',
    label: 'Active Users',
    change: +2.3,
    trend: {
      type: 'up',
      icon: 'users',
    },
    icon: 'user',
  },
]

function generateRandomDeviceData(name: string, minY: number, maxY: number, count = 10) {
  const data = []
  for (let i = 1; i <= count; i++) {
    const y = Math.floor(Math.random() * (maxY - minY + 1)) + minY
    const z = Math.floor(Math.random() * (35 - 15 + 1)) + 15
    data.push({ x: i, y: y, z: z })
  }
  return { name, data }
}

export const getDevicesChart = (): ApexOptions => ({
  chart: {
    height: 223,
    type: 'bubble',
    toolbar: {
      show: false,
    },
  },
  dataLabels: {
    enabled: false,
  },
  series: [generateRandomDeviceData('Desktop', 20, 150), generateRandomDeviceData('Mobile', 20, 120), generateRandomDeviceData('Tablet', 20, 60)],
  fill: {
    opacity: 0.8,
    gradient: {
      // enabled: false,
    },
  },
  colors: [getColor('chart-primary'), getColor('chart-secondary'), getColor('chart-beta')],
  xaxis: {
    min: 0,
    max: 11,
    // show: false,
    labels: { show: false },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    min: 0,
    max: 170,
    show: false,
    labels: { show: false },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },

  grid: {
    padding: {
      top: -20,
      right: 20,
      bottom: 0,
      left: 20,
    },
    borderColor: getColor('border-color'),
  },

  legend: {
    show: true,
    position: 'top',
    horizontalAlign: 'center',
  },
})

export type TrafficRow = {
  url: string
  views: string
  uniques: string
}

export const trafficTableData: TrafficRow[] = [
  {
    url: '/dashboard',
    views: '9.8k',
    uniques: '8.5k',
  },
  {
    url: '/ecommerce-index',
    views: '8.2k',
    uniques: '7.1k',
  },
  {
    url: '/apps/projects-overview',
    views: '7.6k',
    uniques: '6.2k',
  },
  {
    url: '/pages/contact',
    views: '5.9k',
    uniques: '4.8k',
  },
  {
    url: '/support/faq',
    views: '5.2k',
    uniques: '4.3k',
  },
  {
    url: '/login',
    views: '4.7k',
    uniques: '3.9k',
  },
]

export type CountryStat = {
  rank: number
  name: string
  image: string
  visitors: number
  change: number
}

export const topCountriesData: CountryStat[] = [
  { rank: 1, name: 'Germany', image: deFlag, visitors: 10412, change: 1.5 },
  { rank: 2, name: 'France', image: frFlag, visitors: 8934, change: -0.8 },
  { rank: 3, name: 'India', image: inFlag, visitors: 14217, change: 3.2 },
  { rank: 4, name: 'United States', image: usFlag, visitors: 18522, change: 2.1 },
  { rank: 5, name: 'United Kingdom', image: gbFlag, visitors: 7614, change: -1.2 },
  { rank: 6, name: 'Canada', image: caFlag, visitors: 6221, change: 0.9 },
  { rank: 7, name: 'Japan', image: jpFlag, visitors: 5785, change: 0.0 },
  { rank: 8, name: 'Australia', image: auFlag, visitors: 4918, change: 1.1 },
  { rank: 9, name: 'Brazil', image: brFlag, visitors: 3874, change: -0.5 },
  { rank: 10, name: 'Italy', image: itFlag, visitors: 4105, change: 0.7 },
]

export type CampaignDataType = {
  id: number
  name: string
  icon: string
  iconProps: {
    className: string
  }
  visitors: number
  newUsers: number
  sessions: number
  bounceRate: number
  pagesPerVisit: number
  avgDuration: string
  leads: number
  revenue: string
  conversion: number
  isPositive: boolean
}

export const campaignsData: CampaignDataType[] = [
  {
    id: 1,
    name: 'Spring Launch',
    icon: 'rocket',
    iconProps: { className: 'text-primary me-1 text-base' },
    visitors: 502,
    newUsers: 260,
    sessions: 6845,
    bounceRate: 18.22,
    pagesPerVisit: 3.15,
    avgDuration: '01:40',
    leads: 432,
    revenue: '$3.64M',
    conversion: 6.15,
    isPositive: true,
  },
  {
    id: 2,
    name: 'Facebook Push',
    icon: 'brand-facebook',
    iconProps: { className: 'text-info text-base me-1' },
    visitors: 478,
    newUsers: 245,
    sessions: 6120,
    bounceRate: 21.03,
    pagesPerVisit: 2.87,
    avgDuration: '01:28',
    leads: 398,
    revenue: '$3.10M',
    conversion: 5.65,
    isPositive: false,
  },
  {
    id: 3,
    name: 'Holiday Buzz',
    icon: 'speakerphone',
    iconProps: { className: 'text-success text-base me-1' },
    visitors: 445,
    newUsers: 230,
    sessions: 5710,
    bounceRate: 23.12,
    pagesPerVisit: 2.45,
    avgDuration: '01:22',
    leads: 372,
    revenue: '$2.86M',
    conversion: 5.12,
    isPositive: false,
  },
  {
    id: 4,
    name: 'Email Reconnect',
    icon: 'mail-fast',
    iconProps: { className: 'text-warning text-base me-1' },
    visitors: 392,
    newUsers: 190,
    sessions: 5210,
    bounceRate: 25.74,
    pagesPerVisit: 2.18,
    avgDuration: '01:50',
    leads: 340,
    revenue: '$2.45M',
    conversion: 4.88,
    isPositive: false,
  },
  {
    id: 5,
    name: 'Display Retarget',
    icon: 'broadcast',
    iconProps: { className: 'text-muted text-base me-1' },
    visitors: 338,
    newUsers: 160,
    sessions: 4670,
    bounceRate: 19.88,
    pagesPerVisit: 1.92,
    avgDuration: '02:05',
    leads: 298,
    revenue: '$1.95M',
    conversion: 4.62,
    isPositive: false,
  },
]

export type ChatItemType = {
  id: number
  name: string
  avatar?: string
  avatarText?: string
  avatarColor?: string
  status?: 'active' | 'inactive'
  time?: string
  totalMessages?: {
    value: number
    className: string
  }
  message: string
}

export const chatItems: ChatItemType[] = [
  {
    id: 1,
    name: 'Lucas Miller',
    avatar: user3Img,
    status: 'active',
    totalMessages: { value: 5, className: 'text-bg-danger' },
    message: 'active now',
  },
  {
    id: 2,
    name: 'Amelia Green',
    avatar: user4Img,
    time: '25min ago',
    message: 'See you soon!',
  },
  {
    id: 3,
    name: 'Sophia Turner',
    avatarText: 'S',
    avatarColor: 'info',
    totalMessages: { value: 1, className: 'text-bg-success' },
    message: 'Good Morning! 👋',
  },
  {
    id: 4,
    name: 'Noah Smith',
    avatar: user6Img,
    time: '1h ago',
    message: "Let's catch up later.",
  },
  {
    id: 5,
    name: 'Emma Johnson',
    avatar: user7Img,
    time: '3h ago',
    message: 'Sent you the files.',
  },
]

export const getOrdersChartOptions = (): ApexOptions => ({
  series: [
    {
      type: 'column',
      data: [
        [0, 2],
        [1, 3],
        [2, 4],
        [3, 8],
        [4, 5],
        [5, 12],
        [6, 17],
        [7, 19],
        [8, 6],
        [9, 9],
        [10, 14],
        [11, 17],
        [12, 12],
        [13, 6],
        [14, 4],
      ],
    },
    {
      type: 'column',
      data: [
        [0, 9],
        [1, 7],
        [2, 4],
        [3, 8],
        [4, 4],
        [5, 12],
        [6, 4],
        [7, 6],
        [8, 5],
        [9, 10],
        [10, 4],
        [11, 5],
        [12, 10],
        [13, 2],
        [14, 6],
      ],
    },
  ],
  chart: {
    height: 60,
    width: 205,
    parentHeightOffset: 0,
    stacked: true,
    sparkline: {
      enabled: true,
    },
  },
  states: {
    hover: {
      filter: {
        type: 'none',
      },
    },
    active: {
      filter: {
        type: 'none',
      },
    },
  },
  colors: [getColor('chart-primary'), getColor('chart-gray')],
  plotOptions: {
    bar: {
      columnWidth: '60%',
    },
  },
  stroke: {
    curve: 'straight',
    lineCap: 'square',
  },
  tooltip: {
    enabled: false,
    onDatasetHover: {
      highlightDataSeries: false,
    },
    x: {
      show: false,
    },
  },
})

export const getPostsChartOptions = (): ApexOptions => ({
  chart: {
    type: 'area',
    height: 60,
    sparkline: {
      enabled: true,
    },
  },
  stroke: {
    curve: 'smooth',
    width: 1.5,
  },
  fill: {
    opacity: 1,
    gradient: {
      shade: '#1ab394',
      type: 'horizontal',
      shadeIntensity: 0.5,
      inverseColors: true,
      opacityFrom: 0.1,
      opacityTo: 0.2,
      stops: [0, 80, 100],
      colorStops: [],
    },
  },
  series: [
    {
      data: [4, 8, 5, 10, 4, 16, 5, 11, 6, 11, 30, 10, 13, 4, 6, 3, 6],
    },
  ],
  yaxis: {
    min: 0,
  },
  colors: [getColor('chart-primary')],
  tooltip: {
    enabled: false,
  },
})
