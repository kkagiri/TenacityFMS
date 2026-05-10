export const treeViewData = [
  {
    id: '1',
    text: 'Main Category',
    iconName: 'tabler:folder-filled',
    iconClassName: 'text-warning',
    defaultOpen: true,
    children: [
      {
        id: '1.1',
        text: 'Dashboard',
        iconName: 'tabler:layout-dashboard',
        iconClassName: 'text-success',
        checked: true,
      },
      {
        id: '1.2',
        text: 'Reports',
        iconName: 'tabler:report',
        iconClassName: 'text-info',
        defaultOpen: true,
        children: [
          {
            id: '1.2.1',
            text: 'Annual Report',
            iconName: 'tabler:file-description',
            iconClassName: 'text-warning',
          },
          {
            id: '1.2.2',
            text: 'Monthly Report',
            iconName: 'tabler:file-analytics',
            checked: true,
            iconClassName: 'text-secondary',
          },
        ],
      },
      {
        id: '2',
        text: 'User Management',
        iconClassName: 'text-danger',
        iconName: 'tabler:users',
        children: [
          {
            id: '2.1',
            text: 'Add User',
            iconName: 'tabler:user-plus',
            iconClassName: 'text-success',
          },
          {
            id: '2.2',
            text: 'Permissions',
            iconName: 'tabler:key',
            iconClassName: 'text-warning',
          },
        ],
      },
      {
        id: '3',
        text: 'Settings',
        iconName: 'tabler:settings',
        iconClassName: 'text-dark',
        defaultOpen: true,
        children: [
          {
            id: '3.1',
            text: 'General',
            iconName: 'tabler:users-group',
            iconClassName: 'text-info',
          },
          {
            id: '3.2',
            text: 'Security',
            iconName: 'tabler:lock',
            iconClassName: 'text-danger',
          },
          {
            id: '3.3',
            text: 'Notifications',
            iconName: 'tabler:bell',
            iconClassName: 'text-warning',
            checked: true,
          },
        ],
      },
      {
        id: '4',
        iconClassName: 'text-danger',
        text: 'Disabled Node',
        iconName: 'tabler:ban',
      },
    ],
  },
  {
    id: '5',
    text: 'Archives',
    iconName: 'tabler:archive',
    iconClassName: 'text-warning',
    children: [
      {
        id: '5.1',
        text: '2024',
        iconName: 'tabler:calendar-event',
        iconClassName: 'text-primary',
        checked: true,
      },
      {
        id: '5.2',
        text: '2023',
        iconName: 'tabler:calendar-event',
        iconClassName: 'text-secondary',
      },
      {
        id: '5.3',
        text: '2022',
        iconName: 'tabler:calendar-event',
        iconClassName: 'text-success',
      },
    ],
  },
  {
    id: '6',
    text: 'Media',
    iconName: 'tabler:photo',
    defaultOpen: true,
    iconClassName: 'text-info',
    children: [
      {
        id: '6.1',
        text: 'Videos',
        iconName: 'tabler:player-play',
        iconClassName: 'text-danger',
      },
      {
        id: '6.2',
        text: 'Audio',
        iconName: 'tabler:music',
        iconClassName: 'text-success',
      },
    ],
  },
]
