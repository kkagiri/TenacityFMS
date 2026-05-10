export type ManagementType = {
  name: string
  roles: {
    label: string
    className: string
  }[]
  date: string
  time: string
  users: number
}

export const permissionManagementData: ManagementType[] = [
  {
    name: 'User Management',
    roles: [{ label: 'Administrator', className: 'bg-primary/15 text-primary' }],
    date: '24 Jun 2025',
    time: '6:43 am',
    users: 12,
  },
  {
    name: 'Content Management',
    roles: [
      { label: 'Administrator', className: 'bg-primary/15 text-primary' },
      { label: 'Developer', className: 'bg-danger/15 text-danger' },
      { label: 'Analyst', className: 'bg-info/15 text-info' },
      { label: 'Support', className: 'bg-secondary/15 text-secondary' },
      { label: 'Trial', className: 'bg-warning/15 text-warning' },
    ],
    date: '21 Feb 2025',
    time: '11:05 am',
    users: 5,
  },
  {
    name: 'Financial Management',
    roles: [
      { label: 'Administrator', className: 'bg-primary/15 text-primary' },
      { label: 'Analyst', className: 'bg-info/15 text-info' },
    ],
    date: '24 Jun 2025',
    time: '5:30 pm',
    users: 8,
  },
  {
    name: 'Reporting',
    roles: [
      { label: 'Administrator', className: 'bg-primary/15 text-primary' },
      { label: 'Analyst', className: 'bg-info/15 text-info' },
    ],
    date: '21 Feb 2025',
    time: '5:20 pm',
    users: 6,
  },
  {
    name: 'Payroll',
    roles: [
      { label: 'Administrator', className: 'bg-primary/15 text-primary' },
      { label: 'Analyst', className: 'bg-info/15 text-info' },
    ],
    date: '20 Jun 2025',
    time: '6:05 pm',
    users: 4,
  },
  {
    name: 'Disputes Management',
    roles: [
      { label: 'Administrator', className: 'bg-primary/15 text-primary' },
      { label: 'Developer', className: 'bg-danger/15 text-danger' },
      { label: 'Support', className: 'bg-secondary/15 text-secondary' },
    ],
    date: '24 Jun 2025',
    time: '5:20 pm',
    users: 7,
  },
  {
    name: 'Audit Logs',
    roles: [{ label: 'Administrator', className: 'bg-primary/15 text-primary' }],
    date: '23 Jun 2025',
    time: '4:00 pm',
    users: 9,
  },
  {
    name: 'API Access',
    roles: [
      { label: 'Administrator', className: 'bg-primary/15 text-primary' },
      { label: 'Trial', className: 'bg-warning/15 text-warning' },
      { label: 'DevOps', className: 'bg-info/15 text-info' },
    ],
    date: '22 Jun 2025',
    time: '2:35 pm',
    users: 3,
  },
  {
    name: 'Notification Center',
    roles: [
      { label: 'Administrator', className: 'bg-primary/15 text-primary' },
      { label: 'Support', className: 'bg-info/15 text-info' },
    ],
    date: '22 Jun 2025',
    time: '8:45 am',
    users: 2,
  },
  {
    name: 'Access Logs',
    roles: [
      { label: 'Administrator', className: 'bg-primary/15 text-primary' },
      { label: 'Support', className: 'bg-secondary/15 text-secondary' },
    ],
    date: '19 Jun 2025',
    time: '6:10 pm',
    users: 5,
  },
]
