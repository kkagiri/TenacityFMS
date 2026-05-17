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

export type SideBarItemType = {
  name: string
  icon: string
  badge?: {
    label: string
    className: string
  }
}

export const sidebarMenuItemData: SideBarItemType[] = [
  { name: 'My Files', icon: 'folder', badge: { label: '21', className: 'bg-danger/15 text-danger' } },
  { name: 'Shared with Me', icon: 'share' },
  { name: 'Recent', icon: 'clock' },
  { name: 'Favourites', icon: 'star' },
  { name: 'Downloads', icon: 'download' },
  { name: 'Trash', icon: 'trash' },
]

export type CategoryType = {
  name: string
  icon: string
  iconClassName?: string
  badge?: {
    label: string
    className: string
  }
}

export const categoryData: CategoryType[] = [
  { name: 'Work', icon: 'chart-donut', iconClassName: 'text-primary' },
  { name: 'Projects', icon: 'chart-donut', iconClassName: 'text-secondary' },
  { name: 'Media', icon: 'chart-donut', iconClassName: 'text-info' },
  { name: 'Documents', icon: 'chart-donut', iconClassName: 'text-warning' },
]

export type FileRecordType = {
  id: number
  name: string
  icon: string
  size: number
  type: string
  modifiedDate: string
  user: {
    email: string
    image: string
  }
  sharedWith: {
    image: string
  }[]
  isFavorite: boolean
  selected?: boolean
}

export const fileRecordData: FileRecordType[] = [
  {
    id: 1,
    name: 'Project Overview Video',
    icon: 'video',
    size: 120000000,
    type: 'MP4',
    modifiedDate: '2025-04-02',
    user: {
      email: 'john@techgroup.com',
      image: user3,
    },
    sharedWith: [{ image: user5 }, { image: user7 }, { image: user6 }, { image: user8 }],
    isFavorite: false,
  },
  {
    id: 2,
    name: 'Team Meeting Video',
    icon: 'video',
    size: 200000000,
    type: 'MP4',
    modifiedDate: '2025-04-15',
    user: {
      email: 'michael@devteam.com',
      image: user4,
    },
    sharedWith: [{ image: user2 }, { image: user3 }, { image: user5 }],
    isFavorite: false,
  },
  {
    id: 3,
    name: 'Marketing Strategy Design',
    icon: 'brand-figma',
    size: 150000000,
    type: 'Figma',
    modifiedDate: '2025-04-20',
    user: {
      email: 'susan@marketing.com',
      image: user2,
    },
    sharedWith: [{ image: user1 }, { image: user3 }, { image: user6 }, { image: user9 }],
    isFavorite: false,
  },
  {
    id: 4,
    name: 'Client Proposal PDF',
    icon: 'file-type-pdf',
    size: 45000000,
    type: 'PDF',
    modifiedDate: '2025-05-05',
    user: {
      email: 'mark@clientservices.com',
      image: user8,
    },
    sharedWith: [{ image: user2 }, { image: user4 }, { image: user7 }],
    isFavorite: false,
  },
  {
    id: 5,
    name: 'Database Schema',
    icon: 'database',
    size: 30000000,
    type: 'MySQL',
    modifiedDate: '2025-04-01',
    user: {
      email: 'alex@creatix.io',
      image: user2,
    },
    sharedWith: [{ image: user4 }, { image: user8 }],
    isFavorite: false,
  },
  {
    id: 6,
    name: 'Website Script',
    icon: 'code',
    size: 15000000,
    type: 'JS',
    modifiedDate: '2025-04-02',
    user: {
      email: 'john@techgroup.com',
      image: user3,
    },
    sharedWith: [{ image: user5 }, { image: user7 }, { image: user6 }, { image: user4 }],
    isFavorite: false,
  },
  {
    id: 7,
    name: 'Dependency Package',
    icon: 'package',
    size: 5000000,
    type: 'DEP',
    modifiedDate: '2025-04-15',
    user: {
      email: 'michael@devteam.com',
      image: user4,
    },
    sharedWith: [{ image: user2 }, { image: user3 }, { image: user5 }],
    isFavorite: false,
  },
  {
    id: 8,
    name: 'Internet Portal',
    icon: 'folder',
    size: 87000000,
    type: 'Folder',
    modifiedDate: '2025-03-10',
    user: {
      email: 'emma@devcore.com',
      image: user6,
    },
    sharedWith: [{ image: user7 }, { image: user9 }, { image: user10 }, { image: user3 }, { image: user8 }],
    isFavorite: false,
  },
  {
    id: 9,
    name: 'Podcast Episode 12',
    icon: 'music',
    size: 55000000,
    type: 'Audio',
    modifiedDate: '2025-04-01',
    user: {
      email: 'alex@creatix.io',
      image: user2,
    },
    sharedWith: [{ image: user4 }, { image: user8 }],
    isFavorite: false,
  },
]

export type FolderType = {
  name: string
  size: number
}

export const folderData: FolderType[] = [
  { name: 'Premium Multi', size: 2300000000 },
  { name: 'Material Design', size: 105300000 },
  { name: 'DashPro UI Kit', size: 512000000 },
  { name: 'VueStudio Pack', size: 880000000 },
  { name: 'Nextify Pro', size: 1100000000 },
  { name: 'Blazor Studio', size: 780000000 },
  { name: 'Angular Prime', size: 940000000 },
  { name: 'React Kit Pro', size: 1600000000 },
]
