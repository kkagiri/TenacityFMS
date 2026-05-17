export const nestedListInitialData = [
  {
    id: 1,
    title: 'Design Phase',
  },
  {
    id: 2,
    title: 'Development Phase',
    children: [
      {
        id: 4,
        title: 'Frontend Implementation',
      },
      {
        id: 5,
        title: 'Backend API Setup',
        children: [
          {
            id: 6,
            title: 'Authentication Module',
          },
          {
            id: 7,
            title: 'Database Schema',
          },
        ],
      },
    ],
  },
  {
    id: 3,
    title: 'Testing Phase',
    children: [
      {
        id: 8,
        title: 'Unit Tests',
      },
      {
        id: 9,
        title: 'Integration Tests',
      },
    ],
  },
]
export const nestedListWithHandleData = [
  {
    id: 1,
    title: 'Project Alpha',
    children: [
      {
        id: 2,
        title: 'Design Phase',
      },
      {
        id: 3,
        title: 'Development Phase',
        children: [
          {
            id: 4,
            title: 'Frontend Module',
          },
          {
            id: 5,
            title: 'Backend Module',
          },
          {
            id: 6,
            title: 'API Integration',
          },
          {
            id: 7,
            title: 'Unit Testing',
          },
        ],
      },
      {
        id: 8,
        title: 'QA Review',
      },
      {
        id: 9,
        title: 'Deployment',
      },
    ],
  },
]
export const groupedSortableData = [
  {
    id: 1,
    icon: 'layout-kanban',
    label: {
      className: 'bg-primary/15 text-primary',
      text: 'Phase A',
    },
    title: 'Tasks',
    children: [
      {
        id: 2,
        title: 'To Do',
        icon: 'check',
      },
      {
        id: 3,
        title: 'In Progress',
        icon: 'info-circle',
      },
      {
        id: 4,
        title: 'Completed',
        icon: 'circle-check',
      },
    ],
  },
  {
    id: 5,
    icon: 'flag',
    title: 'Milestones',
    label: {
      className: 'bg-info/15 text-info',
      text: 'Phase B',
    },
    children: [
      {
        id: 6,
        title: 'Project Kickoff',
        icon: 'flag',
      },
      {
        id: 7,
        title: 'Phase 1 Completion',
        icon: 'flag',
      },
      {
        id: 8,
        title: 'Final Delivery',
        icon: 'flag',
      },
    ],
  },
  {
    id: 9,
    icon: 'users',
    title: 'Teams',
    label: {
      className: 'bg-success/15 text-success',
      text: 'Phase C',
    },
    children: [
      {
        id: 10,
        title: 'Development Team',
        icon: 'user',
      },
      {
        id: 11,
        title: 'Design Team',
        icon: 'user',
      },
      {
        id: 12,
        title: 'QA Team',
        icon: 'user',
      },
    ],
  },
]
export const SortableWithIconsWithLabels = [
  {
    id: 1,
    icon: 'layout-kanban',
    label: {
      className: 'bg-primary/15 text-primary',
      text: 'Phase A',
    },
    title: 'Strategy',
    children: [
      {
        id: 2,
        title: 'Research Topics',
        icon: 'check',
      },
      {
        id: 3,
        title: 'Analysis in Progress',
        icon: 'info-circle',
      },
      {
        id: 4,
        title: 'Insights Approved',
        icon: 'circle-check',
      },
    ],
  },
  {
    id: 5,
    icon: 'flag',
    title: 'Milestones',
    label: {
      className: 'bg-info/15 text-info',
      text: 'Phase B',
    },
    children: [
      {
        id: 6,
        title: 'Initial Draft Release',
        icon: 'flag',
      },
      {
        id: 7,
        title: 'User Testing Round',
        icon: 'flag',
      },
      {
        id: 8,
        title: 'Final Launch',
        icon: 'flag',
      },
    ],
  },
  {
    id: 9,
    icon: 'users',
    title: 'Departments',
    label: {
      className: 'bg-success/15 text-success',
      text: 'Phase C',
    },
    children: [
      {
        id: 10,
        title: 'Engineering Unit',
        icon: 'user',
      },
      {
        id: 11,
        title: 'Creative Studio',
        icon: 'user',
      },
      {
        id: 12,
        title: 'Quality Assurance',
        icon: 'user',
      },
    ],
  },
]
